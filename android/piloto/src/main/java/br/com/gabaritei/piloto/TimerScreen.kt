package br.com.gabaritei.piloto

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

internal fun timerTime(seconds:Long)="%02d:%02d:%02d".format(seconds/3600,(seconds%3600)/60,seconds%60)
@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun TimerScreen(t:Timer,topic:String,discipline:String,elapsedNow:()->Long,noticeAllowed:Boolean,alerts:Boolean,precise:Boolean,onBack:()->Unit,onPause:()->Unit,onFinish:()->Unit,onDiscard:()->Unit,onNotifications:()->Unit,onPrecision:()->Unit,snackbar:SnackbarHostState,syncFeedback:@Composable ()->Unit={}){
    var elapsed by remember(t){mutableLongStateOf(elapsedNow())}
    LaunchedEffect(t){while(true){elapsed=elapsedNow();delay(1000)}}
    BackHandler(onBack=onBack)
    val reached=t.goalSeconds>0&&elapsed>=t.goalSeconds
    Scaffold(snackbarHost={SnackbarHost(snackbar)},topBar={Column{TopAppBar(title={Text("Cronômetro")},navigationIcon={IconButton(onClick=onBack){Icon(Icons.AutoMirrored.Outlined.ArrowBack,"Voltar à tela inicial")}});syncFeedback()}}){padding->
        Column(Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(horizontal=24.dp,vertical=16.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(18.dp)){
            Text(if(reached)"Meta atingida 🎯"else if(t.startedElapsed==null)"Estudo pausado"else"Hora de focar",color=MaterialTheme.colorScheme.primary,style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.SemiBold)
            if(discipline.isNotBlank())Text(discipline,style=MaterialTheme.typography.titleMedium,textAlign=TextAlign.Center)
            Text(topic.ifBlank{"Seu estudo está salvo neste aparelho"},style=MaterialTheme.typography.bodyMedium,color=MaterialTheme.colorScheme.onSurfaceVariant,textAlign=TextAlign.Center)
            Box(Modifier.size(260.dp),contentAlignment=Alignment.Center){
                CircularProgressIndicator(progress={if(t.goalSeconds<=0)0f else (elapsed.toFloat()/t.goalSeconds).coerceIn(0f,1f)},modifier=Modifier.fillMaxSize(),strokeWidth=5.dp,trackColor=MaterialTheme.colorScheme.outlineVariant)
                Column(horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(8.dp)){
                    Text("TEMPO ESTUDADO",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(timerTime(elapsed),fontSize=40.sp,lineHeight=48.sp,fontWeight=FontWeight.SemiBold,fontFamily=androidx.compose.ui.text.font.FontFamily.Monospace)
                    Text(if(t.goalSeconds<=0)"Tempo livre"else "Meta de ${t.goalSeconds/60} min",style=MaterialTheme.typography.bodyMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if(reached)Text("Você pode continuar ou concluir para registrar este estudo.",style=MaterialTheme.typography.bodyMedium,textAlign=TextAlign.Center)
            else if(t.goalSeconds>0)Text("Faltam ${timerTime((t.goalSeconds-elapsed).coerceAtLeast(0))}",style=MaterialTheme.typography.bodyMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp)){
                OutlinedButton(onClick=onPause,modifier=Modifier.weight(1f).heightIn(min=52.dp),shape=RoundedCornerShape(12.dp)){Text(if(t.startedElapsed==null)"Retomar"else"Pausar")}
                Button(onClick=onFinish,modifier=Modifier.weight(1f).heightIn(min=52.dp),shape=RoundedCornerShape(12.dp)){Text("Concluir")}
            }
            if(!noticeAllowed||!alerts)Surface(shape=RoundedCornerShape(12.dp),color=MaterialTheme.colorScheme.secondaryContainer){Column(Modifier.fillMaxWidth().padding(14.dp),verticalArrangement=Arrangement.spacedBy(6.dp)){
                Text(if(!noticeAllowed)"Notificações desativadas"else"Aviso da meta desativado",style=MaterialTheme.typography.titleSmall)
                Text("Ative para acompanhar o tempo fora do app e receber o aviso ao atingir a meta.",style=MaterialTheme.typography.bodySmall)
                TextButton(onClick=onNotifications){Text("Ativar notificações")}
            }}
            if(noticeAllowed&&alerts&&t.goalSeconds>0&&!precise)Surface(shape=RoundedCornerShape(12.dp),color=MaterialTheme.colorScheme.surfaceVariant){Column(Modifier.fillMaxWidth().padding(14.dp)){
                Text("Permita alarmes precisos para receber o aviso no horário, inclusive com a tela bloqueada.",style=MaterialTheme.typography.bodySmall)
                TextButton(onClick=onPrecision){Text("Permitir aviso preciso")}
            }}
            TextButton(onClick=onDiscard){Text("Descartar cronômetro",color=MaterialTheme.colorScheme.onSurfaceVariant)}
            Text("Voltar à inicial mantém seu estudo em andamento.",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant,textAlign=TextAlign.Center)
        }
    }
}
