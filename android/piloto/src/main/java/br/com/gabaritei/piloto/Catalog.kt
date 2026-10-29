package br.com.gabaritei.piloto

import android.content.Context
import org.json.JSONObject
import org.json.JSONArray

/** Catálogo público separado do histórico pessoal. Atualizações não reescrevem planos iniciados. */
object Catalog {
    private val legacy=setOf("carreira-trf-tjaa","carreira-trt-tjaa")
    fun bundled(context:Context):List<Plan> = parse(JSONObject(context.assets.open("catalog.json").bufferedReader().use{it.readText()}).getJSONArray("plans"),true)
    fun load(context:Context):List<Plan> {
        val base=bundled(context)
        val cached=runCatching{java.io.File(context.filesDir,"catalog-public.json").takeIf{it.isFile}?.readText()?.let{JSONArray(it)}}.getOrNull()?:return base
        return merge(base,cached)
    }
    fun parse(rows:JSONArray,native:Boolean=false):List<Plan> = rows.objects().mapNotNull{p->runCatching{
        val base=if(native)p.getJSONObject("webBase")else p
        val id=base.getString("id");require(id.isNotBlank()&&id.length<=240)
        if(id in legacy||base.optBoolean("excluidoDoCatalogo"))return@runCatching null
        val source=JSONObject(base.toString());val ds=source.array("disciplinas").objects().map{d->Discipline(d.getString("id"),d.optString("nome"),d.array("topicos").objects().filter{!it.optBoolean("removidoDoEdital")&&!it.optBoolean("orfao")}.map{t->
            val ref=if(native)p.array("disciplines").objects().flatMap{it.array("topics").objects()}.find{it.optString("id")==t.optString("id")}else null
            Topic(t.getString("id"),t.optString("nome"),ref?.optString("link")?.takeIf{StudyRules.safeLink(it)},ref?.optString("note").orEmpty(),ref?.optBoolean("noQuestions")?:false)
        },d.optString("cor","#3B82F6"))}
        Plan(id,source.optString("titulo","Plano de estudos"),ds,logoAsset=if(native)p.optString("logoAsset")else "",details=source.toString())
    }.getOrNull()}
    fun merge(base:List<Plan>,rows:JSONArray,personal:Boolean=false):List<Plan>{
        val removed=rows.objects().filter{it.optBoolean("excluidoDoCatalogo")}.map{it.optString("id")}.toSet()
        val result=base.associateBy{it.id}.toMutableMap()
        parse(rows).forEach{incoming->val old=result[incoming.id]
            val oldMeta=old?.let{JSONObject(it.details)};val meta=JSONObject(incoming.details)
            if(old==null||personal||meta.optString("atualizadoEm")>=oldMeta!!.optString("atualizadoEm")){
                val topics=old?.topics.orEmpty().associateBy{it.id}
                result[incoming.id]=incoming.copy(logoAsset=old?.logoAsset.orEmpty(),disciplines=incoming.disciplines.map{d->d.copy(topics=d.topics.map{t->
                    val ref=topics[t.id]?.takeIf{it.name==t.name};if(ref==null)t else t.copy(link=ref.link,note=ref.note,noQuestions=ref.noQuestions)
                })})
            }
        }
        return result.values.filter{it.id !in removed}
    }
    fun personal(catalog:List<Plan>,raw:String)=merge(catalog,JSONObject(raw).array("editais"),true)
    fun base(plan:Plan)=JSONObject(plan.details).also{require(it.optJSONArray("disciplinas")!=null){"Os detalhes deste plano não estão disponíveis. Atualize o catálogo."}}
}
