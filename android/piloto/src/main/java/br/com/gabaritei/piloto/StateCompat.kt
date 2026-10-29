package br.com.gabaritei.piloto

import org.json.JSONArray
import org.json.JSONObject
import java.net.URLEncoder
import java.time.*

internal fun JSONArray.objects():List<JSONObject> = (0 until length()).mapNotNull { optJSONObject(it) }
internal fun JSONObject.array(name:String):JSONArray = optJSONArray(name) ?: JSONArray().also{put(name,it)}
internal fun JSONObject.obj(name:String):JSONObject = optJSONObject(name) ?: JSONObject().also{put(name,it)}
class SyncConflict(message:String):Exception(message)

/** Altera somente campos conhecidos, sobre a cópia MAIS RECENTE lida na transação.
 * Nenhum modelo parcial de tela é serializado como substituto do estado do site. */
object StateCompat {
    fun empty():JSONObject = JSONObject().put("versao",2).put("planos",JSONArray()).put("config",JSONObject())
        .put("sessoes",JSONArray()).put("revisoes",JSONArray()).put("simulados",JSONArray()).put("flashcards",JSONArray()).put("agenda",JSONArray()).put("editais",JSONArray())
    fun generation(json:String) = JSONObject(json).optJSONObject("config")?.optString("syncGeneration").orEmpty()
    private fun encoded(s:String)=URLEncoder.encode(s,"UTF-8").replace("+","%20").replace("%21","!").replace("%27","'").replace("%28","(").replace("%29",")").replace("%7E","~")
    private fun deleted(s:JSONObject,type:String,plan:String,id:String)=s.obj("config").obj("entidadesExcluidas").optBoolean("$type:$plan:${encoded(id)}")
    private fun removed(s:JSONObject,id:String)=s.obj("config").array("removidos").let{a->(0 until a.length()).any{a.optString(it)==id}}
    private fun field(o:JSONObject,key:String,value:Any,now:String){
        if(o.opt(key)==value)return
        val clocks=o.obj("camposAtualizados");val revision=clocks.optJSONObject(key)?.optLong("rev")?:0
        o.put(key,value).put("atualizadoEm",now);clocks.put(key,JSONObject().put("rev",revision+1).put("em",now))
    }
    fun apply(json:String, mutations:List<PendingMutation>, force:Boolean=false):String {
        val s=JSONObject(json)
        require(s.optInt("versao",2)==2 && s.optJSONArray("planos")!=null){"Abra o site uma vez para atualizar o formato deste histórico."}
        val generation=s.obj("config").optString("syncGeneration")
        mutations.sortedWith(compareBy<PendingMutation>{if(it.kind=="plan")0 else 1}.thenBy{it.createdAt}.thenBy{it.id}).forEach { m ->
            if(!force&&m.generation.isNotEmpty()&&generation!=m.generation&&generation.startsWith("principal-"))throw SyncConflict("A versão principal mudou no site. Revise as alterações locais antes de reenviá-las.")
            val p=JSONObject(m.payload);val now=Instant.ofEpochMilli(m.createdAt).toString()
            if(m.kind=="plan") {
                val entry=p.getJSONObject("entry");val id=entry.getString("id")
                if(s.obj("config").obj("planosExcluidos").has(id))throw SyncConflict("Este plano foi excluído no site. Os registros locais foram preservados.")
                if(s.array("planos").objects().none{it.optString("id")==id}){
                    s.array("planos").put(entry)
                    p.optJSONArray("agenda")?.objects()?.forEach{block->if(!removed(s,block.optString("id"))&&!deleted(s,"agenda",id,block.optString("id")))s.array("agenda").put(block)}
                }
                if(s.isNull("planoAtivoId"))s.put("planoAtivoId",id)
            } else {
                val planId=p.getString("planId");val topicId=p.getString("topicId")
                val plan=s.array("planos").objects().find{it.optString("id")==planId}
                    ?: throw SyncConflict("O plano deste registro não existe mais no site. O registro continua salvo no aparelho.")
                if(s.obj("config").obj("planosExcluidos").has(planId))throw SyncConflict("Este plano foi excluído no site.")
                val disc=plan.array("disciplinas").objects().find{d->d.array("topicos").objects().any{it.optString("id")==topicId}}
                    ?: throw SyncConflict("O tópico foi removido do edital. Revise o registro local.")
                val topic=disc.array("topicos").objects().first{it.optString("id")==topicId}
                if(topic.optBoolean("removidoDoEdital")||topic.optBoolean("orfao"))throw SyncConflict("Este tópico não pertence mais ao edital ativo.")
                if(deleted(s,"disc",planId,disc.getString("id"))||deleted(s,"top",planId,topicId))throw SyncConflict("Este tópico foi excluído no site. A sincronização não vai recriá-lo.")
                when(m.kind) {
                    "session" -> {
                        val session=p.getJSONObject("session");val id=session.getString("id")
                        if(!removed(s,id)&&s.array("sessoes").objects().none{it.optString("id")==id}){
                            require(session.optDouble("duracaoMin")>0&&session.optInt("qCertas") in 0..session.optInt("qFeitas"))
                            session.put("atualizadoEm",now);s.array("sessoes").put(session)
                            if(p.optBoolean("completed")&&topic.optString("status")!="dominado"){
                                field(topic,"status","teoria_concluida",now)
                                val revisions=s.array("revisoes")
                                if(plan.obj("plano").optBoolean("sugestoesRevisao",true)&&revisions.objects().none{it.optString("planoId")==planId&&it.optString("topicoId")==topicId}){
                                    val base=LocalDate.parse(session.getString("data"))
                                    val scheme=s.obj("config").optJSONObject("revisaoEsquema");val custom=scheme?.optString("modo")=="custom"
                                    val days=if(custom)scheme?.optJSONArray("dias")?.let{a->(0 until a.length()).map{a.optInt(it)}.filter{it in 1..1095}.sorted()}.orEmpty().ifEmpty{listOf(1,3,7,14,30)} else listOf(1,3,7,14,30)
                                    days.forEach{day->val type=if(day==1&&!custom)"24h" else "${day}d";val rid="rev-$topicId-$type-$base"
                                        if(!removed(s,rid))revisions.put(JSONObject().put("id",rid).put("planoId",planId).put("topicoId",topicId).put("tipo",type).put("dataAgendada",base.plusDays(day.toLong()).toString()).put("dataConcluida",JSONObject.NULL).put("resultadoPct",JSONObject.NULL).put("pontaCurva",day==days.last()).put("atualizadoEm",now))
                                    }
                                }
                            }else if(topic.optString("status","pendente")=="pendente")field(topic,"status","em_curso",now)
                            topic.put("atualizadoEm",now)
                            val minutes=session.getDouble("duracaoMin");val date=session.getString("data")
                            val agenda=s.array("agenda")
                            val type=session.optString("tipo")
                            val block=agenda.objects().filter{it.optString("planoId")==planId&&it.optString("data")==date&&(it.optString("topicoId")==topicId||it.optString("disciplinaId")==disc.getString("id"))&&!it.optBoolean("feito")&&it.optDouble("feitoMin",0.0)<it.optDouble("duracaoMin",1.0)-0.5&&!removed(s,it.optString("id"))&&(it.optString("obs") !in listOf("teoria","questoes","revisao")||it.optString("obs")==type)}.sortedWith(compareBy<JSONObject>{if(it.optString("obs")==type)0 else 1}.thenBy{if(it.optString("topicoId")==topicId)0 else 1}.thenByDescending{it.optDouble("duracaoMin",0.0)-it.optDouble("feitoMin",0.0)}).firstOrNull()
                            if(block!=null){val total=block.optDouble("feitoMin",0.0)+minutes;block.put("feitoMin",total).put("feito",total>=block.optDouble("duracaoMin",0.0)-0.5).put("topicoId",topicId).put("atualizadoEm",now)}
                            else {val aid="android-agd-$id";if(!deleted(s,"agenda",planId,aid)&&!removed(s,aid))agenda.put(JSONObject().put("id",aid).put("planoId",planId).put("disciplinaId",disc.getString("id")).put("topicoId",topicId).put("data",date).put("duracaoMin",minutes).put("feitoMin",minutes).put("feito",true).put("gerado",false).put("extra",true).put("obs",session.optString("tipo")).put("atualizadoEm",now))}
                            advanceCycle(plan,disc.getString("id"),minutes,id,now)
                            plan.put("atualizadoEm",now)
                        }
                    }
                    "link" -> {
                        val id=p.getString("linkId");val ls=plan.array("links");val old=ls.objects().find{it.optString("id")==id}
                        val url=p.optString("url")
                        if(!force && old!=null && old.optString("url")!=p.optString("beforeUrl")&&old.optString("url")!=url)throw SyncConflict("O link deste tópico também foi alterado no site. Escolha qual alteração manter.")
                        if(deleted(s,"link",planId,id)&&url.isNotBlank())throw SyncConflict("Este link foi excluído no site. Adicione outro link para evitar restaurar uma exclusão.")
                        val key="plano:${disc.getString("id")}:$topicId"
                        if(url.isBlank()){
                            plan.put("links",JSONArray(ls.objects().filter{it.optString("id")!=id}))
                            s.obj("config").obj("entidadesExcluidas").put("link:$planId:${encoded(id)}",true)
                        }else{
                            require(StudyRules.safeLink(url))
                            ls.objects().filter{it.optString("topicoChave")==key}.forEach{it.put("principal",false).put("atualizadoEm",now)}
                            val next=(old?:JSONObject()).put("id",id).put("tipo","trilha").put("topicoChave",key).put("url",url).put("nome","Questões de ${topic.optString("nome")}").put("principal",true).put("oculto",false).put("atualizadoEm",now)
                            if(old==null)ls.put(next)
                        }
                        plan.put("atualizadoEm",now)
                    }
                    else -> error("Alteração não suportada nesta versão do aplicativo.")
                }
            }
        }
        return s.toString()
    }
    private fun advanceCycle(plan:JSONObject,discipline:String,minutes:Double,sessionId:String,now:String){
        val meta=plan.obj("plano");if(meta.optString("modoPlanejamento")!="ciclo")return
        val cycle=meta.optJSONObject("ciclo")?:return;val blocks=cycle.array("blocos").objects();var left=kotlin.math.floor(minutes+0.5).toInt()
        var iteration=0
        while(left>0&&iteration++<10000){
            val round=cycle.optInt("volta",1)
            val active=blocks.filter{it.optInt("voltaInicio",1)<=round}
            val target=active.firstOrNull{it.optString("disciplinaId")==discipline&&it.optInt("feitoMin")<it.optInt("metaMin")}?:break
            val before=target.optInt("feitoMin");val credit=minOf(left,target.optInt("metaMin")-before);if(credit<=0)break
            val ledger=target.optJSONObject("creditosCiclo")?:JSONObject().put("reset",0).put("baseMin",before).put("eventos",JSONObject()).also{target.put("creditosCiclo",it)}
            ledger.obj("eventos").put("android-$sessionId-$iteration",credit);field(target,"feitoMin",before+credit,now);left-=credit
            if(active.none{it.optInt("feitoMin")<it.optInt("metaMin")}){blocks.forEach{field(it,"feitoMin",0,now);it.put("creditosCiclo",JSONObject().put("reset",it.optJSONObject("creditosCiclo")?.optInt("reset",0)?.plus(1)?:1).put("baseMin",0).put("eventos",JSONObject()))};cycle.put("volta",round+1)}
        }
    }
    fun chunks(text:String):List<String> {
        val result=mutableListOf<String>();var start=0
        while(start<text.length){var end=minOf(start+180000,text.length);if(end<text.length&&Character.isHighSurrogate(text[end-1])&&Character.isLowSurrogate(text[end]))end--
            val part=text.substring(start,end);require(part.toByteArray(Charsets.UTF_8).size<=700*1024);result+=part;start=end
        }
        require(result.size<=24){"O histórico ultrapassa o limite de sincronização. Exporte um backup no site."}
        return result.ifEmpty{listOf("")}
    }
    fun summary(s:JSONObject)=mapOf("planos" to s.array("planos").length(),"registros" to listOf("sessoes","revisoes","simulados","flashcards").sumOf{s.array(it).length()})
    fun plans(json:String,catalog:List<Plan>):List<Plan> {
        val s=JSONObject(json)
        val enrolled=s.array("planos").objects().filter{!s.obj("config").obj("planosExcluidos").has(it.optString("id"))}.map{p->
            val meta=p.obj("plano");val origin=meta.optString("origemEditalId")
            val source=catalog.firstOrNull{it.id==origin||it.name==meta.optString("concurso")}
            Plan(p.getString("id"),meta.optString("concurso","Plano de estudos"),p.array("disciplinas").objects().filter{!deleted(s,"disc",p.getString("id"),it.optString("id"))}.map{d->
                Discipline(d.getString("id"),d.optString("nome"),d.array("topicos").objects().filter{!it.optBoolean("removidoDoEdital")&&!it.optBoolean("orfao")&&!deleted(s,"top",p.getString("id"),it.optString("id"))}.map{t->
                    val ref=source?.topics?.firstOrNull{it.id==t.optString("id")||it.name==t.optString("nome")}
                    val personal=p.array("links").objects().any{it.optString("tipo")=="trilha"&&it.optString("topicoChave")=="plano:${d.optString("id")}:${t.optString("id")}"}
                    Topic(t.getString("id"),t.optString("nome"),if(personal)null else ref?.link,if(personal)"Links pessoais deste tópico" else ref?.note?:"Adicione um link de questões para este tópico.",ref?.noQuestions?:false)
                })
            }.filter{it.topics.isNotEmpty()},origin,true,logoAsset=source?.logoAsset.orEmpty())
        }.filter{it.topics.isNotEmpty()}
        return enrolled+catalog.filter{c->enrolled.none{it.originId==c.id||it.name==c.name}}
    }
    fun sessions(json:String):List<Session>{val s=JSONObject(json);return s.array("sessoes").objects().filter{!removed(s,it.optString("id"))}.map{r->
        val registered=runCatching{Instant.parse(r.optString("registradoEm"))}.getOrNull()
        val studyDate=runCatching{LocalDate.parse(r.getString("data"))}.getOrNull()
        val ended=when{
            registered!=null&&(studyDate==null||registered.atZone(ZoneId.systemDefault()).toLocalDate()==studyDate)->registered.toEpochMilli()
            studyDate!=null->studyDate.atTime(12,0).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
            else->0L
        }
        val inferred=if(r.optString("planoId").isNotEmpty())r.optString("planoId") else s.array("planos").objects().filter{p->p.array("disciplinas").objects().any{d->d.array("topicos").objects().any{it.optString("id")==r.optString("topicoId")}}}.singleOrNull()?.optString("id").orEmpty()
        Session(r.getString("id"),r.optString("planoId").ifEmpty{inferred},r.optString("topicoId"),(r.optDouble("duracaoMin",0.0)*60).toLong(),r.optInt("qFeitas"),r.optInt("qCertas"),ended)
    }.sortedByDescending{it.endedAt}}
    fun progress(json:String):List<Progress> = JSONObject(json).array("planos").objects().flatMap{p->p.array("disciplinas").objects().flatMap{d->d.array("topicos").objects().filter{it.optString("status") in listOf("teoria_concluida","dominado")}.map{Progress(p.getString("id"),it.getString("id"),true)}}}
    fun links(json:String):List<PersonalLink> = JSONObject(json).array("planos").objects().flatMap{p->
        p.array("disciplinas").objects().flatMap{d->d.array("topicos").objects().mapNotNull{t->
            p.array("links").objects().filter{it.optString("tipo")=="trilha"&&it.optString("topicoChave")=="plano:${d.optString("id")}:${t.optString("id")}"&&!it.optBoolean("oculto")&&StudyRules.safeLink(it.optString("url"))}.sortedByDescending{it.optBoolean("principal")}.firstOrNull()?.let{PersonalLink(p.getString("id"),t.getString("id"),it.getString("url"))}
        }}
    }
}
