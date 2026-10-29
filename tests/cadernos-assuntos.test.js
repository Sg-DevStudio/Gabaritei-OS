const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const c=vm.createContext({window:{}});for(const f of ['data/caderno-tjsp.js','data/trilha-vinculos-trf2.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
test('Constitucional TJSP aponta para direitos individuais, sociais, nacionalidade e órgãos do Judiciário',()=>{
 const m=c.window.TrilhaVinculosTJSP;for(const [id,code]of Object.entries({'CON-01':'405219','CON-02':'405227','CON-03':'405228','CON-06':'405268'}))assert.equal(new URL(m[id].links[0].url).searchParams.get('assunto'),code);
});
test('títulos compostos mantêm os complementos antes ausentes',()=>{
 const m=c.window.TrilhaVinculosTJSP;assert(m['DPP-05'].links[0].code.split(',').includes('406701'));assert(m['MAT-01'].links[0].code.split(',').includes('408656'));assert(m['MAT-07'].links[0].code.split(',').includes('408895'));
 const trf=c.window.TrilhaVinculosTRF2;assert.equal(trf['DHA-05'].links[0].code,'395332');assert.equal(trf['DHA-06'].links[0].code,'291373');assert.equal(trf['GOV-03'].links[0].code,'436564');assert.equal(trf['AGP-06'].links[0].code,'404631');
});
