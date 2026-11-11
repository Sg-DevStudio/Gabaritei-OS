package br.com.gabaritei.piloto

import java.time.LocalDate
import org.json.JSONObject
import kotlin.math.ceil

data class PlannedStudy(val id:String,val discipline:Discipline,val topic:Topic,val minutes:Double,val studied:Double,val done:Boolean,val cycle:Boolean,val kind:String) {
    val remainingMinutes get()=ceil((minutes-studied).coerceAtLeast(0.0)).toInt()
    val reference get()=if(cycle)"cycle:$id" else id
}

/** Read-only projection of the same calendar/cycle used by the website. */
object DailyStudyPlan {
    private fun state(raw:String)=runCatching{JSONObject(raw)}.getOrDefault(JSONObject())
    fun metadata(s:JSONObject,planId:String)=s.array("planos").objects().find{it.optString("id")==planId}?.optJSONObject("plano")?:JSONObject()
    fun removed(s:JSONObject,planId:String,id:String):Boolean {
        val config=s.optJSONObject("config")?:return false
        return config.optJSONArray("removidos")?.let{a->(0 until a.length()).any{a.optString(it)==id}}==true ||
            config.optJSONObject("entidadesExcluidas")?.optBoolean("agenda:$planId:${StateCompat.encoded(id)}")==true
    }
    fun studied(row:JSONObject)=row.optDouble("feitoMin",0.0).takeIf{it.isFinite()}?.coerceAtLeast(0.0)?:0.0
    fun total(row:JSONObject,cycle:Boolean=false)=row.optDouble(if(cycle)"metaMin" else "duracaoMin",0.0).takeIf{it.isFinite()}?.coerceAtLeast(0.0)?:0.0
    fun done(row:JSONObject,cycle:Boolean=false)=(!cycle&&row.optBoolean("feito")) || (total(row,cycle)>0&&studied(row)>=total(row,cycle)-if(cycle)0.0 else 0.5)

    private fun project(s:JSONObject,plan:Plan,row:JSONObject,cycle:Boolean):PlannedStudy? {
        val id=row.optString("id");if(total(row,cycle)<=0||total(row,cycle)>1440||id.isBlank()||(!cycle&&removed(s,plan.id,id)))return null
        val topicId=row.optString("topicoId").takeUnless{it=="null"}.orEmpty()
        val disc=plan.disciplines.find{it.id==row.optString("disciplinaId")}?:plan.disciplines.find{d->d.topics.any{it.id==topicId}}?:return null
        if(disc.paused||disc.archived)return null
        val saved=s.array("planos").objects().find{it.optString("id")==plan.id}?.array("disciplinas")?.objects()?.find{it.optString("id")==disc.id}?.array("topicos")?.objects().orEmpty()
        val topic=if(topicId.isNotBlank())disc.topics.find{it.id==topicId} else
            disc.topics.firstOrNull{t->saved.any{it.optString("id")==t.id&&it.optString("status")=="em_curso"}}?:
            disc.topics.firstOrNull{t->saved.none{it.optString("id")==t.id&&it.optString("status") in listOf("teoria_concluida","dominado")}}?:disc.topics.firstOrNull()
        topic?:return null
        return PlannedStudy(id,disc,topic,total(row,cycle),studied(row),done(row,cycle),cycle,row.optString("obs").takeIf{it in listOf("teoria","questoes","revisao")}?:"teoria")
    }
    fun agenda(raw:String,plan:Plan,date:LocalDate):List<PlannedStudy> {
        val s=state(raw)
        val sorted=s.array("agenda").objects().filter{it.optString("planoId")==plan.id&&it.optString("data")==date.toString()}
            .sortedWith(compareBy<JSONObject>{it.optDouble("ordem",1e9)}.thenBy{it.optString("horaInicio")}.thenBy{it.optString("id")})
            .mapNotNull{project(s,plan,it,false)}
        val pending=sorted.filter{!it.done}.toMutableList();val preferred=metadata(s,plan.id).optString("estudoInicioPreferido")
        val first=pending.indexOfFirst{it.id==preferred};if(first>0)pending.add(0,pending.removeAt(first))
        val ordered=mutableListOf<PlannedStudy>()
        while(pending.isNotEmpty()) {
            val previous=ordered.lastOrNull()?.discipline?.id
            val index=pending.indexOfFirst{it.discipline.id!=previous}.coerceAtLeast(0)
            ordered+=pending.removeAt(index)
        }
        return ordered+sorted.filter{it.done}
    }
    fun cycle(raw:String,plan:Plan):List<PlannedStudy> {
        val s=state(raw);val meta=metadata(s,plan.id);if(meta.optString("modoPlanejamento")!="ciclo")return emptyList()
        val cycle=meta.optJSONObject("ciclo")?:return emptyList()
        return cycle.array("blocos").objects().filter{it.optInt("voltaInicio",1)<=cycle.optInt("volta",1)}.mapNotNull{project(s,plan,it,true)}
    }
    fun pending(raw:String,plan:Plan,date:LocalDate=LocalDate.now())=(cycle(raw,plan)+agenda(raw,plan,date)).filter{!it.done}
}
