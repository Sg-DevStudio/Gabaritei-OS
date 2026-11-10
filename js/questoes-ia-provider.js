/* Personal mode: credential is read from the authenticated owner's private profile.
   It is never bundled in this file, placed in a URL, or saved in a notebook. */
export async function gerar(config,parts,signal,onStatus,credential){
  const settings=window.GabariteiIAConfig;
  if(!settings||!settings.freeOnly||!credential||credential.freeOnly!==true||credential.model!=='gemini-3.5-flash-lite'||typeof credential.apiKey!=='string'||credential.apiKey.length<20)throw Error('A IA gratuita não está configurada para este perfil.');
  if(signal&&signal.aborted)throw Error('timeout: geração cancelada.');
  if(onStatus)onStatus('Criando suas questões com o material selecionado…');
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',{
    method:'POST',signal,headers:{'Content-Type':'application/json','x-goog-api-key':credential.apiKey},
    body:JSON.stringify({contents:[{role:'user',parts:[{text:window.QuestoesIA.prompt(config)},...parts]}],generationConfig:{temperature:0.35,responseMimeType:'application/json',maxOutputTokens:config.quantidade===20?12000:6000,thinkingConfig:{thinkingLevel:'LOW'}}})
  });
  const data=await response.json().catch(()=>null);
  if(!response.ok){const detail=String(data&&data.error&&data.error.message||'Falha do provedor.').replaceAll(credential.apiKey,'[chave protegida]');throw Error('HTTP '+response.status+': '+detail);}
  const text=(data&&data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts||[]).filter(part=>!part.thought).map(part=>part.text||'').join('');
  if(!text)throw Error('A IA não retornou questões. Tente outro trecho de material.');
  return text;
}
