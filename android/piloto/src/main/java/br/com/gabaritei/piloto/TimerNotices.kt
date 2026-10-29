package br.com.gabaritei.piloto

import android.Manifest
import android.app.*
import android.content.*
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

object TimerNotices {
    private const val CHANNEL="native_study_v1"
    private fun prefs(c:Context)=c.getSharedPreferences("native_display",Context.MODE_PRIVATE)
    fun createChannel(c:Context){c.getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel(CHANNEL,"Avisos de estudo",NotificationManager.IMPORTANCE_DEFAULT).apply{description="Término da meta de tempo do cronômetro"})}
    fun allowed(c:Context)=c.getSystemService(NotificationManager::class.java).areNotificationsEnabled()&&(Build.VERSION.SDK_INT<33||ContextCompat.checkSelfPermission(c,Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED)
    fun optedIn(c:Context)=prefs(c).getBoolean("notifications",false)
    fun optIn(c:Context,value:Boolean){prefs(c).edit().putBoolean("notifications",value).apply();if(!value)cancel(c)}
    private fun intent(c:Context,token:String)=PendingIntent.getBroadcast(c,901,Intent(c,TimerNoticeReceiver::class.java).setData(android.net.Uri.parse("gabaritei://timer/$token")).putExtra("token",token),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    fun cancel(c:Context){prefs(c).getString("notice_token",null)?.let{c.getSystemService(AlarmManager::class.java).cancel(intent(c,it))};prefs(c).edit().remove("notice_session").remove("notice_token").apply()}
    fun schedule(c:Context,t:Timer,elapsed:Long){
        cancel(c);if(!optedIn(c)||!allowed(c)||t.startedElapsed==null||t.goalSeconds<=elapsed)return
        val token=java.util.UUID.randomUUID().toString();createChannel(c);prefs(c).edit().putString("notice_session",t.sessionId).putString("notice_token",token).apply()
        val alarm=c.getSystemService(AlarmManager::class.java);val whenAt=System.currentTimeMillis()+(t.goalSeconds-elapsed)*1000
        if(Build.VERSION.SDK_INT<31||alarm.canScheduleExactAlarms())try{alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,whenAt,intent(c,token))}catch(_:SecurityException){alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,whenAt,intent(c,token))}
        else alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,whenAt,intent(c,token))
    }
    fun show(c:Context,test:Boolean=false){
        if(!allowed(c)||!optedIn(c))return
        createChannel(c)
        val open=PendingIntent.getActivity(c,902,Intent(c,MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n=NotificationCompat.Builder(c,CHANNEL).setSmallIcon(R.drawable.book_outline).setContentTitle(if(test)"Avisos ativados" else "Meta de tempo concluída")
            .setContentText(if(test)"O Gabaritei já pode enviar seus avisos de estudo." else "Abra o estudo para continuar ou registrar sua sessão.").setContentIntent(open).setAutoCancel(true).build()
        c.getSystemService(NotificationManager::class.java).notify(if(test)904 else 903,n)
    }
    fun validSession(c:Context,token:String?)=token!=null&&prefs(c).getString("notice_token",null)==token
}
class TimerNoticeReceiver:BroadcastReceiver(){override fun onReceive(c:Context,i:Intent){if(TimerNotices.validSession(c,i.getStringExtra("token"))){TimerNotices.show(c);TimerNotices.cancel(c)}}}
class TimerBootReceiver:BroadcastReceiver(){override fun onReceive(c:Context,i:Intent){TimerNotices.cancel(c)}}
