// Gera um catálogo offline a partir das mesmas fontes versionadas usadas pelo site.
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const c = vm.createContext({window:{}, URL});
for (const file of ['data/catalogo-editais.js','data/edital-tjsp-2026.js','data/edital-trt4-2026.js','data/edital-trt4-analista-2026.js','data/trilha-vinculos-trf2.js','data/caderno-tjsp.js','data/caderno-trt4.js','data/caderno-trt4-analista.js'])
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
const w=c.window, normal=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const sources=[
  [(w.CATALOGO_EDITAIS_BASE||[]).find(p=>p.id==='carreira-trf2-tjaa-2024'),w.TrilhaVinculosTRF2],
  [w.CadernoTJSPBase,w.TrilhaVinculosTJSP],
  [w.CadernoTRT4Base,w.TrilhaVinculosTRT4],
  [w.CadernoTRT4AnalistaBase,w.TrilhaVinculosTRT4Analista]
];
const plans=sources.map(([base,map])=>{
  if(!base)throw Error('Plano ausente na fonte');
  return {id:base.id,name:base.titulo,disciplines:base.disciplinas.map(d=>({id:d.id,name:d.nome,topics:d.topicos.filter(t=>!t.removidoDoEdital).map(t=>{
    const v=Object.values(map).find(v=>normal(v.nome)===normal(t.nome));
    const l=v?.links[0];
    return {id:t.id,name:t.nome,link:l?.url||'',noQuestions:!!l?.semResultadosNoRecorte,note:(l?.semResultadosNoRecorte?'Sem questões no recorte selecionado. ':'')+(v?.pendencia||l?.aviso||(!l?'Adicione um link complementar para este tópico.':''))};
  })}))};
});
const dest=path.join(root,'android/piloto/src/main/assets/catalog.json');fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify({schemaVersion:1,source:'Fontes versionadas do Gabaritei OS',plans},null,2)+'\n');
console.log(plans.map(p=>`${p.name}: ${p.disciplines.flatMap(d=>d.topics).length} tópicos`).join('\n'));
