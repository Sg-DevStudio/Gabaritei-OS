package br.com.gabaritei.piloto

import org.json.JSONObject
import org.json.JSONArray
import org.junit.Assert.*
import org.junit.Test

class NotebookLinksTest {
    private val topic=Topic("t","Crase","https://questoes.grancursosonline.com.br/questoes?assunto=42&banca=1,2","")
    private val plan=Plan("p","Concurso",listOf(Discipline("d","Português",listOf(topic))),enrolled=true)
    private fun state()=StateCompat.empty().put("planos",JSONArray().put(JSONObject().put("id","p").put("plano",JSONObject().put("concurso","Concurso")).put("disciplinas",JSONArray().put(JSONObject().put("id","d").put("nome","Português").put("topicos",JSONArray().put(JSONObject().put("id","t").put("nome","Crase"))))).put("links",JSONArray())))
    private fun op(id:String,url:String,before:String="",name:String="")=PendingMutation("op-$id-$url","link",JSONObject().put("planId","p").put("topicId","t").put("linkId",id).put("url",url).put("beforeUrl",before).put("name",name).put("makePrimary",false).put("keepEmpty",true).toString(),"",1000)
    @Test fun keyboardCapitalizationDoesNotAlterFilters(){
        val url=" Https://questoes.grancursosonline.com.br/questoes?assunto=42%2C43&banca=1,2#x "
        assertEquals("https://questoes.grancursosonline.com.br/questoes?assunto=42%2C43&banca=1,2#x",NotebookLinks.cleanUrl(url))
        assertTrue(StudyRules.safeLink(NotebookLinks.cleanUrl(url)))
        assertFalse(StudyRules.safeLink(NotebookLinks.cleanUrl("javascript:alert(1)")))
    }
    @Test fun defaultAndLegacyUrlsRemainUsableWithoutMigration(){
        val raw=state().toString()
        assertEquals(topic.link,NotebookLinks.available(raw,plan,topic).single().url)
        assertEquals("https://example.com/legacy",NotebookLinks.available(raw,plan,topic,listOf(PersonalLink("p","t","https://example.com/legacy"))).single().url)
    }
    @Test fun allPlatformsAreKeptButRepeatedUrlsNeedOnlyOneChoice(){
        val s=StateCompat.apply(state().toString(),listOf(op("gran",topic.link!!),op("notebook","https://notebooklm.google.com/notebook/x"),op("duplicate",topic.link!!)).mapIndexed{i,op->op.copy(createdAt=1000L+i)})
        assertEquals(3,NotebookLinks.entries(s,plan,topic).size)
        val choices=NotebookLinks.available(s,plan,topic)
        assertEquals(listOf("Gran Questões","NotebookLM"),choices.map{it.platform})
        val rows=NotebookLinks.rows(s,plan,topic)
        assertTrue(rows.first().getBoolean("principal"));assertFalse(rows[1].getBoolean("principal"))
        System.getenv("GABARITEI_NOTEBOOK_FIXTURE_OUT")?.let{java.io.File(it).writeText(s)}
    }
    @Test fun editingOneLinkKeepsOtherPlatformsAndUnknownMetadata(){
        val s=JSONObject(StateCompat.apply(state().toString(),listOf(op("gran",topic.link!!),op("tec","https://tecconcursos.com.br/cadernos/a"))))
        s.array("planos").getJSONObject(0).array("links").getJSONObject(0).put("future",99)
        val edited=StateCompat.apply(s.toString(),listOf(op("tec","https://tecconcursos.com.br/cadernos/b","https://tecconcursos.com.br/cadernos/a","Meu caderno")))
        assertEquals(topic.link,NotebookLinks.available(edited,plan,topic).first().url)
        assertEquals(99,NotebookLinks.rows(edited,plan,topic).first().getInt("future"))
        assertEquals("Meu caderno",NotebookLinks.available(edited,plan,topic).last().label)
    }
    @Test fun removingLastLinkDoesNotResurrectDefaultOrLegacy(){
        val initial=StateCompat.apply(state().toString(),listOf(op("gran",topic.link!!)))
        val deleted=StateCompat.apply(initial,listOf(op("gran","",topic.link!!)))
        assertTrue(NotebookLinks.available(deleted,plan,topic,listOf(PersonalLink("p","t","https://old.example"))).isEmpty())
        assertThrows(SyncConflict::class.java){StateCompat.apply(deleted,listOf(op("gran",topic.link!!)),true)}
        val added=StateCompat.apply(deleted,listOf(op("new","https://qconcursos.com/questoes")))
        assertEquals("Qconcursos",NotebookLinks.available(added,plan,topic).single().platform)
    }
    @Test fun hiddenUnsafeAndDeletedLinksCannotBeOpened(){
        val s=state();val links=s.array("planos").getJSONObject(0).array("links")
        listOf("hidden","unsafe","deleted").forEach{id->links.put(JSONObject().put("id",id).put("tipo","trilha").put("topicoChave","plano:d:t").put("url",if(id=="unsafe")"javascript:alert(1)"else"https://example.com/$id").put("oculto",id=="hidden"))}
        s.obj("config").obj("entidadesExcluidas").put("link:p:deleted",true)
        assertTrue(NotebookLinks.available(s.toString(),plan,topic).isEmpty())
    }
    @Test fun siteRenameAndHideAreNotSilentlyOverwritten(){
        val original=StateCompat.apply(state().toString(),listOf(op("one","https://example.com","","Original")))
        val changed=JSONObject(original);val row=changed.array("planos").getJSONObject(0).array("links").getJSONObject(0)
        row.put("nome","Outro aparelho")
        val mutation=op("one","https://example.com","https://example.com","Novo").let{it.copy(payload=JSONObject(it.payload).put("beforeName","Original").toString())}
        assertThrows(SyncConflict::class.java){StateCompat.apply(changed.toString(),listOf(mutation))}
        row.put("nome","Original").put("oculto",true)
        assertThrows(SyncConflict::class.java){StateCompat.apply(changed.toString(),listOf(mutation))}
    }
    @Test fun sameLinkIdCannotAlterAnotherTopic(){
        val s=JSONObject(StateCompat.apply(state().toString(),listOf(op("foreign","https://example.com"))))
        s.array("planos").getJSONObject(0).array("links").getJSONObject(0).put("topicoChave","plano:other:other")
        assertThrows(SyncConflict::class.java){StateCompat.apply(s.toString(),listOf(op("foreign","https://new.example","https://example.com")))}
    }
}
