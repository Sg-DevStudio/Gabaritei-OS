const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {loadStore}=require('./helpers/load-store');const S=loadStore();
const context=vm.createContext({window:{},Date});vm.runInContext(fs.readFileSync('js/profile-photo.js','utf8'),context);const P=context.window.ProfilePhoto;
const photo='data:image/jpeg;base64,/9j/AA==';
test('foto aceita somente JPEG pequeno, sem URL externa ou SVG',()=>{assert.equal(P.safe(photo),true);for(const value of ['https://example.com/me.jpg','data:image/svg+xml;base64,PHN2Zz4=',photo+'A'.repeat(50000)])assert.equal(P.safe(value),false);});
test('foto removida não volta após mesclar com aparelho antigo',()=>{const old=S.estadoVazio();P.change(old.config,photo);const current=JSON.parse(JSON.stringify(old));P.change(current.config,'');for(const [a,b] of [[old,current],[current,old]]){const merged=S.mesclarEstados(a,b);assert.equal(P.value(merged.config),'');assert.equal(merged.config.fotoPerfil.rev,2);}});
test('foto sobrevive à normalização e não substitui outras preferências',()=>{const local=S.estadoVazio(),remote=S.estadoVazio();local.config.nomeUsuario='Aluno';P.change(remote.config,photo);const merged=S.mesclarEstados(local,remote);assert.equal(P.value(S.normalizar(merged).config),photo);assert.equal(merged.config.nomeUsuario,'Aluno');});
