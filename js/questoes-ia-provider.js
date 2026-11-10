/* Loaded only when generating: the study dashboard does not wait for the AI SDK. */
import { getApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken as getAppCheckToken } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app-check.js';
import { getAI, GoogleAIBackend, getGenerativeModel } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-ai.js';
let ai=null,appCheck=null;
export async function gerar(config,parts,signal,onStatus){
  const settings=window.GabariteiIAConfig;
  if(!settings||!settings.freeOnly||!settings.siteKey)throw Error('A geração gratuita ainda não foi configurada.');
  if(!ai){
    const app=getApp();
    if(!appCheck)appCheck=initializeAppCheck(app,{provider:new ReCaptchaEnterpriseProvider(settings.siteKey),isTokenAutoRefreshEnabled:true});
    ai=getAI(app,{backend:new GoogleAIBackend()});
  }
  if(onStatus)onStatus('Verificando seu acesso à geração gratuita…');
  let checkTimeout;
  try{await Promise.race([getAppCheckToken(appCheck,false),new Promise((_,reject)=>{checkTimeout=setTimeout(()=>reject(Error('app-check: a verificação do acesso demorou. Reabra a aba e tente novamente.')),20000);})]);}
  finally{clearTimeout(checkTimeout);}
  if(signal&&signal.aborted)throw Error('timeout: conexão com a IA demorou.');
  if(onStatus)onStatus('Criando suas questões com o material selecionado…');
  const model=getGenerativeModel(ai,{model:settings.model,generationConfig:{temperature:0.35,responseMimeType:'application/json',maxOutputTokens:config.quantidade===20?16000:9000,thinkingConfig:{thinkingLevel:'LOW'}}});
  const result=await model.generateContent([{text:window.QuestoesIA.prompt(config)},...parts],{timeout:65000,signal});
  return result.response.text();
}
