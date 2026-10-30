package br.com.gabaritei.piloto

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable internal fun PrimaryNavigation(tab:Int,more:Boolean,onNavigate:(Int)->Unit,onStudy:()->Unit,onMore:()->Unit){
    NavigationBar(containerColor=MaterialTheme.colorScheme.surface,tonalElevation=0.dp){
        listOf(0 to "Hoje",8 to "Edital",-1 to "Estudar",5 to "Planejar",-2 to "Mais").forEach{(id,label)->
            NavigationBarItem(selected=if(id==-2)more||tab !in listOf(0,8,5) else id==tab,onClick={when(id){-1->onStudy();-2->onMore();else->onNavigate(id)}},label={Text(label,fontSize=10.sp,lineHeight=14.sp)},icon={
                when(id){
                    0->Icon(Icons.Outlined.Home,null)
                    8->Icon(painterResource(R.drawable.book_outline),null)
                    -1->Surface(Modifier.size(34.dp),shape=CircleShape,color=MaterialTheme.colorScheme.primary){Box(contentAlignment=Alignment.Center){Icon(Icons.Outlined.Add,null,Modifier.size(23.dp),tint=MaterialTheme.colorScheme.onPrimary)}}
                    5->Icon(Icons.Outlined.DateRange,null)
                    else->Icon(Icons.Outlined.Menu,null)
                }
            })
        }
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun MoreNavigationSheet(onClose:()->Unit,onNavigate:(Int)->Unit,onProfile:()->Unit,onReminders:()->Unit){
    ModalBottomSheet(onDismissRequest=onClose,sheetState=rememberModalBottomSheetState(skipPartiallyExpanded=true),containerColor=MaterialTheme.colorScheme.surface){
        Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(bottom=16.dp)){
            Text("Mais opções",Modifier.padding(horizontal=20.dp,vertical=8.dp),style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold)
            listOf(2 to "Caderno de questões",3 to "Estatísticas",1 to "Planos de estudo",7 to "Revisões",4 to "Histórico",6 to "Organizar disciplinas").forEach{(id,label)->
                ListItem(headlineContent={Text(label,style=MaterialTheme.typography.bodyMedium)},leadingContent={when(id){3->Icon(painterResource(R.drawable.stats_outline),null);7,4->Icon(painterResource(R.drawable.history_outline),null);1->Icon(Icons.Outlined.DateRange,null);else->Icon(painterResource(R.drawable.book_outline),null)}},modifier=Modifier.fillMaxWidth().clickableItem{onClose();onNavigate(id)})
            }
            HorizontalDivider(Modifier.padding(horizontal=20.dp))
            ListItem(headlineContent={Text("Lembretes",style=MaterialTheme.typography.bodyMedium)},leadingContent={Icon(Icons.Outlined.Notifications,null)},modifier=Modifier.fillMaxWidth().clickableItem{onClose();onReminders()})
            ListItem(headlineContent={Text("Perfil e preferências",style=MaterialTheme.typography.bodyMedium)},leadingContent={Icon(Icons.Outlined.AccountCircle,null)},modifier=Modifier.fillMaxWidth().clickableItem{onClose();onProfile()})
        }
    }
}
private fun Modifier.clickableItem(action:()->Unit)=this.then(Modifier.clickable(role=androidx.compose.ui.semantics.Role.Button,onClick=action))
@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun StudyActionsSheet(title:String,onClose:()->Unit,onStart:()->Unit,onRecord:()->Unit,onFree:()->Unit,canStart:Boolean){
    ModalBottomSheet(onDismissRequest=onClose,sheetState=rememberModalBottomSheetState(skipPartiallyExpanded=true),containerColor=MaterialTheme.colorScheme.surface){
        Column(Modifier.padding(horizontal=20.dp).padding(bottom=24.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
            Text("Vamos estudar?",style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold)
            Text(title,style=MaterialTheme.typography.bodyMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)
            Button(enabled=canStart,onClick={onClose();onStart()},modifier=Modifier.fillMaxWidth()){Icon(Icons.Outlined.PlayArrow,null);Spacer(Modifier.width(8.dp));Text("Iniciar estudo")}
            OutlinedButton(onClick={onClose();onRecord()},modifier=Modifier.fillMaxWidth()){Text("Registrar estudo")}
            TextButton(onClick={onClose();onFree()},modifier=Modifier.fillMaxWidth()){Text("Registrar estudo livre")}
        }
    }
}
@Composable internal fun DashboardMetric(label:String,value:String,detail:String,ratio:Float?,modifier:Modifier,onClick:()->Unit){
    Card(onClick=onClick,modifier=modifier,shape=RoundedCornerShape(16.dp),border=BorderStroke(1.dp,MaterialTheme.colorScheme.outlineVariant),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface)){
        Column(Modifier.padding(14.dp),verticalArrangement=Arrangement.spacedBy(7.dp)){
            Row(verticalAlignment=Alignment.CenterVertically){Text(label,Modifier.weight(1f),style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onSurfaceVariant);Icon(Icons.Outlined.KeyboardArrowRight,null,Modifier.size(17.dp),tint=MaterialTheme.colorScheme.primary)}
            Text(value,style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Bold)
            Text(detail,style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
            LinearProgressIndicator(progress={ratio?:0f},modifier=Modifier.fillMaxWidth().height(4.dp),color=MaterialTheme.colorScheme.primary,trackColor=MaterialTheme.colorScheme.surfaceVariant)
        }
    }
}
