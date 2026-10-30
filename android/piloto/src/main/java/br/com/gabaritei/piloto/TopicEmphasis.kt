package br.com.gabaritei.piloto

import org.json.JSONObject

/** Priority is pedagogical, never evidence of historical question frequency. */
object TopicEmphasis {
    fun priorities(plan:Plan):Set<String>{
        val details=runCatching{JSONObject(plan.details)}.getOrNull()?:return emptySet()
        val current=plan.topics.map{it.id}.toSet()
        return details.array("disciplinas").objects().flatMap{it.array("topicos").objects()}
            .filter{it.optInt("prioridade",0)==1&&it.optString("id") in current}.map{it.optString("id")}.toSet()
    }
}
