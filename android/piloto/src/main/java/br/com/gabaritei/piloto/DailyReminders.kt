package br.com.gabaritei.piloto

import android.Manifest
import android.app.*
import android.content.*
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.time.*

data class ReminderOptions(val enabled:Boolean=false,val hour:Int=12,val minute:Int=0,val days:Set<Int> = (1..7).toSet(),val onlyUnstudied:Boolean=false,val secondHour:Int=18,val secondMinute:Int=0) {
    val times get()=listOf(LocalTime.of(hour,minute),LocalTime.of(secondHour,secondMinute)).distinct().sorted()
}
object ReminderRules {
    fun valid(o:ReminderOptions)=o.hour in 0..23&&o.minute in 0..59&&o.secondHour in 0..23&&o.secondMinute in 0..59&&(o.hour!=o.secondHour||o.minute!=o.secondMinute)&&o.days.isNotEmpty()&&o.days.all{it in 1..7}
    fun next(now:ZonedDateTime,o:ReminderOptions):ZonedDateTime?{
        if(!o.enabled||!valid(o))return null
        return (0..7).asSequence().flatMap{day->o.times.asSequence().map{now.toLocalDate().plusDays(day.toLong()).atTime(it).atZone(now.zone)}}.firstOrNull{it.dayOfWeek.value in o.days&&it.toInstant()>now.toInstant()}
    }
    fun slot(time:ZonedDateTime)="${time.toLocalDate()}T%02d:%02d".format(time.hour,time.minute)
    fun send(o:ReminderOptions,date:LocalDate,intended:String,last:String,studied:Boolean,running:Boolean)=o.enabled&&valid(o)&&date.dayOfWeek.value in o.days&&o.times.any{intended=="${date}T%02d:%02d".format(it.hour,it.minute)}&&last!=intended&&!running&&(!o.onlyUnstudied||!studied)
    fun message(day:Long):Pair<String,String> = listOf(
        "Seu próximo estudo espera por você 📚" to "Um bloco no seu ritmo para avançar hoje.",
        "Que tal cuidar da sua meta? 🎯" to "Abra o Gabaritei e escolha seu próximo assunto.",
        "Uma revisão já faz diferença 🧠" to "Volte a um assunto e coloque o conhecimento em prática.",
        "Bora dar mais um passo? 🚀" to "Escolha um assunto e avance no seu ritmo."
    )[Math.floorMod(day,4L).toInt()]
}
object DailyReminders {
    private const val CHANNEL="study_reminders_v1"
    private val delivery=Mutex()
    private fun prefs(c:Context)=c.getSharedPreferences("study_reminders",Context.MODE_PRIVATE)
    fun read(c:Context):ReminderOptions {
        val p=prefs(c)
        // One-time schedule upgrade. An explicitly disabled reminder stays disabled.
        if(p.getInt("schedule_version",0)<2)p.edit().putInt("schedule_version",2).putInt("hour",12).putInt("minute",0).putInt("second_hour",18).putInt("second_minute",0).putStringSet("days",(1..7).map{it.toString()}.toSet()).putBoolean("only_unstudied",false).apply()
        return ReminderOptions(p.getBoolean("enabled",true),p.getInt("hour",12),p.getInt("minute",0),p.getStringSet("days",(1..7).map{it.toString()}.toSet())!!.mapNotNull{it.toIntOrNull()}.toSet(),p.getBoolean("only_unstudied",false),p.getInt("second_hour",18),p.getInt("second_minute",0))
    }
    fun channel(c:Context){c.getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel(CHANNEL,"Lembretes da rotina",NotificationManager.IMPORTANCE_DEFAULT).apply{description="Convites para estudar nos dias e horários escolhidos"})}
    fun allowed(c:Context):Boolean {channel(c);return TimerNotices.allowed(c)&&c.getSystemService(NotificationManager::class.java).getNotificationChannel(CHANNEL)?.importance!=NotificationManager.IMPORTANCE_NONE}
    fun save(c:Context,o:ReminderOptions){require(ReminderRules.valid(o));prefs(c).edit().putInt("schedule_version",2).putBoolean("enabled",o.enabled).putInt("hour",o.hour).putInt("minute",o.minute).putInt("second_hour",o.secondHour).putInt("second_minute",o.secondMinute).putStringSet("days",o.days.map{it.toString()}.toSet()).putBoolean("only_unstudied",o.onlyUnstudied).apply();schedule(c)}
    private fun pending(c:Context,token:String)=PendingIntent.getBroadcast(c,1001,Intent(c,DailyReminderReceiver::class.java).setData(android.net.Uri.parse("gabaritei://reminder/$token")).putExtra("token",token),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    fun cancel(c:Context){prefs(c).getString("token",null)?.let{val intent=pending(c,it);c.getSystemService(AlarmManager::class.java).cancel(intent);intent.cancel()};prefs(c).edit().remove("token").remove("intended").apply()}
    fun schedule(c:Context){
        cancel(c);val o=read(c);if(!o.enabled||!allowed(c))return
        val next=ReminderRules.next(ZonedDateTime.now(),o)?:return;val token=java.util.UUID.randomUUID().toString()
        prefs(c).edit().putString("token",token).putString("intended",ReminderRules.slot(next)).apply()
        val alarm=c.getSystemService(AlarmManager::class.java);val at=next.toInstant().toEpochMilli()
        if(TimerNotices.precise(c))try{alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending(c,token))}catch(_:SecurityException){alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending(c,token))}
        else alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending(c,token))
    }
    fun validToken(c:Context,token:String?)=token!=null&&prefs(c).getString("token",null)==token
    fun show(c:Context,test:Boolean=false):Boolean {
        if(!allowed(c)||(!test&&!read(c).enabled))return false
        val message=if(test)"Um lembrete no seu ritmo 📚" to "Prévia do Gabaritei. Dois horários para cuidar dos seus estudos." else ReminderRules.message(LocalDate.now().toEpochDay())
        val open=PendingIntent.getActivity(c,1002,Intent(c,MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n=NotificationCompat.Builder(c,CHANNEL).setSmallIcon(R.drawable.book_outline).setColor(0xFF2854D8.toInt()).setContentTitle(message.first).setContentText(message.second).setStyle(NotificationCompat.BigTextStyle().bigText(message.second)).setCategory(NotificationCompat.CATEGORY_REMINDER).setContentIntent(open).setAutoCancel(true).build()
        return try{c.getSystemService(NotificationManager::class.java).notify(if(test)1004 else 1003,n);true}catch(_:SecurityException){false}
    }
    suspend fun deliver(c:Context,token:String?)=delivery.withLock{
        if(!validToken(c,token))return@withLock
        try {
            val p=prefs(c);val today=LocalDate.now();val owner=p.getString("owner","").orEmpty().takeIf{it.isNotEmpty()};val intended=p.getString("intended","").orEmpty();val d=PilotDatabase.get(c,owner).dao()
            val records=if(owner==null)d.sessions().first()else StateCompat.sessions(d.currentSnapshot()?.json?:StateCompat.empty().toString())
            val studied=records.any{(it.seconds>0||it.questions>0)&&Instant.ofEpochMilli(it.endedAt).atZone(ZoneId.systemDefault()).toLocalDate()==today}||runCatching{val raw=org.json.JSONObject(d.currentSnapshot()?.json?:"{}");val removed=raw.obj("config").array("removidos");val ids=(0 until removed.length()).map{removed.optString(it)}.toSet();raw.array("simulados").objects().any{it.optString("data")==today.toString()&&it.optString("id") !in ids&&(it.optDouble("duracaoMin")>0||it.array("acertos").objects().sumOf{r->r.optInt("total")}>0)}}.getOrDefault(false)
            if(validToken(c,token)&&p.getString("owner","").orEmpty()==owner.orEmpty()&&ReminderRules.send(read(c),today,intended,p.getString("last_sent","").orEmpty(),studied,d.currentTimer()?.startedElapsed!=null)&&show(c))p.edit().putString("last_sent",intended).apply()
        }finally{schedule(c)}
    }
}
class DailyReminderReceiver:BroadcastReceiver(){override fun onReceive(c:Context,i:Intent){val result=goAsync();CoroutineScope(Dispatchers.IO).launch{try{withTimeout(8000){DailyReminders.deliver(c.applicationContext,i.getStringExtra("token"))}}catch(_:Exception){DailyReminders.schedule(c)}finally{result.finish()}}}}
class ReminderClockReceiver:BroadcastReceiver(){override fun onReceive(c:Context,i:Intent){if(i.action in listOf(Intent.ACTION_BOOT_COMPLETED,Intent.ACTION_TIME_CHANGED,Intent.ACTION_TIMEZONE_CHANGED,Intent.ACTION_MY_PACKAGE_REPLACED))DailyReminders.schedule(c)}}
