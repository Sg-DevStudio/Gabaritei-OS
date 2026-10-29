package br.com.gabaritei.piloto

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import java.time.Instant
import java.time.ZoneId
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun StudyDateField(label:String,value:String,onChange:(String)->Unit){
    var open by remember{mutableStateOf(false)}
    OutlinedButton(onClick={open=true},modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(10.dp)){
        Text("$label: ${runCatching{LocalDate.parse(value).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))}.getOrDefault(value)}",Modifier.weight(1f),fontSize=12.sp)
    }
    if(open){val initial=runCatching{LocalDate.parse(value)}.getOrDefault(LocalDate.now());val picker=rememberDatePickerState(initialSelectedDateMillis=initial.atStartOfDay(java.time.ZoneOffset.UTC).toInstant().toEpochMilli())
        DatePickerDialog(onDismissRequest={open=false},confirmButton={TextButton(onClick={picker.selectedDateMillis?.let{onChange(Instant.ofEpochMilli(it).atZone(java.time.ZoneOffset.UTC).toLocalDate().toString())};open=false}){Text("Escolher")}},dismissButton={TextButton(onClick={open=false}){Text("Cancelar")}}){DatePicker(picker)}
    }
}
@Composable internal fun Choice(label:String,value:String,choices:List<Pair<String,String>>,onChange:(String)->Unit){
    var open by remember{mutableStateOf(false)}
    Box{OutlinedButton(onClick={open=true},modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(10.dp)){Text("$label: ${choices.find{it.first==value}?.second?:value}",Modifier.weight(1f),fontSize=12.sp,lineHeight=17.sp)}
        DropdownMenu(open,{open=false},modifier=Modifier.heightIn(max=320.dp)){choices.forEach{(key,name)->DropdownMenuItem(text={Text(name)},onClick={onChange(key);open=false})}}
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable fun StatisticsScreen(plan:Plan,activities:List<StudyActivity>,progress:List<Progress>,raw:String="{}",sessions:List<Session> = emptyList(),onOpen:(String)->Unit={}){
    var view by rememberSaveable{mutableIntStateOf(0)};var period by rememberSaveable{mutableIntStateOf(30)}
    var discipline by rememberSaveable(plan.id){mutableStateOf("")};var topic by rememberSaveable(plan.id){mutableStateOf("")};var kind by rememberSaveable{mutableStateOf("")}
    var includeFree by rememberSaveable{mutableStateOf(false)};var filters by remember{mutableStateOf(false)}
    var start by rememberSaveable{mutableStateOf("")};var end by rememberSaveable{mutableStateOf("")}
    val today=LocalDate.now()
    val free=remember(raw,sessions){StudyMetrics.freeActivities(sessions,raw)}
    val all=activities+if(includeFree)free else emptyList()
    val from=if(period<0)runCatching{LocalDate.parse(start)}.getOrDefault(today) else if(period==0)all.minOfOrNull{it.date}?:today else today.minusDays(period-1L)
    val until=if(period<0)runCatching{LocalDate.parse(end)}.getOrDefault(today)else today
    val data=all.filter{!it.date.isBefore(from)&&!it.date.isAfter(until)&&(discipline.isEmpty()||it.discipline==discipline)&&(topic.isEmpty()||it.topic==topic)&&(kind.isEmpty()||it.category==kind)}
    val minutes=data.sumOf{it.minutes};val q=data.sumOf{it.questions};val correct=data.sumOf{it.correct};val days=data.filter{it.minutes>0||it.questions>0}.map{it.date}.distinct()
    val pct=StudyRules.percentage(correct,q)
    Column(verticalArrangement=Arrangement.spacedBy(12.dp)){
        Row(verticalAlignment=Alignment.CenterVertically){Text("Estatísticas",Modifier.weight(1f),style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold);TextButton(onClick={filters=true}){Text("Filtros")}}
        Row(horizontalArrangement=Arrangement.spacedBy(5.dp)){listOf(7 to "7 dias",30 to "30 dias",90 to "90 dias",0 to "Tudo").forEach{(n,t)->FilterChip(period==n,{period=n},label={Text(t,fontSize=11.sp)})}}
        Text("${from.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))} a ${until.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))}${if(includeFree)" · Inclui estudos livres" else " · Somente este plano"}",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
        if(discipline.isNotEmpty()||topic.isNotEmpty()||kind.isNotEmpty())Row(verticalAlignment=Alignment.CenterVertically){Text(listOfNotNull(plan.disciplines.find{it.id==discipline}?.name,plan.topics.find{it.id==topic}?.name,kind.takeIf{it.isNotEmpty()}).joinToString(" · "),Modifier.weight(1f),style=MaterialTheme.typography.bodySmall);TextButton(onClick={discipline="";topic="";kind=""}){Text("Limpar")}}
        PrimaryTabRow(view){listOf("Resumo","Evolução","Disciplinas").forEachIndexed{i,t->Tab(view==i,{view=i},text={Text(t,fontSize=12.sp)})}}
        when(view){
            0->{
                Row(horizontalArrangement=Arrangement.spacedBy(10.dp)){MetricTile("Tempo estudado",StudyMetrics.time(minutes),Modifier.weight(1f));MetricTile("Acertos",pct?.let{"$it%"}?:"—",Modifier.weight(1f))}
                Block{Text(if(q==0)"Sem questões no período" else "${StudyMetrics.counted(q,"questão","questões")} · ${StudyMetrics.counted(correct,"acerto","acertos")} · ${StudyMetrics.counted(q-correct,"erro","erros")}",style=MaterialTheme.typography.bodyMedium);Text("${StudyMetrics.counted(days.size,"dia","dias")} com estudo · ${if(days.isEmpty())0 else (minutes/days.size).toInt()} min por dia estudado",style=MaterialTheme.typography.bodySmall)}
                val ts=plan.disciplines.filter{discipline.isEmpty()||it.id==discipline}.flatMap{it.topics}.filter{topic.isEmpty()||it.id==topic};val done=progress.count{it.planId==plan.id&&it.completed&&ts.any{t->t.id==it.topicId}}
                Block{Text("Progresso no edital",style=MaterialTheme.typography.titleSmall);Text("$done de ${ts.size} tópicos · ${StudyRules.percentage(done,ts.size)?:0}%",style=MaterialTheme.typography.bodyMedium);LinearProgressIndicator(progress={if(ts.isEmpty())0f else done.toFloat()/ts.size},modifier=Modifier.fillMaxWidth());Text("Acumulado do conteúdo selecionado; não depende do período.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
                Block{Text("Constância",style=MaterialTheme.typography.titleSmall);Text("Maior sequência no período: ${StudyMetrics.counted(StudyMetrics.streak(days),"dia","dias")}",style=MaterialTheme.typography.bodyMedium);val count=(java.time.temporal.ChronoUnit.DAYS.between(from,until)+1).coerceAtLeast(1);Text("Média em todos os dias do período: ${(minutes/count).toInt()} min",style=MaterialTheme.typography.bodySmall)}
                if(data.isEmpty())Text("Registre um estudo para acompanhar sua evolução.",style=MaterialTheme.typography.bodyMedium)
            }
            1->{
                Block{Text("Tempo nos 7 últimos dias do intervalo",style=MaterialTheme.typography.titleSmall);val series=(6 downTo 0).map{n->val day=until.minusDays(n.toLong());day to data.filter{it.date==day}.sumOf{it.minutes}};val max=series.maxOf{it.second}.coerceAtLeast(1.0)
                    Row(Modifier.fillMaxWidth().height(148.dp),horizontalArrangement=Arrangement.spacedBy(7.dp),verticalAlignment=Alignment.Bottom){series.forEach{(day,min)->Column(Modifier.weight(1f),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(5.dp)){Text("${min.toInt()}m",fontSize=9.sp,lineHeight=12.sp);Surface(Modifier.width(18.dp).height((min/max*90).coerceAtLeast(3.0).dp),color=if(min>0)MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,shape=RoundedCornerShape(5.dp)){};Text("${day.dayOfMonth}/${day.monthValue}",fontSize=9.sp,lineHeight=12.sp)}}}
                }
                Block{Text("Evolução por mês",style=MaterialTheme.typography.titleSmall);val months=data.groupBy{java.time.YearMonth.from(it.date)}.toSortedMap();if(months.isEmpty())Text("Sem registros neste intervalo.",style=MaterialTheme.typography.bodySmall)
                    months.forEach{(month,rows)->val total=rows.sumOf{it.questions};Text("${month.monthValue}/${month.year} · ${StudyMetrics.time(rows.sumOf{it.minutes})}",fontWeight=FontWeight.SemiBold,style=MaterialTheme.typography.bodyMedium);Text("$total questões · ${StudyRules.percentage(rows.sumOf{it.correct},total)?.let{"$it% de acertos"}?:"Sem questões"}",style=MaterialTheme.typography.bodySmall);HorizontalDivider()}
                }
                Block{Text("Ritmo por dia da semana",style=MaterialTheme.typography.titleSmall);val max=(1..7).maxOf{d->data.filter{it.date.dayOfWeek.value==d}.sumOf{it.minutes}}.coerceAtLeast(1.0)
                    (1..7).forEach{d->val min=data.filter{it.date.dayOfWeek.value==d}.sumOf{it.minutes};Text("${listOf("Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo")[d-1]} · ${StudyMetrics.time(min)}",style=MaterialTheme.typography.bodySmall);LinearProgressIndicator(progress={(min/max).toFloat()},modifier=Modifier.fillMaxWidth())};Text("Tempo acumulado em cada dia da semana no intervalo selecionado.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            2->{
                var sort by rememberSaveable{mutableStateOf("name")}
                Choice("Ordenar","$sort",listOf("name" to "Nome","accuracy" to "Menor acerto","questions" to "Mais questões")){sort=it}
                val ds=plan.disciplines.filter{discipline.isEmpty()||it.id==discipline}.sortedWith(when(sort){"accuracy"->compareBy{d->val rows=data.filter{it.discipline==d.id};StudyRules.percentage(rows.sumOf{it.correct},rows.sumOf{it.questions})?:101};"questions"->compareByDescending{d->data.filter{it.discipline==d.id}.sumOf{it.questions}};else->compareBy{it.name}})
                ds.forEach{d->var expanded by rememberSaveable(d.id){mutableStateOf(false)};val rows=data.filter{it.discipline==d.id};val total=rows.sumOf{it.questions};val right=rows.sumOf{it.correct};val accuracy=StudyRules.percentage(right,total)
                    Block{Text(d.name,fontWeight=FontWeight.SemiBold,fontSize=14.sp,lineHeight=20.sp);Text(accuracy?.let{"$it% · $right acertos em $total questões"}?:"Sem questões no período",style=MaterialTheme.typography.bodySmall);Text("Tempo: ${StudyMetrics.time(rows.sumOf{it.minutes})}",style=MaterialTheme.typography.bodySmall);TextButton(onClick={expanded=!expanded}){Text(if(expanded)"Recolher tópicos" else "Ver por tópico")}
                        if(expanded)d.topics.filter{topic.isEmpty()||it.id==topic}.forEach{t->val samples=rows.filter{it.topic==t.id};val n=samples.sumOf{it.questions};val hit=samples.sumOf{it.correct};HorizontalDivider();Text(t.name,fontSize=12.sp,lineHeight=17.sp);Text(if(n==0)"Sem questões neste intervalo" else "${StudyRules.percentage(hit,n)}% · $hit/$n acertos · ${n-hit} erros",style=MaterialTheme.typography.bodySmall);if(n in 1..9)Text("Poucas questões registradas.",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                            val link=StateCompat.links(raw).find{it.planId==plan.id&&it.topicId==t.id}?.url?:t.link
                            if(link!=null)TextButton(onClick={onOpen(link)}){Text("Resolver questões ↗")}
                        }
                    }
                }
                if(includeFree&&discipline.isEmpty())Block{Text("Estudos livres",fontWeight=FontWeight.SemiBold);val rows=data.filter{it.discipline==null&&!it.simulated};Text("${StudyMetrics.time(rows.sumOf{it.minutes})} · ${rows.sumOf{it.questions}} questões",style=MaterialTheme.typography.bodySmall)}
            }
        }
    }
    if(filters){var d by remember{mutableStateOf(discipline)};var t by remember{mutableStateOf(topic)};var k by remember{mutableStateOf(kind)};var f by remember{mutableStateOf(includeFree)};var a by remember{mutableStateOf(from.toString())};var b by remember{mutableStateOf(until.toString())};var err by remember{mutableStateOf<String?>(null)}
        AlertDialog(containerColor=MaterialTheme.colorScheme.surface,onDismissRequest={filters=false},title={Text("Filtros")},text={Column(Modifier.verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(8.dp)){
            StudyDateField("Início",a){a=it};StudyDateField("Fim",b){b=it}
            Choice("Disciplina",d,listOf("" to "Todas")+plan.disciplines.map{it.id to it.name}){d=it;t=""}
            Choice("Tópico",t,listOf("" to "Todos")+plan.disciplines.filter{d.isEmpty()||it.id==d}.flatMap{it.topics}.map{it.id to it.name}){t=it}
            Choice("Categoria",k,listOf("" to "Todas","teoria" to "Teoria","questoes" to "Questões","revisao" to "Revisão","simulado" to "Simulado")){k=it}
            Row(verticalAlignment=Alignment.CenterVertically){Checkbox(f,{f=it});Text("Incluir estudos livres",style=MaterialTheme.typography.bodySmall)};err?.let{Text(it,color=MaterialTheme.colorScheme.error)}
        }},confirmButton={TextButton(onClick={val first=runCatching{LocalDate.parse(a)}.getOrNull();val last=runCatching{LocalDate.parse(b)}.getOrNull();if(first==null||last==null||first>last||last>today)err="Confira as datas do intervalo."else{discipline=d;topic=t;kind=k;includeFree=f;start=a;end=b;period=-1;filters=false}}){Text("Aplicar")}},dismissButton={TextButton(onClick={discipline="";topic="";kind="";includeFree=false;period=30;filters=false}){Text("Limpar")}})
    }
}
@Composable private fun MetricTile(label:String,value:String,modifier:Modifier){Card(modifier,shape=RoundedCornerShape(14.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface),border=androidx.compose.foundation.BorderStroke(1.dp,MaterialTheme.colorScheme.outlineVariant)){Column(Modifier.padding(14.dp),verticalArrangement=Arrangement.spacedBy(6.dp)){Text(label,fontSize=11.sp,lineHeight=15.sp,color=MaterialTheme.colorScheme.onSurfaceVariant);Text(value,fontSize=23.sp,lineHeight=30.sp,fontWeight=FontWeight.Bold)}}}
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
