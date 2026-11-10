const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function provider(token){
 const timers=[],requests=[];
 const c={window:{GabariteiIAConfig:{freeOnly:true,siteKey:'public-test',model:'free-test-model'},QuestoesIA:{prompt:()=> 'prompt'}},
  getApp:()=>({}),initializeAppCheck:()=>({}),ReCaptchaEnterpriseProvider:class {},getAppCheckToken:token,
  getAI:()=>({}),GoogleAIBackend:class {},
  getGenerativeModel:(_ai,config)=>({async generateContent(parts,options){requests.push({config,parts,options});return {response:{text:()=>'{"questoes":[]}'}};}}),
  setTimeout(fn,ms){timers.push({fn,ms});return timers.length;},clearTimeout(){}};
 const source=fs.readFileSync(path.join(__dirname,'../js/questoes-ia-provider.js'),'utf8').replace(/^import .*;\r?$/gm,'').replace('export async function gerar','async function gerar');
 vm.runInNewContext(source+'\nthis.gerar=gerar;',c);return {c,timers,requests};
}
test('verification timeout never starts a model request',async()=>{
 const h=provider(()=>new Promise(()=>{}));const result=h.c.gerar({},[],new AbortController().signal);
 assert.equal(h.timers[0].ms,20000);h.timers[0].fn();await assert.rejects(result,/app-check/);assert.equal(h.requests.length,0);
});
test('validated access sends the selected free model and cancellation signal',async()=>{
 const h=provider(async()=>({token:'synthetic'})),controller=new AbortController();
 assert.equal(await h.c.gerar({},[{text:'material'}],controller.signal),'{"questoes":[]}');
 assert.equal(h.requests[0].config.model,'free-test-model');assert.equal(h.requests[0].options.signal,controller.signal);assert.equal(h.requests[0].options.timeout,65000);
});
test('a cancelled operation never proceeds to inference and a paid config is rejected',async()=>{
 const h=provider(async()=>({token:'synthetic'})),controller=new AbortController();controller.abort();
 await assert.rejects(h.c.gerar({},[],controller.signal),/timeout/);assert.equal(h.requests.length,0);
 h.c.window.GabariteiIAConfig.freeOnly=false;await assert.rejects(h.c.gerar({},[],new AbortController().signal),/gratuita/);
});
