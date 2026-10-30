package br.com.gabaritei.piloto

import org.json.JSONObject

/** Reading the complete syllabus includes archived routine items, never deleted/orphaned content. */
object EditalOutline {
    fun read(plan:Plan,raw:String):Plan {
        val root=runCatching{JSONObject(raw)}.getOrNull()?:return plan
        if(root.obj("config").obj("planosExcluidos").has(plan.id))return if(plan.enrolled)plan.copy(disciplines=emptyList())else plan
        val entry=root.array("planos").objects().find{it.optString("id")==plan.id}?:return plan
        val deleted=root.obj("config").obj("entidadesExcluidas")
        fun excluded(type:String,id:String)=deleted.optBoolean("$type:${plan.id}:${StateCompat.encoded(id)}")
        val disciplines=entry.array("disciplinas").objects().filter{!excluded("disc",it.optString("id"))}.sortedBy{it.optInt("ordem")}.map{d->
            val source=plan.disciplines.find{it.id==d.optString("id")}
            Discipline(d.getString("id"),d.optString("nome"),d.array("topicos").objects().filter{!it.optBoolean("orfao")&&!it.optBoolean("removidoDoEdital")&&!excluded("top",it.optString("id"))}.map{t->
                val old=source?.topics?.find{it.id==t.optString("id")}
                Topic(t.getString("id"),t.optString("nome"),old?.link,if(t.optBoolean("androidArquivado"))"Arquivado na rotina"else old?.note.orEmpty(),old?.noQuestions?:false)
            },d.optString("cor",source?.color?:"#3B82F6"),d.optString("planejamentoStatus")=="paused",d.optBoolean("androidArquivada"))
        }
        return plan.copy(disciplines=disciplines)
    }
    fun completed(plan:Plan,progress:List<Progress>):Set<String>{val ids=plan.topics.map{it.id}.toSet();return progress.filter{it.planId==plan.id&&it.completed&&it.topicId in ids}.map{it.topicId}.toSet()}
}
