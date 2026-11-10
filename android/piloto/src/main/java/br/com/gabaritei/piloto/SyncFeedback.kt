package br.com.gabaritei.piloto

import androidx.compose.foundation.background
import androidx.compose.foundation.Image
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

data class SyncFeedbackState(val text:String,val busy:Boolean=false,val attention:Boolean=false)
object SyncFeedbackRules {
    fun current(sync:SyncStatus,pending:Int,catalogBusy:Boolean,connected:Boolean,online:Boolean=true):SyncFeedbackState?=when{
        connected&&!online -> SyncFeedbackState("Sem conexão · salvo neste aparelho",attention=true)
        connected&&sync.failed -> SyncFeedbackState(if(sync.conflict)"Revisar sincronização"else"Salvo neste aparelho",attention=true)
        connected&&(sync.busy||pending>0) -> SyncFeedbackState("Sincronizando…",busy=true)
        catalogBusy -> SyncFeedbackState("Atualizando planos…",busy=true)
        else -> null
    }
}

@Composable internal fun StudySyncFeedback(sync:SyncStatus,pending:Int,catalogBusy:Boolean,connected:Boolean,online:Boolean=true,onOpen:()->Unit){
    val current=SyncFeedbackRules.current(sync,pending,catalogBusy,connected,online)
    var visible by remember{mutableStateOf<SyncFeedbackState?>(null)}
    var showedWork by remember{mutableStateOf(false)}
    LaunchedEffect(current){
        if(current?.busy==true){delay(300);visible=current;showedWork=true}
        else if(current?.attention==true){visible=current;showedWork=false}
        else if(showedWork){visible=SyncFeedbackState("Tudo atualizado");showedWork=false;delay(1800);visible=null}
        else visible=null
    }
    visible?.let{status->
        val color=if(status.attention)MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
        IconButton(onClick=onOpen,modifier=Modifier.semantics{liveRegion=LiveRegionMode.Polite;contentDescription=status.text}){
            Surface(shape=CircleShape,color=color.copy(alpha=.08f),contentColor=color){
                Box(Modifier.size(30.dp).clearAndSetSemantics{},contentAlignment=Alignment.Center){
                    if(status.busy)StudySyncOrbit(20)else Text(if(status.attention)"!"else"✓",fontSize=16.sp,fontWeight=FontWeight.Bold)
                }
            }
        }
    }
}

/** The branded introduction is bounded; cloud synchronization remains independent. */
@Composable internal fun rememberStudyIntro():Boolean {
    var visible by androidx.compose.runtime.saveable.rememberSaveable{mutableStateOf(true)}
    LaunchedEffect(Unit){delay(2600);visible=false}
    return visible
}

@Composable private fun StudySyncOrbit(size:Int){
    Box(Modifier.size(size.dp),contentAlignment=Alignment.Center){
        CircularProgressIndicator(Modifier.fillMaxSize(),strokeWidth=2.dp,trackColor=MaterialTheme.colorScheme.primary.copy(alpha=.15f))
        Box(Modifier.size((size/3).dp).background(MaterialTheme.colorScheme.primary,CircleShape))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun StudyTopBar(title:String,photo:String,sync:SyncStatus,pending:Int,catalogBusy:Boolean,connected:Boolean,online:Boolean,onHome:()->Unit,onAccount:()->Unit){
    TopAppBar(
        colors=TopAppBarDefaults.topAppBarColors(containerColor=MaterialTheme.colorScheme.background),
        navigationIcon={IconButton(onClick=onHome){Image(painterResource(R.drawable.pilot_icon),"Página inicial",Modifier.size(26.dp))}},
        title={Text(title,fontWeight=FontWeight.SemiBold,fontSize=18.sp,lineHeight=24.sp,maxLines=1,overflow=androidx.compose.ui.text.style.TextOverflow.Ellipsis)},
        actions={
            StudySyncFeedback(sync,pending,catalogBusy,connected,online,onAccount)
            IconButton(onClick=onAccount){ProfileAvatar(photo,Modifier.size(28.dp).semantics{contentDescription="Conta e sincronização"})}
        }
    )
}

@Composable internal fun StudyLoading(){
    val c=LocalContext.current
    val motion=android.provider.Settings.Global.getFloat(c.contentResolver,android.provider.Settings.Global.ANIMATOR_DURATION_SCALE,1f)>0f
    val density=LocalDensity.current.density
    val transition=rememberInfiniteTransition(label="marca-gabaritei")
    val hop by transition.animateFloat(0f,0f,infiniteRepeatable(keyframes{durationMillis=2400;0f at 0;-28f at 420;0f at 780;-9f at 970;0f at 1160;0f at 2400}),label="salto")
    val lean by transition.animateFloat(0f,0f,infiniteRepeatable(keyframes{durationMillis=2400;0f at 0;-15f at 420;0f at 780;7f at 970;0f at 1160;0f at 2400}),label="giro")
    val squash by transition.animateFloat(1f,1f,infiniteRepeatable(keyframes{durationMillis=2400;1f at 0;1f at 650;.82f at 780;1.05f at 970;1f at 1160;1f at 2400}),label="pouso")
    val sparkle by transition.animateFloat(0f,0f,infiniteRepeatable(keyframes{durationMillis=2400;0f at 0;0f at 740;.8f at 830;0f at 1450;0f at 2400}),label="brilho")
    Column(horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(6.dp)){
        Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)){
            Box(Modifier.size(58.dp,82.dp),contentAlignment=Alignment.Center){
                Box(Modifier.align(Alignment.BottomCenter).padding(bottom=7.dp).size(28.dp,3.dp).background(MaterialTheme.colorScheme.primary.copy(alpha=.12f),CircleShape))
                Image(painterResource(R.drawable.pilot_icon),null,Modifier.size(44.dp).graphicsLayer{
                    if(motion){translationY=hop*density;rotationZ=lean;scaleY=squash;scaleX=2f-squash}
                })
                if(motion)listOf(3.dp to 43.dp,49.dp to 40.dp,44.dp to 62.dp).forEachIndexed{i,offset->
                    Box(Modifier.align(Alignment.TopStart).offset(offset.first,offset.second).size(if(i==0)4.dp else 3.dp).graphicsLayer{alpha=sparkle}.background(MaterialTheme.colorScheme.primary,CircleShape))
                }
            }
            Text("Gabaritei OS",fontSize=25.sp,fontWeight=FontWeight.Bold,color=MaterialTheme.colorScheme.onSurface)
        }
        Text("Preparando seus estudos…",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
