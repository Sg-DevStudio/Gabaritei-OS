'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function carregar(){const c=vm.createContext({window:{},URL});for(const f of ['data/catalogo-editais.js','data/trilha-vinculos-trf2.js','data/caderno-tjsp.js','data/caderno-trt4.js','data/caderno-trt4-analista.js','data/caderno-qconcursos.js','data/caderno-tec.js','js/trilha.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);return c.window;}
const w=carregar(),b=w.CATALOGO_EDITAIS_BASE.find(e=>e.id==='carreira-trf2-tjaa-2024');
const estado=()=>({plano:{concurso:b.titulo,origemEditalId:b.id},disciplinas:[{id:'p',nome:'Português',topicos:[{id:'r',nome:'Regência verbal e nominal e emprego da crase'}]}],links:[]});
const tecUrls=h=>[...h.matchAll(/href="(https:[^"]+)"/g)].map(m=>new URL(m[1].replaceAll('&amp;','&'))).filter(u=>u.hostname==='www.tecconcursos.com.br');
test('domicílio, responsabilidade civil e resposta do réu usam as categorias pertinentes',()=>{
 const m=w.CadernoTEC.cadernos.TrilhaVinculosTRT4Analista;
 assert.deepEqual(Array.from(m['CIV-03'].assuntos),['2009']);
 assert.deepEqual(Array.from(m['CIV-15'].assuntos),['3364']);
 assert.deepEqual(Array.from(m['DPC-13'].assuntos),['4413','4408']);
 assert(!m['DPC-13'].assuntos.includes('4412'));
 assert(m['DPC-26'].assuntos.includes('5821'));
});
test('subtópicos compostos mantêm as duas partes do filtro TEC',()=>{
 const t=w.CadernoTEC.cadernos.TrilhaVinculosTJSP;
 assert(t['POR-06'].assuntos.includes('330'));
 assert(t['POR-07'].assuntos.includes('5651'));
 assert(t['POR-08'].assuntos.includes('5652'));
 assert(t['MAT-02'].assuntos.includes('1026'));
 assert(!t['MAT-02'].assuntos.includes('5330'));
 for(const c of ['TrilhaVinculosTRT4','TrilhaVinculosTRT4Analista'])assert(w.CadernoTEC.cadernos[c]['CON-09'].assuntos.includes('383'));
 const trf=w.CadernoTEC.cadernos.TrilhaVinculosTRF2;
 for(const [id,assunto]of [['PEN-06','3580'],['PEN-07','3582'],['PEN-08','1959']])assert.deepEqual(Array.from(trf[id].assuntos),[assunto]);
});
test('metadados TEC mantêm origem do tópico e somente endereços oficiais públicos',()=>{
 let total=0;
 for(const [nome,mapa]of Object.entries(w.CadernoTEC.cadernos))for(const [id,t]of Object.entries(mapa)){
  assert.equal(t.nome,w[nome][id].nome);assert(t.assuntos.length>0);
  for(const idAssunto of t.assuntos){const a=w.CadernoTEC.assuntos[idAssunto],u=new URL(a.url);assert(a.nome);assert.equal(u.protocol,'https:');assert.equal(u.hostname,'www.tecconcursos.com.br');assert.equal(u.pathname,'/questoes/filtrar');assert.equal(u.searchParams.get('f[0].id'),idAssunto);assert.equal(u.searchParams.get('f[0].tipo'),'ASSUNTO');assert.equal(u.username,'');}
  total++;
 }
 assert(total>480);
 const publicado=JSON.stringify(w.CadernoTEC);assert(!publicado.includes('/questoes/cadernos/'));assert(!publicado.includes('/questoes/pastas/'));assert(!publicado.includes('@gmail'));
});
test('atalho composto mantém regência e crase no mesmo filtro, com logo e tooltip acessível',()=>{
 const h=w.Trilha.render(estado()),us=tecUrls(h);assert.equal(us.length,1);
 assert.equal(us[0].searchParams.get('formato'),'OBJETIVA');assert.equal(us[0].searchParams.get('f[0].id'),'332');assert.equal(us[0].searchParams.get('f[1].id'),'333');assert.equal(us[0].searchParams.get('f[1].tipo'),'ASSUNTO');
 assert(h.includes('logo-tec-concursos.png'));assert(h.includes('title="Resolva as questões desse assunto no TEC Concursos'));assert(h.includes('aria-label="Resolva as questões desse assunto no TEC Concursos'));
 assert(h.includes('logo-qconcursos.svg'));assert(h.includes('logo-gran-questoes.webp'));
});
test('cadernos antigos recebem TEC sem substituir um link pessoal ou restaurar o removido',()=>{
 const s=estado();s.links=[{id:'privado',tipo:'trilha',topicoChave:'plano:p:r',nome:'Meu material',url:'https://example.org/material'}];
 const antes=JSON.stringify(s);let h=w.Trilha.render(s);assert.equal(tecUrls(h).length,1);assert(h.includes('https://example.org/material'));assert.equal(JSON.stringify(s),antes);
 s.links.push({id:'meu-tec',tipo:'trilha',topicoChave:'plano:p:r',url:'https://www.tecconcursos.com.br/s/meu',nome:'Meu caderno'});h=w.Trilha.render(s);assert.equal(tecUrls(h).length,1);assert.equal(tecUrls(h)[0].pathname,'/s/meu');
 s.links[1]={id:'meu-tec',tipo:'trilha',topicoChave:'plano:p:r',provedorOriginal:'tec',oculto:true};h=w.Trilha.render(s);assert.equal(tecUrls(h).length,0);assert(h.includes('qconcursos-link'));assert(h.includes('https://example.org/material'));
});
test('mudanças de edição e assunto não aplicam o filtro do edital antigo',()=>{
 const s=estado();s.plano.origemEditalId='futuro';assert.equal(tecUrls(w.Trilha.render(s)).length,0);
 s.plano.origemEditalId=b.id;s.disciplinas[0].topicos[0].nome='Conteúdo novo';assert.equal(tecUrls(w.Trilha.render(s)).length,0);
});
test('filtros sem correspondência confirmada são identificados sem levar ao início do TEC',()=>{
 const s=estado();s.disciplinas[0].topicos.push({id:'g',nome:'Gestão de riscos'});const h=w.Trilha.render(s),row=h.split('<article class="trilha-topico"')[2].split('</article>')[0];
 assert(row.includes('TEC Concursos: filtro deste subtópico ainda não verificado'));assert.equal(tecUrls(row).length,0);
});
test('renderizar os quatro cadernos preserva conteúdo, links e histórico',()=>{
 for(const base of [b,w.CadernoTJSPBase,w.CadernoTRT4Base,w.CadernoTRT4AnalistaBase]){
  const s={plano:{concurso:base.titulo,origemEditalId:base.id},disciplinas:base.disciplinas,links:[],sessoes:[{id:'hist',qFeitas:10,qCertas:8}]},antes=JSON.stringify(s),h=w.Trilha.render(s);
  assert.equal((h.match(/class="trilha-topico"/g)||[]).length,base.disciplinas.flatMap(d=>d.topicos).length);assert(tecUrls(h).length>60);assert.equal(JSON.stringify(s),antes);
 }
});
