package br.com.gabaritei.piloto
import org.json.JSONObject
import org.json.JSONArray
import org.junit.Assert.*
import org.junit.Test
class CatalogTest {
 private fun raw(id:String="x",date:String="2026-10-29")=JSONObject().put("id",id).put("titulo","Concurso $id").put("atualizadoEm",date).put("disciplinas",JSONArray().put(JSONObject().put("id","d").put("nome","Direito").put("topicos",JSONArray().put(JSONObject().put("id","t").put("nome","Tema")))))
 @Test fun plansWithoutNotebooksRemainAvailable(){val plans=Catalog.parse(JSONArray().put(raw()));assertEquals(1,plans.size);assertNull(plans.single().topics.single().link);assertEquals("Concurso x",Catalog.base(plans.single()).getString("titulo"))}
 @Test fun staleRemoteCannotReplaceNewSyllabus(){val local=Catalog.parse(JSONArray().put(raw()));val old=raw(date="2025-01-01").put("titulo","Antigo");assertEquals("Concurso x",Catalog.merge(local,JSONArray().put(old)).single().name)}
 @Test fun privateCatalogCustomizationDoesNotChangePublicBase(){val local=Catalog.parse(JSONArray().put(raw()));val custom=raw().put("titulo","Meu concurso");val updated=Catalog.personal(local,StateCompat.empty().put("editais",JSONArray().put(custom)).toString());assertEquals("Meu concurso",updated.single().name);assertEquals("Concurso x",local.single().name)}
 @Test fun catalogueRemovalPreservesEnrolledPlan(){val local=Catalog.parse(JSONArray().put(raw()));val hidden=Catalog.merge(local,JSONArray().put(raw().put("excluidoDoCatalogo",true)));assertTrue(hidden.isEmpty());val state=StateCompat.empty().put("planos",JSONArray().put(JSONObject().put("id","mine").put("plano",JSONObject().put("concurso","Meu plano").put("origemEditalId","x")).put("disciplinas",raw().getJSONArray("disciplinas"))));assertEquals("mine",StateCompat.plans(state.toString(),hidden).single().id)}
}
