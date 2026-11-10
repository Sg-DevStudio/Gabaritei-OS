package br.com.gabaritei.piloto

import java.time.LocalDate
import org.json.JSONObject

/** Agenda duration is shared by the home preview and the timer that it starts. */
object StudyGoals {
    fun minutes(raw:String,planId:String,topicId:String,fallback:Int,today:LocalDate=LocalDate.now(),blockId:String?=null):Int {
        val candidates=runCatching{JSONObject(raw).array("agenda").objects().filter{
            it.optString("planoId")==planId&&it.optString("topicoId")==topicId&&!it.optBoolean("feito")
        }}.getOrDefault(emptyList())
        val block=if(blockId!=null)candidates.find{it.optString("id")==blockId}
            else candidates.firstOrNull{it.optString("data")==today.toString()&&it.optInt("duracaoMin") in 1..1440}
        require(blockId==null||block!=null){"Este bloco foi alterado ou concluído. Abra o planejamento novamente."}
        return block?.optInt("duracaoMin")?.takeIf{it in 1..1440}?:fallback.takeIf{it in 0..1440}?:50
    }
}
