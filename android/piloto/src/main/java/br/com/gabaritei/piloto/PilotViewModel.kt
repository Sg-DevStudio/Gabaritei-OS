package br.com.gabaritei.piloto

import android.app.Activity
import android.app.Application
import android.net.ConnectivityManager
import android.net.Network
import android.os.SystemClock
import android.provider.Settings as AndroidSettings
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONObject
import java.time.*
import java.util.UUID

@OptIn(ExperimentalCoroutinesApi::class, FlowPreview::class)
class PilotViewModel(application: Application) : AndroidViewModel(application) {
    private val cloud=AccountSync(application)
    val account=cloud.account
    val syncStatus=cloud.status
    val pendingCount=MutableStateFlow(0)
    val guestRecords=MutableStateFlow(0)
    val plans=MutableStateFlow<List<Plan>>(emptyList())
    val error=MutableStateFlow<String?>(null)
    val sessions=MutableStateFlow<List<Session>>(emptyList())
    val progress=MutableStateFlow<List<Progress>>(emptyList())
    val links=MutableStateFlow<List<PersonalLink>>(emptyList())
    val settings=MutableStateFlow<Settings?>(null)
    val timer=MutableStateFlow<Timer?>(null)
    val rawSnapshot=MutableStateFlow(StateCompat.empty().toString())
    val ready=MutableStateFlow(false)
    private val enrollmentLock=Mutex()
    private val catalog=MutableStateFlow<List<Plan>>(emptyList())
    val catalogStatus=MutableStateFlow("Catálogo offline")
    val catalogBusy=MutableStateFlow(false)
    private val catalogLock=Mutex()
    private val connectivity=application.getSystemService(ConnectivityManager::class.java)
    private val network=object:ConnectivityManager.NetworkCallback(){override fun onAvailable(network:Network){synchronize();refreshCatalog()}}
    private fun boot()=AndroidSettings.Global.getInt(getApplication<Application>().contentResolver,AndroidSettings.Global.BOOT_COUNT,-1)
    private fun dao(uid:String?=account.value?.uid)=PilotDatabase.get(getApplication(),uid).dao()
    init {
        connectivity.registerDefaultNetworkCallback(network)
        viewModelScope.launch{dao(null).sessions().collect{guestRecords.value=it.size}}
        viewModelScope.launch {
            catalog.value=withContext(Dispatchers.IO){Catalog.load(application)}
            refreshCatalog()
            var bound:String?=null;var initialized=false
            account.collectLatest { a ->
                if(initialized&&bound!=a?.uid){val previous=dao(bound);previous.currentTimer()?.let{previous.timer(it.copy(seconds=elapsed(it),startedElapsed=null))};TimerNotices.cancel(application)}
                bound=a?.uid;initialized=true
                application.getSharedPreferences("study_reminders",0).edit().putString("owner",a?.uid.orEmpty()).apply()
                ready.value=false;rawSnapshot.value=StateCompat.empty().toString();plans.value=emptyList();sessions.value=emptyList();progress.value=emptyList();links.value=emptyList();timer.value=null;settings.value=null;pendingCount.value=0
                val d=dao(a?.uid)
                coroutineScope {
                    launch{d.settings().collect{settings.value=it}}
                    launch{d.timer().collect{t->
                        if(t!=null&&t.startedElapsed!=null&&t.boot!=boot())d.timer(t.copy(startedElapsed=null,boot=boot())) else {timer.value=t;if(t==null)TimerNotices.cancel(application) else TimerNotices.schedule(application,t,elapsed(t))}
                    }}
                    if(a==null){
                        launch{combine(d.snapshot(),catalog){snap,bases->snap to bases}.collectLatest{(snap,bases)->val raw=snap?.json?:StateCompat.empty().toString();val projected=withContext(Dispatchers.Default){StateCompat.plans(raw,bases)};rawSnapshot.value=raw;plans.value=projected;ready.value=true}}
                        launch{d.sessions().collect{sessions.value=it}};launch{d.progress().collect{progress.value=it}};launch{d.links().collect{links.value=it}}
                    }else{
                        launch{combine(d.snapshot(),catalog){snap,bases->snap to bases}.collectLatest { (snap,bases) ->
                            val raw=snap?.json?:StateCompat.empty().toString()
                            val projection=withContext(Dispatchers.Default){Triple(StateCompat.plans(raw,bases).map{it.copy(owner=a.uid)},StateCompat.sessions(raw),Pair(StateCompat.progress(raw),StateCompat.links(raw)))}
                            rawSnapshot.value=raw;plans.value=projection.first;sessions.value=projection.second;progress.value=projection.third.first;links.value=projection.third.second
                            if(settings.value==null){val active=JSONObject(raw).optString("planoAtivoId");val p=plans.value.find{it.id==active};if(p!=null)d.settings(Settings(planId=p.id,topicId=p.topics.firstOrNull()?.id.orEmpty()))}
                            ready.value=true
                        }}
                        cloud.observe(a.uid){synchronize()}
                        launch{d.pending().debounce(800).collect{pendingCount.value=it.size;if(it.isNotEmpty())cloud.synchronize(a.uid,d)}}
                        launch{cloud.synchronize(a.uid,d)}
                    }
                    awaitCancellation()
                }
            }
        }
    }
    fun refreshCatalog()=viewModelScope.launch{
        if(catalogBusy.value)return@launch
        catalogLock.withLock{
            catalogBusy.value=true
            try{
                val rows=withTimeout(20000){cloud.publicCatalog()}
                val loaded=withContext(Dispatchers.IO){val merged=Catalog.merge(Catalog.bundled(getApplication()),rows);require(merged.isNotEmpty());val dest=java.io.File(getApplication<Application>().filesDir,"catalog-public.json");val temp=java.io.File(getApplication<Application>().filesDir,"catalog-public.tmp");temp.writeText(rows.toString());check(temp.renameTo(dest));merged}
                catalog.value=loaded;catalogStatus.value="Catálogo atualizado"
            }catch(_:Exception){catalogStatus.value="Usando a última cópia disponível"}
            finally{catalogBusy.value=false}
        }
    }
    fun signIn(activity:Activity)=viewModelScope.launch {
        try{cloud.signIn(activity)}catch(_:androidx.credentials.exceptions.GetCredentialCancellationException){}catch(_:Exception){error.value="Não foi possível entrar com Google. Confira a conexão e tente novamente."}
    }
    fun signOut()=viewModelScope.launch {
        val uid=account.value?.uid;val d=dao(uid)
        timer.value?.let{d.timer(it.copy(seconds=elapsed(it),startedElapsed=null))}
        TimerNotices.cancel(getApplication());if(account.value?.uid==uid)cloud.signOut()
    }
    fun synchronize(force:Boolean=false){val uid=account.value?.uid?:return;viewModelScope.launch{cloud.synchronize(uid,dao(uid),force)}}
    fun keepRemote(){val uid=account.value?.uid?:return;viewModelScope.launch{val d=dao(uid);d.archivePending();cloud.synchronize(uid,d)}}
    fun importGuest(){val uid=account.value?.uid?:return;viewModelScope.launch{
        try{
            val d=dao(uid);val guest=dao(null);val records=guest.sessions().first();val done=guest.progress().first()
            val guestRaw=JSONObject(guest.currentSnapshot()?.json?:StateCompat.empty().toString())
            val imported=mutableMapOf<String,String>()
            for(entry in guestRaw.array("planos").objects()){
                check(account.value?.uid==uid)
                val old=entry.getString("id");val next="android-import-$old";imported[old]=next
                val copy=JSONObject(entry.toString()).put("id",next)
                val agenda=org.json.JSONArray(guestRaw.array("agenda").objects().filter{it.optString("planoId")==old}.map{JSONObject(it.toString()).put("id","import-${it.optString("id")}").put("planoId",next)})
                d.mutate(mutation(d,"plan",JSONObject().put("entry",copy).put("agenda",agenda)))
            }
            for(s in records){
                check(account.value?.uid==uid){"A conta mudou durante a importação."}
                if(s.planId.isEmpty()){
                    val row=guestRaw.array("sessoes").objects().find{it.optString("id")==s.id}?:continue
                    d.mutate(mutation(d,"free-session",JSONObject().put("session",row)));continue
                }
                val mapped=imported[s.planId]
                val p=if(mapped!=null)StateCompat.plans(d.currentSnapshot()!!.json,catalog.value).first{it.id==mapped}.copy(owner=uid) else {val base=catalog.value.firstOrNull{it.id==s.planId}?:continue;ensurePlan(base.copy(owner=uid),d)}
                val exists=JSONObject(d.currentSnapshot()!!.json).array("sessoes").objects().any{it.optString("id")==s.id}
                if(exists)continue
                val date=Instant.ofEpochMilli(s.endedAt).atZone(ZoneId.systemDefault()).toLocalDate().toString()
                val row=JSONObject().put("id",s.id).put("planoId",p.id).put("topicoId",s.topicId).put("data",date).put("registradoEm",Instant.ofEpochMilli(s.endedAt).toString()).put("tipo",if(s.questions>0)"questoes" else "teoria").put("duracaoMin",s.seconds/60.0).put("qFeitas",s.questions).put("qCertas",s.correct).put("obs","").put("origemRegistroRapido","android")
                guestRaw.array("sessoes").objects().find{it.optString("id")==s.id}?.let{row.put("tipo",it.optString("tipo",row.optString("tipo")))}
                d.mutate(mutation(d,"session",JSONObject().put("planId",p.id).put("topicId",s.topicId).put("session",row).put("completed",done.any{it.planId==s.planId&&it.topicId==s.topicId&&it.completed})))
            }
            error.value="Estudos locais preparados para sincronizar. A cópia no aparelho foi mantida."
        }catch(e:Exception){error.value=e.message?:"Não foi possível trazer os registros locais."}
    }}
    suspend fun backupJson(owner:String):String=withContext(Dispatchers.IO){
        check(account.value?.uid==owner){"A conta mudou antes da exportação."}
        val d=dao(owner);val copy=JSONObject(d.currentSnapshot()?.json?:StateCompat.empty().toString())
        copy.put("recuperacaoAndroid",org.json.JSONArray(d.recoveryCopies().map{JSONObject(it.json)}))
        check(account.value?.uid==owner){"A conta mudou antes da exportação."};copy.toString(2)
    }
    private suspend fun mutation(d:PilotDao,kind:String,payload:JSONObject):PendingMutation {
        val stamp=maxOf(System.currentTimeMillis(),(d.pendingNow().maxOfOrNull{it.createdAt}?:0)+1)
        return PendingMutation(UUID.randomUUID().toString(),kind,payload.toString(),d.currentSnapshot()?.json?.let{StateCompat.generation(it)}.orEmpty(),stamp)
    }
    private suspend fun ensurePlan(p:Plan,d:PilotDao):Plan = enrollmentLock.withLock {
        check(p.owner==account.value?.uid.orEmpty()){ "A conta mudou. Escolha novamente o plano." }
        if(account.value==null)return@withLock p
        val raw=d.currentSnapshot()?.json?:StateCompat.empty().toString()
        val enrolled=StateCompat.plans(raw,catalog.value).find{it.enrolled&&(it.id==p.id||(!p.enrolled&&it.originId==p.originId))}
        if(enrolled!=null)return@withLock enrolled.copy(owner=p.owner)
        check(!p.enrolled){"Este plano não pertence à conta atual."}
        val base=Catalog.base(p)
        val id="android-pl-"+UUID.randomUUID().toString();val now=Instant.now().toString()
        val meta=JSONObject().put("concurso",p.name).put("origemEditalId",p.originId).put("origemEditalVersao",base.optString("atualizadoEm")).put("banca",base.optString("banca")).put("foto",base.optString("foto")).put("orgao",base.optString("orgao")).put("cargo",base.optString("cargo"))
        val ds=base.getJSONArray("disciplinas");ds.objects().forEach{d->d.array("topicos").objects().forEach{it.put("status","pendente")}}
        val entry=JSONObject().put("id",id).put("criadoEm",now).put("atualizadoEm",now).put("plano",meta).put("disciplinas",ds).put("links",org.json.JSONArray()).put("cronogramas",JSONObject().put("sustentavel",org.json.JSONArray()).put("hardcore",org.json.JSONArray()))
        d.mutate(mutation(d,"plan",JSONObject().put("entry",entry)))
        return@withLock p.copy(id=id,enrolled=true)
    }
    fun createPlan(plan:Plan,routine:Routine,onResult:(String?)->Unit)=viewModelScope.launch{
        try{
            check(plan.owner==account.value?.uid.orEmpty()){ "A conta mudou. Reabra o plano." }
            val d=dao(plan.owner.takeIf{it.isNotEmpty()})
            val payload=withContext(Dispatchers.Default){
                val base=Catalog.base(plan)
                val now=Instant.now().toString();val id=if(plan.owner.isEmpty())plan.id else "android-pl-"+UUID.randomUUID().toString()
                val meta=JSONObject().put("concurso",plan.name).put("origemEditalId",plan.originId).put("origemEditalVersao",base.optString("atualizadoEm")).put("banca",base.optString("banca")).put("foto",base.optString("foto")).put("orgao",base.optString("orgao")).put("cargo",base.optString("cargo"))
                val ds=base.getJSONArray("disciplinas");ds.objects().forEach{disc->disc.array("topicos").objects().forEach{it.put("status","pendente")}}
                val entry=JSONObject().put("id",id).put("plano",meta).put("disciplinas",ds).put("links",org.json.JSONArray()).put("cronogramas",JSONObject().put("sustentavel",org.json.JSONArray()).put("hardcore",org.json.JSONArray())).put("criadoEm",now).put("atualizadoEm",now)
                JSONObject().put("entry",entry).put("agenda",PlanRoutine.agenda(entry,routine,LocalDate.now()))
            }
            check(plan.owner==account.value?.uid.orEmpty()){ "A conta mudou. Reabra o plano." }
            val op=mutation(d,"plan",payload)
            if(plan.owner.isEmpty())d.localPlan(op) else d.mutate(op)
            d.settings(Settings(planId=payload.getJSONObject("entry").getString("id"),topicId=plan.topics.firstOrNull()?.id.orEmpty()))
            getApplication<Application>().getSharedPreferences("native_display",0).edit().putInt("focusMinutes",routine.blockMinutes).apply()
            onResult(null)
        }catch(e:Exception){onResult(e.message?:"Não foi possível criar o plano.")}
    }
    fun select(plan:Plan,topic:Topic)=viewModelScope.launch {
        runCatching{val d=dao(plan.owner.takeIf{it.isNotEmpty()});val p=ensurePlan(plan,d);d.settings(Settings(planId=p.id,topicId=topic.id))}.onFailure{error.value=it.message}
    }
    fun preview(plan:Plan)=viewModelScope.launch{if(plan.owner==account.value?.uid.orEmpty())dao(plan.owner.takeIf{it.isNotEmpty()}).settings(Settings(planId=plan.id,topicId=plan.topics.firstOrNull()?.id.orEmpty()))}
    fun select(plan:Plan)=select(plan,plan.topics.firstOrNull{t->progress.value.none{it.planId==plan.id&&it.topicId==t.id&&it.completed}}?:plan.topics.firstOrNull()?:Topic("","",null,""))
    fun start(plan:Plan,topic:Topic)=viewModelScope.launch {
        try{val d=dao(plan.owner.takeIf{it.isNotEmpty()});val p=ensurePlan(plan,d);d.settings(Settings(planId=p.id,topicId=topic.id))
            if(!d.startTimer(Timer(sessionId=UUID.randomUUID().toString(),planId=p.id,topicId=topic.id,seconds=0,startedElapsed=SystemClock.elapsedRealtime(),boot=boot(),goalSeconds=getApplication<Application>().getSharedPreferences("native_display",0).getInt("focusMinutes",50)*60L)))error.value="Conclua ou descarte o cronômetro atual antes de iniciar outro."
        }catch(e:Exception){error.value=e.message?:"Não foi possível iniciar o estudo."}
    }
    fun elapsed(t:Timer)=StudyRules.elapsed(t.seconds,if(t.boot==boot())t.startedElapsed else null,SystemClock.elapsedRealtime())
    fun pause(t:Timer)=viewModelScope.launch{val d=dao();if(d.currentTimer()?.sessionId==t.sessionId)d.timer(t.copy(seconds=elapsed(t),startedElapsed=null))}
    fun resume(t:Timer)=viewModelScope.launch{val d=dao();if(d.currentTimer()?.sessionId==t.sessionId)d.timer(t.copy(startedElapsed=SystemClock.elapsedRealtime(),boot=boot()))}
    fun discard(t:Timer)=viewModelScope.launch{dao().clearTimer(t.sessionId)}
    fun save(plan:Plan,topic:Topic,input:StudyInput,completed:Boolean,timer:Timer?,id:String,category:String="",date:LocalDate=LocalDate.now(),failed:()->Unit={},success:()->Unit){
        val validation=StudyRules.error(input)?:if(date.isAfter(LocalDate.now()))"A data não pode estar no futuro." else null;if(validation!=null){error.value=validation;failed();return}
        viewModelScope.launch{try{
            val d=dao(plan.owner.takeIf{it.isNotEmpty()});val p=ensurePlan(plan,d);val now=date.atTime(LocalTime.now()).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
            val kind=category.ifBlank{if(input.questions>0)"questoes" else "teoria"}
            val row=JSONObject().put("id",id).put("planoId",p.id).put("topicoId",topic.id).put("data",date.toString()).put("registradoEm",Instant.ofEpochMilli(System.currentTimeMillis()).toString()).put("tipo",kind).put("duracaoMin",input.seconds/60.0).put("qFeitas",input.questions).put("qCertas",input.correct).put("obs","").put("origemRegistroRapido","android")
            if(plan.owner.isEmpty())d.record(Session(id,p.id,topic.id,input.seconds,input.questions,input.correct,now),completed,timer!=null,row.toString())
            else{
                val s=row
                d.mutate(mutation(d,"session",JSONObject().put("planId",p.id).put("topicId",topic.id).put("session",s).put("completed",completed)),if(timer!=null)id else null)
            }
            d.settings(Settings(planId=p.id,topicId=topic.id));if(plan.owner==account.value?.uid.orEmpty())success()
        }catch(e:Exception){error.value=e.message?:"Não foi possível salvar. Tente novamente.";failed()}}
    }
    fun saveNotebookLink(plan:Plan,topic:Topic,old:QuestionLink?,url:String,name:String,remove:Boolean=false,onDone:(String?)->Unit)=viewModelScope.launch{
        try{
            check(plan.owner==account.value?.uid.orEmpty()){"A conta mudou. Reabra o plano."}
            val value=NotebookLinks.cleanUrl(url)
            require(remove||StudyRules.safeLink(value)){"Use um link HTTPS válido."}
            val d=dao(plan.owner.takeIf{it.isNotEmpty()});val p=ensureLocalEditable(plan,d)
            val raw=d.currentSnapshot()?.json?:StateCompat.empty().toString()
            val entries=NotebookLinks.entries(raw,p,topic,if(p.owner.isEmpty())d.links().first()else emptyList())
            require(remove||entries.none{it.id!=old?.id&&it.url==value}){"Este link já está neste tópico."}
            val payloads=mutableListOf<JSONObject>()
            // On first customization, materialize the other defaults just as the website does.
            if(NotebookLinks.rows(raw,p,topic).isEmpty())entries.filter{it.id!=old?.id}.forEach{entry->payloads+=JSONObject().put("planId",p.id).put("topicId",topic.id).put("linkId","android-link-${UUID.randomUUID()}").put("beforeUrl","").put("url",entry.url).put("name",entry.label).put("makePrimary",false)}
            payloads+=JSONObject().put("planId",p.id).put("topicId",topic.id).put("linkId",old?.takeIf{it.persisted}?.id?:"android-link-${UUID.randomUUID()}").put("beforeUrl",if(old?.persisted==true)old.url else "").put("url",if(remove)""else value).put("name",name).put("makePrimary",false).put("keepEmpty",true).also{if(old?.persisted==true)it.put("beforeName",old.name)}
            val ops=payloads.mapIndexed{i,payload->mutation(d,"link",payload).let{it.copy(createdAt=it.createdAt+i)}}
            d.notebook(ops,p.id,topic.id,p.owner.isEmpty())
            if(plan.owner==account.value?.uid.orEmpty())onDone(null)
        }catch(e:Exception){onDone(e.message?:"Não foi possível salvar o link.")}
    }
    fun edit(plan:Plan,payload:JSONObject,onDone:(String?)->Unit={})=viewModelScope.launch{
        try{
            check(plan.owner==account.value?.uid.orEmpty()){"A conta mudou. Reabra o plano."}
            val d=dao(plan.owner.takeIf{it.isNotEmpty()});val p=ensureLocalEditable(plan,d)
            val op=mutation(d,"structure",payload.put("planId",p.id))
            if(p.owner.isEmpty())d.localPlan(op)else d.mutate(op)
            onDone(null)
        }catch(e:Exception){onDone(e.message?:"Não foi possível salvar.");error.value=e.message}
    }
    private suspend fun ensureLocalEditable(plan:Plan,d:PilotDao):Plan{
        if(plan.owner.isNotEmpty())return ensurePlan(plan,d)
        if(d.currentSnapshot()?.json?.let{JSONObject(it).array("planos").objects().any{p->p.optString("id")==plan.id}}==true)return plan
        val source=Catalog.base(plan)
        val entry=JSONObject().put("id",plan.id).put("plano",JSONObject().put("concurso",plan.name).put("origemEditalId",plan.originId)).put("disciplinas",source.getJSONArray("disciplinas")).put("links",org.json.JSONArray()).put("cronogramas",JSONObject())
        d.localPlan(mutation(d,"plan",JSONObject().put("entry",entry)))
        return plan
    }
    fun saveFree(title:String,input:StudyInput,category:String,date:LocalDate,id:String,onDone:(String?)->Unit)=viewModelScope.launch{
        try{
            require(title.trim().length in 1..240){"Dê um nome ao estudo."};StudyRules.error(input)?.let{error(it)};require(!date.isAfter(LocalDate.now())){"A data não pode estar no futuro."}
            val owner=account.value?.uid;val d=dao(owner);val ended=date.atTime(LocalTime.now()).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
            val row=JSONObject().put("id",id).put("data",date.toString()).put("registradoEm",Instant.now().toString()).put("topicoNome",title.trim()).put("tipo",category).put("duracaoMin",input.seconds/60.0).put("qFeitas",input.questions).put("qCertas",input.correct).put("estudoLivre",true).put("planoId",JSONObject.NULL).put("topicoId",JSONObject.NULL)
            if(owner==null)d.recordFree(Session(id,"","",input.seconds,input.questions,input.correct,ended),row.toString()) else d.mutate(mutation(d,"free-session",JSONObject().put("session",row)))
            onDone(null)
        }catch(e:Exception){onDone(e.message?:"Não foi possível registrar.")}
    }
    fun setPhoto(uri:android.net.Uri?,owner:String,onDone:(String?)->Unit)=viewModelScope.launch{
        try{
            val image=if(uri==null)""else withContext(Dispatchers.IO){ProfilePhoto.encode(getApplication(),uri)}
            check(owner==account.value?.uid.orEmpty()){"A conta mudou. Abra seu perfil novamente."}
            val d=dao(owner.takeIf{it.isNotEmpty()});val current=d.currentSnapshot()?.json?:StateCompat.empty().toString()
            val op=mutation(d,"profile-photo",JSONObject().put("image",image).put("before",ProfilePhoto.value(current)))
            if(owner.isEmpty())d.localPlan(op)else d.mutate(op)
            onDone(null)
        }catch(e:Exception){onDone(e.message?:"Não foi possível salvar a foto.")}
    }
    override fun onCleared(){cloud.close();connectivity.unregisterNetworkCallback(network);super.onCleared()}
}
