package br.com.gabaritei.piloto

import android.app.Notification
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.SystemClock
import android.os.ParcelFileDescriptor
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first
import org.junit.*
import org.junit.Assert.*
import org.junit.runner.RunWith
import org.junit.runners.MethodSorters
import java.util.UUID

/** Physical QA uses only the separate package and synthetic, unrecorded timers. */
@RunWith(AndroidJUnit4::class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class TimerRuntimeTest {
    private val instrumentation=InstrumentationRegistry.getInstrumentation()
    private val c get()=instrumentation.targetContext
    private val dao get()=PilotDatabase.get(c).dao()
    private fun shell(command:String){ParcelFileDescriptor.AutoCloseInputStream(instrumentation.uiAutomation.executeShellCommand(command)).use{it.readBytes()}}
    private suspend fun waitFor(message:String,condition:suspend()->Boolean){val end=SystemClock.elapsedRealtime()+15000;while(SystemClock.elapsedRealtime()<end){if(condition())return;delay(100)};throw AssertionError(message)}
    private fun notice(id:Int)=c.getSystemService(NotificationManager::class.java).activeNotifications.find{it.id==id}
    private suspend fun start(goal:Long=3600):Timer{
        check(c.packageName.endsWith(".qa"));check(dao.currentTimer()==null)
        val auth=AccountSync(c);check(auth.auth.currentUser==null);auth.close()
        c.getSharedPreferences("study_reminders",0).edit().putString("owner","").commit()
        c.getSharedPreferences("native_display",0).edit().putBoolean("notifications",true).putBoolean("timer_permission_asked",true).commit()
        instrumentation.runOnMainSync{c.startActivity(Intent(c,MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))}
        delay(2000) // Let the app bind its initial empty timer before simulating a user's start.
        val t=Timer(sessionId="timer-qa-"+UUID.randomUUID(),planId=Catalog.bundled(c).first().id,topicId=Catalog.bundled(c).first().topics.first().id,seconds=0,startedElapsed=SystemClock.elapsedRealtime(),boot=TimerNotices.boot(c),goalSeconds=goal)
        dao.startTimer(t)
        StudyTimerService.connect(c,t,"","Compreensão e interpretação de textos")
        waitFor("Controles da sessão ativa"){notice(TimerNotices.ACTIVE_ID)?.notification?.actions?.any{it.title.toString()=="Pausar"}==true}
        return t
    }
    private suspend fun cleanup(){dao.currentTimer()?.takeIf{it.sessionId.startsWith("timer-qa-")}?.let{dao.clearTimer(it.sessionId)};StudyTimerService.stop(c);delay(300)}
    @Before fun resetInterruptedQaTimer()=runBlocking{check(c.packageName.endsWith(".qa"));val auth=AccountSync(c);check(auth.auth.currentUser==null);auth.close();cleanup()}
    @Test fun a_livePauseResumeAndStaleActions()=runBlocking{
        val before=dao.sessions().first().size
        try{
            val t=start();val live=notice(TimerNotices.ACTIVE_ID)!!.notification
            assertTrue(live.flags and Notification.FLAG_ONGOING_EVENT!=0);assertTrue(live.flags and Notification.FLAG_FOREGROUND_SERVICE!=0)
            assertTrue("Base de tempo próxima ao início",kotlin.math.abs(live.`when`-(System.currentTimeMillis()-TimerClock.elapsed(t,SystemClock.elapsedRealtime(),TimerNotices.boot(c))*1000))<2000)
            val oldPause=live.actions.first{it.title.toString()=="Pausar"}.actionIntent
            shell("input keyevent 3");delay(1300);oldPause.send();waitFor("Pausa persistida"){dao.currentTimer()?.startedElapsed==null}
            val paused=dao.currentTimer()!!;assertTrue(paused.seconds>=1)
            delay(1100);assertEquals(paused.seconds,dao.currentTimer()!!.seconds)
            waitFor("Controle de retomada"){notice(TimerNotices.ACTIVE_ID)?.notification?.actions?.any{it.title.toString()=="Retomar"}==true}
            notice(TimerNotices.ACTIVE_ID)!!.notification.actions.first{it.title.toString()=="Retomar"}.actionIntent.send()
            waitFor("Retomada persistida"){dao.currentTimer()?.startedElapsed!=null}
            dao.clearTimer(t.sessionId);waitFor("Notificação removida"){notice(TimerNotices.ACTIVE_ID)==null}
            val next=start();oldPause.send();delay(500);assertEquals(next.sessionId,dao.currentTimer()!!.sessionId);assertNotNull(dao.currentTimer()!!.startedElapsed)
            assertEquals(before,dao.sessions().first().size)
        }finally{cleanup()}
    }
    @Test fun b_goalAlertIsDeliveredOnce()=runBlocking{
        try{
            val t=start(5);shell("input keyevent 3");waitFor("Meta notificada"){notice(903)!=null}
            val first=notice(903)!!;TimerNotices.reached(c,t);assertEquals(first.postTime,notice(903)!!.postTime)
            assertNotNull(dao.currentTimer());assertNull(dao.sessions().first().find{it.id==t.sessionId})
            assertNotNull(first.notification.contentIntent)
            val channel=c.getSystemService(NotificationManager::class.java).getNotificationChannel(first.notification.channelId)
            assertEquals(android.media.AudioAttributes.USAGE_ALARM,channel.audioAttributes.usage)
            assertNotNull(channel.sound);assertEquals(NotificationManager.IMPORTANCE_HIGH,channel.importance)
            assertNull(first.notification.getLargeIcon())
        }finally{cleanup()}
    }
    @Test fun prepareVisualTimer()=runBlocking<Unit>{
        Assume.assumeTrue(InstrumentationRegistry.getArguments().getString("timerVisualFixture")=="true")
        val plan=Catalog.bundled(c).first()
        dao.startTimer(Timer(sessionId="timer-qa-visual",planId=plan.id,topicId=plan.topics.first().id,seconds=0,startedElapsed=null,boot=TimerNotices.boot(c),goalSeconds=10))
    }
    @Test fun z_goalWithScreenOff()=runBlocking{
        Assume.assumeTrue(InstrumentationRegistry.getArguments().getString("lockedTimerTest")=="true")
        try{
            assertTrue("Alarme preciso autorizado no QA",TimerNotices.precise(c))
            val t=start(10);val expected=t.startedElapsed!!+10000;assertNull(notice(903))
            shell("input keyevent 223");delay(300);assertFalse("Tela apagada",c.getSystemService(android.os.PowerManager::class.java).isInteractive)
            waitFor("Aviso com tela apagada"){notice(903)!=null}
            assertTrue("Aviso próximo à meta",SystemClock.elapsedRealtime()-expected<4000)
            assertEquals(t.sessionId,dao.currentTimer()!!.sessionId)
        }finally{cleanup();shell("input keyevent 224")}
    }
}
