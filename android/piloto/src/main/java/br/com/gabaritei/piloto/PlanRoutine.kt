package br.com.gabaritei.piloto

import java.time.LocalDate
import org.json.JSONObject
import org.json.JSONArray
import kotlin.math.roundToInt

data class Routine(val days:Set<Int>,val dailyMinutes:Int,val blockMinutes:Int)
object PlanRoutine {
    fun minutesFromHours(value:String):Int? = value.trim().replace(',','.').toDoubleOrNull()?.takeIf{it.isFinite()&&it in .25..12.0}?.let{(it*60).roundToInt()}

    fun validate(r:Routine)=r.days.isNotEmpty()&&r.days.all{it in 1..7}&&r.dailyMinutes in 15..720&&r.blockMinutes in 15..120
    fun agenda(entry:JSONObject,r:Routine,start:LocalDate):JSONArray{
        require(validate(r)){"Escolha pelo menos um dia, 15 a 720 minutos por dia e blocos de 15 a 120 minutos."}
        data class Item(val discipline:String,val topic:String,var left:Int)
        val queues=entry.array("disciplinas").objects().map{d->d.array("topicos").objects().map{t->
            val hours=t.optDouble("horas_estimadas",1.0).takeIf{it.isFinite()&&it>0&&it<=40}?:1.0
            Item(d.getString("id"),t.getString("id"),(hours*60).roundToInt().coerceAtLeast(1))
        }.toMutableList()}.filter{it.isNotEmpty()}
        val result=JSONArray();var discipline=0;var date=start;var safety=0
        while(queues.any{it.isNotEmpty()}&&safety++<730){
            if(date.dayOfWeek.value in r.days){var available=r.dailyMinutes
                while(available>0&&queues.any{it.isNotEmpty()}){
                    while(queues[discipline%queues.size].isEmpty())discipline++
                    val queue=queues[discipline%queues.size];val topic=queue.first();val minutes=minOf(available,r.blockMinutes,topic.left)
                    result.put(JSONObject().put("id","android-plan-${entry.getString("id")}-${result.length()}").put("planoId",entry.getString("id")).put("disciplinaId",topic.discipline).put("topicoId",topic.topic)
                        .put("data",date.toString()).put("duracaoMin",minutes).put("feitoMin",0).put("feito",false).put("gerado",false).put("origem","android-rotina").put("obs","teoria"))
                    topic.left-=minutes;available-=minutes;if(topic.left<=0)queue.removeAt(0);discipline++
                }
            }
            date=date.plusDays(1)
        }
        require(queues.none{it.isNotEmpty()}){"Essa rotina precisaria de mais de dois anos. Aumente o tempo semanal antes de criar o plano."}
        entry.obj("plano").put("modoPlanejamento","cronograma").put("rotinaAndroid",JSONObject().put("dias",JSONArray(r.days.sorted())).put("minutosDia",r.dailyMinutes).put("minutosBloco",r.blockMinutes).put("inicio",start.toString()))
        return result
    }
}
