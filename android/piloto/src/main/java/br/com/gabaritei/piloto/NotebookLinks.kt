package br.com.gabaritei.piloto

import java.net.URI
import org.json.JSONObject

/** Display only: persisted links retain their individual IDs in the shared web state. */
data class QuestionLink(val id:String,val url:String,val name:String="",val persisted:Boolean=false) {
    val platform:String get()=NotebookLinks.platform(url)
    val label:String get()=name.takeUnless{it.isBlank()||it.startsWith("Questões de ")||it.startsWith("Resolver:")}?:platform
}
object NotebookLinks {
    fun cleanUrl(value:String)=value.trim().replaceFirst(Regex("^https:",RegexOption.IGNORE_CASE),"https:")
    fun key(plan:Plan,topic:Topic)="plano:${plan.discipline(topic).id}:${topic.id}"
    fun rows(raw:String,plan:Plan,topic:Topic):List<JSONObject> = JSONObject(raw).array("planos").objects().find{it.optString("id")==plan.id}?.array("links")?.objects()?.filter{it.optString("tipo")=="trilha"&&it.optString("topicoChave")==key(plan,topic)}.orEmpty()
    fun index(raw:String,plan:Plan,legacy:List<PersonalLink> = emptyList()):Map<String,List<QuestionLink>>{
        val state=JSONObject(raw)
        val rows=state.array("planos").objects().find{it.optString("id")==plan.id}?.array("links")?.objects()?.filter{it.optString("tipo")=="trilha"}?.groupBy{it.optString("topicoChave")}.orEmpty()
        val deleted=state.obj("config").obj("entidadesExcluidas")
        return plan.disciplines.flatMap{d->d.topics.map{topic->
            val scoped=rows["plano:${d.id}:${topic.id}"].orEmpty()
            val entries=if(scoped.isNotEmpty()){
                scoped.filter{!it.optBoolean("oculto")&&!deleted.optBoolean("link:${plan.id}:${StateCompat.encoded(it.optString("id"))}")&&StudyRules.safeLink(it.optString("url").trim())}.sortedByDescending{it.optBoolean("principal")}.map{QuestionLink(it.getString("id"),it.getString("url").trim(),it.optString("nome"),true)}
            }else{
                val old=legacy.find{it.planId==plan.id&&it.topicId==topic.id}?.url
                (old?:topic.link)?.trim()?.takeIf{StudyRules.safeLink(it)}?.let{listOf(QuestionLink(if(old==null)"reference"else"legacy",it))}.orEmpty()
            }
            topic.id to entries
        }}.toMap()
    }
    fun entries(raw:String,plan:Plan,topic:Topic,legacy:List<PersonalLink> = emptyList())=index(raw,plan,legacy)[topic.id].orEmpty()
    fun available(raw:String,plan:Plan,topic:Topic,legacy:List<PersonalLink> = emptyList())=entries(raw,plan,topic,legacy).distinctBy{it.url}
    fun platform(url:String):String{
        val host=runCatching{URI(url).host?.lowercase().orEmpty().removePrefix("www.")}.getOrDefault("")
        return when {
            host=="questoes.grancursosonline.com.br"->"Gran Questões"
            host=="notebooklm.google.com"||host=="notebooklm.google"->"NotebookLM"
            host=="tecconcursos.com.br"||host.endsWith(".tecconcursos.com.br")->"TEC Concursos"
            host=="qconcursos.com"||host.endsWith(".qconcursos.com")->"Qconcursos"
            else->host.ifBlank{"Questões"}
        }
    }
}
