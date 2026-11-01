// Opt-in real-browser regression. Run the synthetic fixture and isolated Next
// production server first; see OTP_AUTH_UX_REVIEW.md. Never target a live API.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const origin=process.env.OTP_AUTH_BROWSER_ORIGIN,api=process.env.OTP_AUTH_BROWSER_API,cdp=process.env.OTP_AUTH_BROWSER_CDP;
const configured=Boolean(origin&&api&&cdp);
test('production browser OTP confirmation and accessible login dialog', {skip:!configured,timeout:180000}, async(t)=>{
 for(const address of [origin,api,cdp]) assert(['127.0.0.1','localhost'].includes(new URL(address).hostname),'Synthetic loopback targets only');
 const identity=await fetch(api+'/__auth/identity');assert.equal(identity.status,200);assert.deepEqual(await identity.json(),{fixture:'jeawaz-otp-auth',synthetic:true});
 const target=await(await fetch(cdp+'/json/new?about:blank',{method:'PUT'})).json();
 const ws=new WebSocket(target.webSocketDebuggerUrl);t.after(async()=>{ws.close();await fetch(cdp+'/json/close/'+target.id).catch(()=>{});});await new Promise((a,b)=>{ws.onopen=a;ws.onerror=b;});
 let id=0;const pending=new Map(),errors=[],results=[],networkURLs=new Map();let finishedConfirm=0;
 ws.onmessage=e=>{const x=JSON.parse(e.data);if(x.method==='Network.requestWillBeSent')networkURLs.set(x.params.requestId,x.params.request.url);if(['Network.loadingFinished','Network.loadingFailed'].includes(x.method)&&networkURLs.get(x.params.requestId)?.includes('/users/me'))finishedConfirm++;if(x.method==='Fetch.requestPaused'){const allowed=[origin,api].includes(new URL(x.params.request.url).origin);void send(allowed?'Fetch.continueRequest':'Fetch.failRequest',allowed?{requestId:x.params.requestId}:{requestId:x.params.requestId,errorReason:'BlockedByClient'}).catch(()=>{});return;}if(x.id&&pending.has(x.id)){const p=pending.get(x.id);pending.delete(x.id);x.error?p.reject(Error(JSON.stringify(x.error))):p.resolve(x.result);}if(x.method==='Runtime.exceptionThrown')errors.push(x.params.exceptionDetails);if(x.method==='Runtime.consoleAPICalled'&&x.params.type==='error')errors.push(x.params.args.map(a=>a.value||a.description).join(' '));};
 const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__otpBackCalls=0;window.__otpPops=0;const originalBack=history.back.bind(history);history.back=()=>{window.__otpBackCalls++;originalBack();};addEventListener('popstate',()=>window.__otpPops++);`});await send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 const value=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const wait=async(expression,label)=>{const deadline=Date.now()+15000;while(Date.now()<deadline){if(await value(expression))return;await sleep(25);}throw Error('Timeout '+label+'; '+JSON.stringify(await value('({url:location.href,body:document.body.innerText.slice(-1200),active:document.activeElement.tagName})')));};
 const press=async(key,code,modifiers=0)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code,modifiers,text:key==='Enter'?'\r':undefined});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code,modifiers});};
 const click=async selector=>{const p=await value(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length);if(!e)throw Error('missing '+${JSON.stringify(selector)});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});};
 const stats=async()=>await(await fetch(api+'/__test/stats')).json();
 async function open(width,mode='success',confirmDelay=0){
  await fetch(api+`/__auth/config?mode=${mode}&confirmDelay=${confirmDelay}`);
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<640});
  await send('Page.navigate',{url:origin+'/products'});
  await wait(`document.readyState==='complete'&&[...document.querySelectorAll('button')].some(e=>e.getClientRects().length&&e.textContent.includes('\u0648\u0631\u0648\u062f'))`,'login link');
  await value("[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&e.textContent.includes('\u0648\u0631\u0648\u062f')).setAttribute('data-otp-trigger','true')");await click('[data-otp-trigger]');
  await wait(`!!document.querySelector('[role="dialog"] input[name="phoneNumber"]')&&document.activeElement.name==='phoneNumber'`,'dialog initial phone focus');
  assert.equal(await value(`document.querySelectorAll('[role="dialog"]').length`),1);
  assert.equal(await value(`document.querySelector('[role="dialog"]').getAttribute('aria-modal')`),'true');
  assert.equal(await value(`document.querySelector('[role="dialog"]').getAttribute('aria-label')`),'ورود یا ثبت‌نام در جیاواز');
  assert.equal(await value('document.documentElement.scrollWidth<=innerWidth'),true);
  const closeSize=await value(`(()=>{const r=document.querySelector('[role="dialog"] button[aria-label]').getBoundingClientRect();return{width:r.width,height:r.height}})()`);
  if(width<768){assert(closeSize.width<=1);assert(closeSize.height<=1);assert.equal(await value(`document.querySelector('[role="dialog"] button[aria-label]').getAttribute('aria-label')`),"بستن پنجره ورود");}
  else {assert(closeSize.width>=40);assert(closeSize.height>=40);}
  const ax=await send('Accessibility.getFullAXTree');
  assert(ax.nodes.some(n=>!n.ignored&&n.role?.value==='button'&&n.name?.value==='بستن پنجره ورود'),'close remains exposed to assistive technology');
  if(width<768)assert.equal(await value(`(()=>{const button=document.querySelector('[role="dialog"] [aria-label="بستن پنجره ورود"]'),r=button.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===button||button.contains(hit);})()`),false,'no mobile pointer hit area');
  assert.equal(await value('document.body.style.overflow'),'hidden');
 }
 async function enterOtp(){
  await send('Input.insertText',{text:'09121111111'});await press('Enter',13);
  await wait(`document.querySelectorAll('[aria-label^="کد ورود، رقم"]').length===5&&!document.querySelector('[role="dialog"] button[type="submit"]').disabled`,'OTP ready');
  assert.equal(await value(`document.activeElement.getAttribute('aria-label')`),'کد ورود، رقم ۱');
  await send('Input.insertText',{text:'12345'});await press('Enter',13);
 }
 for(const width of [320,375,390,430,480,481,767,768,1024]){
  await open(width);
  for(let i=0;i<12;i++){await press('Tab',9);await wait(`document.querySelector('[role="dialog"]').contains(document.activeElement)`,'focus contained after Tab');}
  for(let i=0;i<12;i++){await press('Tab',9,8);await wait(`document.querySelector('[role="dialog"]').contains(document.activeElement)`,'focus contained after Tab');}
  await press('Escape',27);await wait(`!document.querySelector('[role="dialog"]')`,'Escape dismissal');
  await wait(`document.activeElement.hasAttribute('data-otp-trigger')`,'restore login link focus');
  assert.notEqual(await value('document.body.style.overflow'),'hidden');
  results.push({width,initialFocus:true,tabTrap:true,shiftTabTrap:true,escape:true,focusRestored:true,noOverflow:true});
 }
 await open(1024);await click('[role="dialog"] [aria-label="بستن پنجره ورود"]');await wait(`!document.querySelector('[role="dialog"]')`,'desktop X dismissal');await wait(`document.activeElement.hasAttribute('data-otp-trigger')`,'desktop X focus restoration');results.push({desktopXDismissal:true,focusRestored:true});
 await open(390);await send('Input.dispatchMouseEvent',{type:'mousePressed',x:2,y:2,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:2,y:2,button:'left',clickCount:1});await wait(`!document.querySelector('[role="dialog"]')`,'outside dismissal');assert.notEqual(await value('document.body.style.overflow'),'hidden');results.push({outsideDismissal:true});
 for(const mode of ['500','401','network']){
  await open(390,mode);await enterOtp();
  await wait(`!!document.querySelector('[role="dialog"] [role="alert"]')&&!document.querySelector('[role="dialog"] button[type="submit"]').disabled`,'confirmation error '+mode);
  assert.equal(await value(`document.querySelectorAll('[aria-label^="کد ورود، رقم"]').length`),0);
  assert.match(await value(`document.querySelector('[role="alert"]').textContent`),/بررسی وضعیت ورود/);
  let events=await stats();assert.equal(events.filter(e=>e.path==='/auth/verify-otp').length,1);
  await fetch(api+'/__auth/mode?mode=success');await click('[role="dialog"] button[type="submit"]');
  await wait(`!document.querySelector('[role="dialog"]')`,'confirmation retry success');
  events=await stats();assert.equal(events.filter(e=>e.path==='/auth/verify-otp').length,1);
  results.push({mode,noFalseSuccess:true,retryWithoutOtpReplay:true,verifyRequests:1});
 }
 await open(390,'hold');await enterOtp();
 await wait(`!!document.querySelector('[role="dialog"] [role="status"]')`,'pending confirmation');
 await press('Enter',13);await value(`document.querySelector('[role="dialog"] [aria-label="بستن پنجره ورود"]').focus()`);await press('Enter',13);await wait(`!document.querySelector('[role="dialog"]')`,'close while confirming');
 await fetch(api+'/__auth/release');await wait(`[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='\u067e\u0631\u0648\u0641\u0627\u06cc\u0644')`,'closed flow confirmation settled');assert.equal(await value('location.pathname'),'/products');
 assert.equal((await stats()).filter(e=>e.path==='/auth/verify-otp').length,1);
 assert.equal(await value(`document.body.innerText.includes('به جیاواز خوش آمدید!')`),false);results.push({closeWhileConfirming:true,noLateSuccess:true});
 await open(390);
 const drag=await value(`(()=>{const r=document.querySelector('[role="dialog"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+25}})()`);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...drag,id:1}]});
 for(let d=30;d<=180;d+=30)await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:drag.x,y:drag.y+d,id:1}]});
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(`!document.querySelector('[role="dialog"]')`,'mobile drag dismissal');results.push({mobileDragDismissal:true});

 // Held confirmations are released after the actual dismissal event. The unit
 // regression additionally fixes the exact before-unmount execution order.
 const waitHeld=async()=>{const deadline=Date.now()+15000;while(Date.now()<deadline){const state=await(await fetch(api+'/__auth/pending')).json();if(state.pending===1)return;await sleep(25);}throw Error('confirmation never reached the fixture hold barrier');};
 const waitConfirmationFinished=async(previous)=>{const deadline=Date.now()+15000;while(finishedConfirm<=previous&&Date.now()<deadline)await sleep(25);assert(finishedConfirm>previous,'held confirmation finished');};
 const outside=async()=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',x:2,y:2,button:'left',clickCount:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:2,y:2,button:'left',clickCount:1});};
 const noLateUi=async()=>{assert.equal(await value(`document.body.innerText.includes('به جیاواز خوش آمدید!')||document.body.innerText.includes('کد ورود تأیید شد، اما')`),false);};
 for(const kind of ['escape','outside'])for(const outcome of ['success','500','network']){
  await open(390,'hold');await enterOtp();await wait(`!!document.querySelector('[role="dialog"] [role="status"]')`,'held confirmation');await waitHeld();
  if(kind==='escape')await press('Escape',27);else await outside();
  const previous=finishedConfirm;await fetch(api+'/__auth/release?result='+outcome);await waitConfirmationFinished(previous);
  await wait(`!document.querySelector('[role="dialog"]')`,'pending dismissal '+kind);
  await noLateUi();assert.equal(await value('window.__otpBackCalls'),1);assert.equal((await stats()).filter(e=>e.path==='/auth/verify-otp').length,1);
  results.push({pendingDismissal:kind,outcome,oneNavigation:true,noLateUi:true,noOtpReplay:true});
 }
 for(const kind of ['escape','outside']){
  await open(390);
  // Hold the known drag-close timer explicitly rather than racing a 300ms sleep.
  await value(`(()=>{const nativeSet=window.setTimeout,nativeClear=window.clearTimeout;let id=2000000000;window.__dragPending=new Map();window.__dragCaptured=[];window.setTimeout=(fn,delay,...args)=>{if(delay===300&&typeof fn==='function'){const run=()=>fn(...args);window.__dragPending.set(++id,run);window.__dragCaptured.push(run);return id;}return nativeSet(fn,delay,...args);};window.clearTimeout=(id)=>{window.__dragPending.delete(id);nativeClear(id);};})()`);
  const pos=await value(`(()=>{const r=document.querySelector('[role="dialog"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+25}})()`);
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...pos,id:1}]});
  for(let d=30;d<=180;d+=30)await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:pos.x,y:pos.y+d,id:1}]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait('window.__dragCaptured.length===1','captured drag timer');
  if(kind==='escape')await press('Escape',27);else await outside();
  await wait(`!document.querySelector('[role="dialog"]')`,'combined drag dismissal');assert.equal(await value('window.__dragPending.size'),0);
  // Even a callback dequeued before cancellation must be inert after unmount.
  await value('window.__dragCaptured[0]()');assert.equal(await value('window.__otpBackCalls'),1);await noLateUi();
  results.push({dragThen:kind,queuedCallbackAfterUnmount:true,oneNavigation:true});
  if(kind==='escape'){
   await value(`[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&e.textContent.includes('ورود')).setAttribute('data-otp-trigger','true')`);await click('[data-otp-trigger]');
   await wait(`document.activeElement.name==='phoneNumber'&&!!document.querySelector('[role="dialog"]')`,'reopened login');
   await enterOtp();await wait(`!document.querySelector('[role="dialog"]')`,'fresh reopened login success');
   assert.equal((await stats()).filter(e=>e.path==='/auth/verify-otp').length,1);assert.equal(await value('window.__otpBackCalls'),2);results.push({reopenedLogin:true,freshAttempt:true});
  }
 }
 await open(390,'hold');await enterOtp();await wait(`!!document.querySelector('[role="dialog"] [role="status"]')`,'Back held confirmation');await waitHeld();
 const history=await send('Page.getNavigationHistory');assert(history.currentIndex>0);await send('Page.navigateToHistoryEntry',{entryId:history.entries[history.currentIndex-1].id});
 await wait(`!document.querySelector('[role="dialog"]')`,'native Back dismissal');
 const previous=finishedConfirm;await fetch(api+'/__auth/release');await waitConfirmationFinished(previous);await noLateUi();
 assert.equal(await value('window.__otpBackCalls'),0);results.push({nativeBack:true,noExtraHistoryCall:true,noLateUi:true});

 const hydration=errors.filter(e=>/hydrat|Minified React error|maximum update|invalid hook/i.test(JSON.stringify(e)));assert.deepEqual(hydration,[]);
 if(process.env.OTP_AUTH_EVIDENCE_DIR)fs.writeFileSync(path.join(process.env.OTP_AUTH_EVIDENCE_DIR,'browser.json'),JSON.stringify({results,hydrationErrors:hydration},null,2));console.log(JSON.stringify({passed:results.length,results}));
});
