const test=require('node:test'),assert=require('node:assert/strict');
const {metadata,SIGNER,PACKAGE}=require('../scripts/android-release-manifest.cjs');
const badging=`package: name='${PACKAGE}' versionCode='27' versionName='0.21.0' platformBuildVersionName='15'\nsdkVersion:'26'`;
const signed='Signer #1 certificate SHA-256 digest: '+SIGNER;
test('aviso de atualização usa código, tamanho e assinatura do APK publicado',()=>{
 const m=metadata(badging,signed,13000000,'a'.repeat(64),'android-native-v0.21.0');assert.equal(m.versionCode,27);assert.equal(m.minSdk,26);assert.equal(m.sizeBytes,13000000);assert.match(m.apkUrl,/android-native-v0\.21\.0\/Gabaritei\.apk$/);
});
test('metadados não aceitam outro pacote, certificado ou tag que diverge do APK',()=>{
 assert.throws(()=>metadata(badging.replace(PACKAGE,'outro.app'),signed,1000,'a'.repeat(64)));
 assert.throws(()=>metadata(badging,signed.replace(SIGNER,'b'.repeat(64)),1000,'a'.repeat(64)));
 assert.throws(()=>metadata(badging,signed,1000,'a'.repeat(64),'android-native-v99.0.0'));
 assert.throws(()=>metadata(badging,signed,90*1024*1024,'a'.repeat(64)));
});
