// Generate update metadata from the signed APK, not from a guessed release number.
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const PACKAGE='br.com.gabaritei.os.piloto';
const SIGNER='02b7a6d78db229e9106d5e4618f2a9bff088619ce4d92203ab2f67df49ce855c';
function metadata(badging,signature,bytes,sha256,tag){
 const p=badging.match(/package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'/),sdk=badging.match(/sdkVersion:'(\d+)'/);
 const signers=[...signature.matchAll(/Signer #\d+ certificate SHA-256 digest: ([a-f0-9]{64})/gi)].map(m=>m[1].toLowerCase());
 if(!p||p[1]!==PACKAGE||!sdk||signers.length!==1||signers[0]!==SIGNER)throw Error('Pacote ou certificado diferente do aplicativo distribuído.');
 const code=Number(p[2]),name=p[3],minSdk=Number(sdk[1]);
 if(!Number.isSafeInteger(code)||code<1||code>2100000000||!/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(name)||name.length>40||bytes<1||bytes>80*1024*1024||!Number.isInteger(minSdk)||minSdk<1||minSdk>1000||!/^[a-f0-9]{64}$/.test(sha256))throw Error('Metadados inválidos do APK.');
 if(tag&&tag!=='android-native-v'+name)throw Error('A tag não corresponde à versão compilada no APK.');
 return {versionCode:code,versionName:name,packageName:PACKAGE,minSdk,sizeBytes:bytes,sha256,certificateSha256:SIGNER,apkUrl:`https://github.com/Sg-DevStudio/Gabaritei-OS/releases/download/android-native-v${name}/Gabaritei.apk`};
}
function main(args){
 const option=name=>{const i=args.indexOf(name);return i<0?'':args[i+1]||'';};const apk=option('--apk'),out=option('--out'),sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
 if(!apk||!out||!sdk)throw Error('Use --apk arquivo.apk --out android-release.json com ANDROID_HOME definido.');
 const tools=path.join(sdk,'build-tools',process.env.ANDROID_BUILD_TOOLS||'35.0.0'),java=process.env.JAVA_HOME?path.join(process.env.JAVA_HOME,'bin',process.platform==='win32'?'java.exe':'java'):'java';
 const badging=cp.execFileSync(path.join(tools,process.platform==='win32'?'aapt.exe':'aapt'),['dump','badging',apk],{encoding:'utf8'});
 const signature=cp.execFileSync(java,['-jar',path.join(tools,'lib','apksigner.jar'),'verify','--print-certs',apk],{encoding:'utf8'});
 const bytes=fs.readFileSync(apk),data=metadata(badging,signature,bytes.length,crypto.createHash('sha256').update(bytes).digest('hex'),option('--tag'));
 fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({version:data.versionName,code:data.versionCode,size:data.sizeBytes,out}));
}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={metadata,SIGNER,PACKAGE};
