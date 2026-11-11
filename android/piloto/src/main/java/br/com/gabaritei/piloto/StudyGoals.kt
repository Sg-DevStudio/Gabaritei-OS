package br.com.gabaritei.piloto

import java.time.LocalDate
import org.json.JSONObject

/** Agenda duration is shared by the home preview and the timer that it starts. */
object StudyGoals {
    fun minutes(raw:String,planId:String,topicId:String,fallback:Int,today:LocalDate=LocalDate.now(),blockId:String?=null):Int {
        val state=runCatching{JSONObject(raw)}.getOrDefault(JSONObject())
        val cycle=blockId?.startsWith("cycle:")==true
        val rows=if(cycle)DailyStudyPlan.metadata(state,planId).takeIf{it.optString("modoPlanejamento")=="ciclo"}?.optJSONObject("ciclo")?.let{c->c.array("blocos").objects().filter{it.optInt("voltaInicio",1)<=c.optInt("volta",1)}}.orEmpty() else state.array("agenda").objects()
        val candidates=rows.filter{
            (cycle||it.optString("planoId")==planId)&&!DailyStudyPlan.removed(state,planId,it.optString("id"))&&
                (it.optString("topicoId")==topicId||(blockId!=null&&it.optString("topicoId").let{v->v.isBlank()||v=="null"}))&&!DailyStudyPlan.done(it,cycle)
        }
        val block=if(blockId!=null)candidates.find{it.optString("id")==if(cycle)blockId.removePrefix("cycle:")else blockId}
            else candidates.firstOrNull{it.optString("data")==today.toString()&&it.optInt("duracaoMin") in 1..1440}
        require(blockId==null||block!=null){"Este bloco foi alterado ou concluído. Abra o planejamento novamente."}
        return block?.let{kotlin.math.ceil(DailyStudyPlan.total(it,cycle)-DailyStudyPlan.studied(it)).toInt()}?.takeIf{it in 1..1440}?:fallback.takeIf{it in 0..1440}?:50
    }
}
