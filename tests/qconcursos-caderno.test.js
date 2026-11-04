'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function carregar(){
 const c=vm.createContext({window:{},URL});
 for(const f of ['data/catalogo-editais.js','data/trilha-vinculos-trf2.js','data/caderno-tjsp.js','data/caderno-trt4.js','data/caderno-trt4-analista.js','data/caderno-qconcursos.js','js/trilha.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
 return c.window;
}
const w=carregar(),base=w.CATALOGO_EDITAIS_BASE.find(e=>e.id==='carreira-trf2-tjaa-2024');
const estado=()=>({plano:{concurso:base.titulo,origemEditalId:base.id},disciplinas:[{id:'pt',nome:'Português',topicos:[{id:'p1',nome:'Pontuação'}]}],links:[]});
const urls=html=>[...html.matchAll(/href="(https:[^"]+)"/g)].map(x=>new URL(x[1].replaceAll('&amp;','&')));
test('mapas Qconcursos apontam para categorias públicas por assunto e conservam a identidade do tópico',()=>{
 let quantidade=0;
 for(const [caderno,mapa]of Object.entries(w.CadernoQconcursos.cadernos))for(const [id,ref]of Object.entries(mapa)){
  assert.equal(ref.nome,w[caderno][id].nome);
  const c=w.CadernoQconcursos.categorias[ref.categoria],u=new URL(c.url);
  assert.equal(u.protocol,'https:');assert.equal(u.hostname,'www.qconcursos.com');assert(u.pathname.startsWith('/questoes-de-concursos/disciplinas/'));assert(u.pathname.endsWith('/questoes'));
  assert.equal(u.search,'');assert.equal(u.hash,'');assert.equal(u.username,'');assert(['assunto','relacionado'].includes(ref.cobertura));quantidade++;
 }
 assert(quantidade>480);
});
test('logos identificam Gran e Qconcursos no tooltip e no nome acessível, sem misturar filtros',()=>{
 const html=w.Trilha.render(estado()),links=urls(html);
 assert(html.includes('logo-qconcursos.svg'));assert(html.includes('logo-gran-questoes.webp'));
 for(const nome of ['Gran','Qconcursos'])assert(html.includes('title="Resolva as questões desse assunto no '+nome));
 const q=links.find(u=>u.hostname==='www.qconcursos.com'),gran=links.find(u=>u.hostname==='questoes.grancursosonline.com.br');
 assert(q.pathname.includes('/pontuacao/questoes'));assert.equal(q.search,'');assert.equal(gran.searchParams.get('banca'),'982,92');
 assert(html.includes('Todas as bancas e anos.'));
});
test('adicionar o Qconcursos não substitui links pessoais nem restaura um atalho removido',()=>{
 const s=estado(),k='plano:pt:p1';s.links=[{id:'gran-pessoal',tipo:'trilha',topicoChave:k,nome:'Meu filtro',url:'https://questoes.grancursosonline.com.br/questoes?assunto=403700'}];
 const antes=JSON.stringify(s);let html=w.Trilha.render(s);
 assert(html.includes('assunto=403700'));assert(html.includes('logo-qconcursos.svg'));assert.equal(JSON.stringify(s),antes);
 s.links.push({id:'q-editado',tipo:'trilha',topicoChave:k,provedorOriginal:'qconcursos',nome:'Meu recorte',url:'https://www.qconcursos.com/questoes-de-concursos/questoes?subject_ids%5B%5D=14647'});
 html=w.Trilha.render(s);assert.equal(urls(html).filter(u=>u.hostname==='www.qconcursos.com').length,1);assert(html.includes('subject_ids%5B%5D=14647'));
 s.links[1]={...s.links[1],oculto:true,url:undefined};html=w.Trilha.render(s);
 assert.equal(urls(html).filter(u=>u.hostname==='www.qconcursos.com').length,0);assert(html.includes('assunto=403700'));
});
test('edições diferentes e tópicos sem correspondência não recebem filtros automáticos incorretos',()=>{
 const s=estado();s.plano.origemEditalId='trf2-edital-futuro';assert(!w.Trilha.render(s).includes('qconcursos-link'));
 s.plano.origemEditalId=base.id;s.disciplinas[0].topicos[0].nome='Conteúdo inédito do próximo edital';assert(!w.Trilha.render(s).includes('qconcursos-link'));
 s.disciplinas[0].topicos[0].nome='Código de Conduta da Justiça Federal: Resolução CJF 147/2011';
 s.disciplinas[0].topicos.push({id:'p2',nome:'Pontuação'});
 const html=w.Trilha.render(s),primeiro=html.split('<article class="trilha-topico"')[1].split('</article>')[0];
 assert(primeiro.includes('Qconcursos: filtro deste subtópico ainda não verificado'));assert(!urls(primeiro).some(u=>u.hostname==='www.qconcursos.com'));
});
test('cada caderno conserva suas disciplinas, tópicos e dados ao renderizar duas plataformas',()=>{
 const bases=[base,w.CadernoTJSPBase,w.CadernoTRT4Base,w.CadernoTRT4AnalistaBase];
 for(const b of bases){const s={plano:{concurso:b.titulo,origemEditalId:b.id},disciplinas:b.disciplinas,links:[]},antes=JSON.stringify(s),html=w.Trilha.render(s);
  assert.equal((html.match(/class="trilha-topico"/g)||[]).length,b.disciplinas.flatMap(d=>d.topicos).length);assert.equal(JSON.stringify(s),antes);
  assert(urls(html).some(u=>u.hostname==='www.qconcursos.com'));assert(urls(html).some(u=>u.hostname==='questoes.grancursosonline.com.br'));
 }
});
