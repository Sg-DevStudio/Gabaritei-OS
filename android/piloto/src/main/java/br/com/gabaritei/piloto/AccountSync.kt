package br.com.gabaritei.piloto

import android.app.Activity
import android.content.Context
import android.util.Base64
import androidx.credentials.*
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.tasks.await
import org.json.JSONObject
import java.security.SecureRandom
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class Account(val uid:String,val email:String,val name:String)
data class SyncStatus(val text:String="Entrar para sincronizar",val busy:Boolean=false,val conflict:Boolean=false,val failed:Boolean=false)
class AccountSync(private val context:Context, firebaseApp:FirebaseApp?=null) {
    val auth:FirebaseAuth
    private val cloud:FirebaseFirestore
    val account=MutableStateFlow<Account?>(null)
    val status=MutableStateFlow(SyncStatus())
    private val lock=Mutex()
    private val clientId="android-"+UUID.randomUUID().toString()
    private var listener:ListenerRegistration?=null
    private var authListener:FirebaseAuth.AuthStateListener
    init {
        if(firebaseApp==null&&FirebaseApp.getApps(context).none{it.name==FirebaseApp.DEFAULT_APP_NAME})FirebaseApp.initializeApp(context,FirebaseOptions.Builder()
            .setApplicationId(context.getString(R.string.firebase_app_id)).setApiKey(context.getString(R.string.firebase_api_key)).setProjectId(context.getString(R.string.firebase_project_id)).build())
        val app=firebaseApp?:FirebaseApp.getInstance()
        auth=FirebaseAuth.getInstance(app);cloud=FirebaseFirestore.getInstance(app)
        authListener=FirebaseAuth.AuthStateListener{a->account.value=a.currentUser?.let{Account(it.uid,it.email.orEmpty(),it.displayName.orEmpty())}}
        auth.addAuthStateListener(authListener)
    }
    suspend fun signIn(activity:Activity) {
        val nonce=ByteArray(32).also{SecureRandom().nextBytes(it)}.let{Base64.encodeToString(it,Base64.NO_WRAP or Base64.URL_SAFE or Base64.NO_PADDING)}
        val request=GetCredentialRequest.Builder().addCredentialOption(GetGoogleIdOption.Builder().setServerClientId(context.getString(R.string.firebase_web_client_id)).setFilterByAuthorizedAccounts(false).setAutoSelectEnabled(false).setNonce(nonce).build()).build()
        val result=CredentialManager.create(activity).getCredential(activity,request).credential
        require(result is CustomCredential && result.type==GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL){"Não foi possível obter a conta Google."}
        val token=GoogleIdTokenCredential.createFrom(result.data).idToken
        require(JSONObject(String(Base64.decode(token.split('.')[1],Base64.URL_SAFE))).optString("nonce")==nonce){"A resposta do login não corresponde a este pedido."}
        auth.signInWithCredential(GoogleAuthProvider.getCredential(token,null)).await()
    }
    suspend fun signOut(){auth.signOut();runCatching{CredentialManager.create(context).clearCredentialState(ClearCredentialStateRequest())};status.value=SyncStatus()}
    fun observe(uid:String,onRemote:()->Unit) {
        listener?.remove()
        listener=cloud.document("users/$uid/state/current").addSnapshotListener{snap,error->
            if(account.value?.uid!=uid)return@addSnapshotListener
            if(error!=null){status.value=SyncStatus("Não foi possível atualizar a nuvem. Seus dados continuam no aparelho.",failed=true)}
            else if(snap!=null&&!snap.metadata.isFromCache)onRemote()
        }
    }
    private fun read(tx:Transaction,ref:DocumentReference,meta:Map<String,Any>?):String? {
        if(meta==null)return null
        if(meta["formato"]==null){val value=meta["state"] as? Map<*,*> ?: error("Histórico remoto inválido.");return JSONObject(value).toString()}
        require((meta["formato"] as? Number)?.toInt()==2){"Atualize o aplicativo para ler este formato de histórico."}
        val n=(meta["chunks"] as? Number)?.toInt()?:0;require(n in 1..24){"Metadados do histórico inválidos."}
        val parts=(0 until n).map{i->
            val d=tx.get(ref.parent.document("${ref.id}-chunk-${i.toString().padStart(2,'0')}")).data?:error("Falta uma parte do histórico.")
            require((d["index"] as? Number)?.toInt()==i&&d["rev"]==meta["rev"]&&d["payload"] is String){"Uma parte do histórico está corrompida."}
            d["payload"] as String
        }
        val json=parts.joinToString("");val cfg=JSONObject(json).optJSONObject("config")
        require((cfg?.optLong("rev")?:0)==(meta["rev"] as? Number)?.toLong()){ "Versões inconsistentes do histórico." }
        if(meta["syncGeneration"]!=null)require(cfg?.optString("syncGeneration")==meta["syncGeneration"]){"Versão principal inconsistente."}
        return json
    }
    suspend fun synchronize(uid:String,dao:PilotDao,force:Boolean=false) = lock.withLock {
        if(account.value?.uid!=uid)return@withLock
        val pending=dao.pendingNow()
        status.value=SyncStatus(if(pending.isEmpty())"Atualizando histórico…" else "Enviando ${pending.size} alterações…",true)
        try {
            val ref=cloud.document("users/$uid/state/current")
            val result=cloud.runTransaction { tx ->
                check(auth.currentUser?.uid==uid){"A conta mudou durante a sincronização."}
                val meta=tx.get(ref).data
                val previous=read(tx,ref,meta)
                val before=previous?:StateCompat.empty().toString()
                if(pending.isEmpty())return@runTransaction before
                val next=JSONObject(StateCompat.apply(before,pending,force))
                // Todos os reads, inclusive o slot do backup, precedem os writes.
                val today=LocalDate.now();val backupRef=ref.parent.document("backup-${today.dayOfWeek.value%7}")
                val backupMeta=if(previous!=null)tx.get(backupRef).data else null
                val now=Instant.now().toString();val config=next.obj("config")
                val rev=maxOf(config.optLong("rev"),(meta?.get("rev") as? Number)?.toLong()?:0)+1
                config.put("rev",rev).put("atualizadoEm",now)
                if(config.optString("syncGeneration").isEmpty())config.put("syncGeneration","auto-$clientId").put("syncGenerationCreatedAt",now)
                fun writeParts(target:DocumentReference,json:String,r:Long,oldCount:Int):Int {
                    val parts=StateCompat.chunks(json)
                    parts.forEachIndexed{i,p->tx.set(target.parent.document("${target.id}-chunk-${i.toString().padStart(2,'0')}"),mapOf("payload" to p,"index" to i,"rev" to r,"savedAt" to FieldValue.serverTimestamp()))}
                    for(i in parts.size until minOf(24,oldCount))tx.delete(target.parent.document("${target.id}-chunk-${i.toString().padStart(2,'0')}"))
                    return parts.size
                }
                if(previous!=null&&!((backupMeta?.get("criadoEm") as? String)?.startsWith(today.toString())?:false)){
                    val old=JSONObject(previous);val oldRev=old.obj("config").optLong("rev")
                    val count=writeParts(backupRef,previous,oldRev,(backupMeta?.get("chunks") as? Number)?.toInt()?:0)
                    tx.set(backupRef,mapOf("formato" to 2,"chunks" to count,"criadoEm" to now,"clientId" to clientId,"rev" to oldRev,"resumo" to StateCompat.summary(old),"savedAt" to FieldValue.serverTimestamp()))
                }
                check(auth.currentUser?.uid==uid){"A conta mudou durante a sincronização."}
                val json=next.toString();val count=writeParts(ref,json,rev,(meta?.get("chunks") as? Number)?.toInt()?:0)
                tx.set(ref,mapOf("formato" to 2,"chunks" to count,"updatedAt" to now,"clientId" to clientId,"syncGeneration" to config.getString("syncGeneration"),"rev" to rev,"resumo" to StateCompat.summary(next),"savedAt" to FieldValue.serverTimestamp()))
                json
            }.await()
            if(account.value?.uid==uid){dao.acceptRemote(result,pending.map{it.id});status.value=SyncStatus("Sincronizado")}
        } catch(e:Exception){
            if(account.value?.uid==uid){
                val conflict=generateSequence<Throwable>(e){it.cause}.filterIsInstance<SyncConflict>().firstOrNull()
                status.value=SyncStatus(conflict?.message?:"Sem sincronização agora. Os registros continuam salvos; tente novamente ao conectar.",conflict=conflict!=null,failed=true)
            }
        }
    }
    fun close(){listener?.remove();auth.removeAuthStateListener(authListener)}
}
