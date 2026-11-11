const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const credential={freeOnly:true,model:'gemini-3.5-flash-lite',apiKey:'synthetic-private-key-for-test'};
function provider(response){
 const requests=[];
 const c={window:{GabariteiIAConfig:{freeOnly:true},QuestoesIA:{prompt:()=> 'prompt'}},
  fetch:async(url,options)=>{requests.push({url,options});return response||{ok:true,json:async()=>({candidates:[{content:{parts:[{thought:true,text:'omit'},{text:'{"questoes":'},{text:'[]}'}]}}]})};}};
 const source=fs.readFileSync(path.join(__dirname,'../js/questoes-ia-provider.js'),'utf8').replaceAll('export async function','async function');
 vm.runInNewContext(source+'\nthis.gerar=gerar;',c);return {c,requests};
}
test('personal credential stays in its header and the free model is fixed',async()=>{
 const h=provider(),controller=new AbortController();
 assert.equal(await h.c.gerar({quantidade:10},[{text:'material'}],controller.signal,null,credential),'{"questoes":[]}');
 const {url,options}=h.requests[0];assert.match(url,/gemini-3\.5-flash-lite:generateContent$/);
 assert.equal(options.headers['x-goog-api-key'],credential.apiKey);
 assert.equal(url.includes(credential.apiKey),false);assert.equal(options.body.includes(credential.apiKey),false);
 assert.equal(options.signal,controller.signal);
 const body=JSON.parse(options.body);assert.equal(body.generationConfig.maxOutputTokens,6000);assert.equal(body.contents[0].parts[1].text,'material');
});
test('missing, paid or mismatched configuration cannot start a request',async()=>{
 const h=provider();for(const config of [null,{...credential,freeOnly:false},{...credential,model:'other-model'}])await assert.rejects(h.c.gerar({},[],null,null,config),/gratuita/);
 h.c.window.GabariteiIAConfig.freeOnly=false;await assert.rejects(h.c.gerar({},[],null,null,credential),/gratuita/);assert.equal(h.requests.length,0);
});
test('pre-cancelled operation never starts inference',async()=>{
 const h=provider(),controller=new AbortController();controller.abort();await assert.rejects(h.c.gerar({},[],controller.signal,null,credential),/timeout/);assert.equal(h.requests.length,0);
});
test('quota errors stay explicit and redact any echoed private key',async()=>{
 const h=provider({ok:false,status:429,json:async()=>({error:{message:'Quota exceeded '+credential.apiKey}})});
 await assert.rejects(h.c.gerar({},[],null,null,credential),error=>error.message.includes('HTTP 429')&&!error.message.includes(credential.apiKey));
});
test('empty model response is rejected',async()=>{
 const h=provider({ok:true,json:async()=>({candidates:[]})});await assert.rejects(h.c.gerar({},[],null,null,credential),/não retornou/);
});
