package br.com.gabaritei.piloto
import org.junit.Assert.*
import org.junit.Test
class TimerClockTest {
    private fun timer()=Timer(sessionId="study",planId="p",topicId="t",seconds=12,startedElapsed=1000,boot=4,goalSeconds=60)
    @Test fun pauseUsesLatestMonotonicTimeAndIsIdempotent(){val paused=TimerClock.paused(timer(),6000,4);assertEquals(17L,paused.seconds);assertNull(paused.startedElapsed);assertEquals(paused,TimerClock.paused(paused,15000,4))}
    @Test fun duplicateResumeDoesNotResetRunningTime(){val t=timer();assertEquals(t,TimerClock.running(t,9000,4));assertEquals(20L,TimerClock.elapsed(TimerClock.running(t,9000,4),9000,4))}
    @Test fun pauseResumePauseKeepsAllSegments(){val paused=TimerClock.paused(timer(),6000,4);val resumed=TimerClock.running(paused,12000,4);assertEquals(20L,TimerClock.paused(resumed,15000,4).seconds)}
    @Test fun rebootDoesNotCountUnmeasuredTime(){val paused=TimerClock.paused(timer(),300,5);assertEquals(12L,paused.seconds);assertNull(paused.startedElapsed);assertEquals(15L,TimerClock.elapsed(TimerClock.running(paused,500,5),3500,5))}
}
