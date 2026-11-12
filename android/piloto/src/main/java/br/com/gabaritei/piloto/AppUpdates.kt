package br.com.gabaritei.piloto

import android.app.Application
import android.content.ClipData
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.FileProvider
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update
import org.json.JSONObject
import java.io.File
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL
import java.security.MessageDigest

internal data class AndroidRelease(val code:Long,val name:String,val url:String,val sha256:String,val bytes:Long,val minSdk:Int){
    val page:String get()="https://github.com/Sg-DevStudio/Gabaritei-OS/releases/tag/android-native-v$name"
    fun json()=JSONObject().put("versionCode",code).put("versionName",name).put("packageName",UpdatePolicy.PACKAGE).put("apkUrl",url).put("sha256",sha256).put("sizeBytes",bytes).put("minSdk",minSdk).toString()
}

internal object UpdatePolicy {
    const val PACKAGE="br.com.gabaritei.os.piloto"
    const val MAX_APK=80L*1024*1024
    val sources=listOf("https://github.com/Sg-DevStudio/Gabaritei-OS/releases/latest/download/android-release.json","https://sg-devstudio.github.io/Gabaritei-OS/data/android-release.json","https://app-gestao-estudos.web.app/data/android-release.json")
    fun parse(text:String):AndroidRelease{
        require(text.toByteArray().size<=32768){"Informações de atualização inválidas."}
        val j=JSONObject(text);require(listOf("versionCode","sizeBytes","minSdk").all{j.opt(it) is Number&&j.getDouble(it)==j.getLong(it).toDouble()});val code=j.getLong("versionCode");val name=j.getString("versionName");val url=j.getString("apkUrl");val hash=j.getString("sha256").lowercase();val bytes=j.getLong("sizeBytes");val sdk=j.getInt("minSdk")
        require(j.getString("packageName")==PACKAGE&&code in 1..2100000000L&&name.matches(Regex("[0-9]+\\.[0-9]+\\.[0-9]+(?:-[A-Za-z0-9.-]+)?"))&&name.length<=40)
        require(url=="https://github.com/Sg-DevStudio/Gabaritei-OS/releases/download/android-native-v$name/Gabaritei.apk"&&hash.matches(Regex("[0-9a-f]{64}"))&&bytes in 1..MAX_APK&&sdk in 1..1000){"Informações de atualização inválidas."}
        return AndroidRelease(code,name,url,hash,bytes,sdk)
    }
    fun safeRedirect(url:String):Boolean=runCatching{val u=URI(url);u.scheme=="https"&&u.userInfo==null&&(u.port==-1||u.port==443)&&u.host in setOf("github.com","release-assets.githubusercontent.com","objects.githubusercontent.com","sg-devstudio.github.io","app-gestao-estudos.web.app")}.getOrDefault(false)
    fun newer(r:AndroidRelease,installed:Long,sdk:Int)=r.code>installed&&r.minSdk<=sdk
    fun verifyIdentity(r:AndroidRelease,archivePackage:String,archiveCode:Long,archiveSigners:Set<String>,installedSigners:Set<String>){
        require(archivePackage==PACKAGE&&archiveCode==r.code){"O arquivo não corresponde a esta atualização."}
        require(archiveSigners.isNotEmpty()&&installedSigners.isNotEmpty()&&archiveSigners==installedSigners){"A assinatura do arquivo é diferente da versão instalada."}
    }
    fun hash(file:File):String=file.inputStream().use{input->val d=MessageDigest.getInstance("SHA-256");val buffer=ByteArray(32768);while(true){val n=input.read(buffer);if(n<0)break;d.update(buffer,0,n)};d.digest().joinToString(""){"%02x".format(it)}}
    fun verifyFile(r:AndroidRelease,file:File){require(file.isFile&&file.length()==r.bytes&&hash(file)==r.sha256){"O download está incompleto ou não corresponde à versão publicada. Baixe novamente."}}
    suspend fun copy(input:InputStream,file:File,expected:Long,onProgress:(Float)->Unit){
        var total=0L;file.outputStream().use{out->val buffer=ByteArray(32768);while(true){currentCoroutineContext().ensureActive();val n=input.read(buffer);if(n<0)break;total+=n;require(total<=expected&&total<=MAX_APK){"O arquivo excede o tamanho anunciado."};out.write(buffer,0,n);onProgress(total.toFloat()/expected)}}
        require(total==expected){"O download não terminou. Tente novamente."}
    }
}

internal object UpdateNetwork {
    suspend fun connection(address:String):HttpURLConnection=withContext(Dispatchers.IO){
        var url=address
        repeat(6){
            currentCoroutineContext().ensureActive();require(UpdatePolicy.safeRedirect(url)){"Destino de atualização não permitido."}
            val c=URL(url).openConnection() as HttpURLConnection;c.instanceFollowRedirects=false;c.connectTimeout=12000;c.readTimeout=25000;c.useCaches=false;c.setRequestProperty("User-Agent","Gabaritei-Updater");c.setRequestProperty("Cache-Control","no-cache")
            val status=try{c.responseCode}catch(e:Throwable){c.disconnect();throw e}
            if(status in listOf(301,302,303,307,308)){val next=c.getHeaderField("Location");c.disconnect();require(!next.isNullOrBlank());url=URI(url).resolve(next).toString()}
            else{if(status!=200){c.disconnect();error("Não foi possível consultar a atualização (HTTP $status).")};return@withContext c}
        }
        error("Redirecionamentos demais ao consultar a atualização.")
    }
    suspend fun manifest(address:String):AndroidRelease{
        val c=connection(address)
        return try{withContext(Dispatchers.IO){val bytes=c.inputStream.use{input->java.io.ByteArrayOutputStream().use{out->val buffer=ByteArray(4096);var total=0;while(true){val n=input.read(buffer);if(n<0)break;total+=n;require(total<=32768);out.write(buffer,0,n)};out.toByteArray()}};UpdatePolicy.parse(String(bytes,Charsets.UTF_8))}}finally{c.disconnect()}
    }
}

internal data class UpdateState(val release:AndroidRelease?=null,val checking:Boolean=false,val downloading:Boolean=false,val progress:Float=0f,val ready:Boolean=false,val message:String="",val snoozed:Boolean=false)

internal class AppUpdates(app:Application):AndroidViewModel(app){
    private val context=app
    private val prefs=app.getSharedPreferences("app_updates",0)
    private val folder=File(app.cacheDir,"app-updates").apply{mkdirs()}
    private val installedInfo=getInfo(app.packageName,0)
    val installedCode=versionCode(installedInfo)
    val installedName=installedInfo.versionName.orEmpty()
    val state=MutableStateFlow(UpdateState())
    private var checkJob:Job?=null;private var downloadJob:Job?=null
    init{runCatching{UpdatePolicy.parse(prefs.getString("release","").orEmpty())}.getOrNull()?.takeIf{UpdatePolicy.newer(it,installedCode,Build.VERSION.SDK_INT)}?.let{r->state.value=UpdateState(release=r,ready=apk(r).let{it.isFile&&it.length()==r.bytes},snoozed=snoozed(r))}}
    private fun apk(r:AndroidRelease)=File(folder,"Gabaritei-${r.code}.apk")
    private fun snoozed(r:AndroidRelease)=prefs.getLong("dismissed_code",0)==r.code&&System.currentTimeMillis()-prefs.getLong("dismissed_at",0)<24*60*60*1000L
    fun later(){state.value.release?.let{prefs.edit().putLong("dismissed_code",it.code).putLong("dismissed_at",System.currentTimeMillis()).apply()};state.update{it.copy(snoozed=true)}}
    fun check(force:Boolean=false){
        if(context.packageName!=UpdatePolicy.PACKAGE){state.update{it.copy(message="Atualizações são distribuídas para o aplicativo principal.")};return}
        if(checkJob?.isActive==true||downloadJob?.isActive==true||state.value.downloading)return
        val now=System.currentTimeMillis();if(!force&&now-prefs.getLong("attempt",0) in 0 until 15*60*1000L)return
        if(!force&&now-prefs.getLong("checked",0) in 0 until 6*60*60*1000L)return
        prefs.edit().putLong("attempt",now).apply();state.update{it.copy(checking=true,message="")}
        checkJob=viewModelScope.launch{
            try{
                val releases=mutableListOf<AndroidRelease>();var latestConfirmed=false
                for((i,source) in UpdatePolicy.sources.withIndex()){try{releases+=UpdateNetwork.manifest(source);if(i==0)latestConfirmed=true}catch(e:CancellationException){throw e}catch(_:Exception){}}
                require(releases.isNotEmpty()){"Não foi possível verificar agora. Confira a conexão e tente novamente."}
                if(!latestConfirmed)state.value.release?.let{releases+=it}
                val newest=releases.maxBy{it.code};val available=newest.takeIf{UpdatePolicy.newer(it,installedCode,Build.VERSION.SDK_INT)}
                if(latestConfirmed)prefs.edit().putLong("checked",System.currentTimeMillis()).apply()
                if(available!=null){prefs.edit().putString("release",available.json()).apply();state.value=UpdateState(release=available,ready=apk(available).let{it.isFile&&it.length()==available.bytes},snoozed=snoozed(available))}
                else{prefs.edit().remove("release").apply();state.value=UpdateState(message=if(newest.code>installedCode)"A próxima versão exige um Android mais recente. Sua versão atual continua disponível."else if(latestConfirmed)"Você está com a versão mais recente."else"Não foi possível confirmar a versão mais recente. Tente verificar novamente mais tarde.");cleanOld(null)}
            }catch(e:CancellationException){throw e}catch(e:Exception){state.update{it.copy(checking=false,message=e.message?:"Não foi possível verificar agora.")}}
        }
    }
    private fun cleanOld(keep:File?){folder.listFiles()?.filter{it.parentFile?.canonicalFile==folder.canonicalFile&&it.name.startsWith("Gabaritei-")&&it!=keep}?.forEach{it.delete()}}
    fun download(){
        if(context.packageName!=UpdatePolicy.PACKAGE)return
        val release=state.value.release?:return;if(downloadJob?.isActive==true||state.value.downloading||state.value.checking)return
        state.update{it.copy(downloading=true,progress=0f,message="",ready=false)}
        downloadJob=viewModelScope.launch{
            val staging=File(folder,"Gabaritei-${release.code}.download.apk")
            try{withContext(Dispatchers.IO){cleanOld(null);val c=UpdateNetwork.connection(release.url);try{c.inputStream.use{UpdatePolicy.copy(it,staging,release.bytes){p->state.update{s->s.copy(progress=p)}}}}finally{c.disconnect()};UpdatePolicy.verifyFile(release,staging);verifyApk(release,staging);check(staging.renameTo(apk(release))){"Não foi possível guardar a atualização."}}
                state.update{it.copy(downloading=false,progress=1f,ready=true,message="Download concluído. A instalação será confirmada pelo Android.")}
            }catch(e:CancellationException){state.update{it.copy(downloading=false,message="Download cancelado.")};throw e}catch(e:Exception){state.update{it.copy(downloading=false,ready=false,message=e.message?:"Não foi possível baixar. Tente novamente.")}}finally{withContext(NonCancellable+Dispatchers.IO){staging.delete()}}
        }
    }
    fun cancelDownload(){downloadJob?.cancel()}
    fun canInstall()=context.packageManager.canRequestPackageInstalls()
    @Suppress("DEPRECATION") private suspend fun verifyApk(r:AndroidRelease,file:File)=withContext(Dispatchers.IO){
        val flags=if(Build.VERSION.SDK_INT>=28)PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES
        @Suppress("DEPRECATION") val archive=context.packageManager.getPackageArchiveInfo(file.absolutePath,flags)?:error("O arquivo baixado não é um APK válido.")
        UpdatePolicy.verifyIdentity(r,archive.packageName,versionCode(archive),signers(archive),signers(getInfo(context.packageName,flags)))
        require(r.code>versionCode(getInfo(context.packageName,0))){"Esta atualização já está instalada."}
    }
    suspend fun installerIntent():Intent{
        require(context.packageName==UpdatePolicy.PACKAGE)
        val r=state.value.release?:error("Verifique a atualização novamente.");val file=apk(r)
        try{withContext(Dispatchers.IO){UpdatePolicy.verifyFile(r,file)};verifyApk(r,file)}catch(e:Exception){file.delete();state.update{it.copy(ready=false,message=e.message?:"Baixe a atualização novamente.")};throw e}
        check(canInstall()){"Permita que o Gabaritei abra o instalador do Android."}
        val uri=FileProvider.getUriForFile(context,context.packageName+".sharing",file)
        return Intent(Intent.ACTION_VIEW).setDataAndType(uri,"application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK).apply{clipData=ClipData.newRawUri("Atualização do Gabaritei",uri)}
    }
    fun installerOpened(){state.update{it.copy(message="Confirme a atualização no instalador do Android. Se cancelar, você pode tentar novamente.")}}
    fun failure(message:String){state.update{it.copy(message=message)}}
    @Suppress("DEPRECATION") private fun getInfo(name:String,flags:Int)=context.packageManager.getPackageInfo(name,flags)
    @Suppress("DEPRECATION") private fun versionCode(info:PackageInfo)=if(Build.VERSION.SDK_INT>=28)info.longVersionCode else info.versionCode.toLong()
    @Suppress("DEPRECATION") private fun signers(info:PackageInfo):Set<String>{val signatures=if(Build.VERSION.SDK_INT>=28)info.signingInfo?.apkContentsSigners.orEmpty()else info.signatures.orEmpty();return signatures.map{MessageDigest.getInstance("SHA-256").digest(it.toByteArray()).joinToString(""){b->"%02x".format(b)}}.toSet()}
}
