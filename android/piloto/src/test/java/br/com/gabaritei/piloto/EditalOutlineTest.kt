package br.com.gabaritei.piloto

import org.json.JSONObject
import org.json.JSONArray
import org.junit.Assert.*
import org.junit.Test

class EditalOutlineTest {
    private val base=Plan("p","Plano",listOf(Discipline("d","Direito",listOf(Topic("t","Tema","https://example.com","")))))
    private fun raw():JSONObject=StateCompat.empty().put("planos",JSONArray().put(JSONObject().put("id","p").put("plano",JSONObject()).put("disciplinas",JSONArray().put(JSONObject().put("id","d").put("nome","Direito").put("ordem",1).put("topicos",JSONArray().put(JSONObject().put("id","t").put("nome","Tema")).put(JSONObject().put("id","archived").put("nome","Ainda pertence ao edital").put("androidArquivado",true)))))))
    @Test fun fullOutlineIncludesArchivedRoutineItemsWithoutChangingSource(){
        val state=raw();val before=state.toString();val outline=EditalOutline.read(base,state.toString())
        assertEquals(listOf("t","archived"),outline.topics.map{it.id});assertEquals("Arquivado na rotina",outline.topics.last().note)
        assertEquals(before,state.toString());assertEquals(1,base.topics.size)
    }
    @Test fun removedOrphanedAndDeletedTopicsNeverReappear(){
        val s=raw();val d=s.array("planos").getJSONObject(0).array("disciplinas").getJSONObject(0)
        d.array("topicos").put(JSONObject().put("id","orphan").put("orfao",true)).put(JSONObject().put("id","removed").put("removidoDoEdital",true))
        s.obj("config").obj("entidadesExcluidas").put("top:p:archived",true)
        assertEquals(listOf("t"),EditalOutline.read(base,s.toString()).topics.map{it.id})
    }
    @Test fun deletedDisciplineDoesNotExposeItsTopics(){val s=raw();s.obj("config").obj("entidadesExcluidas").put("disc:p:d",true);assertTrue(EditalOutline.read(base,s.toString()).topics.isEmpty())}
    @Test fun instanceNamesOrderAndLinkIdentityArePreserved(){val s=raw();s.array("planos").getJSONObject(0).array("disciplinas").getJSONObject(0).put("nome","Minha matéria");val outline=EditalOutline.read(base,s.toString());assertEquals("Minha matéria",outline.disciplines.single().name);assertEquals("https://example.com",outline.topics.first().link);assertEquals(base.id,outline.id)}
    @Test fun catalogAndInvalidSnapshotsFallBackToCurrentPlan(){assertEquals(base,EditalOutline.read(base,"{}"));assertEquals(base,EditalOutline.read(base,"broken"))}
    @Test fun deletedInstanceNeverLeaksIntoCatalogPreview(){val s=raw();s.obj("config").obj("planosExcluidos").put("p",true);assertTrue(EditalOutline.read(base.copy(enrolled=true),s.toString()).topics.isEmpty());assertEquals(base,EditalOutline.read(base,s.toString()))}
    @Test fun completionNeverCountsOtherPlansMissingTopicsOrDuplicates(){val outline=EditalOutline.read(base,raw().toString());val progress=listOf(Progress("p","t",true),Progress("p","t",true),Progress("other","archived",true),Progress("p","missing",true),Progress("p","archived",false));assertEquals(setOf("t"),EditalOutline.completed(outline,progress))}
}
