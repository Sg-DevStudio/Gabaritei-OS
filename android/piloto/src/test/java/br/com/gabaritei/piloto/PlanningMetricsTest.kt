package br.com.gabaritei.piloto

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.time.*

class PlanningMetricsTest {
    private fun entry()=JSONObject().put("id","p").put("plano",JSONObject()).put("disciplinas",JSONArray().put(JSONObject().put("id","d").put("topicos",JSONArray().put(JSONObject().put("id","t").put("horas_estimadas",2).put("status","pendente")))))
    @Test fun routineRespectsDaysBudgetAndNeverMarksStudy(){val e=entry();val a=PlanRoutine.agenda(e,Routine(setOf(1),60,50),LocalDate.parse("2026-10-26"));assertEquals(4,a.length());assertEquals(120,a.objects().sumOf{it.getInt("duracaoMin")});assertTrue(a.objects().all{LocalDate.parse(it.getString("data")).dayOfWeek.value==1&&!it.getBoolean("feito")});assertEquals("pendente",e.getJSONArray("disciplinas").getJSONObject(0).getJSONArray("topicos").getJSONObject(0).getString("status"))}
    @Test fun invalidRoutineDoesNotGenerateAgenda(){assertFalse(PlanRoutine.validate(Routine(emptySet(),120,50)));assertFalse(PlanRoutine.validate(Routine(setOf(1),0,50)));assertThrows(IllegalArgumentException::class.java){PlanRoutine.agenda(entry(),Routine(setOf(1),0,50),LocalDate.now())}}
    @Test fun metricsIncludeSimulatedQuestionsAndTimeOnce(){val p=Plan("p","Plano",listOf(Discipline("d","Disciplina",listOf(Topic("t","Tema",null,"")))))
        val time=LocalDate.parse("2026-10-29").atTime(12,0).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();val session=Session("s","p","t",3600,55,40,time)
        val raw=JSONObject().put("simulados",JSONArray().put(JSONObject().put("id","sim").put("planoId","p").put("data","2026-10-29").put("duracaoMin",30).put("acertos",JSONArray().put(JSONObject().put("disciplinaId","d").put("total",25).put("certas",20))))).toString()
        val samples=StudyMetrics.activities(p,listOf(session),raw);assertEquals(80,samples.sumOf{it.questions});assertEquals(60,samples.sumOf{it.correct});assertEquals(90.0,samples.sumOf{it.minutes},0.0);assertEquals(2,samples.filter{it.discipline=="d"}.size)
    }
    @Test fun streakUsesDistinctConsecutiveStudyDays(){val days=listOf("2026-10-26","2026-10-27","2026-10-27","2026-10-29").map{LocalDate.parse(it)};assertEquals(2,StudyMetrics.streak(days))}
    @org.junit.Test fun dailyHoursAreConvertedOnlyAtTheBoundary(){org.junit.Assert.assertEquals(120,PlanRoutine.minutesFromHours("2"));org.junit.Assert.assertEquals(150,PlanRoutine.minutesFromHours("2,5"));org.junit.Assert.assertEquals(150,PlanRoutine.minutesFromHours("2.5"));org.junit.Assert.assertEquals(15,PlanRoutine.minutesFromHours("0,25"));org.junit.Assert.assertNull(PlanRoutine.minutesFromHours("120"));org.junit.Assert.assertNull(PlanRoutine.minutesFromHours("NaN"));org.junit.Assert.assertNull(PlanRoutine.minutesFromHours("0"))}
}
