package br.com.gabaritei.piloto
import android.app.AlarmManager
import android.content.Context
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows
import org.robolectric.annotation.Config
import org.robolectric.RobolectricTestRunner
import org.junit.runner.RunWith
import org.junit.Test
import org.junit.Assert.*
@RunWith(RobolectricTestRunner::class)
@Config(sdk=[28],manifest=Config.NONE)
class DailyRemindersTest {
 @Test fun disabledReminderHasNoAlarmAndCancelsOldToken(){val c=RuntimeEnvironment.getApplication();DailyReminders.save(c,ReminderOptions(true));val token=c.getSharedPreferences("study_reminders",0).getString("token",null);assertNotNull(token);DailyReminders.save(c,ReminderOptions(false));assertFalse(DailyReminders.validToken(c,token));assertNull(Shadows.shadowOf(c.getSystemService(AlarmManager::class.java)).nextScheduledAlarm)}
 @Test fun reschedulingInvalidatesOldBroadcast(){val c=RuntimeEnvironment.getApplication();DailyReminders.save(c,ReminderOptions(true));val old=c.getSharedPreferences("study_reminders",0).getString("token",null);DailyReminders.schedule(c);assertFalse(DailyReminders.validToken(c,old));val now=c.getSharedPreferences("study_reminders",0).getString("token",null);assertTrue(DailyReminders.validToken(c,now));DailyReminders.cancel(c)}
}
