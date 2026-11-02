package br.com.gabaritei.piloto

/** Monotonic clock: changing the wall clock cannot change study credits. */
object TimerClock {
    fun elapsed(t:Timer,now:Long,boot:Int)=StudyRules.elapsed(t.seconds,t.startedElapsed.takeIf{t.boot==boot},now)
    fun paused(t:Timer,now:Long,boot:Int)=t.copy(seconds=elapsed(t,now,boot),startedElapsed=null,boot=boot)
    fun running(t:Timer,now:Long,boot:Int)=if(t.startedElapsed!=null&&t.boot==boot)t else t.copy(startedElapsed=now,boot=boot)
}
