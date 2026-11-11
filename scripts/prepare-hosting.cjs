// Publica somente arquivos de execução rastreados pelo Git; nunca dados de usuário.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.hosting-dist');
const files=cp.execFileSync('git',['ls-files','--','index.html','manifest.json','sw.js','css','js','data','assets','icons','calc'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
if(!files.includes('index.html')||!files.includes('js/redacoes-ui.js'))throw Error('Commit/index incompleto: prepare os arquivos antes de publicar.');
fs.mkdirSync(out,{recursive:true});let bytes=0;
for(const name of files){const source=path.resolve(root,name),target=path.resolve(out,name);if(!source.startsWith(root+path.sep)||!target.startsWith(out+path.sep)||!fs.lstatSync(source).isFile())throw Error('Arquivo fora da lista pública: '+name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);bytes+=fs.statSync(source).size;}
console.log(JSON.stringify({arquivos:files.length,bytes,pasta:'.hosting-dist'}));
