const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const credential={freeOnly:true,model:'gemini-3.5-flash-lite',apiKey:'synthetic-private-key-for-test'};
function provider(response){
 const requests=[];
 const c={setTimeout:fn=>{queueMicrotask(fn);return 0;},clearTimeout(){},window:{GabariteiIAConfig:{freeOnly:true},QuestoesIA:{prompt:()=> 'prompt'}},
  fetch:async(url,options)=>{requests.push({url,options});return (typeof response==='function'?response(requests.length):response)||{ok:true,json:async()=>({candidates:[{content:{parts:[{thought:true,text:'omit'},{text:'{"questoes":'},{text:'[]}'}]}}]})};}};
 const source=fs.readFileSync(path.join(__dirname,'../js/questoes-ia-provider.js'),'utf8').replaceAll('export async function','async function');
 vm.runInNewContext(source+'\nthis.gerar=gerar;this.solicitar=solicitar;',c);return {c,requests};
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

test('a temporary 503 is retried once, whereas quota is never retried',async()=>{
 const h=provider(n=>n===1?{status:503,ok:false}:{ok:true,json:async()=>({candidates:[{content:{parts:[{text:'ok'}]}}]})});
 assert.equal(await h.c.gerar({},[],null,null,credential),'ok');assert.equal(h.requests.length,2);
 const quota=provider({ok:false,status:429,json:async()=>({error:{message:'Quota'}})});await assert.rejects(quota.c.gerar({},[],null,null,credential),/429/);assert.equal(quota.requests.length,1);
});

test('parecer estruturado envia schema e sinaliza resposta truncada',async()=>{
 const h=provider();const schema={type:'OBJECT',properties:{texto:{type:'STRING'}},required:['texto']};
 await h.c.solicitar('transcrever',[],null,null,credential,12000,schema);
 const config=JSON.parse(h.requests[0].options.body).generationConfig;assert.deepEqual(config.responseSchema,schema);assert.equal(config.maxOutputTokens,12000);
 const truncated=provider({ok:true,json:async()=>({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{"incompleto":'}]}}]})});
 await assert.rejects(truncated.c.gerar({},[],null,null,credential),/limite de geração/);
});

test('modelo pessoal permitido muda o destino sem expor a chave',async()=>{
 const h=provider();h.c.window.GabariteiIAConfig.personalModels=[credential.model,'gemini-3.8-flash'];
 await h.c.gerar({quantidade:1},[],null,null,{...credential,model:'gemini-3.8-flash'});
 assert.match(h.requests[0].url,/gemini-3\.8-flash:generateContent$/);assert.equal(h.requests[0].url.includes(credential.apiKey),false);
});

const groqCredential={provider:'groq',freeOnly:true,model:'openai/gpt-oss-120b',apiKey:'gsk_'+'x'.repeat(40)};
function groq(response){const h=provider(response||{ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{"ok":true}'}}]})});h.c.window.GabariteiIAConfig.groqModel=groqCredential.model;return h;}
test('Groq envia chave somente no header, JSON e modelo explícito',async()=>{
 const h=groq();assert.equal(await h.c.solicitar('JSON', [{text:'Material'}],null,null,groqCredential,12000),'{"ok":true}');
 const r=h.requests[0],body=JSON.parse(r.options.body);assert.equal(r.url,'https://api.groq.com/openai/v1/chat/completions');assert.equal(r.options.headers.Authorization,'Bearer '+groqCredential.apiKey);
 assert.equal(body.response_format.type,'json_object');assert.equal(body.model,groqCredential.model);assert.ok(body.max_completion_tokens<=3500);assert.ok(!r.options.body.includes(groqCredential.apiKey));
});
test('Groq rejeita PDF e material grande sem enviar ou cortar o original',async()=>{
 const h=groq();await assert.rejects(h.c.solicitar('JSON',[{inlineData:{mimeType:'application/pdf',data:'YWJj'}}],null,null,groqCredential),/PDF/);
 await assert.rejects(h.c.solicitar('JSON',[{text:'a'.repeat(20000)}],null,null,groqCredential),/Nenhum texto foi cortado/);assert.equal(h.requests.length,0);
});
test('Groq não aceita modelo arbitrário, flag paga ou chave inválida',async()=>{
 const h=groq();for(const c of [{...groqCredential,freeOnly:false},{...groqCredential,model:'other'},{...groqCredential,apiKey:'bad'}])await assert.rejects(h.c.solicitar('JSON',[],null,null,c),/Configure/);assert.equal(h.requests.length,0);
});
test('erro de cota Groq oculta a chave e não troca de provedor',async()=>{
 const h=groq({ok:false,status:429,json:async()=>({error:{message:'quota '+groqCredential.apiKey}})});
 await assert.rejects(h.c.solicitar('JSON',[],null,null,groqCredential),e=>e.message.includes('Groq HTTP 429')&&!e.message.includes(groqCredential.apiKey));assert.equal(h.requests.length,1);
});
test('Groq rejeita resposta truncada e respeita cancelamento antes da chamada',async()=>{
 const h=groq({ok:true,json:async()=>({choices:[{finish_reason:'length',message:{content:'{}'}}]})});await assert.rejects(h.c.solicitar('JSON',[],null,null,groqCredential),/incompleta/);
 const c=new AbortController();c.abort();const clean=groq();await assert.rejects(clean.c.solicitar('JSON',[],c.signal,null,groqCredential),/cancelada/);assert.equal(clean.requests.length,0);
});
test('Groq informa a pausa entre chamadas gratuitas',async()=>{
 const h=groq(),status=[];await h.c.solicitar('JSON',[],null,null,groqCredential);await h.c.solicitar('JSON',[],null,t=>status.push(t),groqCredential);assert.ok(status.some(t=>t.includes('aguardando a janela')));assert.equal(h.requests.length,2);
});
