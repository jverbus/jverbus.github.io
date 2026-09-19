const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve('scripts/design-review/demo-improvements-2026-09-18/screenshots');
fs.mkdirSync(out, {recursive:true});
const chrome = spawn(process.env.CHROME_BINARY || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--hide-scrollbars', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--disable-component-update', '--disable-sync',
  '--remote-debugging-pipe', '--user-data-dir=' + fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'jverbus-demo-check-')),
  'about:blank'
], {stdio:['ignore','ignore','pipe','pipe','pipe']});
let seq=0, buffer='', pending=new Map(), errors=[];
chrome.stdio[4].on('data', chunk => {
  buffer += chunk;
  let end;
  while ((end=buffer.indexOf('\0'))!==-1) {
    const msg=JSON.parse(buffer.slice(0,end)); buffer=buffer.slice(end+1);
    if (msg.id && pending.has(msg.id)) {
      const {resolve,reject,timer}=pending.get(msg.id); clearTimeout(timer);pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method==='Runtime.exceptionThrown') errors.push(msg.params);
  }
});
function cmd(method,params={},sessionId) {
  return new Promise((resolve,reject)=>{
    const id=++seq; const timer=setTimeout(()=>reject(new Error('CDP timeout: '+method)),20000);
    pending.set(id,{resolve,reject,timer});
    chrome.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');
  });
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const {targetId}=await cmd('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await cmd('Target.attachToTarget',{targetId,flatten:true});
  const send=(m,p={})=>cmd(m,p,sessionId);
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled',{cacheDisabled:true}); await send('Page.bringToFront');
  async function evaluate(expression) {
    const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async function poll(expression,timeout=20000) {
    const start=Date.now();
    while(Date.now()-start<timeout) {if(await evaluate(expression))return;await sleep(100);}
    throw new Error('Timed out: '+expression);
  }
  const report=[],checks=[];
  const routes={
    if:'/2026/03/18/announcing-extended-isolation-forest-support/',
    lux:'/2016/08/18/calibrating-the-lux-dark-matter-experiment/',
    orbit:'/2026/01/09/brown-physics-ai-winter-school-workshop/',
    castle:'/2016/10/07/insight-castle-compromised-account-detection/'
  };
  const anchors={if:'try-it-live',lux:'kinematics-live',orbit:'fly-it-live'};
  function assert(name,condition,detail){checks.push({name,passed:!!condition,detail});if(!condition)throw new Error(name+': '+JSON.stringify(detail));console.log('PASS '+name);}
  async function click(selector){await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);}
  async function navigate(key,port=4175){
    await send('Page.navigate',{url:'http://127.0.0.1:'+port+routes[key]});
    await poll('document.readyState === "complete"');await evaluate('document.fonts.ready');
    if(key!=='castle'){
      await evaluate(`document.getElementById('${anchors[key]}').scrollIntoView({block:'start',behavior:'instant'})`);
      await poll(`!document.querySelector('[data-${key}-demo]').hidden`);
      await sleep(300);
    }
  }
  async function shot(name,key,selector){
    const sel=selector||(key==='castle'?'.layout-post .unit-article':'[data-'+key+'-demo]');
    await evaluate(`document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:'start',behavior:'instant'})`);
    await sleep(250);
    const layout=await evaluate(`(()=>{const d=document.querySelector(${JSON.stringify(sel)}),r=d.getBoundingClientRect();return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,root:{x:r.x,y:r.y,width:r.width,height:r.height},text:d.innerText,scheme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light',canvases:Array.from(d.querySelectorAll('canvas')).map(c=>({width:c.width,height:c.height,displayWidth:c.clientWidth,displayHeight:c.clientHeight})),inlineStyles:d.querySelectorAll('[style]').length}})()`);
    assert(name+' fits viewport',layout.scrollWidth<=layout.width,layout);
    const capture=key==='castle'?{format:'png'}:{format:'png',captureBeyondViewport:true,clip:{x:Math.max(0,layout.root.x),y:await evaluate('scrollY')+layout.root.y,width:layout.root.width,height:layout.root.height,scale:1}};
    const {data}=await send('Page.captureScreenshot',capture);
    fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data,'base64'));
    report.push({name,...layout});
  }
  if (!process.argv.includes('--extra')) {
  for(const [label,width,dpr] of [['desktop',1280,1],['mobile',390,2]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:dpr,mobile:label==='mobile'});
    for(const scheme of ['light','dark']){
      await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme},{name:'prefers-reduced-motion',value:'reduce'}]});
      for(const key of Object.keys(routes)){
        await navigate(key);await shot(label+'-'+scheme+'-'+key,key);
        if(key==='castle'){
          await navigate(key,4176);await shot(label+'-'+scheme+'-castle-baseline',key);
          const before=fs.readFileSync(path.join(out,label+'-'+scheme+'-castle-baseline.png'));
          const after=fs.readFileSync(path.join(out,label+'-'+scheme+'-castle.png'));
          assert(label+' '+scheme+' Castle screenshot unchanged',before.equals(after));
        }
      }
    }
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'},{name:'prefers-reduced-motion',value:'reduce'}]});
  await navigate('if');
  const scores=await evaluate(`({a:Number(document.querySelector('[data-score-if]').textContent),b:Number(document.querySelector('[data-score-eif]').textContent)})`);
  assert('Opening probe exposes model score difference',scores.b>scores.a,scores);
  await evaluate(`document.querySelector('[data-panel=if]').focus()`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  await sleep(150);
  assert('Keyboard moves linked score probe',await evaluate(`Number(document.querySelector('[data-score-if]').textContent)!==${scores.a}||Number(document.querySelector('[data-score-eif]').textContent)!==${scores.b}`));
  await click('[data-if-demo] [data-action=clear]');await click('[data-tool=add]');
  await evaluate(`document.querySelector('[data-panel=if]').focus()`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await sleep(200);
  await shot('if-first-point','if');
  assert('First point prompts for another point',await evaluate(`document.querySelector('[data-if-demo]').innerText.includes('one more')`));
  await navigate('lux');
  for(const [preset,expected] of [['subkev','0.37 keV'],['onekev','1.00 keV'],['maximum','74.1 keV']]){
    await click('[data-lux-preset='+preset+']');await sleep(150);
    const actual=await evaluate(`document.querySelector('[data-lux-energy-value]').textContent`);
    assert('LUX '+preset+' energy',actual===expected,actual);
    if(preset==='maximum')await shot('lux-maximum','lux');
  }
  await evaluate(`const input=document.querySelector('[data-lux-angle]');input.value=0;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));`);
  await sleep(150);await shot('lux-zero-energy','lux');
  assert('Zero-angle readout remains accessible',await evaluate(`document.querySelector('[data-lux-energy-value]').textContent==='0.00 keV'&&!document.querySelector('[data-lux-readout]').hasAttribute('aria-hidden')`));
  const first=await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`);await sleep(250);
  assert('Reduced-motion LUX is static',first===await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`));
  await navigate('orbit');
  assert('Reduced-motion orbit starts paused',await evaluate(`document.querySelector('[data-action=pause]').textContent==='Resume'`));
  await click('[data-action=hohmann]');
  await poll(`document.querySelectorAll('[data-orbit-results] tr').length===1`);await click('[data-action=pause]');
  await shot('orbit-hohmann','orbit');
  await click('[data-action=greedy]');
  await poll(`document.querySelectorAll('[data-orbit-results] tr').length===2`,30000);await click('[data-action=pause]');
  await shot('orbit-comparison','orbit');
  const bounds=await evaluate(`({near:Number(document.querySelector('[data-orbit-value=near]').textContent),far:Number(document.querySelector('[data-orbit-value=far]').textContent)})`);
  assert('Completed Greedy coast fits visible band',bounds.near>=1.568&&bounds.far<=1.632,bounds);
  await click('[data-action=prograde]');await sleep(150);
  const departure=await evaluate(`document.querySelector('[data-orbit-status]').textContent`);
  assert('Manual burn reports departure',/outside|left|leaves|depart/i.test(departure),departure);
  await click('[data-action=retrograde]');
  await poll(`document.querySelectorAll('[data-orbit-results] tr').length===3`);
  await click('[data-action=reset]');
  assert('Reset retains all completed comparisons',await evaluate(`document.querySelectorAll('[data-orbit-results] tr').length===3`));
  await send('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:2,mobile:true});
  await shot('narrow-orbit-comparison','orbit');
  for(const key of ['if','lux']){await navigate(key);await shot('narrow-'+key,key);}
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'},{name:'prefers-reduced-motion',value:'no-preference'}]});
  await navigate('lux');
  assert('LUX lazy initialization preserves anchor position',await evaluate(`(()=>{const r=document.querySelector('[data-lux-demo]').getBoundingClientRect();return r.top>=0&&r.top<150})()`));
  await click('[data-lux-preset=maximum]');await sleep(150);
  const pulseStart=await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`);await sleep(220);
  assert('LUX example animates a neutron traversal',pulseStart!==await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`));
  await sleep(1000);const pulseEnd=await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`);await sleep(200);
  assert('LUX traversal stops at static geometry',pulseEnd===await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`));
  await click('[data-lux-preset=maximum]');await sleep(100);
  const vertex=await evaluate(`(()=>{const c=document.querySelector('[data-lux=tpc]'),r=c.getBoundingClientRect();return {x:r.x+c.clientLeft+c.clientWidth*.5,y:r.y+c.clientTop+c.clientHeight*.46}})()`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...vertex,button:'left',buttons:1,clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',...vertex,button:'left',buttons:0,clickCount:1});await sleep(150);
  const cancelledReplay=await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`);
  assert('Clicking a vertex clears the interrupted replay',pulseEnd===cancelledReplay);
  await evaluate(`document.querySelector('[data-lux-angle]').focus()`);
  for(const [key,code] of [['Home',36],['ArrowRight',39]]){
    await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code});
  }
  assert('Keyboard slider distinguishes small positive recoil from zero',await evaluate(`document.querySelector('[data-lux-energy-value]').textContent==='<0.01 keV'`));
  await navigate('orbit');await sleep(200);
  const orbitClock=()=>evaluate(`document.querySelector('[data-orbit-value=time]').textContent`);
  assert('Normal-motion orbit begins coasting',Number(await orbitClock())>0);
  await evaluate(`window.scrollTo({top:0,behavior:'instant'})`);await sleep(250);const offscreenTime=await orbitClock();await sleep(350);
  assert('Offscreen orbit stops advancing',offscreenTime===await orbitClock());
  await evaluate(`document.getElementById('fly-it-live').scrollIntoView({block:'start',behavior:'instant'})`);await sleep(250);
  assert('Orbit resumes on returning to view',Number(await orbitClock())>Number(offscreenTime));
  await click('[data-action=pause]');const pausedTime=await orbitClock();await sleep(250);
  assert('Paused orbit stops advancing',pausedTime===await orbitClock());
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:2,mobile:true});
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await navigate('if');await click('[data-action=clear]');await click('[data-tool=add]');await sleep(150);
  async function touchPoint(){
    await evaluate(`document.querySelector('[data-panel=if]').scrollIntoView({block:'center',behavior:'instant'})`);
    let previous=null,stable=0;for(let i=0;i<40&&stable<3;i++){await sleep(50);const current=await evaluate(`scrollY+':'+document.querySelector('[data-panel=if]').getBoundingClientRect().top`);stable=current===previous?stable+1:0;previous=current;}
    return evaluate(`(()=>{const r=document.querySelector('[data-panel=if]').getBoundingClientRect();return {x:r.x+r.width*.5,y:r.y+r.height*.6,id:1}})()`);
  }
  let point=await touchPoint();const scrollStart=await evaluate('scrollY');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,y:point.y-80}]});await sleep(150);
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(200);
  assert('Touch pan scrolls without adding a training point',await evaluate(`scrollY>${scrollStart}&&document.querySelector('[data-probe-context]').textContent.startsWith('No points')`));
  point=await touchPoint();
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(200);
  assert('Completed native touch tap adds one point',await evaluate(`document.querySelector('[data-probe-context]').textContent.startsWith('1 point;')`));
  await click('[data-preset=two-blobs]');await click('[data-tool=inspect]');await sleep(200);
  await evaluate(`document.querySelector('[data-panel=eif]').scrollIntoView({block:'center',behavior:'instant'})`);await sleep(150);
  assert('Mobile score readout stays visible at second panel',await evaluate(`(()=>{const r=document.querySelector('.if-demo-readout').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()`));
  const mobileProbe=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(out,'mobile-if-linked-readout.png'),Buffer.from(mobileProbe.data,'base64'));
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});
  await send('Emulation.setScriptExecutionDisabled',{value:true});
  for(const key of ['if','lux','orbit']){
    await send('Page.navigate',{url:'http://127.0.0.1:4175'+routes[key]});await poll('document.readyState === "complete"');
    assert(key+' no-JS fallback and static anchor',await evaluate(`document.querySelector('[data-${key}-demo]').hidden&&!!document.getElementById('${anchors[key]}')`));
  }
  await send('Emulation.setScriptExecutionDisabled',{value:false});
  assert('No browser exceptions',errors.length===0,errors);
  fs.writeFileSync(path.join(out,process.argv.includes('--extra')?'extra-browser-report.json':'browser-report.json'),JSON.stringify({report,checks,errors},null,2)+'\n');
  await cmd('Browser.close');
})().catch(e=>{console.error(e);chrome.kill();process.exitCode=1;});
