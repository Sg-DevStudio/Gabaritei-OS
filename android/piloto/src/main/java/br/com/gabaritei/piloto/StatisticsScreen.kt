package br.com.gabaritei.piloto

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import java.time.LocalDate

@Composable fun StatisticsScreen(plan:Plan,activities:List<StudyActivity>,progress:List<Progress>){
    var period by rememberSaveable{mutableIntStateOf(7)};val today=LocalDate.now()
    val data=activities.filter{period==0||(!it.date.isBefore(today.minusDays(period.toLong()-1))&&!it.date.isAfter(today))}
    val minutes=data.sumOf{it.minutes};val q=data.sumOf{it.questions};val correct=data.sumOf{it.correct};val days=data.filter{it.minutes>0||it.questions>0}.map{it.date}.distinct()
    val completed=progress.count{it.planId==plan.id&&it.completed&&plan.topics.any{t->t.id==it.topicId}}
    Column(verticalArrangement=Arrangement.spacedBy(12.dp)){
        Text("Desempenho",style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold)
        Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){listOf(7 to "7 dias",30 to "30 dias",0 to "Tudo").forEach{(n,t)->FilterChip(selected=period==n,onClick={period=n},label={Text(t)})}}
        Row(horizontalArrangement=Arrangement.spacedBy(10.dp)){
            MetricTile("Tempo estudado","${(minutes/60).toInt()}h ${minutes.toInt()%60}min",Modifier.weight(1f))
            MetricTile("Acertos",StudyRules.percentage(correct,q)?.let{"$it%"}?:"—",Modifier.weight(1f))
        }
        Row(horizontalArrangement=Arrangement.spacedBy(10.dp)){
            MetricTile("Questões resolvidas","$q",Modifier.weight(1f))
            MetricTile("Progresso no edital","${StudyRules.percentage(completed,plan.topics.size)?:0}%",Modifier.weight(1f))
        }
        Block{
            Text("Estudo nos últimos 7 dias",style=MaterialTheme.typography.titleSmall,fontWeight=FontWeight.SemiBold)
            val series=(6 downTo 0).map{offset->val date=today.minusDays(offset.toLong());date to activities.filter{it.date==date}.sumOf{it.minutes}}
            val max=series.maxOf{it.second}.coerceAtLeast(1.0)
            Row(Modifier.fillMaxWidth().height(144.dp),horizontalArrangement=Arrangement.spacedBy(8.dp),verticalAlignment=Alignment.Bottom){series.forEach{(day,min)->
                Column(Modifier.weight(1f),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(5.dp)){
                    Text("${min.toInt()}m",fontSize=9.sp,lineHeight=12.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)
                    Surface(Modifier.width(18.dp).height((min/max*94).coerceAtLeast(3.0).dp),color=if(min>0)MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,shape=RoundedCornerShape(5.dp)){}
                    Text(listOf("S","T","Q","Q","S","S","D")[day.dayOfWeek.value-1],fontSize=10.sp,lineHeight=14.sp)
                }
            }}
            Text("${days.size} ${if(days.size==1)"dia" else "dias"} com estudo no período selecionado",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Block{
            Text("Por disciplina",style=MaterialTheme.typography.titleSmall,fontWeight=FontWeight.SemiBold)
            plan.disciplines.forEach{d->val samples=data.filter{it.discipline==d.id};val total=samples.sumOf{it.questions};val right=samples.sumOf{it.correct};val pct=StudyRules.percentage(right,total)
                Column(verticalArrangement=Arrangement.spacedBy(5.dp),modifier=Modifier.padding(vertical=6.dp)){
                    Row(verticalAlignment=Alignment.CenterVertically){Text(d.name,Modifier.weight(1f),fontSize=12.sp,lineHeight=17.sp);Text(pct?.let{"$it%"}?:"—",fontSize=12.sp,lineHeight=17.sp,fontWeight=FontWeight.SemiBold)}
                    LinearProgressIndicator(progress={(pct?:0)/100f},modifier=Modifier.fillMaxWidth().height(5.dp),trackColor=MaterialTheme.colorScheme.surfaceVariant)
                    Text(if(total==0)"Sem questões no período" else "$right acertos em $total questões",fontSize=10.sp,lineHeight=14.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
        Block{Text("Consistência",style=MaterialTheme.typography.titleSmall,fontWeight=FontWeight.SemiBold);Text("Maior sequência: ${StudyMetrics.streak(days)} dias",style=MaterialTheme.typography.bodyMedium)
            Text("Média por dia estudado: ${if(days.isEmpty())0 else (minutes/days.size).toInt()} min",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
    }
}
@Composable private fun MetricTile(label:String,value:String,modifier:Modifier){
    Card(modifier,shape=RoundedCornerShape(16.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface),border=androidx.compose.foundation.BorderStroke(1.dp,MaterialTheme.colorScheme.outlineVariant)){
        Column(Modifier.padding(14.dp),verticalArrangement=Arrangement.spacedBy(8.dp)){Text(label,fontSize=11.sp,lineHeight=15.sp,color=MaterialTheme.colorScheme.onSurfaceVariant);Text(value,fontSize=23.sp,lineHeight=30.sp,fontWeight=FontWeight.Bold)}
    }
}
@Composable fun AchievementsDialog(achievements:List<Achievement>,onClose:()->Unit){
    Dialog(onDismissRequest=onClose){Surface(shape=RoundedCornerShape(24.dp),color=MaterialTheme.colorScheme.background){Column(Modifier.padding(16.dp).heightIn(max=680.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){
        Text("🏆  Conquistas",style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold)
        Text("${achievements.count{it.earned}} de ${achievements.size} desbloqueadas",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
        LazyColumn(Modifier.weight(1f,false),verticalArrangement=Arrangement.spacedBy(8.dp)){
            items(achievements.chunked(2)){pair->Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){pair.forEach{a->
                Card(Modifier.weight(1f),shape=RoundedCornerShape(14.dp),colors=CardDefaults.cardColors(containerColor=if(a.earned)MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface),border=androidx.compose.foundation.BorderStroke(1.dp,MaterialTheme.colorScheme.outlineVariant)){
                    Column(Modifier.padding(10.dp).heightIn(min=100.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(5.dp)){
                        Text(a.icon,fontSize=26.sp,lineHeight=32.sp);Text(a.name,fontSize=11.sp,lineHeight=15.sp,fontWeight=FontWeight.SemiBold)
                        Text(a.description,fontSize=9.sp,lineHeight=12.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)
                        if(a.earned)Text("Conquistado",fontSize=9.sp,lineHeight=12.sp,color=MaterialTheme.colorScheme.primary)
                    }
                }
            }}}
        }
        TextButton(onClick=onClose,modifier=Modifier.align(Alignment.End)){Text("Fechar")}
    }}}
}
