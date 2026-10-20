import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { QueryClient, QueryObserver, MutationObserver } from "@tanstack/react-query";
import { createSessionLifecycle, SessionSupersededError, SESSION_CHANGE_KEY } from "./sessionLifecycle.mjs";
import { captureCartMutation, sessionCartOptions, cartMutationCallbacks } from "./sessionCartMutation.mjs";
import { createQuantityFlow, createLineGuard } from "./cartQuantityFlow.mjs";
import { applyIdentityChange, planIdentityChange } from "./authIdentityCache.mjs";
const require = createRequire(import.meta.url), React = require("react");
const { transformSync } = require("next/dist/build/swc");
const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return {promise,resolve,reject}; };
const tick = () => new Promise(setImmediate);
function compile(file, deps, window = {}) {
  const source = readFileSync(new URL("../" + file, import.meta.url), "utf8");
  const {code} = transformSync(source, { filename:file, module:{type:"commonjs"}, jsc:{parser:{syntax:"ecmascript",jsx:true},transform:{react:{runtime:"automatic"}}} });
  const exports={}; new Function("require","exports","window",code)((name) => Object.hasOwn(deps,name) ? deps[name] : require(name), exports, window); return exports;
}
function browserPair() {
  const targets=[new EventTarget(),new EventTarget()], messages=[];
  for (const target of targets) target.localStorage={setItem(key,newValue){messages.push(JSON.parse(newValue));for(const peer of targets)if(peer!==target){const event=new Event("storage");Object.assign(event,{key,newValue});peer.dispatchEvent(event);}}};
  return {targets,messages};
}
function mountAuth(lifecycle, getUserApi, target = new EventTarget()) {
  const cells=[], effects=[]; let index=0;
  const hooks={...React,
    useState(initial){const n=index++;if(!(n in cells))cells[n]=typeof initial==="function"?initial():initial;return[cells[n],v=>{cells[n]=typeof v==="function"?v(cells[n]):v;}];},
    useRef(initial){const n=index++;return cells[n]??(cells[n]={current:initial});},
    useCallback(fn,deps){const n=index++,old=cells[n];if(!old||deps.some((v,i)=>v!==old.deps[i]))cells[n]={deps,value:fn};return cells[n].value;},
    useMemo(fn,deps){return hooks.useCallback(fn,deps)();},
    useEffect(fn,deps){const n=index++,old=cells[n];if(!old||deps.some((v,i)=>v!==old.deps[i])){old?.cleanup?.();cells[n]={deps};effects.push(()=>{cells[n].cleanup=fn();});}},
    useLayoutEffect(fn,deps){return hooks.useEffect(fn,deps);},
  };
  let expired;
  const {AuthProvider}=compile("contexts/auth/AuthContext.jsx",{
    react:hooks,"@/services/authServices":{loginApi:()=>lifecycle.change("login",async()=>{}),logoutApi:()=>lifecycle.change("logout",async()=>{})},
    "@/services/usersServices":{getUserApi,updateUserApi:async()=>{}},
    "@/utils/authSessionEvents.mjs":{onSessionExpired:fn=>{expired=fn;return()=>{};}},
    "@/utils/sessionLifecycle.mjs":{sessionLifecycle:lifecycle,SessionSupersededError},
  },target);
  const render=()=>{index=0;const tree=AuthProvider({children:null});while(effects.length)effects.shift()();return tree.props.value;};
  render(); return {value:render,expire:()=>expired(),unmount:()=>cells.forEach(c=>c?.cleanup?.())};
}
const client = () => new QueryClient({defaultOptions:{queries:{retry:false,gcTime:Infinity},mutations:{retry:false,gcTime:Infinity}}});

test("session change invalidates synchronously; readiness waits for captured cancellation",async()=>{
  const session=createSessionLifecycle(), barrier=deferred();session.confirm(0,null);
  session.subscribe(event=>event.type==="invalidate"?barrier.promise:undefined);
  const action=deferred(), changed=session.change("login",()=>action.promise);
  assert.equal(session.generation(),1);assert.equal(session.ready(),false);
  let settled=false;const ready=session.wait(1).then(()=>{settled=true;});await tick();assert.equal(settled,false);
  barrier.resolve();await ready;action.resolve();await changed;session.confirm(1,7);assert.equal(session.ready(),true);
});
test("two tabs reconcile login, logout and account switching using credential-free markers",async()=>{
  const {targets,messages}=browserPair(),a=createSessionLifecycle(),b=createSessionLifecycle();let owner=null,reads=0;
  const authA=mountAuth(a,async()=>{if(owner===null)throw {response:{status:401}};return{id:owner};},targets[0]);
  const authB=mountAuth(b,async()=>{reads++;if(owner===null)throw {response:{status:401}};return{id:owner};},targets[1]);await tick();
  for(const identity of [7,8,null,9]){
    const held=deferred(),change=a.change(identity===null?"logout":"login",async()=>{await held.promise;owner=identity;});
    assert.equal(b.ready(),false);assert.equal(authB.value().user,null);
    held.resolve();await change;await tick();assert.equal(authB.value().user?.id??null,identity);assert.equal(b.ready(),true);
  }
  assert(reads>=5);for(const message of messages)assert.deepEqual(Object.keys(message).sort(),["id","phase","version"]);
  authA.unmount();authB.unmount();
});
for(const eventName of ["focus","pageshow"])test(eventName+" confirms cookie identity; failed confirmation keeps cart mutations suspended",async()=>{
  const session=createSessionLifecycle(),target=new EventTarget();let owner=7,failure=null,reads=0;
  const auth=mountAuth(session,async()=>{reads++;if(failure)throw failure;return{id:owner};},target);await tick();const initial=session.generation();
  target.dispatchEvent(new Event(eventName));await tick();assert.equal(session.generation(),initial);assert.equal(auth.value().user.id,7);
  owner=8;target.dispatchEvent(new Event(eventName));await tick();assert.equal(auth.value().user.id,8);assert(session.generation()>initial);
  failure=new Error("network");target.dispatchEvent(new Event(eventName));await tick();assert.equal(session.ready(),false);assert.equal(auth.value().sessionReady,false);
  await assert.rejects(sessionCartOptions({mutationFn:async()=>assert.fail("dispatched")},session).mutationFn(captureCartMutation({},session)),SessionSupersededError);
  failure=null;target.dispatchEvent(new Event(eventName));await tick();assert.equal(session.ready(),true);assert.equal(reads,5);auth.unmount();
});
test("simultaneous confirmation callers share one request; failed strict confirmation can retry",async()=>{
  const session=createSessionLifecycle(),first=deferred();let reads=0;
  const auth=mountAuth(session,()=>{reads++;return first.promise;});
  const strict=auth.value().checkAuth({requireUser:true});assert.equal(reads,1);first.resolve({id:7});assert.equal((await strict).id,7);auth.unmount();
});
test("late A add response cannot write B cache, feedback or callbacks through actual hook",async()=>{
  const session=createSessionLifecycle();session.confirm(0,1);const c=client(),held=deferred();let feedback=0,followup=0;
  const {useAddToCart}=compile("hooks/useCart.js",{
    react:{useRef:v=>({current:v})},"@/services/cartServices":{addToCartApi:()=>held.promise},"@/utils/showApiError":{showApiError:()=>assert.fail("stale error feedback")},
    "@/utils/addedToCartContract.mjs":{cartFromAddResponse:data=>data},"@/contexts/auth/AuthContext":{useAuth:()=>({loading:false,sessionReady:true})},
    "@/utils/sessionLifecycle.mjs":{sessionLifecycle:session},
    "@/utils/sessionCartMutation.mjs":{captureCartMutation:v=>captureCartMutation(v,session),sessionCartOptions:o=>sessionCartOptions(o,session),cartMutationCallbacks:(a,b)=>cartMutationCallbacks(a,b,session)},
    "react-hot-toast":{success:()=>feedback++},"@tanstack/react-query":{useQueryClient:()=>c,useMutation:options=>{const observer=new MutationObserver(c,options);observer.subscribe(()=>{});return{mutate:(v,o)=>observer.mutate(v,o).catch(()=>{}),mutateAsync:(v,o)=>observer.mutate(v,o)};}},
  });
  const hook=useAddToCart({onAdded:()=>followup++});hook.addToCart({productId:1});await tick();session.invalidate("B");session.confirm(1,2);c.setQueryData(["cart-items"],{owner:"B",items:[]});held.resolve({owner:"A",items:["private"]});await tick();assert.equal(c.getQueryData(["cart-items"]).owner,"B");assert.equal(feedback+followup,0);c.clear();
});
test("stale queued mutations do not dispatch; current B work retains the same line serialization",async()=>{
  const session=createSessionLifecycle();session.confirm(0,1);const c=client(),held=deferred(),calls=[],settlements=[];
  const options=sessionCartOptions({scope:{id:"same-line"},mutationFn:async value=>{calls.push(value);if(value==="A1")await held.promise;return value;}},session);
  const run=value=>{const request=captureCartMutation(value,session),observer=new MutationObserver(c,options);observer.subscribe(()=>{});return observer.mutate(request,cartMutationCallbacks({onSettled:()=>settlements.push(value)},request,session)).catch(e=>e);};
  const a=run("A1"),queued=run("A2");await tick();session.invalidate("B");session.confirm(1,2);const b=run("B");held.resolve();
  assert.equal((await a).code,"ERR_SESSION_SUPERSEDED");assert.equal((await queued).code,"ERR_SESSION_SUPERSEDED");assert.equal(await b,"B");assert.deepEqual(calls,["A1","B"]);assert.equal(settlements.length,3);c.clear();
});
test("pending first guest fetch is cancelled before the confirmed account fetch; ignored abort cannot adopt guest data",async()=>{
  const c=client(),held=deferred();let reads=0,aborted=false;
  const observer=new QueryObserver(c,{queryKey:["cart-items"],staleTime:300000,queryFn:({signal})=>{reads++;signal.addEventListener("abort",()=>aborted=true);return reads===1?held.promise:Promise.resolve({owner:"user",items:["existing","merged"]});}});
  const off=observer.subscribe(()=>{});await tick();observer.setOptions({...observer.options,enabled:false});
  await applyIdentityChange(c,planIdentityChange(null,7),{refetch:false});assert.equal(aborted,true);
  observer.setOptions({...observer.options,enabled:true});await tick();held.resolve({owner:"guest",items:[]});await tick();
  assert.equal(reads,2);assert.equal(c.getQueryData(["cart-items"]).owner,"user");off();c.clear();
});
test("an older cancellation barrier finishing cannot cancel B's newer request",async()=>{
  const c=client(),old=deferred(),newer=deferred(),barrier=deferred();let reads=0;
  const observer=new QueryObserver(c,{queryKey:["cart-items"],queryFn:()=>++reads===1?old.promise:newer.promise});const off=observer.subscribe(()=>{});await tick();
  const cancel=c.cancelQueries.bind(c);c.cancelQueries=(...args)=>{const captured=cancel(...args);return captured.then(()=>barrier.promise);};
  const transition=applyIdentityChange(c,planIdentityChange(null,7),{refetch:false});
  const request=c.fetchQuery({queryKey:["cart-items"],queryFn:()=>{reads++;return newer.promise;}});barrier.resolve();await transition;
  newer.resolve({owner:"B"});assert.equal((await request).owner,"B");old.resolve({owner:"guest"});await tick();assert.equal(c.getQueryData(["cart-items"]).owner,"B");off();c.clear();
});
test("rapid transitions reject stale confirmations and preserve public catalog data",async()=>{
  const session=createSessionLifecycle(),c=client(),old=deferred();let reads=0;c.setQueryData(["products"],{public:true});c.setQueryData(["orders"],["A-private"]);
  session.subscribe(event=>event.type==="invalidate"?applyIdentityChange(c,{reset:["orders"],cart:"reset"},{refetch:false}):undefined);
  const auth=mountAuth(session,()=>++reads===1?old.promise:Promise.resolve({id:9}));
  const a=auth.value().checkAuth({requireUser:true}).catch(e=>e);session.invalidate("B");session.invalidate("C");await auth.value().checkAuth({requireUser:true});old.resolve({id:7});assert.equal((await a).code,"ERR_SESSION_SUPERSEDED");assert.equal(auth.value().user.id,9);assert.equal(c.getQueryData(["orders"]),undefined);assert.deepEqual(c.getQueryData(["products"]),{public:true});auth.unmount();c.clear();
});
test("malformed or duplicate cross-tab markers are ignored and subscriptions clean up",()=>{
  const session=createSessionLifecycle(),target=new EventTarget(),disconnect=session.connect(target);
  const send=value=>{const e=new Event("storage");Object.assign(e,{key:SESSION_CHANGE_KEY,newValue:JSON.stringify(value)});target.dispatchEvent(e);};
  send({version:1,id:"x",phase:"settled"});const generation=session.generation();send({version:1,id:"x",phase:"settled"});send({version:1,id:"bad",phase:"invalid"});assert.equal(session.generation(),generation);disconnect();send({version:1,id:"other",phase:"settled"});assert.equal(session.generation(),generation);
});

for(const outcome of ["same-account","changed-account","failure"])test("in-flight cart result during focus confirmation: "+outcome,{timeout:5000},async()=>{
  const session=createSessionLifecycle();session.confirm(0,7);const held=deferred(),c=client();let success=0;
  const observer=new MutationObserver(c,sessionCartOptions({mutationFn:()=>held.promise,onSuccess:()=>success++},session));
  const result=observer.mutate(captureCartMutation({},session)).catch(e=>e);await tick();session.pause();held.resolve({items:[]});await tick();assert.equal(success,0);
  if(outcome==="same-account")session.confirm(0,7);
  if(outcome==="changed-account"){session.invalidate("B");session.confirm(1,8);}
  if(outcome==="failure")session.unconfirmed();
  const value=await result;if(outcome==="same-account"){assert.deepEqual(value,{items:[]});assert.equal(success,1);}else assert.equal(value.code,"ERR_SESSION_SUPERSEDED");c.clear();
});
test("a mutation initiated while identity is unknown is not dispatched after later confirmation",async()=>{
  const session=createSessionLifecycle(),request=captureCartMutation({},session);session.confirm(0,7);
  await assert.rejects(sessionCartOptions({mutationFn:async()=>assert.fail("dispatched")},session).mutationFn(request),SessionSupersededError);
});
test("per-call callbacks preserve their public variables and release-only settlement runs for stale work",()=>{
  const session=createSessionLifecycle();session.confirm(0,7);const variables={itemId:4,quantity:2},request=captureCartMutation(variables,session),seen=[];
  const callbacks=cartMutationCallbacks({onSuccess:(data,v)=>seen.push(v),onSettled:(data,error,v)=>seen.push(v)},request,session);
  callbacks.onSuccess({},request);assert.equal(seen[0],variables);session.invalidate("B");callbacks.onSuccess({},request);callbacks.onSettled(undefined,new SessionSupersededError(),request);assert.deepEqual(seen,[variables,variables]);
});
test("reconciliation failure settles existing readiness waiters and rejects later waiters without hanging",async()=>{
  const session=createSessionLifecycle();session.confirm(0,7);session.pause();const waiting=session.waitUntilReady(0).catch(e=>e);session.unconfirmed();assert.equal((await waiting).code,"ERR_SESSION_SUPERSEDED");await assert.rejects(session.waitUntilReady(0),SessionSupersededError);
});

test("quantity controls do not optimistically change or dispatch while identity is suspended",()=>{
  const session=createSessionLifecycle();let increments=0,decrements=0;
  const {useQuantityHandler}=compile("hooks/useQuantityHandler.js",{
    react:{useState:value=>[value,()=>{}],useEffect:()=>{},useRef:value=>({current:value})},
    "@tanstack/react-query":{useQueryClient:()=>({getQueryData:()=>undefined})},
    "./useCart":{cartKeys:{items:()=>["cart-items"]},useAddToCart:()=>({}),useGetAllCartItems:()=>({}),useRemoveFromCart:()=>({}),useUpdateQuantity:()=>({})},
    "@/utils/addedToCartContract.mjs":{findCartLine:()=>undefined},
    "@/utils/cartQuantityFlow.mjs":{createLineGuard:()=>({}),lineScopeFor:()=>"line",createQuantityFlow:()=>({increment:()=>increments++,decrement:()=>decrements++})},
    "@/utils/sessionLifecycle.mjs":{sessionLifecycle:session},
  });
  const controls=useQuantityHandler({id:105,stock:100},5,"decant");assert.equal(controls.isPending,true);controls.AddToCartHandler();controls.RemoveFromCartHandler();assert.equal(increments+decrements,0);
  session.confirm(0,7);controls.AddToCartHandler();controls.RemoveFromCartHandler();assert.equal(increments,1);assert.equal(decrements,1);
});
test("discarded coupon completion is handled without a success continuation or unhandled rejection",async()=>{
  const source=readFileSync(new URL("../app/(user)/cart/_components/CartSummery.jsx",import.meta.url),"utf8");const body=source.slice(source.indexOf("  const CouponHandler"),source.indexOf("\n  return ("));
  const handler=new Function("applyCoupon","coupon","isSessionSuperseded",body+";return CouponHandler;")(async()=>{throw new SessionSupersededError();},"fixture",e=>e?.code==="ERR_SESSION_SUPERSEDED");await assert.doesNotReject(handler());
});

test("unmount settles a paused session waiter instead of leaving a dangling promise",async()=>{
  const session=createSessionLifecycle(),auth=mountAuth(session,async()=>({id:7}));await tick();session.pause();let settled=false;
  const waiting=session.waitUntilReady(session.generation()).catch(()=>{}).finally(()=>{settled=true;});auth.unmount();await tick();const settledOnUnmount=settled;
  session.invalidate("test-cleanup");await waiting;assert.equal(settledOnUnmount,true);
});

test("a discarded optimistic increment resynchronizes from B's empty cart and releases its control",()=>{
  const guard=createLineGuard();let quantity=0,pending=false;
  const flow=createQuantityFlow({guard,quantity:0,setQuantity:v=>quantity=typeof v==="function"?v(quantity):v,line:null,request:{productId:105,mode:"decant",volume:5},readCart:()=>({items:[]}),add:(_data,callbacks)=>{queueMicrotask(()=>callbacks.onSettled(undefined,new SessionSupersededError()));},onPendingChange:v=>pending=v});
  flow.increment();assert.equal(quantity,1);
  return tick().then(()=>{assert.equal(quantity,0);assert.equal(pending,false);assert.equal(guard.pending,false);});
});
test("definitive session loss is announced to other tabs without credentials or a refresh loop",async()=>{
  const {targets}=browserPair(),a=createSessionLifecycle(),b=createSessionLifecycle();let owner=7;
  const get=async()=>{if(owner===null)throw{response:{status:401}};return{id:owner};};const authA=mountAuth(a,get,targets[0]),authB=mountAuth(b,get,targets[1]);await tick();owner=null;authA.expire();await tick();assert.equal(authB.value().user,null);assert.equal(b.ready(),true);authA.unmount();authB.unmount();
});

test("an old quantity flow cannot write local state or feedback after a new generation starts",()=>{
  const session=createSessionLifecycle();session.confirm(0,7);let options,writes=0,rejections=0;
  const {useQuantityHandler}=compile("hooks/useQuantityHandler.js",{
    react:{useState:value=>[value,()=>writes++],useEffect:()=>{},useRef:value=>({current:value})},"@tanstack/react-query":{useQueryClient:()=>({getQueryData:()=>undefined})},
    "./useCart":{cartKeys:{items:()=>["cart-items"]},useAddToCart:()=>({}),useGetAllCartItems:()=>({}),useRemoveFromCart:()=>({}),useUpdateQuantity:()=>({})},
    "@/utils/addedToCartContract.mjs":{findCartLine:()=>undefined},"@/utils/cartQuantityFlow.mjs":{createLineGuard:()=>({}),lineScopeFor:()=>"line",createQuantityFlow:value=>{options=value;return{};}},"@/utils/sessionLifecycle.mjs":{sessionLifecycle:session},
  });useQuantityHandler({id:105,stock:100},5,"decant",null,{onRejected:()=>rejections++});session.invalidate("B");session.confirm(1,8);options.setQuantity(9);options.onPendingChange(false);options.onRejected(new Error());assert.equal(writes,0);assert.equal(rejections,0);
});


for(const eventName of ["focus","pageshow"])for(const failed of [false,true])test("remote pending login stays suspended on "+eventName+" until "+(failed?"failed":"successful")+" settlement",async()=>{
  const {targets}=browserPair(),a=createSessionLifecycle(),b=createSessionLifecycle(),held=deferred();let owner=7;
  const read=async()=>({id:owner}),authA=mountAuth(a,read,targets[0]),authB=mountAuth(b,read,targets[1]);await tick();
  const change=a.change("login",async()=>{await held.promise;if(failed)throw Error("fixture login failure");owner=8;}).catch(e=>e);
  try{
    assert.equal(b.ready(),false);targets[1].dispatchEvent(new Event(eventName));await tick();
    assert.equal(b.ready(),false);assert.equal(authB.value().user,null);
    held.resolve();const result=await change;await tick();
    if(failed)assert.match(result.message,/fixture/);
    assert.equal(b.ready(),true);assert.equal(authB.value().user.id,failed?7:8);
  }finally{held.resolve();await change;authA.unmount();authB.unmount();}
});
test("confirmation rechecks after the cancellation barrier before restoring user state",async()=>{
  const session=createSessionLifecycle(),held=deferred();let reads=0;
  const auth=mountAuth(session,()=>++reads===1?Promise.resolve({id:7}):held.promise);await tick();
  try{
    const result=auth.value().checkAuth({requireUser:true}).catch(e=>e);
    held.resolve({id:7});queueMicrotask(()=>queueMicrotask(()=>session.invalidate("B")));
    assert.equal((await result).code,"ERR_SESSION_SUPERSEDED");
    assert.equal(auth.value().user,null);assert.equal(session.ready(),false);
  }finally{auth.unmount();}
});
test("strict confirmation rejects invalidation queued just before its successful completion",async()=>{
  const session=createSessionLifecycle(),auth=mountAuth(session,async()=>({id:7}));await tick();let invalidated=false;
  const off=session.subscribe(event=>{if(event.type==="ready"&&!invalidated){invalidated=true;queueMicrotask(()=>session.invalidate("B"));}});
  try{await assert.rejects(auth.value().checkAuth({requireUser:true}),SessionSupersededError);assert.equal(auth.value().user,null);}
  finally{off();auth.unmount();}
});
test("strict confirmation accepts its own legitimate identity generation increment",async()=>{
  const session=createSessionLifecycle();let owner=7;const auth=mountAuth(session,async()=>({id:owner}));await tick();owner=8;
  try{assert.equal((await auth.value().checkAuth({requireUser:true})).id,8);assert.equal(session.identity(),8);assert.equal(session.ready(),true);}
  finally{auth.unmount();}
});
function couponHook(session,c,applyCouponApi,feedback){
  const {useApplyCoupon}=compile("hooks/useCart.js",{
    react:React,"@/services/cartServices":{applyCouponApi},
    "@/utils/showApiError":{showApiError:()=>feedback.errors++},
    "@/utils/addedToCartContract.mjs":{},"@/contexts/auth/AuthContext":{},
    "@/utils/sessionLifecycle.mjs":{sessionLifecycle:session},
    "@/utils/sessionCartMutation.mjs":{captureCartMutation:v=>captureCartMutation(v,session),sessionCartOptions:o=>sessionCartOptions(o,session),cartMutationCallbacks:(a,b)=>cartMutationCallbacks(a,b,session)},
    "react-hot-toast":{success:()=>feedback.success++},
    "@tanstack/react-query":{useQueryClient:()=>c,useMutation:options=>{const observer=new MutationObserver(c,options);observer.subscribe(()=>{});return{mutateAsync:(v,o)=>observer.mutate(v,o)};}},
  });
  return useApplyCoupon();
}
for(const state of ["paused","unconfirmed"])test("coupon dispatch is denied while identity is "+state,async()=>{
  const session=createSessionLifecycle();session.confirm(0,7);if(state==="paused")session.pause();else session.unconfirmed();
  const c=client(),feedback={success:0,errors:0};let calls=0;
  try{
    const hook=couponHook(session,c,async()=>{calls++;return{};},feedback);
    await assert.rejects(hook.applyCoupon("fixture"),SessionSupersededError);assert.equal(calls,0);assert.deepEqual(feedback,{success:0,errors:0});
  }finally{c.clear();}
});
for(const failed of [false,true])test("late coupon "+(failed?"failure":"success")+" cannot affect B",async()=>{
  const session=createSessionLifecycle();session.confirm(0,7);const c=client(),held=deferred(),feedback={success:0,errors:0};let invalidations=0;
  c.invalidateQueries=async()=>{invalidations++;};
  try{
    const hook=couponHook(session,c,()=>held.promise,feedback),result=hook.applyCoupon("fixture").catch(e=>e);await tick();
    session.invalidate("B");session.confirm(1,8);c.setQueryData(["cart-items"],{owner:8});
    if(failed)held.reject(Error("old failure"));else held.resolve({message:"fixture"});
    const outcome=await result;
    if(!failed)assert.equal(outcome.code,"ERR_SESSION_SUPERSEDED");
    assert.deepEqual(feedback,{success:0,errors:0});assert.equal(invalidations,0);assert.deepEqual(c.getQueryData(["cart-items"]),{owner:8});
  }finally{held.resolve();c.clear();}
});
test("valid coupon preserves raw variables, response and normal success feedback",async()=>{
  const session=createSessionLifecycle();session.confirm(0,7);const c=client(),feedback={success:0,errors:0};let received;
  const response={message:"fixture",coupon:{discount:100}};
  try{const hook=couponHook(session,c,async value=>{received=value;return response;},feedback);assert.equal(await hook.applyCoupon("fixture"),response);assert.equal(received,"fixture");assert.deepEqual(feedback,{success:1,errors:0});}
  finally{c.clear();}
});


function controlledRemoteTab() {
  const target=new EventTarget(),timers=new Map();let marker=null,sequence=0;
  target.localStorage={getItem:()=>marker,setItem:(_key,value)=>{marker=value;}};
  return {
    target,timers,
    clock:{setTimer:(callback,delay)=>{const id=++sequence;timers.set(id,{callback,delay});return id;},clearTimer:id=>timers.delete(id)},
    deliver(phase,id){marker=JSON.stringify({version:1,phase,id});const event=new Event("storage");Object.assign(event,{key:SESSION_CHANGE_KEY,newValue:marker});target.dispatchEvent(event);},
    miss(phase,id){marker=JSON.stringify({version:1,phase,id});},
    expire(){const due=[...timers.values()];timers.clear();for(const timer of due)timer.callback();},
  };
}
test("overlapping remote transitions require both settlements; duplicate and late starts cannot suspend again",async()=>{
  const tab=controlledRemoteTab(),session=createSessionLifecycle(tab.clock);let owner=7,reads=0;
  const auth=mountAuth(session,async()=>{reads++;return{id:owner};},tab.target);await tick();
  try{
    tab.deliver("started","one");tab.deliver("started","two");assert.equal(tab.timers.size,2);
    tab.deliver("settled","one");tab.target.dispatchEvent(new Event("focus"));await tick();
    assert.equal(session.canConfirm(),false);assert.equal(session.ready(),false);assert.equal(reads,1);assert.equal(tab.timers.size,1);
    owner=8;tab.deliver("settled","two");await tick();assert.equal(session.ready(),true);assert.equal(auth.value().user.id,8);assert.equal(reads,2);assert.equal(tab.timers.size,0);
    const generation=session.generation();tab.deliver("started","one");tab.deliver("settled","two");assert.equal(session.generation(),generation);
  }finally{auth.unmount();assert.equal(tab.timers.size,0);}
});
for(const failed of [false,true])test("abandoned remote transition recovery requires fresh "+(failed?"failed":"successful")+" identity confirmation",async()=>{
  const tab=controlledRemoteTab(),session=createSessionLifecycle(tab.clock),held=deferred();let reads=0;
  const auth=mountAuth(session,()=>++reads===1?Promise.resolve({id:7}):held.promise,tab.target);await tick();
  try{
    tab.deliver("started","abandoned");assert.equal(tab.timers.size,1);
    assert.equal([...tab.timers.values()][0].delay,30_000);
    const generation=session.generation();tab.expire();await tick();
    assert(session.generation()>generation);assert.equal(session.ready(),false);assert.equal(auth.value().user,null);assert.equal(reads,2);
    if(failed)held.reject(Error("network"));else held.resolve({id:8});await tick();
    assert.equal(session.ready(),!failed);assert.equal(auth.value().user?.id??null,failed?null:8);
    if(failed)await assert.rejects(session.waitUntilReady(session.generation()),SessionSupersededError);
    const beforeLate=session.generation();tab.deliver("settled","abandoned");await tick();
    assert(session.generation()>beforeLate);assert.equal(tab.timers.size,0);
  }finally{held.resolve({id:8});auth.unmount();assert.equal(tab.timers.size,0);}
});
test("focus reads missed start and settlement markers without duplicate identity requests",async()=>{
  const tab=controlledRemoteTab(),session=createSessionLifecycle(tab.clock);let owner=7,reads=0;
  const auth=mountAuth(session,async()=>{reads++;return{id:owner};},tab.target);await tick();
  try{
    tab.miss("started","missed");tab.target.dispatchEvent(new Event("focus"));await tick();assert.equal(session.ready(),false);assert.equal(reads,1);
    owner=8;tab.miss("settled","missed");tab.target.dispatchEvent(new Event("pageshow"));await tick();
    assert.equal(session.ready(),true);assert.equal(auth.value().user.id,8);assert.equal(reads,2);assert.equal(tab.timers.size,0);
  }finally{auth.unmount();}
});
test("mount during a remote transition stays suspended; disconnect cancels its recovery timer",async()=>{
  const tab=controlledRemoteTab();tab.miss("started","during-mount");const session=createSessionLifecycle(tab.clock);let reads=0;
  const auth=mountAuth(session,async()=>{reads++;return{id:7};},tab.target);await tick();
  assert.equal(session.ready(),false);assert.equal(reads,0);assert.equal(tab.timers.size,1);auth.unmount();assert.equal(tab.timers.size,0);
});
test("a remote transition overlapping local login cannot restore readiness until both settle",async()=>{
  const tab=controlledRemoteTab(),session=createSessionLifecycle(tab.clock),held=deferred();let owner=7;
  const auth=mountAuth(session,async()=>({id:owner}),tab.target);await tick();
  const local=session.change("login",()=>held.promise).catch(e=>e);
  try{
    tab.deliver("started","remote");held.resolve();await local;await tick();
    assert.equal(session.ready(),false);await assert.rejects(auth.value().checkAuth({requireUser:true}),SessionSupersededError);
    owner=8;tab.deliver("settled","remote");await tick();assert.equal(session.ready(),true);assert.equal(auth.value().user.id,8);
  }finally{held.resolve();await local;auth.unmount();}
});


for(const cleanup of ["settlement","unmount"])test("a dequeued remote recovery callback is inert after "+cleanup,async()=>{
  const tab=controlledRemoteTab(),session=createSessionLifecycle(tab.clock),auth=mountAuth(session,async()=>({id:7}),tab.target);await tick();
  tab.deliver("started","queued-recovery");const callback=[...tab.timers.values()][0].callback;
  if(cleanup==="settlement"){tab.deliver("settled","queued-recovery");await tick();}else auth.unmount();
  const generation=session.generation();callback();await tick();
  try{assert.equal(session.generation(),generation);assert.equal(tab.timers.size,0);}finally{if(cleanup==="settlement")auth.unmount();}
});

// Hard-load order: every layout effect runs before any passive effect, so the
// stored marker is replayed before descendant queries capture a generation.
test("AuthProvider replays the stored session marker in its layout mount effect",async()=>{
  const source=readFileSync(new URL("../contexts/auth/AuthContext.jsx",import.meta.url),"utf8");
  const connect=source.indexOf("sessionLifecycle.connect(window)");
  assert.notEqual(connect,-1);assert.equal(source.indexOf("sessionLifecycle.connect(",connect+1),-1);
  const before=source.slice(0,connect),layout=before.lastIndexOf("useLayoutEffect(() => {"),passive=before.lastIndexOf("useEffect(() => {");
  assert.ok(layout>passive,"connect must run inside useLayoutEffect");
  assert.match(source.slice(connect),/void checkAuth\(\);\s*return \(\) => \{ mountedRef\.current = false; unsubscribe\(\); disconnect\(\); sessionLifecycle\.unconfirmed\(\); \};\s*\}, \[checkAuth, settle\]\);/);
  assert.match(source,/useEffect\(\(\) => onSessionExpired\(/,"session-expiry subscription stays a passive effect");
  const session=createSessionLifecycle(),target=new EventTarget(),calls=[];
  target.localStorage={getItem:()=>JSON.stringify({version:1,phase:"settled",id:"previous-login"}),setItem(){}};
  const auth=mountAuth(session,async()=>{calls.push("me");return{id:7};},target);
  try{
    assert.equal(session.generation(),1);await tick();
    assert.equal(calls.length,1);assert.equal(session.ready(),true);assert.equal(session.identity(),7);assert.equal(auth.value().user.id,7);
  }finally{auth.unmount();}
});

// A reconnect (Strict Mode re-running AuthProvider's mount effect, or a
// reappearing subtree) replays the stored marker; an already applied settled
// transition must not advance the generation again.
const storedTarget=(phase="settled",id="previous-login")=>{const target=new EventTarget();let marker=JSON.stringify({version:1,phase,id});
  target.localStorage={getItem:()=>marker,setItem:(key,value)=>{marker=value;}};return target;};
test("reconnecting replays an already applied settled marker without a new generation",()=>{
  const session=createSessionLifecycle(),target=storedTarget();
  session.connect(target)();assert.equal(session.generation(),1);
  const disconnect=session.connect(target);
  try{assert.equal(session.generation(),1);assert.equal(session.canConfirm(),true);}finally{disconnect();}
});
test("after a reconnect, a new settled transition from another tab still invalidates",()=>{
  const session=createSessionLifecycle(),target=storedTarget();
  session.connect(target)();const disconnect=session.connect(target);
  try{
    const event=new Event("storage");Object.assign(event,{key:SESSION_CHANGE_KEY,newValue:JSON.stringify({version:1,phase:"settled",id:"next-login"})});
    target.dispatchEvent(event);assert.equal(session.generation(),2);
  }finally{disconnect();}
});
test("a stored in-progress transition still suspends confirmation after a reconnect",()=>{
  const timers=new Set(),session=createSessionLifecycle({setTimer:(fn)=>{const t={fn};timers.add(t);return t;},clearTimer:(t)=>timers.delete(t)});
  const target=storedTarget("started","other-tab");
  session.connect(target)();assert.equal(timers.size,0);assert.equal(session.canConfirm(),true);
  const disconnect=session.connect(target);
  try{assert.equal(session.canConfirm(),false);assert.equal(timers.size,1);}finally{disconnect();assert.equal(timers.size,0);}
});
test("this tab's own published settled marker is not re-applied by a reconnect",async()=>{
  const session=createSessionLifecycle(),target=storedTarget("settled","old");
  let disconnect=session.connect(target);const before=session.generation();
  await session.change("login",async()=>{});const after=session.generation();assert.ok(after>before);
  disconnect();disconnect=session.connect(target);
  try{assert.equal(session.generation(),after);}finally{disconnect();}
});
test("AuthProvider remounted on the same page (Strict Mode) advances the generation once for a stored marker",async()=>{
  const session=createSessionLifecycle(),target=storedTarget(),reads=[];
  const getUser=async()=>{reads.push("me");return{id:7};};
  mountAuth(session,getUser,target).unmount();assert.equal(session.generation(),1);
  const auth=mountAuth(session,getUser,target);
  try{assert.equal(session.generation(),1);await tick();assert.equal(session.ready(),true);assert.equal(auth.value().user.id,7);}finally{auth.unmount();}
});
