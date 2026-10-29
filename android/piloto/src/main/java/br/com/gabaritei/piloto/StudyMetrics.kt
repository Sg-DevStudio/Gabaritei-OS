package br.com.gabaritei.piloto

import java.time.*
import org.json.JSONObject

data class StudyActivity(val id:String,val date:LocalDate,val minutes:Double,val questions:Int,val correct:Int,val discipline:String?,val simulated:Boolean=false,val topic:String?=null,val category:String="teoria",val title:String="")
data class Achievement(val name:String,val description:String,val icon:String,val earned:Boolean)
object StudyMetrics {
    fun sessionTitle(plan:Plan,session:Session,raw:String):String {
        val root=runCatching{JSONObject(raw)}.getOrDefault(JSONObject())
        return plan.topics.find{it.id==session.topicId}?.name?.takeIf{it.isNotBlank()}
            ?:root.array("sessoes").objects().find{it.optString("id")==session.id}?.optString("topicoNome")?.takeIf{it.isNotBlank()}
            ?:root.array("planos").objects().find{it.optString("id")==session.planId}?.array("disciplinas")?.objects()?.flatMap{it.array("topicos").objects()}?.find{it.optString("id")==session.topicId}?.optString("nome")?.takeIf{it.isNotBlank()}
            ?:"Estudo arquivado"
    }
    fun counted(count:Int,singular:String,plural:String)="$count ${if(count==1)singular else plural}"
    fun time(minutes:Double)="${(minutes/60).toInt()}h ${minutes.toInt()%60}min"
    fun freeActivities(sessions:List<Session>,raw:String):List<StudyActivity>{
        val meta=runCatching{JSONObject(raw).array("sessoes").objects().associateBy{it.optString("id")}}.getOrDefault(emptyMap())
        return sessions.filter{it.planId.isEmpty()}.map{s->StudyActivity(s.id,Instant.ofEpochMilli(s.endedAt).atZone(ZoneId.systemDefault()).toLocalDate(),s.seconds/60.0,s.questions,s.correct,null,topic=null,category=meta[s.id]?.optString("tipo")?:"teoria",title=meta[s.id]?.optString("topicoNome").orEmpty())}
    }

    fun activities(plan:Plan,sessions:List<Session>,raw:String):List<StudyActivity>{
        val metadata=runCatching{JSONObject(raw).array("sessoes").objects().associateBy{it.optString("id")}}.getOrDefault(emptyMap())
        val rawDisciplines=runCatching{JSONObject(raw).array("planos").objects().find{it.optString("id")==plan.id}?.array("disciplinas")?.objects().orEmpty()}.getOrDefault(emptyList())
        val historicalTopics=rawDisciplines.flatMap{d->d.array("topicos").objects().map{it.optString("id") to d.optString("id")}}.toMap()
        val result=sessions.filter{it.planId==plan.id}.map{s->StudyActivity(s.id,Instant.ofEpochMilli(s.endedAt).atZone(ZoneId.systemDefault()).toLocalDate(),s.seconds/60.0,s.questions,s.correct.coerceIn(0,s.questions.coerceAtLeast(0)),plan.disciplines.firstOrNull{d->d.topics.any{it.id==s.topicId}}?.id?:historicalTopics[s.topicId],topic=s.topicId,category=metadata[s.id]?.optString("tipo")?:if(s.questions>0)"questoes" else "teoria",title=metadata[s.id]?.optString("topicoNome").orEmpty())}.toMutableList()
        runCatching{val root=JSONObject(raw);val removed=root.optJSONObject("config")?.optJSONArray("removidos")
            root.optJSONArray("simulados")?.objects()?.filter{it.optString("planoId")==plan.id&&(removed==null||(0 until removed.length()).none{i->removed.optString(i)==it.optString("id")})}?.forEach{s->
                val rows=s.optJSONArray("acertos")?.objects().orEmpty();val date=runCatching{LocalDate.parse(s.optString("data"))}.getOrNull()?:return@forEach
                // Tempo do simulado é contado uma vez; acertos ficam por disciplina.
                result+=StudyActivity("sim:${s.optString("id")}",date,s.optDouble("duracaoMin",0.0),0,0,null,true,category="simulado")
                rows.forEachIndexed{i,r->val q=r.optInt("total").coerceAtLeast(0);result+=StudyActivity("sim:${s.optString("id")}:$i",date,0.0,q,r.optInt("certas").coerceIn(0,q),r.optString("disciplinaId"),true,category="simulado")}
            }
        }
        return result
    }
    fun streak(days:List<LocalDate>):Int {var best=0;var current=0;var previous:LocalDate?=null;days.distinct().sorted().forEach{current=if(previous?.plusDays(1)==it)current+1 else 1;best=maxOf(best,current);previous=it};return best}
    fun achievements(plan:Plan?,allPlans:List<Plan>,sessions:List<Session>,progress:List<Progress>,raw:String):List<Achievement>{
        val activities=if(plan==null)emptyList() else activities(plan,sessions,raw);val q=activities.sumOf{it.questions};val hours=activities.sumOf{it.minutes}/60
        val days=streak(activities.filter{it.minutes>0||it.questions>0}.map{it.date})
        val done=if(plan==null)0 else progress.count{it.planId==plan.id&&it.completed&&plan.topics.any{t->t.id==it.topicId}}
        val pct=StudyRules.percentage(done,plan?.topics?.size?:0)?:0
        val mastered=runCatching{JSONObject(raw).optJSONArray("planos")?.objects()?.find{it.optString("id")==plan?.id}?.optJSONArray("disciplinas")?.objects()?.sumOf{d->d.optJSONArray("topicos")?.objects()?.count{it.optString("status")=="dominado"}?:0}?:0}.getOrDefault(0)
        return listOf(
            Achievement("Plano traçado","Comece um plano de estudos","🚀",allPlans.any{it.enrolled}||sessions.isNotEmpty()),
            Achievement("Semana de fogo","7 dias seguidos estudando","🔥",days>=7),
            Achievement("Inabalável","30 dias seguidos estudando","🏔️",days>=30),
            Achievement("Centena","100 questões resolvidas","💯",q>=100),
            Achievement("Franco-atirador","1.000 questões resolvidas","🎯",q>=1000),
            Achievement("Maratonista","50 horas de estudo","⏱️",hours>=50),
            Achievement("Domínio","10 tópicos dominados","🧠",mastered>=10),
            Achievement("Meio caminho","50% do edital concluído","📈",pct>=50),
            Achievement("Edital fechado","100% do edital concluído","🏆",pct>=100),
            Achievement("Simulado feito","Registre um simulado","📝",activities.any{it.simulated})
        )
    }
}
