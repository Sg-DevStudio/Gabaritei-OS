package br.com.gabaritei.piloto

import java.time.LocalDate
import org.json.JSONObject
import org.json.JSONArray
import org.junit.Assert.*
import org.junit.Test

class DailyStudyPlanTest {
    private val today=LocalDate.of(2026,11,11)
    private val spelling=Topic("spelling","Ortografia",null,"")
    private val cohesion=Topic("cohesion","Coesão e coerência",null,"")
    private val law=Topic("law","Licitações",null,"")
    private val plan=Plan("p","TRF2",listOf(Discipline("pt","Português",listOf(spelling,cohesion)),Discipline("adm","Administrativo",listOf(law))),enrolled=true)
    private fun block(id:String="a",topic:String="cohesion",disc:String="pt",minutes:Int=60,date:LocalDate=today)=JSONObject().put("id",id).put("planoId","p").put("disciplinaId",disc).put("topicoId",topic).put("duracaoMin",minutes).put("data",date.toString())
    private fun state(vararg blocks:JSONObject)=JSONObject().put("planos",JSONArray().put(JSONObject().put("id","p").put("plano",JSONObject()))).put("agenda",JSONArray(blocks.toList()))
    @Test fun actualAgendaSelectsCohesionAndSixtyMinutesInsteadOfDeviceSpellingAndFifty(){
        val raw=state(block()).toString();val next=DailyStudyPlan.pending(raw,plan,today).first()
        assertEquals(cohesion,next.topic);assertEquals(60,next.remainingMinutes)
        assertEquals(60,StudyGoals.minutes(raw,plan.id,next.topic.id,50,today,next.reference))
    }
    @Test fun completedTimeIsEnoughEvenIfLegacyDoneFlagIsFalse(){
        val raw=state(block().put("feitoMin",59.6).put("feito",false)).toString()
        assertTrue(DailyStudyPlan.pending(raw,plan,today).isEmpty());assertTrue(DailyStudyPlan.agenda(raw,plan,today).single().done)
    }
    @Test fun partialStudyLeavesOnlyTheRemainingTimeInPreviewAndTimer(){
        val raw=state(block().put("feitoMin",20)).toString();val next=DailyStudyPlan.pending(raw,plan,today).single()
        assertEquals(40,next.remainingMinutes);assertEquals(40,StudyGoals.minutes(raw,"p","cohesion",50,today,next.reference))
    }
    @Test fun globalTopicCompletionDoesNotCompleteUnstudiedCalendarBlocks(){
        val raw=state(block());raw.array("planos").getJSONObject(0).put("disciplinas",JSONArray().put(JSONObject().put("id","pt").put("topicos",JSONArray().put(JSONObject().put("id","cohesion").put("status","dominado")))))
        assertEquals(cohesion,DailyStudyPlan.pending(raw.toString(),plan,today).single().topic)
    }
    @Test fun orderPreferenceAndAlternationMatchCalendarWithoutMutatingIt(){
        val raw=state(block("a"),block("b"),block("c","law","adm"),block("done").put("feito",true))
        raw.array("planos").getJSONObject(0).obj("plano").put("estudoInicioPreferido","b")
        val before=raw.toString();assertEquals(listOf("b","c","a","done"),DailyStudyPlan.agenda(before,plan,today).map{it.id})
        assertEquals(before,raw.toString())
    }
    @Test fun deletedPausedArchivedOrUnknownTopicsCannotReturnToTheQueue(){
        val raw=state(block("deleted"),block("removed"),block("law","law","adm"),block("missing","no-topic"))
        raw.put("config",JSONObject().put("removidos",JSONArray().put("removed")).put("entidadesExcluidas",JSONObject().put("agenda:p:deleted",true)))
        val paused=plan.copy(disciplines=plan.disciplines.map{if(it.id=="adm")it.copy(paused=true)else it})
        assertTrue(DailyStudyPlan.pending(raw.toString(),paused,today).isEmpty())
        val archived=plan.copy(disciplines=plan.disciplines.map{it.copy(archived=true)})
        assertTrue(DailyStudyPlan.pending(state(block()).toString(),archived,today).isEmpty())
    }
    @Test fun dayChangeAndOtherPlansNeverReuseYesterdaysSuggestion(){
        val raw=state(block("yesterday",date=today.minusDays(1)),block("today"),block("tomorrow",date=today.plusDays(1)),block("foreign").put("planoId","other")).toString()
        assertEquals(listOf("today"),DailyStudyPlan.pending(raw,plan,today).map{it.id})
        assertEquals(listOf("tomorrow"),DailyStudyPlan.pending(raw,plan,today.plusDays(1)).map{it.id})
    }
    @Test fun cycleUsesOnlyCurrentRoundAndRespectsItsOwnRemainingGoal(){
        val raw=state();val meta=raw.array("planos").getJSONObject(0).obj("plano")
        meta.put("modoPlanejamento","ciclo").put("ciclo",JSONObject().put("volta",1).put("blocos",JSONArray().put(block("cycle").put("metaMin",60).put("feitoMin",15)).put(block("future").put("metaMin",60).put("voltaInicio",2))))
        val next=DailyStudyPlan.pending(raw.toString(),plan,today).single();assertEquals("cycle:cycle",next.reference);assertEquals(45,next.remainingMinutes)
        assertEquals(45,StudyGoals.minutes(raw.toString(),"p","cohesion",50,today,next.reference))
        meta.put("modoPlanejamento","semanal");assertTrue(DailyStudyPlan.pending(raw.toString(),plan,today).isEmpty())
    }
    @Test fun topiclessBlockUsesItsOwnDisciplineAndContinuesAnInProgressTopic(){
        val raw=state(block().put("topicoId",JSONObject.NULL));raw.array("planos").getJSONObject(0).put("disciplinas",JSONArray().put(JSONObject().put("id","pt").put("topicos",JSONArray().put(JSONObject().put("id","cohesion").put("status","em_curso")))))
        val next=DailyStudyPlan.pending(raw.toString(),plan,today).single();assertEquals(cohesion,next.topic)
        assertEquals(60,StudyGoals.minutes(raw.toString(),"p","cohesion",50,today,next.reference))
    }
    @Test fun repeatedTopicsKeepTheChosenBlockDuration(){
        val raw=state(block("short",minutes=30),block("long",minutes=60)).toString()
        val next=DailyStudyPlan.pending(raw,plan,today).first();assertEquals("long",next.id)
        assertEquals(30,StudyGoals.minutes(raw,"p","cohesion",50,today,"short"))
    }
    @Test(expected=IllegalArgumentException::class) fun fullyCreditedBlockCannotBeStartedAgain(){
        StudyGoals.minutes(state(block().put("feitoMin",60)).toString(),"p","cohesion",50,today,"a")
    }
}
