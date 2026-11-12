const fs = require('node:fs');
const root = 'C:/Users/HP/Downloads/Neko Fix';
(async () => {
  const pages = await (await fetch('http://127.0.0.1:9331/json/list')).json();
  const page = pages.find(p => p.type === 'page');
  if (!page) throw Error('No isolated verification tab');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let seq = 0;
  const pending = new Map();
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (pending.has(msg.id)) {
      const { resolve, reject, timeout } = pending.get(msg.id);
      clearTimeout(timeout); pending.delete(msg.id);
      if (msg.error) reject(Error(JSON.stringify(msg.error))); else resolve(msg.result);
    }
  };
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timeout = setTimeout(() => { pending.delete(id); reject(Error(method + ' timed out')); }, 20000);
    pending.set(id, {resolve, reject, timeout});
    ws.send(JSON.stringify({id, method, params}));
  });
  const evaluate = async expression => {
    const res = await call('Runtime.evaluate', {expression, returnByValue:true, awaitPromise:true});
    if (res.exceptionDetails) throw Error(JSON.stringify(res.exceptionDetails));
    return res.result.value;
  };
  await call('Page.enable');
  await call('Runtime.enable');
  await call('Emulation.setDeviceMetricsOverride', {width:360,height:800,deviceScaleFactor:1,mobile:true});
  const ids = ['stack','knife','doodle','slice','breakout','colorswitch','piano','shooter','mines','pipe','sort','match3','lights','gomoku'];
  const results = [];
  for (const id of ids) {
    await call('Page.navigate', {url:'http://127.0.0.1:3010/backup/game-test.html?view='+id+'&ready=1'});
    const ready = await evaluate(`new Promise((resolve,reject)=>{
      const start=performance.now();
      const check=()=>{
        const card=document.querySelector('.g-ready');
        if(card && document.readyState==='complete') {
          setTimeout(()=>resolve({viewport:innerWidth,frame:document.querySelector('.game-frame').clientWidth,card:card.clientWidth,scroll:card.scrollWidth,stage:document.querySelector('.game-stage').clientWidth,stageScroll:document.querySelector('.game-stage').scrollWidth,waiting:!document.querySelector('canvas,.pz-cell,.pz-tube'),errors:window.__errs}),450);
        } else if(performance.now()-start>10000)reject(Error('Ready screen timeout'));
        else setTimeout(check,40);
      };check();
    })`);
    if (id === 'stack') {
      const shot = await call('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(root+'/backup/ready-mobile-360.png',Buffer.from(shot.data,'base64'));
    }
    await evaluate(`document.querySelector('[data-ready-go]').click(); true`);
    const game = await evaluate(`new Promise(resolve=>setTimeout(()=>{
      const frame=document.querySelector('.game-frame');
      const stage=document.querySelector('.game-stage');
      resolve({started:!!document.querySelector('canvas,.pz-cell,.pz-tube'),frame:frame.clientWidth,scroll:frame.scrollWidth,stage:stage.clientWidth,stageScroll:stage.scrollWidth,errors:window.__errs});
    },350))`);
    if (['stack','sort','match3','pipe','lights'].includes(id)) {
      const shot = await call('Page.captureScreenshot',{format:'png'});
      fs.writeFileSync(root+'/backup/game-'+id+'-mobile-360.png',Buffer.from(shot.data,'base64'));
    }
    results.push({id,ready,game});
  }
  fs.writeFileSync(root+'/backup/responsive-results.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results.map(r=>({id:r.id,waiting:r.ready.waiting,started:r.game.started,overflow:r.game.scroll-r.game.frame,errors:r.game.errors})),null,2));
  ws.close();
  const failed=results.filter(r=>!r.ready.waiting||!r.game.started||r.ready.errors.length||r.game.errors.length||r.game.scroll>r.game.frame+1||r.ready.stageScroll>r.ready.stage+1||r.game.stageScroll>r.game.stage+1);
  if(failed.length)throw Error(failed.length+' responsive failures');
})().catch(error=>{console.error(error);process.exitCode=1;});
