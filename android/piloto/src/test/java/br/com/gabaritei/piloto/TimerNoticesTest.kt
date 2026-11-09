package br.com.gabaritei.piloto

import android.app.AlarmManager
import org.robolectric.RuntimeEnvironment
import android.content.Context
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk=[28],manifest=Config.NONE)
class TimerNoticesTest {
    @Test fun goalHasAlarmSoundAndOngoingChannelStaysSilent(){val c=RuntimeEnvironment.getApplication();TimerNotices.createChannel(c);val manager=c.getSystemService(android.app.NotificationManager::class.java);val goal=manager.getNotificationChannel(TimerNotices.CHANNEL);assertEquals(android.app.NotificationManager.IMPORTANCE_HIGH,goal.importance);assertEquals(android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM),goal.sound);assertEquals(android.media.AudioAttributes.USAGE_ALARM,goal.audioAttributes.usage);assertNull(manager.getNotificationChannel(TimerNotices.ACTIVE_CHANNEL).sound)}
    @Test fun pausedAndFreeTimersDoNotScheduleNotices(){val c=RuntimeEnvironment.getApplication();TimerNotices.optIn(c,true)
        val alarm=Shadows.shadowOf(c.getSystemService(AlarmManager::class.java));val t=Timer(sessionId="t",planId="p",topicId="q",seconds=0,startedElapsed=null,boot=1,goalSeconds=60)
        TimerNotices.schedule(c,t,0);assertNull(alarm.nextScheduledAlarm)
        TimerNotices.schedule(c,t.copy(startedElapsed=1,goalSeconds=0),0);assertNull(alarm.nextScheduledAlarm)
    }
    @Test fun replacingAnAlarmInvalidatesTheOldToken(){val c=RuntimeEnvironment.getApplication();TimerNotices.optIn(c,true)
        val t=Timer(sessionId="t",planId="p",topicId="q",seconds=0,startedElapsed=1,boot=1,goalSeconds=60)
        TimerNotices.schedule(c,t,0);val first=c.getSharedPreferences("native_display",0).getString("notice_token",null)
        TimerNotices.schedule(c,t,10);val second=c.getSharedPreferences("native_display",0).getString("notice_token",null)
        assertNotNull(first);assertNotEquals(first,second);assertFalse(TimerNotices.validSession(c,first));assertTrue(TimerNotices.validSession(c,second))
        TimerNotices.cancel(c);assertFalse(TimerNotices.validSession(c,second))
    }
}

