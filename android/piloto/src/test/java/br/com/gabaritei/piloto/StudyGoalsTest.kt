package br.com.gabaritei.piloto

import java.time.LocalDate
import org.json.JSONObject
import org.json.JSONArray
import org.junit.Assert.*
import org.junit.Test

class StudyGoalsTest {
    private val today=LocalDate.of(2026,11,10)
    private fun block(id:String="a",minutes:Int=60,date:LocalDate=today,done:Boolean=false,plan:String="p",topic:String="pt")=JSONObject().put("id",id).put("planoId",plan).put("topicoId",topic).put("duracaoMin",minutes).put("data",date.toString()).put("feito",done)
    private fun raw(vararg blocks:JSONObject)=JSONObject().put("agenda",JSONArray(blocks.toList())).toString()
    @Test fun scheduledHourOverridesDeviceFiftyMinutes(){assertEquals(60,StudyGoals.minutes(raw(block()),"p","pt",50,today))}
    @Test fun changedAgendaIsReadAgainAtStart(){assertEquals(75,StudyGoals.minutes(raw(block(minutes=75)),"p","pt",50,today))}
    @Test fun unrelatedOrFinishedBlocksCannotSetTheGoal(){
        assertEquals(25,StudyGoals.minutes(raw(block(plan="other"),block(topic="other"),block(date=today.minusDays(1)),block(done=true)),"p","pt",25,today))
    }
    @Test fun chosenPlanningBlockKeepsItsOwnDurationEvenOnAnotherDate(){
        assertEquals(30,StudyGoals.minutes(raw(block(),block("b",30,today.plusDays(1))),"p","pt",50,today,"b"))
    }
    @Test(expected=IllegalArgumentException::class) fun removedBlockRequiresReopeningPlanning(){StudyGoals.minutes(raw(block()),"p","pt",50,today,"removed")}
    @Test fun unscheduledStudyRetainsDevicePreferenceIncludingFreeTimer(){
        assertEquals(25,StudyGoals.minutes("{}","p","pt",25,today));assertEquals(0,StudyGoals.minutes("{}","p","pt",0,today))
    }
    @Test fun invalidDurationsDoNotCreateNegativeOrUnboundedTimers(){assertEquals(50,StudyGoals.minutes(raw(block(minutes=-1)),"p","pt",-5,today))}
}
