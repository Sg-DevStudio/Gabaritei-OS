package br.com.gabaritei.piloto
import org.junit.Assert.*
import org.junit.Test
import java.time.*
class ReminderRulesTest {
 @Test fun nextDateRespectsDaysAndDoesNotReplayPastTime(){val now=ZonedDateTime.of(2026,10,30,20,0,0,0,ZoneId.of("America/Sao_Paulo"));val o=ReminderOptions(true,days=(1..5).toSet());assertEquals(LocalDate.of(2026,11,2),ReminderRules.next(now,o)!!.toLocalDate());assertNull(ReminderRules.next(now,o.copy(enabled=false)));assertNull(ReminderRules.next(now,o.copy(days=emptySet())))}
 @Test fun noonAndEveningAreIndependentAndContinueOnWeekends(){val o=ReminderOptions(true);val now=ZonedDateTime.of(2026,11,7,11,59,0,0,ZoneId.of("America/Sao_Paulo"));val noon=ReminderRules.next(now,o)!!;val evening=ReminderRules.next(noon,o)!!;assertEquals("2026-11-07T12:00",ReminderRules.slot(noon));assertEquals("2026-11-07T18:00",ReminderRules.slot(evening));assertEquals("2026-11-08T12:00",ReminderRules.slot(ReminderRules.next(evening,o)!!));assertTrue(ReminderRules.send(o,now.toLocalDate(),ReminderRules.slot(evening),ReminderRules.slot(noon),true,false));assertFalse(ReminderRules.valid(o.copy(secondHour=12)))}
 @Test fun suppressesDuplicateLateAndOptionallyAlreadyStudiedNotices(){val day=LocalDate.of(2026,10,29);val slot="${day}T12:00";val o=ReminderOptions(true,onlyUnstudied=true);assertTrue(ReminderRules.send(o,day,slot,"",false,false));assertFalse(ReminderRules.send(o,day,slot,slot,false,false));assertFalse(ReminderRules.send(o,day,"${day.minusDays(1)}T12:00","",false,false));assertFalse(ReminderRules.send(o,day,slot,"",true,false));assertFalse(ReminderRules.send(o,day,slot,"",false,true));assertTrue(ReminderRules.send(o.copy(onlyUnstudied=false),day,slot,"",true,false))}
 @Test fun localClockSurvivesDaylightSavingGap(){val now=ZonedDateTime.of(2026,3,7,23,0,0,0,ZoneId.of("America/New_York"));val next=ReminderRules.next(now,ReminderOptions(true,2,30,setOf(7)))!!;assertEquals(3,next.hour);assertTrue(next.toInstant()>now.toInstant())}
}
