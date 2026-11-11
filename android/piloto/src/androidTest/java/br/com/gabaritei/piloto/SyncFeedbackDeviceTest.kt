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
@OptIn(ExperimentalMaterial3Api::class)
class SyncFeedbackDeviceTest {
    @Test fun feedbackDistinguishesWorkOfflineAndConfirmedCompletion(){
        val instrument=InstrumentationRegistry.getInstrumentation();val c=instrument.targetContext
        require(c.packageName.endsWith(".qa"))
        val auth=AccountSync(c);check(auth.auth.currentUser==null);auth.close()
        val state=mutableStateOf(SyncStatus(busy=true));val pending=mutableStateOf(1);val online=mutableStateOf(true);val menu=mutableStateOf(false);var destination=-1
        fun capture(name:String){instrument.uiAutomation.takeScreenshot()?.let{image->File(c.getExternalFilesDir(null),name).outputStream().use{image.compress(Bitmap.CompressFormat.PNG,100,it)};image.recycle()}}
        val ui=instrument.uiAutomation
        fun nodeFor(text:String):android.view.accessibility.AccessibilityNodeInfo? {
            fun contains(node:android.view.accessibility.AccessibilityNodeInfo?):android.view.accessibility.AccessibilityNodeInfo? {
                if(node==null)return null
                if(node.isVisibleToUser&&(node.text?.contains(text)==true||node.contentDescription?.contains(text)==true))return node
                return (0 until node.childCount).firstNotNullOfOrNull{contains(node.getChild(it))}
            }
            return contains(ui.rootInActiveWindow)
        }
        fun visible(text:String)=nodeFor(text)!=null
        fun waitFor(text:String,shown:Boolean=true){val until=SystemClock.elapsedRealtime()+6000;while(SystemClock.elapsedRealtime()<until){if(visible(text)==shown)return;SystemClock.sleep(100)};val root=ui.rootInActiveWindow;if(root?.packageName?.toString()==c.packageName)capture("sync-failure.png");throw AssertionError("Estado visual: $text / $shown; janela: ${root?.packageName}")}
        ActivityScenario.launch(MainActivity::class.java).use{scenario->
            scenario.onActivity{activity->activity.setShowWhenLocked(true);activity.setTurnScreenOn(true);activity.window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);activity.setContent{GabariteiTheme("dark"){
                val intro=rememberStudyIntro()
                Surface{Box(Modifier.fillMaxSize(),contentAlignment=Alignment.TopCenter){
                    Scaffold(modifier=Modifier.widthIn(max=360.dp).fillMaxHeight(),topBar={StudyTopBar("Gabaritei OS","",state.value,pending.value,false,true,online.value,{},{})}){padding->
                        Box(Modifier.fillMaxSize().padding(padding),contentAlignment=Alignment.Center){if(intro)StudyLoading()else Text("Seu histórico continua salvo neste aparelho.",style=MaterialTheme.typography.bodyMedium)}
                    }
                    if(menu.value)MoreNavigationSheet({menu.value=false},{destination=it},{},{},onEssays={destination=9})
                }}
            }}}
            waitFor("Preparando seus estudos…");val introSeen=SystemClock.elapsedRealtime();SystemClock.sleep(420);capture("brand-loading.png")
            waitFor("Seu histórico continua salvo neste aparelho.")
            assertTrue("A abertura não pode aguardar o fim da nuvem",SystemClock.elapsedRealtime()-introSeen<3300)
            waitFor("Preparando seus estudos…",false)
            fun bounds(text:String)=android.graphics.Rect().also{nodeFor(text)!!.getBoundsInScreen(it)}
            waitFor("Sincronizando…");capture("sync-busy.png")
            val title=bounds("Gabaritei OS");val sync=bounds("Sincronizando…");val photo=bounds("Conta e sincronização")
            assertTrue("Sync deve ficar à esquerda da foto",sync.right<=photo.centerX())
            assertTrue("Sync deve usar a mesma linha do título",kotlin.math.abs(sync.centerY()-title.centerY())<12)
            assertTrue("Foto deve usar a mesma linha do título",kotlin.math.abs(photo.centerY()-title.centerY())<12)
            instrument.runOnMainSync{online.value=false};waitFor("Sem conexão · salvo neste aparelho");waitFor("Sincronizando…",false);capture("sync-offline.png")
            instrument.runOnMainSync{online.value=true};waitFor("Sincronizando…")
            instrument.runOnMainSync{state.value=SyncStatus("Sincronizado");pending.value=0};waitFor("Tudo atualizado");capture("sync-done.png")
            waitFor("Tudo atualizado",false)
            val items=listOf("Planos de estudo" to 1,"Caderno de questões" to 2,"Redações" to 9,"Estatísticas" to 3,"Histórico" to 4)
            instrument.runOnMainSync{menu.value=true};waitFor("Organizar disciplinas");SystemClock.sleep(400);capture("more-menu.png")
            val tops=items.map{bounds(it.first).top};assertEquals(tops.sorted(),tops);assertEquals(tops.size,tops.distinct().size)
            items.forEach{(label,id)->
                instrument.runOnMainSync{menu.value=true};waitFor(label)
                var node=nodeFor(label)!!
                while(!node.isClickable&&node.parent!=null)node=node.parent?:break
                assertTrue(node.performAction(android.view.accessibility.AccessibilityNodeInfo.ACTION_CLICK))
                waitFor("Mais opções",false);instrument.waitForIdleSync();assertEquals(id,destination)
            }
        }
    }
}
