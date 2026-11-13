package br.com.gabaritei.piloto

import java.net.URI
import org.json.JSONObject

/** Display only: persisted links retain their individual IDs in the shared web state. */
data class QuestionLink(val id:String,val url:String,val name:String="",val persisted:Boolean=false,val note:String="",val originalProvider:String="") {
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
                val saved=scoped.filter{!it.optBoolean("oculto")&&!deleted.optBoolean("link:${plan.id}:${StateCompat.encoded(it.optString("id"))}")&&StudyRules.safeLink(it.optString("url").trim())}.sortedByDescending{it.optBoolean("principal")}.map{QuestionLink(it.getString("id"),it.getString("url").trim(),it.optString("nome"),true,originalProvider=it.optString("provedorOriginal"))}
                val touched=scoped.map{it.optString("provedorOriginal").ifBlank{provider(it.optString("url"))}}.toSet()
                // Match the website: new TEC/Qconcursos defaults complement personal links.
                // A provider explicitly edited/removed must never be restored by its default.
                val empty=scoped.any{it.optBoolean("oculto")&&it.optString("id").startsWith("android-empty-")}
                saved+if(empty)emptyList()else topic.questionLinks.filter{StudyRules.safeLink(it.url)&&provider(it.url) in setOf("tec","qconcursos")&&provider(it.url) !in touched}
            }else{
                val old=legacy.find{it.planId==plan.id&&it.topicId==topic.id}?.url
                if(old==null&&topic.questionLinks.isNotEmpty())topic.questionLinks.filter{StudyRules.safeLink(it.url)}
                else (old?:topic.link)?.trim()?.takeIf{StudyRules.safeLink(it)}?.let{listOf(QuestionLink(if(old==null)"reference"else"legacy",it))}.orEmpty()
            }
            topic.id to entries
        }}.toMap()
    }
    fun entries(raw:String,plan:Plan,topic:Topic,legacy:List<PersonalLink> = emptyList())=index(raw,plan,legacy)[topic.id].orEmpty()
    fun available(raw:String,plan:Plan,topic:Topic,legacy:List<PersonalLink> = emptyList())=entries(raw,plan,topic,legacy).distinctBy{it.url}
    fun provider(url:String)=when(platform(url)){"Gran Questões"->"gran";"TEC Concursos"->"tec";"Qconcursos"->"qconcursos";else->""}
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
