package br.com.gabaritei.piloto

import org.json.JSONObject
import org.json.JSONArray

data class HomeArrangement(val order:List<String>,val hidden:Set<String>){val visible get()=order.filter{it !in hidden}}
object HomeLayouts {
    val labels=linkedMapOf("quote" to "Frase do dia","study" to "Planejamento do dia","metrics" to "Desempenho e progresso","achievements" to "Conquistas","constancy" to "Constância","goals" to "Metas semanais","reviews" to "Revisões pendentes")
    val defaults get()=HomeArrangement(labels.keys.toList(),emptySet())
    private fun strings(a:JSONArray?)=(0 until(a?.length()?:0)).mapNotNull{a?.opt(it) as? String}.filter{it.length in 1..40}.distinct().take(32)
    fun read(raw:String):HomeArrangement{
        val o=runCatching{JSONObject(raw).obj("config").optJSONObject("inicioLayout")}.getOrNull()
        return HomeArrangement((strings(o?.optJSONArray("ordem")).filter{it in labels}+labels.keys).distinct(),strings(o?.optJSONArray("ocultos")).filter{it in labels}.toSet())
    }
    fun content(o:JSONObject?):String=JSONArray().put(JSONArray(strings(o?.optJSONArray("ordem")))).put(JSONArray(strings(o?.optJSONArray("ocultos")).sorted())).toString()
    fun payload(raw:String,value:HomeArrangement):JSONObject{
        val current=JSONObject(raw).obj("config").optJSONObject("inicioLayout")
        val futureOrder=strings(current?.optJSONArray("ordem")).filter{it !in labels}
        val futureHidden=strings(current?.optJSONArray("ocultos")).filter{it !in labels}
        return JSONObject().put("before",content(current)).put("layout",JSONObject().put("ordem",JSONArray((value.order.filter{it in labels}+labels.keys+futureOrder).distinct())).put("ocultos",JSONArray((value.hidden.filter{it in labels}+futureHidden).distinct().sorted())))
    }
    fun apply(root:JSONObject,payload:JSONObject,now:String,force:Boolean){
        val config=root.obj("config");val previous=config.optJSONObject("inicioLayout");val wanted=payload.getJSONObject("layout")
        require(wanted.optJSONArray("ordem")!=null&&wanted.optJSONArray("ocultos")!=null)
        if(content(wanted)==content(previous))return
        if(!force&&payload.optString("before")!=content(previous))throw SyncConflict("A tela inicial foi alterada em outro aparelho. Revise o layout antes de reaplicar.")
        val next=JSONObject(previous?.toString()?:"{}")
        next.put("ordem",wanted.getJSONArray("ordem")).put("ocultos",wanted.getJSONArray("ocultos")).put("rev",(previous?.optLong("rev")?:0)+1).put("em",now)
        config.put("inicioLayout",next)
    }
}
