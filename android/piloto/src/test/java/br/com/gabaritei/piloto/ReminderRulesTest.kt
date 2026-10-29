package br.com.gabaritei.piloto
import org.junit.Assert.*
import org.junit.Test
import java.time.*
class ReminderRulesTest {
 @Test fun nextDateRespectsDaysAndDoesNotReplayPastTime(){val now=ZonedDateTime.of(2026,10,30,20,0,0,0,ZoneId.of("America/Sao_Paulo"));val o=ReminderOptions(true);assertEquals(LocalDate.of(2026,11,2),ReminderRules.next(now,o)!!.toLocalDate());assertNull(ReminderRules.next(now,o.copy(enabled=false)));assertNull(ReminderRules.next(now,o.copy(days=emptySet())))}
 @Test fun suppressesDuplicateLateAndAlreadyStudiedNotices(){val day=LocalDate.of(2026,10,29);val o=ReminderOptions(true);assertTrue(ReminderRules.send(o,day,day.toString(),"",false,false));assertFalse(ReminderRules.send(o,day,day.toString(),day.toString(),false,false));assertFalse(ReminderRules.send(o,day,day.minusDays(1).toString(),"",false,false));assertFalse(ReminderRules.send(o,day,day.toString(),"",true,false));assertFalse(ReminderRules.send(o,day,day.toString(),"",false,true));assertTrue(ReminderRules.send(o.copy(onlyUnstudied=false),day,day.toString(),"",true,false))}
 @Test fun localClockSurvivesDaylightSavingGap(){val now=ZonedDateTime.of(2026,3,7,23,0,0,0,ZoneId.of("America/New_York"));val next=ReminderRules.next(now,ReminderOptions(true,2,30,setOf(7)))!!;assertEquals(3,next.hour);assertTrue(next.toInstant()>now.toInstant())}
}
