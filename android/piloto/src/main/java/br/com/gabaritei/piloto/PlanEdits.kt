package br.com.gabaritei.piloto

import org.json.JSONArray
import org.json.JSONObject

/** Edições da instância do aluno. Nunca altera o catálogo compartilhado. */
object PlanEdits {
    private fun set(row:JSONObject,key:String,value:Any,now:String){
        if(row.opt(key)==value)return
        val clocks=row.obj("camposAtualizados");val rev=clocks.optJSONObject(key)?.optLong("rev")?:0
        row.put(key,value).put("atualizadoEm",now);clocks.put(key,JSONObject().put("rev",rev+1).put("em",now))
    }
    private fun name(p:JSONObject)=p.getString("name").trim().also{require(it.length in 1..240){"Informe um nome de até 240 caracteres."}}
    fun apply(state:JSONObject,p:JSONObject,now:String,force:Boolean){
        val id=p.getString("planId")
        val plan=state.array("planos").objects().find{it.optString("id")==id}?:throw SyncConflict("Este plano não está mais disponível.")
        if(state.obj("config").obj("planosExcluidos").has(id))throw SyncConflict("O plano foi excluído no site.")
        val ds=plan.array("disciplinas")
        val action=p.getString("action")
        if(action=="add-discipline"){
            val did=p.getString("disciplineId")
            if(ds.objects().none{it.optString("id")==did})ds.put(JSONObject().put("id",did).put("nome",name(p)).put("peso",1).put("cor",p.optString("color","#3B82F6")).put("planejamentoStatus","active").put("ordem",ds.length()).put("topicos",JSONArray().put(JSONObject().put("id",p.getString("newTopicId")).put("nome","Estudo geral").put("status","pendente").put("horas_estimadas",1).put("incidencia_pct",0))).put("atualizadoEm",now))
        }else if(action=="order"){
            val ids=p.getJSONArray("ids");val order=(0 until ids.length()).map{ids.getString(it)}.distinct()
            val rows=ds.objects();val sorted=order.mapNotNull{key->rows.find{it.optString("id")==key}}+rows.filter{it.optString("id") !in order}
            sorted.forEachIndexed{i,d->set(d,"ordem",i,now)};plan.put("disciplinas",JSONArray(sorted))
        }else if(action=="cycle-block"){
            val block=plan.obj("plano").obj("ciclo").array("blocos").objects().find{it.optString("id")==p.optString("blockId")}?:throw SyncConflict("A etapa do ciclo foi removida.")
            val minutes=p.getInt("minutes");require(minutes in 1..720)
            set(block,"metaMin",minutes,now)
        }else if(action=="agenda"){
            val block=state.array("agenda").objects().find{it.optString("id")==p.optString("blockId")&&it.optString("planoId")==id}?:throw SyncConflict("Este bloco foi removido.")
            require(!block.optBoolean("feito")){"Este estudo já foi concluído."}
            val minutes=p.getInt("minutes");require(minutes in 1..720){"Informe de 1 a 720 minutos."}
            set(block,"duracaoMin",minutes,now)
        }else{
            val did=p.getString("disciplineId")
            if(state.obj("config").obj("entidadesExcluidas").has("disc:$id:${StateCompat.encoded(did)}"))throw SyncConflict("A disciplina foi excluída no site.")
            val d=ds.objects().find{it.optString("id")==did}?:throw SyncConflict("Esta disciplina foi removida.")
            if(action=="discipline"){
                if(p.has("name")){
                    if(!force&&p.has("beforeName")&&d.optString("nome")!=p.optString("beforeName")&&d.optString("nome")!=name(p))throw SyncConflict("O nome da disciplina mudou no site. Revise antes de reaplicar.")
                    set(d,"nome",name(p),now)
                }
                if(p.has("color")){val color=p.getString("color");require(Regex("#[0-9a-fA-F]{6}").matches(color));set(d,"cor",color,now)}
                if(p.has("paused"))set(d,"planejamentoStatus",if(p.getBoolean("paused"))"paused" else "active",now)
                if(p.has("archived")){set(d,"androidArquivada",p.getBoolean("archived"),now);set(d,"planejamentoStatus",if(p.getBoolean("archived"))"paused" else "active",now)}
            }else if(action=="topic"){
                val tid=p.getString("topicId");val ts=d.array("topicos")
                val old=ts.objects().find{it.optString("id")==tid}
                if(state.obj("config").obj("entidadesExcluidas").has("top:$id:${StateCompat.encoded(tid)}"))throw SyncConflict("Este tópico foi excluído no site.")
                val t=old?:JSONObject().put("id",tid).put("status","pendente").put("horas_estimadas",1).put("incidencia_pct",0)
                if(old==null){require(p.optBoolean("new")){"O tópico foi removido."};ts.put(t)}
                if(p.has("name")){
                    if(!force&&old!=null&&p.has("beforeName")&&old.optString("nome")!=p.optString("beforeName")&&old.optString("nome")!=name(p))throw SyncConflict("O nome do tópico mudou no site.")
                    set(t,"nome",name(p),now)
                }
                if(p.has("archived"))set(t,"androidArquivado",p.getBoolean("archived"),now)
            }else error("Edição não suportada.")
        }
        plan.put("atualizadoEm",now)
    }
}
