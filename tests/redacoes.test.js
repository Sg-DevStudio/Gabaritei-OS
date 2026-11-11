const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../js/redacoes');
const original={tema:'Tecnologia nos serviços públicos',banca:'Treino',texto:'A tecnologia pode tornar os serviços públicos mais acessíveis. No entanto, o atendimento presencial deve ser mantido para quem não tem acesso à internet. Investir em inclusão digital e capacitação ajuda a reduzir as barreiras de acesso.'};
const feedback=()=>({resumo:'O texto apresenta uma posição clara.',criterios:['Tema','Argumentação','Coesão','Norma-padrão'].map(nome=>({nome,analise:'Há um argumento relacionado ao tema.',trecho:'A tecnologia pode tornar os serviços públicos mais acessíveis.',sugestao:'Aprofunde o argumento com um exemplo.'})),ajustes:[{trecho:'Investir em inclusão digital e capacitação',explicacao:'O trecho pode ser desenvolvido.',sugestao:'Especifique quem pode promover a capacitação.'}],proximoTreino:'Desenvolva um parágrafo com um exemplo concreto.',nota:99});
test('rascunho permite texto vazio e correção exige material suficiente',()=>{assert.equal(R.preparar({...original,texto:''}).texto,'');assert.throws(()=>R.preparar({...original,texto:'curto'},true),/150/);assert.throws(()=>R.preparar({...original,tema:''}),/tema/);assert.throws(()=>R.preparar({...original,texto:'x'.repeat(16001)}),/tamanho/);});
test('parecer conserva o original, rejeita citações inventadas e descarta notas não oficiais',()=>{const a=R.validarAvaliacao(JSON.stringify(feedback()),original);assert.equal(a.nota,null);assert.equal(original.texto.includes(a.ajustes[0].trecho),true);const fake=feedback();fake.ajustes[0].trecho='Eu escrevi uma lei inexistente';assert.throws(()=>R.validarAvaliacao(fake,original),/não está/);});
test('histórico e lixeira preservam texto, critérios e correção ao reabrir',()=>{const item=R.documento({...original,id:'essay-1',criterios:'Avalie tema e estrutura.',avaliacao:feedback(),excluidoEm:'2026-11-11T12:00:00Z'});const round=R.documento(JSON.parse(JSON.stringify(item)));assert.equal(round.texto,original.texto);assert.equal(round.avaliacao.criterios.length,4);assert.equal(round.excluidoEm,item.excluidoEm);const restored=R.documento({...round,excluidoEm:''});assert.deepEqual(restored.avaliacao,round.avaliacao);});
test('não aceita parecer truncado nem objeto incompleto',()=>{assert.throws(()=>R.validarAvaliacao('{',original),/incompleta/);assert.throws(()=>R.validarAvaliacao({resumo:'bom'},original),/formato/);assert.equal(R.palavras('  Texto com\n espaços. '),3);});


test('entrada de arquivo admite PDF e fotos comuns com tamanho limitado',()=>{
 for(const type of ['application/pdf','image/jpeg','image/png','image/webp'])assert.equal(R.validarArquivo({size:1024,type}),type);
 for(const file of [{size:0,type:'image/jpeg'},{size:11*1024*1024,type:'application/pdf'},{size:100,type:'text/html'}])assert.throws(()=>R.validarArquivo(file));
});
test('transcrição preserva grafia e dúvidas sem inventar texto legível',()=>{
 const raw={texto:'A tecnologia melhora o [ilegível].\nPorisso é útil.',observacoes:['Uma palavra não ficou legível.']};
 assert.deepEqual(R.validarTranscricao(JSON.stringify(raw)),raw);
 assert.throws(()=>R.validarTranscricao({texto:'',observacoes:[]}),/legível/);
 assert.throws(()=>R.validarTranscricao('{'),/transcrição/);
 assert.throws(()=>R.validarTranscricao({texto:'x'.repeat(16001)}),/tamanho/);
 assert.match(R.promptTranscricao(),/Não corrija/);
});
test('parecer aceita cerca JSON sem relaxar a validação de citações',()=>{assert.equal(R.validarAvaliacao('```json\n'+JSON.stringify(feedback())+'\n```',original).criterios.length,4);});
