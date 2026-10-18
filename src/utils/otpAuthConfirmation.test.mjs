import { createSessionLifecycle, SessionSupersededError } from "./sessionLifecycle.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as flow from "./otpLoginFlow.mjs";
import * as otp from "./otpInputContract.mjs";
import { toPersianNumbers } from "./toPersianNumbers.js";
const require = createRequire(import.meta.url);
const { transformSync } = require("next/dist/build/swc");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const source = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
function load(p, deps, globals = {}) {
  const { code } = transformSync(source(p), { filename:p, module:{type:"commonjs"},
    jsc:{parser:{syntax:"ecmascript",jsx:true},transform:{react:{runtime:"automatic"}}} });
  const exports = {};
  new Function("require","exports","setTimeout","clearTimeout","window",code)(
    (name)=>Object.hasOwn(deps,name)?deps[name]:require(name), exports,
    globals.setTimeout ?? setTimeout, globals.clearTimeout ?? clearTimeout,
    globals.window ?? {addEventListener(){},removeEventListener(){}},
  );
  return exports;
}
// Exercise real compiled components/callbacks with isolated hook state, not copied
// login logic. Network, router, effects and toast boundaries are controlled.
function hooks() {
  const cells=[], effects=[]; let index=0;
  const react={...React,
    useState(initial){const i=index++;if(!(i in cells))cells[i]=typeof initial==="function"?initial():initial;return[cells[i],v=>{cells[i]=typeof v==="function"?v(cells[i]):v;}];},
    useRef(initial){const i=index++;return cells[i]??(cells[i]={current:initial});},
    useCallback(fn,deps){const i=index++,old=cells[i];if(!old||deps.some((v,j)=>v!==old.deps[j]))cells[i]={deps,value:fn};return cells[i].value;},
    useMemo(fn,deps){const i=index++,old=cells[i];if(!old||deps.some((v,j)=>v!==old.deps[j]))cells[i]={deps,value:fn()};return cells[i].value;},
    useEffect(fn,deps){const i=index++,old=cells[i];if(!old||deps.some((v,j)=>v!==old.deps[j])){old?.cleanup?.();cells[i]={deps};effects.push(()=>{cells[i].cleanup=fn();});}},
  };
  return {react,render(fn,props,runEffects=true){index=0;const tree=fn(props);if(runEffects)while(effects.length)effects.shift()();return tree;},unmount(){for(const cell of cells)cell?.cleanup?.();}};
}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
function context(getUserApi) {
  const h=hooks(), lifecycle=createSessionLifecycle();
  const {AuthProvider}=load("contexts/auth/AuthContext.jsx",{
    react:h.react,"@/services/authServices":{loginApi:async()=>{},logoutApi:async()=>{}},
    "@/services/usersServices":{getUserApi,updateUserApi:async()=>{}},
    "@/utils/authSessionEvents.mjs":{onSessionExpired:()=>()=>{}},
    "@/utils/sessionLifecycle.mjs":{sessionLifecycle:lifecycle,SessionSupersededError},
  });
  return {lifecycle,value:()=>h.render(AuthProvider,{children:null},false).props.value};
}
for(const status of [401,500,"network"]){
  test(`strict confirmation rejects ${status}; default background check still resolves`,async()=>{
    const error=Object.assign(new Error("fixture failure"),{response:status==="network"?undefined:{status}});
    const c=context(async()=>{throw error;});
    await assert.rejects(c.value().checkAuth({requireUser:true}),e=>e===error);
    assert.equal(c.value().user,null);
    await assert.doesNotReject(c.value().checkAuth());
  });
}
test("strict confirmation requires a real user and returns it",async()=>{
  for(const value of [null,{},undefined])await assert.rejects(context(async()=>value).value().checkAuth({requireUser:true}));
  const user={id:7,phoneNumber:"989121111111"},c=context(async()=>user);
  assert.equal(await c.value().checkAuth({requireUser:true}),user);assert.equal(c.value().user,user);
});
test("superseded confirmation cannot claim success or replace a newer user",async()=>{
  const old=deferred();let calls=0;const c=context(()=>++calls===1?old.promise:Promise.resolve({id:8}));
  const first=c.value().checkAuth({requireUser:true});
  c.lifecycle.invalidate("account-change");
  await c.value().checkAuth({requireUser:true});old.resolve({id:7});
  await assert.rejects(first,SessionSupersededError);assert.equal(c.value().user.id,8);
});
function login({verify=async()=>{},confirm=async()=>({id:7}),checkout=false,dismissal=null}={}) {
  const h=hooks(),calls={request:0,verify:0,confirm:0,success:[],errors:[],navigation:0,authenticated:0};
  let webOtp;
  const Form=()=>null,Field=()=>null,Otp=()=>null;
  const {default:Login}=load("app/(user)/auth/_components/Login.jsx",{
    react:h.react,"next/navigation":{useRouter:()=>({replace:()=>calls.navigation++,back:()=>calls.navigation++})},
    "react-hot-toast":{success:m=>calls.success.push(m),error:m=>calls.errors.push(m)},
    "react-hook-form":{useForm:()=>({register:()=>{},control:{},watch:()=>"09121111111",handleSubmit:fn=>fn,formState:{errors:{}}})},
    "@/contexts/auth/AuthContext":{useAuth:()=>({checkAuth:async(options)=>{assert.deepEqual(options,{requireUser:true});calls.confirm++;return confirm();},login:async()=>{}})},
    "@/components/Modal":{useModalDismissal:()=>dismissal},
    "./LoginForm":Form,"@/ui/PassInput":()=>null,"@/ui/RHFTextField":Field,"@/ui/PersianOTPInput":Otp,
    "@/services/authServices":{requestOtpApi:async()=>{calls.request++;return{expiresAt:new Date(Date.now()+90000).toISOString()};},verifyOtpApi:async body=>{calls.verify++;assert.deepEqual(body,{phoneNumber:"09121111111",code:"12345"});return verify();}},
    "@/hooks/useOtpTimer":()=>({resendRemaining:0}),"@/hooks/useWebOtp":options=>{webOtp=options;},
    "@/utils/otpInputContract.mjs":otp,"@/utils/otpLoginFlow.mjs":flow,
  });
  const props={closeBtn:true,afterLoginHref:checkout?undefined:"/",onAuthenticated:checkout?()=>calls.authenticated++:undefined};
  const form=()=>h.render(Login,props).props.children;
  const ready=async()=>{await form().props.onSubmit({phoneNumber:"09121111111"});form().props.children.props.children.props.onChange("12345");};
  return{calls,form,ready,close:()=>h.unmount(),webCode:code=>webOtp.onCode(code,webOtp.requestKey)};
}
test("OTP plus confirmed user announces success and navigates exactly once",async()=>{
  const l=login();await l.ready();await l.form().props.onSubmit({});await l.form().props.onSubmit({});
  assert.equal(l.calls.verify,1);assert.equal(l.calls.confirm,1);assert.equal(l.calls.success.length,1);assert.equal(l.calls.navigation,1);
});
for(const status of [401,500,"network"]){
  test(`OTP accepted then confirmation ${status}: retry confirms only, never replays OTP`,async()=>{
    let fail=true;const l=login({confirm:async()=>{if(fail)throw Object.assign(new Error("fixture"),{response:{status}});return{id:7};}});
    await l.ready();await l.form().props.onSubmit({});
    assert.equal(l.calls.verify,1);assert.equal(l.calls.success.length,0);assert.equal(l.calls.navigation,0);
    assert.equal(l.form().props.sessionAccepted,true);assert.equal(l.form().props.editDisabled,true);
    assert.equal(l.form().props.children.props.role,"alert");
    await l.form().props.onResend();assert.equal(l.calls.request,1);
    l.form().props.onEditPhone();assert.equal(l.form().props.sessionAccepted,true);
    fail=false;await l.form().props.onSubmit({});
    assert.equal(l.calls.verify,1);assert.equal(l.calls.confirm,2);assert.equal(l.calls.navigation,1);assert.equal(l.calls.success.length,1);
  });
}
test("invalid/expired OTP stays on code entry and never confirms the session",async()=>{
  const l=login({verify:async()=>{throw{response:{status:401}};}});await l.ready();await l.form().props.onSubmit({});
  assert.equal(l.calls.confirm,0);assert.equal(l.form().props.sessionAccepted,false);assert.equal(l.calls.success.length,0);
});
test("delayed verification coalesces submissions; closing prevents confirmation and navigation",async()=>{
  const d=deferred(),l=login({verify:()=>d.promise});await l.ready();
  const p=l.form().props.onSubmit({});await l.form().props.onSubmit({});assert.equal(l.calls.verify,1);
  l.close();d.resolve();await p;assert.equal(l.calls.confirm,0);assert.equal(l.calls.success.length,0);assert.equal(l.calls.navigation,0);
});
test("delayed confirmation blocks duplicate submissions and suppresses closed-modal success",async()=>{
  const d=deferred(),started=deferred(),l=login({confirm:()=>{started.resolve();return d.promise;}});await l.ready();
  const p=l.form().props.onSubmit({});await started.promise;await l.form().props.onSubmit({});
  assert.equal(l.calls.verify,1);assert.equal(l.calls.confirm,1);l.close();d.resolve({id:7});await p;
  assert.equal(l.calls.navigation,0);assert.equal(l.calls.success.length,0);
});
test("checkout is notified only after confirmed authentication",async()=>{
  const l=login({checkout:true});await l.ready();await l.form().props.onSubmit({});assert.equal(l.calls.authenticated,1);assert.equal(l.calls.navigation,0);
});
test("actual OTP slots and login icon buttons render meaningful Persian accessible names",()=>{
  const {default:Input}=load("ui/PersianOTPInput.jsx",{"@/utils/toPersianNumbers":{toPersianNumbers},"@/utils/otpInputContract.mjs":otp});
  const html=renderToStaticMarkup(React.createElement(Input,{value:"",onChange:()=>{},label:"کد ورود",numInputs:5}));
  assert.equal((html.match(/aria-label="کد ورود، رقم/g)||[]).length,5);
  const {default:Form}=load("app/(user)/auth/_components/LoginForm.jsx",{"./AuthLayout":({children})=>children});
  const form=renderToStaticMarkup(React.createElement(Form,{step:"otp",otpScreen:"ready",closeBtn:true}));
  assert.match(form,/aria-label="بستن پنجره ورود"/);assert.match(form,/aria-label="بازگشت و ویرایش شماره موبایل"/);
  const retry=renderToStaticMarkup(React.createElement(Form,{step:"otp",otpScreen:"ready",sessionAccepted:true}));
  assert.match(retry,/بررسی مجدد وضعیت ورود/);assert.doesNotMatch(retry,/aria-label="بازگشت/);
});

test("accessible login Modal opts into one Base UI dialog; legacy consumers retain their surface",()=>{
  const h=hooks(),Root=()=>null,Portal=()=>null,Popup=()=>null,Backdrop=()=>null;
  const outside=[],closed=[];
  const {default:Modal}=load("components/Modal.jsx",{
    react:h.react,"@base-ui/react/dialog":{Dialog:{Root,Portal,Popup}},"@/ui/Backdrop":Backdrop,
    "@/hooks/useOutsideClick":(_close,_capture,enabled)=>{outside.push(enabled);return{current:null};},
    "@/hooks/useDragToClose":{useDragToClose:()=>({onPointerDown:()=>{}})},
  });
  const legacy=h.render(Modal,{isOpen:true,onClose:()=>{},children:null});
  assert.equal(legacy.type,Backdrop);assert.equal(legacy.props.children.props.children.type,"section");assert.equal(outside.at(-1),true);
  const dialog=h.render(Modal,{isOpen:true,onClose:()=>closed.push(true),accessibleLabel:"ورود",children:null}).props.children;
  assert.equal(dialog.type,Root);assert.equal(dialog.props.modal,"trap-focus");assert.equal(outside.at(-1),false);
  const surface=dialog.props.children.props.children.props.children.props.children;
  assert.equal(surface.type,Popup);assert.equal(surface.props["aria-label"],"ورود");assert.equal(surface.props["aria-modal"],true);
  assert.equal(surface.props.finalFocus,true);assert.equal(typeof surface.props.onPointerDown,"function");
  dialog.props.onOpenChange(true);assert.equal(closed.length,0);dialog.props.onOpenChange(false);assert.equal(closed.length,1);
});
test("popup fallback focus follows replacement OTP input without overriding child focus",()=>{
  const h=hooks(),Popup=()=>null;
  const {default:Modal}=load("components/Modal.jsx",{
    react:h.react,"@base-ui/react/dialog":{Dialog:{Root:()=>null,Portal:()=>null,Popup}},"@/ui/Backdrop":()=>null,
    "@/hooks/useOutsideClick":()=>({current:null}),"@/hooks/useDragToClose":{useDragToClose:()=>({})},
  });
  const provided=h.render(Modal,{isOpen:true,onClose:()=>{},accessibleLabel:"ورود"});
  const dialog=provided.props.children;
  const props=dialog.props.children.props.children.props.children.props.children.props;
  let focused=0;const input={focus:()=>focused++},surface={querySelector:()=>input};
  props.ref(surface);assert.equal(props.initialFocus(),input);
  props.onFocus({target:surface,currentTarget:surface});assert.equal(focused,1);
  props.onFocus({target:input,currentTarget:surface});assert.equal(focused,1);
});
test("confirmation pending keeps the retry submission disabled",()=>{
  const {default:Form}=load("app/(user)/auth/_components/LoginForm.jsx",{"./AuthLayout":({children})=>children});
  const html=renderToStaticMarkup(React.createElement(Form,{step:"otp",otpScreen:"ready",sessionAccepted:true,verifyPending:true}));
  assert.match(html,/type="submit" disabled="" aria-busy="true"/);
});

test("explicit close suppresses pending success before unmount and ignores duplicate closes",async()=>{
  const d=deferred(),started=deferred(),l=login({confirm:()=>{started.resolve();return d.promise;}});
  await l.ready();const pending=l.form().props.onSubmit({});await started.promise;
  l.form().props.onClose();l.form().props.onClose();assert.equal(l.calls.navigation,1);
  d.resolve({id:7});await pending;assert.equal(l.calls.navigation,1);assert.equal(l.calls.success.length,0);
});

test("strict password-login confirmation rejects failure; legacy callers keep best-effort behavior",async()=>{
  const c=context(async()=>{throw new Error("fixture failure");});
  await assert.rejects(c.value().login({}, {requireUser:true}),/fixture failure/);
  await assert.doesNotReject(c.value().login({}));
});

function fakeClock() {
  let next=0;const active=new Map(),queued=[];
  return {
    setTimeout(fn){const id=++next;active.set(id,fn);queued.push(fn);return id;},
    clearTimeout(id){active.delete(id);},
    flush(){const ready=[...active.values()];active.clear();for(const fn of ready)fn();},
    get size(){return active.size;},queued,
  };
}
function modalSession(onClose, {accessible=true}={}) {
  const h=hooks(),clock=fakeClock(),listeners=new Set();
  const win={addEventListener:(_type,fn)=>listeners.add(fn),removeEventListener:(_type,fn)=>listeners.delete(fn)};
  const globals={...clock,window:win};
  const drag=load('hooks/useDragToClose.js',{react:h.react},globals);
  const Root=()=>null,Portal=()=>null,Popup=()=>null;
  const {default:Modal}=load('components/Modal.jsx',{
    react:h.react,'@base-ui/react/dialog':{Dialog:{Root,Portal,Popup}},'@/ui/Backdrop':()=>null,
    '@/hooks/useOutsideClick':()=>({current:null}),'@/hooks/useDragToClose':drag,
  },globals);
  let tree;
  const render=(isOpen=true)=>{tree=h.render(Modal,{isOpen,onClose,accessibleLabel:accessible?'fixture':undefined});};
  render();
  const root=()=>accessible?tree.props.children:null;
  const surface=()=>accessible?root().props.children.props.children.props.children.props.children:tree.props.children.props.children;
  return {
    clock,render,get dismissal(){return accessible?tree.props.value:null;},
    dismiss(reason='escape-key'){root().props.onOpenChange(false,{reason});},
    pop(){for(const fn of [...listeners])fn();},
    drag(){const props=surface().props,el={style:{},querySelector:()=>null,setPointerCapture:()=>{}};props.onPointerDown({pointerType:'touch',currentTarget:el,clientY:0,pointerId:1});props.onPointerMove({currentTarget:el,clientY:180});props.onPointerUp({currentTarget:el});},
    unmount(){h.unmount();},
  };
}
for(const reason of ['escape-key','outside-press','close-button'])for(const outcome of ['success','failure']) {
  test(`${reason} synchronously suppresses late ${outcome} before unmount, with one dismissal`,async()=>{
    const d=deferred(),started=deferred();let l;
    const m=modalSession(()=>l.calls.navigation++);
    l=login({dismissal:m.dismissal,confirm:()=>{started.resolve();return d.promise;}});
    await l.ready();const pending=l.form().props.onSubmit({});await started.promise;
    if(reason==='close-button')l.form().props.onClose();else m.dismiss(reason);
    assert.equal(m.dismissal.isDismissed(),true);assert.equal(l.calls.navigation,1);
    m.dismiss('outside-press');l.form().props.onClose();await l.form().props.onSubmit({});
    if(outcome==='success')d.resolve({id:7});else d.reject(new Error('fixture late failure'));
    await pending;
    assert.equal(l.calls.navigation,1);assert.equal(l.calls.success.length,0);assert.equal(l.calls.errors.length,0);
    assert.equal(l.calls.verify,1);assert.equal(l.calls.confirm,1);
    m.unmount();l.close();assert.equal(m.clock.size,0);
  });
}
for(const reason of ['escape-key','outside-press']) {
  test(`drag then ${reason} cancels the queued close, even if dequeued after unmount`,()=>{
    let closes=0;const m=modalSession(()=>closes++);m.drag();
    assert.equal(m.dismissal.isDismissed(),true);assert.equal(m.clock.size,1);
    const dequeued=m.clock.queued.at(-1);m.dismiss(reason);assert.equal(closes,1);assert.equal(m.clock.size,0);
    m.unmount();dequeued();m.clock.flush();assert.equal(closes,1);
  });
}
for(const outcome of ['success','failure']) {
  test(`drag immediately invalidates confirmation before animation finishes: ${outcome}`,async()=>{
    const d=deferred(),started=deferred();let l;const m=modalSession(()=>l.calls.navigation++);
    l=login({dismissal:m.dismissal,confirm:()=>{started.resolve();return d.promise;}});
    await l.ready();const pending=l.form().props.onSubmit({});await started.promise;
    m.drag();assert.equal(l.calls.navigation,0);assert.equal(m.dismissal.isDismissed(),true);
    if(outcome==='success')d.resolve({id:7});else d.reject(new Error('fixture'));
    await pending;assert.equal(l.calls.success.length,0);assert.equal(l.calls.errors.length,0);
    m.clock.flush();assert.equal(l.calls.navigation,1);assert.equal(l.calls.verify,1);m.unmount();
  });
}
test('unmount cancels a pending drag without navigating',()=>{
  let closes=0;const m=modalSession(()=>closes++);m.drag();const dequeued=m.clock.queued.at(-1);
  m.unmount();assert.equal(m.clock.size,0);dequeued();assert.equal(closes,0);
});
test('reopening starts a fresh valid login and cannot be closed by the previous drag',async()=>{
  let closes=0;const m=modalSession(()=>closes++);m.drag();const old=m.clock.queued.at(-1);
  m.dismiss();m.render(false);m.render(true);assert.equal(m.dismissal.isDismissed(),false);
  old();assert.equal(closes,1);
  const l=login({dismissal:m.dismissal});await l.ready();await l.form().props.onSubmit({});
  assert.equal(l.calls.verify,1);assert.equal(l.calls.success.length,1);assert.equal(l.calls.navigation,1);m.unmount();
});
test('browser Back invalidates pending confirmation without a second history transition',async()=>{
  const d=deferred(),started=deferred();let closes=0;const m=modalSession(()=>closes++);
  const l=login({dismissal:m.dismissal,confirm:()=>{started.resolve();return d.promise;}});
  await l.ready();const pending=l.form().props.onSubmit({});await started.promise;
  m.pop();assert.equal(m.dismissal.isDismissed(),true);m.dismiss();d.resolve({id:7});await pending;
  assert.equal(closes,0);assert.equal(l.calls.navigation,0);assert.equal(l.calls.success.length,0);m.unmount();
});
test('legacy Modal retains its original single drag close and no dismissal provider',()=>{
  let closes=0;const m=modalSession(()=>closes++,{accessible:false});assert.equal(m.dismissal,null);
  m.drag();assert.equal(closes,0);m.clock.flush();assert.equal(closes,1);m.unmount();
});
test('closing a legacy Modal cancels a pending drag without changing active drag behavior',()=>{
  let closes=0;const m=modalSession(()=>closes++,{accessible:false});m.drag();const old=m.clock.queued.at(-1);
  m.render(false);assert.equal(m.clock.size,0);old();assert.equal(closes,0);m.unmount();
});
test('terms navigation uses the same dismissal once before its destination push',()=>{
  let closes=0,pushes=0;const m=modalSession(()=>closes++),clock=fakeClock(),h=hooks();
  const {default:Layout}=load('app/(user)/auth/_components/AuthLayout.jsx',{
    react:h.react,'next/navigation':{useRouter:()=>({back:()=>{throw Error('bypassed dismissal');},push:()=>pushes++})},
    '@/components/Modal':{useModalDismissal:()=>m.dismissal},'@/utils/toPersianNumbers':{toPersianNumbers},
  },clock);
  const tree=h.render(Layout,{login:true,step:'phone'});
  function button(node){if(!node||typeof node!=='object')return null;if(node.type==='button')return node;for(const child of React.Children.toArray(node.props?.children)){const found=button(child);if(found)return found;}return null;}
  button(tree).props.onClick();button(tree).props.onClick();assert.equal(closes,1);assert.equal(m.dismissal.isDismissed(),true);
  clock.flush();assert.equal(pushes,1);m.unmount();
});

test('WebOTP arriving after dismissal cannot fill the old form or verify a code',async()=>{
  let closes=0;const m=modalSession(()=>closes++),l=login({dismissal:m.dismissal});await l.ready();
  l.form().props.children.props.children.props.onChange('');l.form();m.dismiss();l.webCode('54321');
  const input=l.form().props.children.props.children;assert.equal(input.props.value,'');
  assert.equal(l.calls.verify,0);assert.equal(l.calls.confirm,0);assert.equal(closes,1);m.unmount();
});

test("mobile login close stays screen-reader accessible without a visible control or 44px hit area",()=>{
  const {default:LoginForm}=load("app/(user)/auth/_components/LoginForm.jsx",{"./AuthLayout":{default:()=>null}});
  const form=LoginForm({closeBtn:true,step:"phone",onClose:()=>{},isPasswordType:false});
  const close=form.props.children[0].props.children;
  assert.equal(close.props["aria-label"],"بستن پنجره ورود");assert.equal(close.props.type,"button");
  assert.match(close.props.className,/\bsr-only\b/);assert.match(close.props.className,/md:not-sr-only/);
  assert.doesNotMatch(close.props.className,/max-md:min-[hw]-11/);assert.match(close.props.className,/md:size-10/);
});
