'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function loadAppStatus(controlled=true){
 let now=1000,id=0,reloads=0,allowed=false;
 const timers=new Map(),events={},docEvents={},workerEvents={},session=new Map();
 const label={textContent:''},symbol={textContent:''};
 const pill={hidden:true,dataset:{},setAttribute(){},addEventListener(){},querySelector:s=>s==='.atividade-texto'?label:symbol};
 const reg={installing:null,addEventListener(k,f){workerEvents[k]=f;}};
 const c={Date:{now:()=>now},Set,sessionStorage:{getItem:k=>session.get(k),setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)},
  setTimeout(fn,ms){timers.set(++id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),
  setInterval(fn,ms){timers.set(++id,{fn,at:now+ms,repeat:ms});return id;},
  window:{GabariteiAtualizacaoSegura:()=>allowed,addEventListener(k,f){events[k]=f;},location:{reload(){reloads++;}}},
  document:{hidden:false,getElementById:id=>id==='atividade-app'?pill:null,addEventListener(k,f){docEvents[k]=f;}},
  navigator:{serviceWorker:{controller:controlled?{}:null,addEventListener(k,f){events[k]=f;},register:async()=>reg}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../js/app-status.js'),'utf8'),c);events.load();
 function advance(ms){const end=now+ms;for(let guard=0;guard<100;guard++){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;const [n,t]=due;timers.delete(n);now=t.at;if(t.repeat)timers.set(n,{...t,at:now+t.repeat});t.fn();}now=end;}
 return {c,pill,label,symbol,events,docEvents,session,reg,advance,sync:c.window.GabariteiAtividade.sincronizar,setSafe:v=>{allowed=v;},reloads:()=>reloads};
}
module.exports={loadAppStatus};
