package br.com.gabaritei.piloto

import android.app.Application
import androidx.lifecycle.ViewModelProvider
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ScheduledTimerTest {
    @Test fun actualStartUsesScheduledHourRatherThanFiftyMinutePreference()=runBlocking {
        val instrumentation=InstrumentationRegistry.getInstrumentation();val c=instrumentation.targetContext
        check(c.packageName.endsWith(".qa"));val auth=AccountSync(c);check(auth.auth.currentUser==null);auth.close()
        val dao=PilotDatabase.get(c).dao();check(dao.currentTimer()==null)
        ActivityScenario.launch(MainActivity::class.java).use{scenario->
            lateinit var vm:PilotViewModel
            scenario.onActivity{vm=ViewModelProvider(it)[PilotViewModel::class.java]}
            withTimeout(15000){vm.ready.first{it}}
            val base=vm.plans.value.first{it.topics.isNotEmpty()}
            val created=CompletableDeferred<String?>()
            instrumentation.runOnMainSync{vm.createPlan(base,Routine((1..7).toSet(),120,60)){created.complete(it)}}
            assertNull(withTimeout(15000){created.await()})
            val plan=withTimeout(10000){vm.plans.first{it.any{p->p.enrolled&&p.id==base.id}}}.first{it.enrolled&&it.id==base.id}
            val raw=dao.currentSnapshot()!!.json
            val topic=plan.topics.first{StudyGoals.minutes(raw,plan.id,it.id,50)==60}
            c.getSharedPreferences("native_display",0).edit().putInt("focusMinutes",50).commit()
            try {
                instrumentation.runOnMainSync{vm.start(plan,topic)}
                val timer=withTimeout(10000){dao.timer().first{it!=null}}!!
                assertEquals(3600L,timer.goalSeconds)
                assertEquals(topic.id,timer.topicId)
                assertEquals(60,StudyGoals.minutes(raw,plan.id,topic.id,50))
            }finally {
                val timer=dao.currentTimer()
                if(timer!=null){var job:Job?=null;instrumentation.runOnMainSync{job=vm.discard(timer)};job?.join()}
            }
        }
    }
}
