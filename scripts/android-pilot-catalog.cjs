// Gera um catálogo offline a partir das mesmas fontes versionadas usadas pelo site.
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const c = vm.createContext({window:{}, URL});
for (const file of ['data/catalogo-editais.js','data/edital-tjsp-2026.js','data/edital-trt4-2026.js','data/edital-trt4-analista-2026.js','data/trilha-vinculos-trf2.js','data/caderno-tjsp.js','data/caderno-trt4.js','data/caderno-trt4-analista.js'])
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),c);
const w=c.window, normal=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const notebooks=[
  [(w.CATALOGO_EDITAIS_BASE||[]).find(p=>p.id==='carreira-trf2-tjaa-2024'),w.TrilhaVinculosTRF2],
  [w.CadernoTJSPBase,w.TrilhaVinculosTJSP],
  [w.CadernoTRT4Base,w.TrilhaVinculosTRT4],
  [w.CadernoTRT4AnalistaBase,w.TrilhaVinculosTRT4Analista]
];
const sources=[...notebooks,...(w.CATALOGO_EDITAIS_BASE||[]).filter(b=>!notebooks.some(([n])=>n.id===b.id)).map(b=>[b,{}])];
const plans=sources.map(([base,map])=>{
  if(!base)throw Error('Plano ausente na fonte');
  const full=(w.CATALOGO_EDITAIS_BASE||[]).find(p=>p.id===base.id)||base;
  const photoFallback=/trf2/i.test(base.titulo)?'assets/carreiras/logo-trf2.png':/tjsp/i.test(base.titulo)?'assets/carreiras/logo-tjsp.jpg':/trt4/i.test(base.titulo)?'assets/carreiras/logo-trt4.jpg':'';
  const webBase={...full,...base,foto:photoFallback||full.foto||base.foto||''};
  let logoAsset='';const photo=webBase.foto;
  if(photo){
    const data=photo.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/s);
    const raster=photo.replace(/\.svg$/i,'.png');
    const source=!data&&fs.existsSync(path.join(root,raster))?path.join(root,raster):!data&&fs.existsSync(path.join(root,photo))?path.join(root,photo):null;
    if(data||source){const ext=data?(data[1]==='jpeg'?'jpg':data[1]):path.extname(source).slice(1);logoAsset='planlogos/'+base.id+'.'+ext;
      const dest=path.join(root,'android/piloto/src/main/assets',logoAsset);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data?Buffer.from(data[2],'base64'):fs.readFileSync(source));}
  }
  return {id:base.id,name:base.titulo,logoAsset,webBase,disciplines:base.disciplinas.map(d=>({id:d.id,name:d.nome,topics:d.topicos.filter(t=>!t.removidoDoEdital).map(t=>{
    const v=Object.values(map).find(v=>normal(v.nome)===normal(t.nome));
    const l=v?.links[0];
    return {id:t.id,name:t.nome,link:l?.url||'',noQuestions:!!l?.semResultadosNoRecorte,note:(l?.semResultadosNoRecorte?'Sem questões no recorte selecionado. ':'')+(v?.pendencia||l?.aviso||(!l?'Adicione um link complementar para este tópico.':''))};
  })}))};
});
const dest=path.join(root,'android/piloto/src/main/assets/catalog.json');fs.mkdirSync(path.dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify({schemaVersion:1,source:'Fontes versionadas do Gabaritei OS',plans},null,2)+'\n');
console.log(plans.map(p=>`${p.name}: ${p.disciplines.flatMap(d=>d.topics).length} tópicos`).join('\n'));

// A comparação Kotlin confere resultados contra a regra real do site.
vm.runInContext(fs.readFileSync(path.join(root,'js/domain.js'),'utf8'),c);
const comparePlans=plans.map(p=>({id:p.id,titulo:p.name,janelaProva:p.webBase.janelaProva,disciplinas:p.webBase.disciplinas.map(d=>({id:d.id,nome:d.nome,topicos:d.topicos.filter(t=>!t.removidoDoEdital&&!t.orfao).map(t=>({id:t.id,nome:t.nome,horas_estimadas:t.horas_estimadas}))}))}));
const cases=[];for(let i=0;i<comparePlans.length;i++)for(let j=i;j<comparePlans.length;j++)for(const hours of [10,18,40])cases.push({a:comparePlans[i].id,b:comparePlans[j].id,hours,today:'2026-10-29',expected:w.Dominio.conciliarPlanos(comparePlans[i],comparePlans[j],{horasSemana:hours,hoje:'2026-10-29'})});
const fixture=path.join(root,'android/piloto/src/test/resources/plan-comparison.json');fs.mkdirSync(path.dirname(fixture),{recursive:true});fs.writeFileSync(fixture,JSON.stringify({plans:comparePlans,cases},null,2)+'\n');
