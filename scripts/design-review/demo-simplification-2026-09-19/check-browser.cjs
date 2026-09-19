const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve('scripts/design-review/demo-simplification-2026-09-19/screenshots');
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
  async function navigate(key,port=4185){
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
  for(const [label,width,dpr] of [['desktop',1280,1],['mobile',390,2]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:dpr,mobile:label==='mobile'});
    for(const scheme of ['light','dark']){
      await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:scheme},{name:'prefers-reduced-motion',value:'reduce'}]});
      for(const key of Object.keys(routes)){
        await navigate(key);await shot(label+'-'+scheme+'-'+key,key);
        if(key==='castle'){
          await navigate(key,4186);await shot(label+'-'+scheme+'-castle-baseline',key);
          assert(label+' '+scheme+' Castle unchanged',fs.readFileSync(path.join(out,label+'-'+scheme+'-castle-baseline.png')).equals(fs.readFileSync(path.join(out,label+'-'+scheme+'-castle.png'))));
        }
      }
    }
  }
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'},{name:'prefers-reduced-motion',value:'reduce'}]});
  await navigate('if');
  assert('IF has four buttons and no numeric readouts or sliders',await evaluate(`document.querySelectorAll('[data-if-demo] button').length===4&&!document.querySelector('[data-if-demo] input, [data-score-if], [data-probe-context]')`));
  await click('[data-action=clear]');await sleep(100);
  const empty=await evaluate(`document.querySelector('[data-panel=if]').toDataURL()`);
  await evaluate(`document.querySelector('[data-panel=if]').focus()`);
  const key=async(k,n)=>{for(const type of ['keyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:k,code:k,windowsVirtualKeyCode:n});};
  await key('Enter',13);await sleep(200);
  const one=await evaluate(`document.querySelector('[data-panel=if]').toDataURL()`);
  assert('Keyboard adds a visible first point',empty!==one);
  await shot('if-first-point','if');
  await key('Delete',46);await sleep(200);
  assert('Keyboard removes point without a tool menu',empty===await evaluate(`document.querySelector('[data-panel=if]').toDataURL()`));
  await click('[data-preset=two-blobs]');await sleep(200);
  const both=await evaluate(`Array.from(document.querySelectorAll('[data-panel]')).map(c=>c.toDataURL())`);
  await evaluate(`document.querySelector('[data-panel=if]').focus()`);await key('ArrowRight',39);await sleep(200);
  assert('Keyboard probe moves on both maps',await evaluate(`Array.from(document.querySelectorAll('[data-panel]')).every((c,i)=>c.toDataURL()!==${JSON.stringify(both)}[i])`));
  await navigate('lux');
  assert('LUX has one button and one energy output',await evaluate(`document.querySelectorAll('[data-lux-demo] button').length===1&&!document.querySelector('[data-lux-angle-value]')&&!!document.querySelector('[data-lux-energy-value]')`));
  for(const [angle,expected] of [[0,'0.00 keV'],[180,'74.1 keV']]){
    await evaluate(`(()=>{const input=document.querySelector('[data-lux-angle]');input.value=${angle};input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await sleep(150);
    const actual=await evaluate(`document.querySelector('[data-lux-energy-value]').textContent`);
    assert('LUX angle '+angle+' gives correct energy',actual===expected,actual);
  }
  await shot('lux-maximum','lux');
  await click('[data-action=reset]');await sleep(150);
  const still=await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`);await sleep(200);
  assert('Reduced-motion LUX stays static',still===await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`));
  await navigate('orbit');
  assert('Orbit is one canvas without tables or numeric readouts',await evaluate(`document.querySelectorAll('[data-orbit-demo] canvas').length===1&&!document.querySelector('[data-orbit-demo] table, [data-orbit-value]')`));
  assert('Reduced-motion orbit starts paused',await evaluate(`document.querySelector('[data-action=pause]').textContent==='Resume'`));
  for(const mode of ['hohmann','greedy']){
    await click('[data-action='+mode+']');
    await poll(`/Target orbit reached/i.test(document.querySelector('[data-orbit-status]').textContent)`,35000);
    await click('[data-action=pause]');await shot('orbit-'+mode,'orbit');
    assert(mode+' completes with a short status',await evaluate(`document.querySelector('[data-orbit-status]').textContent.trim().split(/\s+/).length<12`));
  }
  await click('[data-action=prograde]');await sleep(150);
  assert('Manual burn takes over flight',await evaluate(`!/Target orbit reached/i.test(document.querySelector('[data-orbit-status]').textContent)`));
  await click('[data-action=reset]');
  await send('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:2,mobile:true});
  for(const k of ['if','lux','orbit']){await navigate(k);await shot('narrow-'+k,k);}
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'},{name:'prefers-reduced-motion',value:'no-preference'}]});
  await navigate('lux');
  assert('LUX retains fragment position',await evaluate(`(()=>{const r=document.querySelector('[data-lux-demo]').getBoundingClientRect();return r.top>=0&&r.top<150})()`));
  await click('[data-action=reset]');await sleep(100);
  const pulse=await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`);await sleep(220);
  assert('Reset replays the neutron path',pulse!==await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`));
  await sleep(1100);const ended=await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`);await sleep(200);
  assert('Neutron replay ends',ended===await evaluate(`document.querySelector('[data-lux=tpc]').toDataURL()`));
  await navigate('orbit');await sleep(200);
  const picture=()=>evaluate(`document.querySelector('[data-orbit=map]').toDataURL()`);
  const initial=await picture();await sleep(200);
  assert('Orbit animates normally',initial!==await picture());
  await evaluate(`window.scrollTo({top:0,behavior:'instant'})`);await sleep(250);const off=await picture();await sleep(300);
  assert('Offscreen orbit pauses',off===await picture());
  await evaluate(`document.getElementById('fly-it-live').scrollIntoView({block:'start',behavior:'instant'})`);await sleep(300);
  assert('Returning to orbit resumes it',off!==await picture());
  await click('[data-action=pause]');const paused=await picture();await sleep(250);
  assert('Pause stops animation',paused===await picture());
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:1000,deviceScaleFactor:2,mobile:true});
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await navigate('if');await click('[data-action=clear]');await sleep(150);
  const cleared=await evaluate(`document.querySelector('[data-panel=if]').toDataURL()`);
  async function touchPoint(){
    await evaluate(`document.querySelector('[data-panel=if]').scrollIntoView({block:'center',behavior:'instant'})`);
    let previous=null,stable=0;for(let i=0;i<40&&stable<3;i++){await sleep(50);const current=await evaluate(`scrollY+':'+document.querySelector('[data-panel=if]').getBoundingClientRect().top`);stable=current===previous?stable+1:0;previous=current;}
    return evaluate(`(()=>{const r=document.querySelector('[data-panel=if]').getBoundingClientRect();return {x:r.x+r.width*.5,y:r.y+r.height*.6,id:1}})()`);
  }
  let point=await touchPoint();const scrollStart=await evaluate('scrollY');
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...point,y:point.y-80}]});await sleep(150);
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(200);
  assert('Touch pan scrolls without editing',await evaluate(`scrollY>${scrollStart}&&document.querySelector('[data-panel=if]').toDataURL()===${JSON.stringify(cleared)}`));
  point=await touchPoint();
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(200);
  assert('Touch tap adds a visible point directly',cleared!==await evaluate(`document.querySelector('[data-panel=if]').toDataURL()`));
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});
  await send('Emulation.setScriptExecutionDisabled',{value:true});
  for(const k of ['if','lux','orbit']){
    await send('Page.navigate',{url:'http://127.0.0.1:4185'+routes[k]});await poll('document.readyState === "complete"');
    assert(k+' no-JS fallback and anchor',await evaluate(`document.querySelector('[data-${k}-demo]').hidden&&!!document.getElementById('${anchors[k]}')`));
  }
  await send('Emulation.setScriptExecutionDisabled',{value:false});
  assert('No browser exceptions',errors.length===0,errors);
  fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify({report,checks,errors},null,2)+'\n');
  await cmd('Browser.close');
})().catch(e=>{console.error(e);chrome.kill();process.exitCode=1;});
