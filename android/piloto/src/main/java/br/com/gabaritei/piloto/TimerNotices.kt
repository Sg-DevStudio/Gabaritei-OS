package br.com.gabaritei.piloto

import android.Manifest
import android.app.*
import android.content.*
import android.content.pm.PackageManager
import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*

object TimerNotices {
    const val CHANNEL="native_study_v1"
    const val ACTIVE_CHANNEL="native_timer_running_v1"
    const val ACTIVE_ID=905
    private fun prefs(c:Context)=c.getSharedPreferences("native_display",Context.MODE_PRIVATE)
    fun createChannel(c:Context){
        c.getSystemService(NotificationManager::class.java).apply{
            createNotificationChannel(NotificationChannel(CHANNEL,"Avisos de estudo",NotificationManager.IMPORTANCE_DEFAULT).apply{description="Término da meta de tempo do cronômetro"})
            createNotificationChannel(NotificationChannel(ACTIVE_CHANNEL,"Cronômetro em andamento",NotificationManager.IMPORTANCE_LOW).apply{description="Tempo de estudo e controles de pausa e retomada";setSound(null,null)})
        }
    }
    fun allowed(c:Context)=c.getSystemService(NotificationManager::class.java).areNotificationsEnabled()&&(Build.VERSION.SDK_INT<33||ContextCompat.checkSelfPermission(c,Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED)
    fun activeAllowed(c:Context):Boolean{createChannel(c);return allowed(c)&&c.getSystemService(NotificationManager::class.java).getNotificationChannel(ACTIVE_CHANNEL)?.importance!=NotificationManager.IMPORTANCE_NONE}
    fun alertAllowed(c:Context):Boolean{createChannel(c);return allowed(c)&&c.getSystemService(NotificationManager::class.java).getNotificationChannel(CHANNEL)?.importance!=NotificationManager.IMPORTANCE_NONE}
    fun optedIn(c:Context)=prefs(c).getBoolean("notifications",true)
    fun optIn(c:Context,value:Boolean){prefs(c).edit().putBoolean("notifications",value).apply();if(!value)cancel(c)}
    fun precise(c:Context)=Build.VERSION.SDK_INT<31||c.getSystemService(AlarmManager::class.java).canScheduleExactAlarms()
    private fun intent(c:Context,token:String)=PendingIntent.getBroadcast(c,901,Intent(c,TimerNoticeReceiver::class.java).setData(android.net.Uri.parse("gabaritei://timer/$token")).putExtra("token",token),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    fun cancel(c:Context){prefs(c).getString("notice_token",null)?.let{c.getSystemService(AlarmManager::class.java).cancel(intent(c,it))};prefs(c).edit().remove("notice_session").remove("notice_token").remove("notice_owner").apply()}
    fun schedule(c:Context,t:Timer,elapsed:Long,owner:String=""){
        cancel(c);if(!optedIn(c)||!alertAllowed(c)||t.startedElapsed==null||t.goalSeconds<=elapsed||t.goalSeconds<=0)return
        val token=java.util.UUID.randomUUID().toString();createChannel(c);prefs(c).edit().putString("notice_session",t.sessionId).putString("notice_owner",owner).putString("notice_token",token).apply()
        val alarm=c.getSystemService(AlarmManager::class.java);val whenAt=SystemClock.elapsedRealtime()+(t.goalSeconds-elapsed)*1000
        if(precise(c))try{alarm.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP,whenAt,intent(c,token))}catch(_:SecurityException){alarm.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP,whenAt,intent(c,token))}
        else alarm.setAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP,whenAt,intent(c,token))
    }
    fun open(c:Context,sessionId:String?=null):PendingIntent=PendingIntent.getActivity(c,902,Intent(c,MainActivity::class.java).setAction("br.com.gabaritei.OPEN_TIMER").putExtra("timer_session",sessionId).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    fun show(c:Context,test:Boolean=false,sessionId:String?=null){
        if(!alertAllowed(c)||!optedIn(c))return
        createChannel(c)
        val n=NotificationCompat.Builder(c,CHANNEL).setSmallIcon(R.drawable.book_outline).setContentTitle(if(test)"Avisos ativados" else "Meta de tempo concluída 🎯")
            .setContentText(if(test)"O Gabaritei já pode enviar seus avisos de estudo." else "Seu tempo planejado terminou. Toque para continuar ou concluir o estudo.").setContentIntent(open(c,sessionId)).setAutoCancel(true).build()
        try{c.getSystemService(NotificationManager::class.java).notify(if(test)904 else 903,n)}catch(_:SecurityException){}
    }
    @Synchronized fun reached(c:Context,t:Timer){
        if(!alertAllowed(c)||!optedIn(c)||t.goalSeconds<=0)return
        val key="${t.sessionId}:${t.goalSeconds}"
        if(prefs(c).getString("notice_reached",null)==key)return
        prefs(c).edit().putString("notice_reached",key).commit()
        show(c,sessionId=t.sessionId)
    }
    fun validSession(c:Context,token:String?)=token!=null&&prefs(c).getString("notice_token",null)==token
    fun boot(c:Context)=Settings.Global.getInt(c.contentResolver,Settings.Global.BOOT_COUNT,-1)
    suspend fun deliver(c:Context,token:String?){
        if(!validSession(c,token))return
        val p=prefs(c);val owner=p.getString("notice_owner","").orEmpty();val session=p.getString("notice_session",null)
        if(c.getSharedPreferences("study_reminders",0).getString("owner","").orEmpty()!=owner)return
        val t=PilotDatabase.get(c,owner.takeIf{it.isNotEmpty()}).dao().currentTimer()?:return
        if(!validSession(c,token)||t.sessionId!=session||t.startedElapsed==null||t.boot!=boot(c))return
        if(t.goalSeconds>0&&TimerClock.elapsed(t,SystemClock.elapsedRealtime(),boot(c))>=t.goalSeconds){reached(c,t);cancel(c)}
    }
}
class TimerNoticeReceiver:BroadcastReceiver(){override fun onReceive(c:Context,i:Intent){val result=goAsync();CoroutineScope(Dispatchers.IO).launch{try{TimerNotices.deliver(c,i.getStringExtra("token"))}finally{result.finish()}}}}
class TimerBootReceiver:BroadcastReceiver(){override fun onReceive(c:Context,i:Intent){if(i.action!=Intent.ACTION_BOOT_COMPLETED)return;TimerNotices.cancel(c);c.stopService(Intent(c,StudyTimerService::class.java));c.getSystemService(NotificationManager::class.java).cancel(TimerNotices.ACTIVE_ID)}}
