package br.com.gabaritei.piloto
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate
class PlanComparisonTest {
 @Test fun matchesWebsiteForAllBundledPlanPairs(){val root=JSONObject(javaClass.classLoader!!.getResourceAsStream("plan-comparison.json")!!.bufferedReader().readText());val plans=Catalog.parse(root.getJSONArray("plans")).associateBy{it.id};root.array("cases").objects().forEach{case->val a=plans.getValue(case.getString("a"));val b=plans.getValue(case.getString("b"));val actual=PlanComparison.compare(a,b,case.getDouble("hours"),LocalDate.parse(case.getString("today")));val expected=case.getJSONObject("expected").getJSONObject("detalhes");val label="${a.name} + ${b.name}";assertEquals(label,expected.getInt("overlapPct"),actual.overlap);assertEquals(label,expected.getInt("topicosComuns"),actual.commonTopics);assertEquals(label,expected.getInt("cargaUniaoH"),actual.effort);assertEquals(label,expected.getInt("economiaH"),actual.savings);assertEquals(label,expected.getDouble("exigidaSemana"),actual.weekly,.01);assertEquals(label,expected.getInt("exclusivosA"),actual.onlyA);assertEquals(label,expected.getInt("exclusivosB"),actual.onlyB);assertEquals(label,mapOf("nao_recomendado" to "Não recomendada","baixa" to "Baixa","moderada" to "Moderada","alta" to "Alta")[case.getJSONObject("expected").getString("nivel")],actual.level)}}
 @Test fun rejectsImpossibleWeeklyHours(){val p=Plan("a","A",emptyList());assertThrows(IllegalArgumentException::class.java){PlanComparison.compare(p,p,0.0)};assertThrows(IllegalArgumentException::class.java){PlanComparison.compare(p,p,169.0)}}
}
