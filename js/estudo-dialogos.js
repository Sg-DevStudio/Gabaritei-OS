(function(){
 'use strict';let aberto=null;
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function confirmar(options){
   if(aberto)return Promise.resolve(false);
   return new Promise(resolve=>{
     const anterior=document.activeElement,el=document.createElement('dialog');aberto=el;el.className='estudo-dialogo';el.setAttribute('aria-labelledby','estudo-dialogo-titulo');el.setAttribute('aria-describedby','estudo-dialogo-texto');
     el.innerHTML='<h2 id="estudo-dialogo-titulo">'+esc(options.titulo||'Confirmar ação')+'</h2><p id="estudo-dialogo-texto">'+esc(options.texto)+'</p><div class="estudo-dialogo-acoes"><button type="button" class="botao-quieto" data-cancelar>'+esc(options.cancelar||'Cancelar')+'</button><button type="button" class="botao'+(options.perigo?' estudo-perigo':'')+'" data-confirmar>'+esc(options.acao||'Continuar')+'</button></div>';
     let concluido=false;function terminar(value){if(concluido)return;concluido=true;el.close();el.remove();aberto=null;if(anterior&&anterior.isConnected)anterior.focus();resolve(value);}
     el.querySelector('[data-cancelar]').onclick=()=>terminar(false);el.querySelector('[data-confirmar]').onclick=()=>terminar(true);el.oncancel=e=>{e.preventDefault();terminar(false);};document.body.appendChild(el);el.showModal();el.querySelector('[data-cancelar]').focus();
   });
 }
 window.EstudoDialogo={confirmar,fechar:()=>{if(aberto)aberto.querySelector('[data-cancelar]').click();}};
})();
