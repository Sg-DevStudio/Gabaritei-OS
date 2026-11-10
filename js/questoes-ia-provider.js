/* Loaded only when generating: the study dashboard does not wait for the AI SDK. */
import { getApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app-check.js';
import { getAI, GoogleAIBackend, getGenerativeModel } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-ai.js';
let ai=null;
export async function gerar(config,parts){
  const settings=window.GabariteiIAConfig;
  if(!settings||!settings.freeOnly||!settings.siteKey)throw Error('A geração gratuita ainda não foi configurada.');
  if(!ai){
    const app=getApp();
    initializeAppCheck(app,{provider:new ReCaptchaEnterpriseProvider(settings.siteKey),isTokenAutoRefreshEnabled:true});
    ai=getAI(app,{backend:new GoogleAIBackend()});
  }
  const model=getGenerativeModel(ai,{model:settings.model,generationConfig:{temperature:0.35,responseMimeType:'application/json',maxOutputTokens:16000}}, {timeout:90000});
  const result=await model.generateContent([{text:window.QuestoesIA.prompt(config)},...parts]);
  return result.response.text();
}
