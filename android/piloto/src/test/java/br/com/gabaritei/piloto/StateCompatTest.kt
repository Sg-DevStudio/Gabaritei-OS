package br.com.gabaritei.piloto

import org.json.JSONObject
import org.json.JSONArray
import org.junit.Assert.*
import org.junit.Test

class StateCompatTest {
    private fun state():String=JSONObject().put("versao",2).put("config",JSONObject().put("rev",8).put("syncGeneration","principal-original").put("metaDesconhecida","preservada"))
        .put("planos",JSONArray().put(JSONObject().put("id","pl-real").put("plano",JSONObject().put("concurso","Plano real").put("campoFuturo",99))
            .put("disciplinas",JSONArray().put(JSONObject().put("id","D1").put("nome","Direito").put("topicos",JSONArray().put(JSONObject().put("id","T1").put("nome","Assunto").put("status","pendente").put("camposAtualizados",JSONObject().put("status",JSONObject().put("rev",4).put("em","2026-10-01T00:00:00Z"))).put("futuro","não apagar"))))).put("links",JSONArray())))
        .put("sessoes",JSONArray()).put("agenda",JSONArray()).put("revisoes",JSONArray()).put("simulados",JSONArray().put(JSONObject().put("id","sim-antigo").put("dadosExtras",true))).put("flashcards",JSONArray().put(JSONObject().put("id","deck-antigo").put("cards",JSONArray()))).put("outraRaiz",JSONObject().put("valor",true)).toString()
    private fun session(id:String="ses-android",completed:Boolean=true)=PendingMutation(id,"session",JSONObject().put("planId","pl-real").put("topicId","T1").put("completed",completed).put("session",JSONObject().put("id",id).put("planoId","pl-real").put("topicoId","T1").put("data","2026-10-29").put("registradoEm","2026-10-29T15:00:00Z").put("tipo","teoria").put("duracaoMin",30).put("qFeitas",10).put("qCertas",8)).toString(),"principal-original",1793286000000)
    private fun topic(s:JSONObject)=s.getJSONArray("planos").getJSONObject(0).getJSONArray("disciplinas").getJSONObject(0).getJSONArray("topicos").getJSONObject(0)
    @Test fun retroactiveStudyUsesStudyDateInsteadOfRegistrationDate(){
        val s=JSONObject(StateCompat.apply(state(),listOf(session())))
        s.getJSONArray("sessoes").getJSONObject(0).put("data","2026-10-20")
        val day=java.time.Instant.ofEpochMilli(StateCompat.sessions(s.toString()).single().endedAt).atZone(java.time.ZoneId.systemDefault()).toLocalDate()
        assertEquals(java.time.LocalDate.parse("2026-10-20"),day)
    }
    @Test fun recordsPreserveUnknownFieldsAndAreIdempotent(){
        val once=StateCompat.apply(state(),listOf(session()))
        val twice=JSONObject(StateCompat.apply(once,listOf(session())))
        assertEquals(1,twice.getJSONArray("sessoes").length());assertEquals(1,twice.getJSONArray("agenda").length());assertEquals(5,twice.getJSONArray("revisoes").length())
        assertEquals("não apagar",topic(twice).getString("futuro"));assertTrue(twice.getJSONObject("outraRaiz").getBoolean("valor"))
        assertEquals("preservada",twice.getJSONObject("config").getString("metaDesconhecida"));assertEquals(1,twice.getJSONArray("simulados").length())
        assertEquals(5,topic(twice).getJSONObject("camposAtualizados").getJSONObject("status").getInt("rev"))
        assertEquals("teoria_concluida",topic(twice).getString("status"))
        System.getenv("GABARITEI_FIXTURE_OUT")?.let{java.io.File(it).writeText(twice.toString())}
    }
    @Test fun concurrentIndependentSessionsAccumulate(){
        val first=StateCompat.apply(state(),listOf(session("one")))
        val merged=JSONObject(StateCompat.apply(first,listOf(session("two"))))
        assertEquals(2,merged.getJSONArray("sessoes").length());assertEquals(5,merged.getJSONArray("revisoes").length())
        assertEquals(60L,StateCompat.sessions(merged.toString()).sumOf{it.seconds}/60)
    }
    @Test fun deletionsNeverResurrect(){
        val s=JSONObject(state());s.getJSONObject("config").put("removidos",JSONArray().put("ses-android"))
        assertEquals(0,JSONObject(StateCompat.apply(s.toString(),listOf(session()))).getJSONArray("sessoes").length())
        s.getJSONObject("config").put("planosExcluidos",JSONObject().put("pl-real","2026-10-29"))
        assertThrows(SyncConflict::class.java){StateCompat.apply(s.toString(),listOf(session()),true)}
    }
    @Test fun changedPrincipalRequiresExplicitResolution(){
        val s=JSONObject(state());s.getJSONObject("config").put("syncGeneration","principal-new")
        assertThrows(SyncConflict::class.java){StateCompat.apply(s.toString(),listOf(session()))}
        assertEquals(1,JSONObject(StateCompat.apply(s.toString(),listOf(session()),true)).getJSONArray("sessoes").length())
    }
    @Test fun differentLinkChangesAreNotSilentlyOverwritten(){
        val s=JSONObject(state());s.getJSONArray("planos").getJSONObject(0).getJSONArray("links").put(JSONObject().put("id","link-1").put("url","https://changed.example").put("tipo","trilha").put("topicoChave","plano:D1:T1"))
        val op=PendingMutation("link-op","link",JSONObject().put("planId","pl-real").put("topicId","T1").put("linkId","link-1").put("beforeUrl","https://original.example").put("url","https://new.example").toString(),"principal-original",1793286000000)
        assertThrows(SyncConflict::class.java){StateCompat.apply(s.toString(),listOf(op))}
        assertEquals("https://new.example",StateCompat.links(StateCompat.apply(s.toString(),listOf(op),true)).single().url)
    }
    @Test fun unicodeChunksRoundTripWithoutBreakingSurrogates(){
        val text="a".repeat(179999)+"🙂"+"á".repeat(200000)
        val parts=StateCompat.chunks(text);assertEquals(text,parts.joinToString(""));assertTrue(parts.all{it.length<=180000&&!Character.isHighSurrogate(it.last())})
        assertThrows(IllegalArgumentException::class.java){StateCompat.chunks("a".repeat(180000*24+1))}
    }
    @Test fun customRevisionSchemeAndExistingAgendaAreRespected(){
        val s=JSONObject(state());s.getJSONObject("config").put("revisaoEsquema",JSONObject().put("modo","custom").put("dias",JSONArray(listOf(2,9,21))))
        s.getJSONArray("agenda").put(JSONObject().put("id","planned").put("planoId","pl-real").put("topicoId","T1").put("disciplinaId","D1").put("data","2026-10-29").put("duracaoMin",60).put("feitoMin",10).put("feito",false).put("obs","teoria"))
        val next=JSONObject(StateCompat.apply(s.toString(),listOf(session())))
        assertEquals(1,next.getJSONArray("agenda").length());assertEquals(40,next.getJSONArray("agenda").getJSONObject(0).getInt("feitoMin"));assertFalse(next.getJSONArray("agenda").getJSONObject(0).getBoolean("feito"))
        assertEquals(3,next.getJSONArray("revisoes").length());assertEquals("2d",next.getJSONArray("revisoes").getJSONObject(0).getString("tipo"))
    }
    @Test fun removedPersonalLinksDoNotFallBackToCatalog(){
        val s=JSONObject(state());s.getJSONArray("planos").getJSONObject(0).getJSONArray("links").put(JSONObject().put("id","hidden").put("tipo","trilha").put("topicoChave","plano:D1:T1").put("oculto",true))
        val catalog=listOf(Plan("source","Plano real",listOf(Discipline("D1","Direito",listOf(Topic("T1","Assunto","https://example.com",""))))))
        assertNull(StateCompat.plans(s.toString(),catalog).first().topics.first().link)
    }
    @Test fun cycleCreditIsIdempotentAndKeepsMergeLedger(){
        val s=JSONObject(state());val meta=s.getJSONArray("planos").getJSONObject(0).getJSONObject("plano")
        meta.put("modoPlanejamento","ciclo").put("ciclo",JSONObject().put("volta",1).put("blocos",JSONArray().put(JSONObject().put("id","block").put("disciplinaId","D1").put("metaMin",60).put("feitoMin",10))))
        val once=StateCompat.apply(s.toString(),listOf(session()));val twice=JSONObject(StateCompat.apply(once,listOf(session())))
        val block=twice.getJSONArray("planos").getJSONObject(0).getJSONObject("plano").getJSONObject("ciclo").getJSONArray("blocos").getJSONObject(0)
        assertEquals(40,block.getInt("feitoMin"));assertEquals(1,block.getJSONObject("creditosCiclo").getJSONObject("eventos").length())
    }
}
