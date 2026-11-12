let ultimoGroq=0;
async function solicitarGroq(prompt,parts,signal,onStatus,c,maxTokens,schema){
  if(!window.GabariteiIAConfig?.freeOnly||c.freeOnly!==true||c.model!==window.GabariteiIAConfig.groqModel||!/^gsk_[A-Za-z0-9_-]{20,200}$/.test(c.apiKey||''))throw Error('Configure sua chave pessoal do Groq.');
  if(parts.some(p=>typeof p.text!=='string'))throw Error('Este modelo do Groq aceita texto. Para PDF/foto, configure também o Gemini ou cole o texto do material.');
  const content=[prompt,...parts.map(p=>p.text),schema?'Responda somente JSON neste formato: '+JSON.stringify(schema):''].join('\n');
  const budget=Math.min(maxTokens,3500,7000-Math.ceil(content.length/2));
  if(budget<1800)throw Error('O material é grande para o limite gratuito do Groq. Use um trecho menor ou selecione Gemini. Nenhum texto foi cortado.');
  if(signal?.aborted)throw Error('timeout: geração cancelada.');
  const wait=Math.max(0,61000-(Date.now()-ultimoGroq));
  if(wait){onStatus?.('Groq · aguardando a janela gratuita por até '+Math.ceil(wait/1000)+' s…');await new Promise((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(Error('timeout: geração cancelada.'));};const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},wait);signal?.addEventListener('abort',abort,{once:true});});}
  if(signal?.aborted)throw Error('timeout: geração cancelada.');ultimoGroq=Date.now();onStatus?.('Analisando o texto · Groq / '+c.model+'…');
  const r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',signal,headers:{'Content-Type':'application/json',Authorization:'Bearer '+c.apiKey},body:JSON.stringify({model:c.model,messages:[{role:'user',content}],response_format:{type:'json_object'},max_completion_tokens:budget,reasoning_effort:'low',temperature:0.35})});
  const data=await r.json().catch(()=>null);
  if(!r.ok)throw Error('Groq HTTP '+r.status+': '+String(data?.error?.message||'Falha do provedor.').replaceAll(c.apiKey,'[chave protegida]'));
  const choice=data?.choices?.[0];if(choice?.finish_reason==='length')throw Error('A resposta do Groq ficou incompleta. Use um material menor.');
  if(typeof choice?.message?.content!=='string'||!choice.message.content.trim())throw Error('O Groq não retornou conteúdo.');return choice.message.content;
}
/* Personal mode: credential is read from the authenticated owner's private profile.
   It is never bundled in this file, placed in a URL, or saved in a notebook. */
export async function solicitar(prompt,parts,signal,onStatus,credential,maxTokens=6000,responseSchema){
  if(credential?.provider==='groq')return solicitarGroq(prompt,parts,signal,onStatus,credential,maxTokens,responseSchema);
  const settings=window.GabariteiIAConfig;
  if(!settings||!settings.freeOnly||!credential||credential.freeOnly!==true||!(settings.personalModels||[settings.model||'gemini-3.5-flash-lite']).includes(credential.model)||typeof credential.apiKey!=='string'||credential.apiKey.length<20)throw Error('A IA gratuita não está configurada para este perfil.');
  if(signal&&signal.aborted)throw Error('timeout: geração cancelada.');
  if(onStatus)onStatus('Analisando o material · '+credential.model+'…');
  let response;
  for(let tentativa=0;tentativa<2;tentativa++){
  if(signal&&signal.aborted)throw Error('timeout: geração cancelada.');
  response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(credential.model)+':generateContent',{
    method:'POST',signal,headers:{'Content-Type':'application/json','x-goog-api-key':credential.apiKey},
    body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt},...parts]}],generationConfig:{temperature:0.35,responseMimeType:'application/json',maxOutputTokens:maxTokens,thinkingConfig:{thinkingLevel:'LOW'},...(responseSchema?{responseSchema}:{})}})
  });
  if(response.status!==503||tentativa>0)break;
  if(response.body&&response.body.cancel)await response.body.cancel().catch(()=>{});
  if(onStatus)onStatus('O serviço está ocupado. Tentando esta etapa mais uma vez…');
  await new Promise((resolve,reject)=>{let timer;const abortar=()=>{clearTimeout(timer);reject(Error('timeout: geração cancelada.'));};if(signal&&signal.aborted){abortar();return;}timer=setTimeout(()=>{if(signal)signal.removeEventListener('abort',abortar);resolve();},2000);if(signal)signal.addEventListener('abort',abortar,{once:true});});
  }
  const data=await response.json().catch(()=>null);
  if(!response.ok){const detail=String(data&&data.error&&data.error.message||'Falha do provedor.').replaceAll(credential.apiKey,'[chave protegida]');throw Error('HTTP '+response.status+': '+detail);}
  if(data&&data.candidates&&data.candidates[0]&&data.candidates[0].finishReason==='MAX_TOKENS')throw Error('A resposta ultrapassou o limite de geração. Tente novamente com um trecho menor.');
  const text=(data&&data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts||[]).filter(part=>!part.thought).map(part=>part.text||'').join('');
  if(!text)throw Error('A IA não retornou conteúdo. Tente novamente.');
  return text;
}

export async function gerar(config,parts,signal,onStatus,credential,contexto){if(credential?.provider==='groq'&&contexto)contexto={...contexto,anteriores:contexto.anteriores.slice(-8).map(t=>t.slice(0,120))};return solicitar(window.QuestoesIA.prompt(config,contexto),parts,signal,onStatus,credential,config.quantidade>10?12000:6000);}
