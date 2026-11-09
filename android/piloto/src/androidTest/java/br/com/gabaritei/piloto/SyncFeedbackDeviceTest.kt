package br.com.gabaritei.piloto

import android.graphics.Bitmap
import android.os.SystemClock
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

/** Synthetic UI states only; never signs in, modifies connectivity or opens student data. */
@RunWith(AndroidJUnit4::class)
class SyncFeedbackDeviceTest {
    @Test fun feedbackDistinguishesWorkOfflineAndConfirmedCompletion(){
        val instrument=InstrumentationRegistry.getInstrumentation();val c=instrument.targetContext
        require(c.packageName.endsWith(".qa"))
        val auth=AccountSync(c);check(auth.auth.currentUser==null);auth.close()
        val state=mutableStateOf(SyncStatus(busy=true));val pending=mutableStateOf(1);val online=mutableStateOf(true);val loading=mutableStateOf(true)
        fun capture(name:String){instrument.uiAutomation.takeScreenshot()?.let{image->File(c.getExternalFilesDir(null),name).outputStream().use{image.compress(Bitmap.CompressFormat.PNG,100,it)};image.recycle()}}
        val ui=instrument.uiAutomation
        fun visible(text:String):Boolean {
            fun contains(node:android.view.accessibility.AccessibilityNodeInfo?):Boolean {
                if(node==null)return false
                if(node.isVisibleToUser&&(node.text?.contains(text)==true||node.contentDescription?.contains(text)==true))return true
                return (0 until node.childCount).any{contains(node.getChild(it))}
            }
            return contains(ui.rootInActiveWindow)
        }
        fun waitFor(text:String,shown:Boolean=true){val until=SystemClock.elapsedRealtime()+6000;while(SystemClock.elapsedRealtime()<until){if(visible(text)==shown)return;SystemClock.sleep(100)};val root=ui.rootInActiveWindow;if(root?.packageName?.toString()==c.packageName)capture("sync-failure.png");throw AssertionError("Estado visual: $text / $shown; janela: ${root?.packageName}")}
        ActivityScenario.launch(MainActivity::class.java).use{scenario->
            scenario.onActivity{activity->activity.setShowWhenLocked(true);activity.setTurnScreenOn(true);activity.window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);activity.setContent{GabariteiTheme{Surface{if(loading.value)Box(Modifier.fillMaxSize(),contentAlignment=Alignment.Center){StudyLoading()}else Column(Modifier.fillMaxSize().padding(20.dp),verticalArrangement=Arrangement.spacedBy(18.dp)){
                Text("Gabaritei OS",style=MaterialTheme.typography.titleLarge)
                StudySyncFeedback(state.value,pending.value,false,true,online.value){}
                Text("Seu histórico continua salvo neste aparelho.",style=MaterialTheme.typography.bodyMedium)
            }}}}}
            waitFor("Preparando seus estudos…");SystemClock.sleep(420);capture("brand-loading.png");instrument.runOnMainSync{loading.value=false}
            waitFor("Sincronizando…");capture("sync-busy.png")
            instrument.runOnMainSync{online.value=false};waitFor("Sem conexão · salvo neste aparelho");waitFor("Sincronizando…",false);capture("sync-offline.png")
            instrument.runOnMainSync{online.value=true};waitFor("Sincronizando…")
            instrument.runOnMainSync{state.value=SyncStatus("Sincronizado");pending.value=0};waitFor("Tudo atualizado");capture("sync-done.png")
            waitFor("Tudo atualizado",false)
        }
    }
}
