package br.com.gabaritei.piloto
import android.Manifest
import android.app.NotificationManager
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Test
import org.junit.Assert.*
import org.junit.runner.RunWith
import org.json.JSONObject
import org.json.JSONArray
import java.time.LocalDate
@RunWith(AndroidJUnit4::class)
class ReminderDeviceTest {
 @Test fun remindersAreDeliveredOnceAndRespectRecordedStudyAndTimer()=runBlocking {
    val instrument=InstrumentationRegistry.getInstrumentation();val c=instrument.targetContext;require(c.packageName.endsWith(".qa"))
    if(android.os.Build.VERSION.SDK_INT>=33)instrument.uiAutomation.grantRuntimePermission(c.packageName,Manifest.permission.POST_NOTIFICATIONS)
    val prefs=c.getSharedPreferences("study_reminders",0);val owner="test-reminder-${java.util.UUID.randomUUID()}";val dao=PilotDatabase.get(c,owner).dao();val manager=c.getSystemService(NotificationManager::class.java);val today=LocalDate.now().toString()
    fun prepare(slot:String="12:00",last:String="",only:Boolean=true):String {DailyReminders.save(c,ReminderOptions(true,days=(1..7).toSet(),onlyUnstudied=only));prefs.edit().putString("owner",owner).putString("intended","${today}T$slot").putString("last_sent",last).apply();return prefs.getString("token",null)!!}
    try {
        manager.cancelAll();val token=prepare();DailyReminders.deliver(c,token);assertEquals("${today}T12:00",prefs.getString("last_sent",null));kotlinx.coroutines.withTimeout(5000){while(manager.activeNotifications.none{it.id==1003})kotlinx.coroutines.delay(100)};assertNull(manager.activeNotifications.first{it.id==1003}.notification.getLargeIcon());assertFalse(DailyReminders.validToken(c,token));manager.cancelAll();kotlinx.coroutines.withTimeout(5000){while(manager.activeNotifications.any{it.id==1003})kotlinx.coroutines.delay(100)}
        DailyReminders.deliver(c,prepare("18:00","${today}T12:00",false));assertEquals("${today}T18:00",prefs.getString("last_sent",null));manager.cancelAll();kotlinx.coroutines.delay(300)
        val raw=StateCompat.empty().put("sessoes",JSONArray().put(JSONObject().put("id","studied").put("planoId",JSONObject.NULL).put("topicoId",JSONObject.NULL).put("data",today).put("duracaoMin",30).put("qFeitas",0).put("qCertas",0)))
        dao.snapshot(RemoteSnapshot(json=raw.toString(),syncedAt=0));DailyReminders.deliver(c,prepare());assertFalse(manager.activeNotifications.any{it.id==1003})
        dao.snapshot(RemoteSnapshot(json=StateCompat.empty().toString(),syncedAt=0));dao.timer(Timer(sessionId="running",planId="p",topicId="t",seconds=0,startedElapsed=1,boot=1));DailyReminders.deliver(c,prepare());assertFalse(manager.activeNotifications.any{it.id==1003})
    }finally{DailyReminders.save(c,ReminderOptions(false));manager.cancelAll();prefs.edit().remove("owner").apply()}
 }
}
