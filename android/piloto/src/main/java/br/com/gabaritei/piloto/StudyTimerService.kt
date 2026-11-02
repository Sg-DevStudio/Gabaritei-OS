package br.com.gabaritei.piloto

import android.app.*
import android.content.*
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.*
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collect

/** One service per current session. Room remains the single source of time and account. */
class StudyTimerService:Service(){
    private val scope=CoroutineScope(SupervisorJob()+Dispatchers.Main.immediate)
    private var observation:Job?=null
    private var deadline:Job?=null
    private var owner=""
    private var session=""
    private var title="Estudo em andamento"
    override fun onBind(i:Intent?)=null
    override fun onStartCommand(i:Intent?,flags:Int,startId:Int):Int{
        val stored=getSharedPreferences("timer_runtime",0)
        val uid=i?.getStringExtra("owner")?:stored.getString("owner","").orEmpty()
        val id=i?.getStringExtra("session")?:stored.getString("session","").orEmpty()
        if(id.isBlank()||activeOwner(this)!=uid){if(session.isBlank())stopSelf();return START_NOT_STICKY}
        if(i?.action==PAUSE||i?.action==RESUME){
            if(stored.getString("session",null)!=id||stored.getString("owner","")!=uid){if(session.isBlank())stopSelf();return START_NOT_STICKY}
        }
        owner=uid;session=id;title=i?.getStringExtra("title")?:stored.getString("title","Estudo em andamento").orEmpty()
        TimerNotices.createChannel(this)
        ServiceCompat.startForeground(this,TimerNotices.ACTIVE_ID,notification(null),if(Build.VERSION.SDK_INT>=34)ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE else 0)
        stored.edit().putString("owner",owner).putString("session",session).putString("title",title).apply()
        observation?.cancel();deadline?.cancel()
        val command=i?.action
        observation=scope.launch{
            val d=PilotDatabase.get(this@StudyTimerService,uid.takeIf{it.isNotEmpty()}).dao()
            if(command==PAUSE||command==RESUME)d.changeTimer(id,SystemClock.elapsedRealtime(),TimerNotices.boot(this@StudyTimerService),command==RESUME)
            d.timer().collect{t->
                if(activeOwner(this@StudyTimerService)!=uid||t==null||t.sessionId!=id){finish();return@collect}
                if(t.startedElapsed!=null&&t.boot!=TimerNotices.boot(this@StudyTimerService)){d.changeTimer(id,SystemClock.elapsedRealtime(),TimerNotices.boot(this@StudyTimerService),false);return@collect}
                update(t,uid)
            }
        }
        return START_STICKY
    }
    private fun update(t:Timer,uid:String){
        val elapsed=TimerClock.elapsed(t,SystemClock.elapsedRealtime(),TimerNotices.boot(this))
        TimerNotices.schedule(this,t,elapsed,uid)
        try{getSystemService(NotificationManager::class.java).notify(TimerNotices.ACTIVE_ID,notification(t))}catch(_:SecurityException){}
        deadline?.cancel()
        if(t.startedElapsed!=null&&t.goalSeconds>0){
            deadline=scope.launch{
                delay(((t.goalSeconds-elapsed).coerceAtLeast(0))*1000)
                val latest=PilotDatabase.get(this@StudyTimerService,uid.takeIf{it.isNotEmpty()}).dao().currentTimer()
                if(latest?.sessionId==t.sessionId&&latest.startedElapsed!=null&&activeOwner(this@StudyTimerService)==uid&&TimerClock.elapsed(latest,SystemClock.elapsedRealtime(),TimerNotices.boot(this@StudyTimerService))>=latest.goalSeconds)TimerNotices.reached(this@StudyTimerService,latest)
            }
        }
    }
    private fun action(action:String)=PendingIntent.getService(this,if(action==PAUSE)910 else 911,Intent(this,StudyTimerService::class.java).setAction(action).setData(Uri.parse("gabaritei://timer-control/$session/$action")).putExtra("owner",owner).putExtra("session",session).putExtra("title",title),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    private fun notification(t:Timer?):Notification{
        val running=t?.startedElapsed!=null
        val elapsed=t?.let{TimerClock.elapsed(it,SystemClock.elapsedRealtime(),TimerNotices.boot(this))}?:0
        val state=if(t==null)"Abrindo cronômetro" else if(running)"Estudando agora" else "Estudo pausado · ${formatTime(elapsed)}"
        val n=NotificationCompat.Builder(this,TimerNotices.ACTIVE_CHANNEL).setSmallIcon(R.drawable.book_outline).setContentTitle(state).setContentText(title)
            .setContentIntent(TimerNotices.open(this,session)).setOngoing(true).setOnlyAlertOnce(true).setSilent(true).setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE).setWhen(System.currentTimeMillis()-elapsed*1000).setShowWhen(running).setUsesChronometer(running)
        if(t!=null)n.addAction(0,if(running)"Pausar"else"Retomar",action(if(running)PAUSE else RESUME))
        n.addAction(0,"Abrir cronômetro",TimerNotices.open(this,session))
        return n.build()
    }
    private fun finish(){TimerNotices.cancel(this);getSystemService(NotificationManager::class.java).cancel(903);getSharedPreferences("timer_runtime",0).edit().clear().apply();stopForeground(STOP_FOREGROUND_REMOVE);stopSelf()}
    override fun onDestroy(){scope.cancel();super.onDestroy()}
    companion object{
        private const val PAUSE="br.com.gabaritei.TIMER_PAUSE"
        private const val RESUME="br.com.gabaritei.TIMER_RESUME"
        fun activeOwner(c:Context)=c.getSharedPreferences("study_reminders",0).getString("owner","").orEmpty()
        fun connect(c:Context,t:Timer,owner:String,title:String):Boolean=try{
            ContextCompat.startForegroundService(c,Intent(c,StudyTimerService::class.java).putExtra("owner",owner).putExtra("session",t.sessionId).putExtra("title",title));true
        }catch(_:IllegalStateException){false}catch(_:SecurityException){false}
        fun stop(c:Context){TimerNotices.cancel(c);c.stopService(Intent(c,StudyTimerService::class.java));c.getSystemService(NotificationManager::class.java).cancel(TimerNotices.ACTIVE_ID);c.getSystemService(NotificationManager::class.java).cancel(903);c.getSharedPreferences("timer_runtime",0).edit().clear().apply()}
        private fun formatTime(seconds:Long)="%02d:%02d:%02d".format(seconds/3600,(seconds%3600)/60,seconds%60)
    }
}
