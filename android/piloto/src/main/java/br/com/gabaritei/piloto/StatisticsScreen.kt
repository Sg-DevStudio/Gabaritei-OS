package br.com.gabaritei.piloto

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.selection.toggleable
import androidx.compose.ui.semantics.Role
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
@Composable fun StatisticsScreen(plan:Plan,activities:List<StudyActivity>,progress:List<Progress>,raw:String="{}",sessions:List<Session> = emptyList(),onOpen:(String)->Unit={},achievements:List<Achievement> = emptyList()){
    val context=androidx.compose.ui.platform.LocalContext.current
    val preferences=remember{context.getSharedPreferences("statistics_display",0)}
    val preferenceKey="metrics:${plan.owner.ifEmpty{"guest"}}"
    var displayed by remember(preferenceKey){mutableStateOf(StatisticsModel.display(preferences.getStringSet(preferenceKey,null)))}
    var displayDialog by remember{mutableStateOf(false)}
    var view by rememberSaveable{mutableIntStateOf(0)};var period by rememberSaveable{mutableIntStateOf(30)}
    var discipline by rememberSaveable(plan.id){mutableStateOf("")};var topic by rememberSaveable(plan.id){mutableStateOf("")};var kind by rememberSaveable{mutableStateOf("")}
    var includeFree by rememberSaveable{mutableStateOf(false)};var filters by remember{mutableStateOf(false)}
    var start by rememberSaveable{mutableStateOf("")};var end by rememberSaveable{mutableStateOf("")}
    var metric by rememberSaveable{mutableStateOf(StatsMetric.ACCURACY.key)}
    var resolving by remember{mutableStateOf<Topic?>(null)}
    val today=LocalDate.now()
    val free=remember(raw,sessions){StudyMetrics.freeActivities(sessions,raw)}
    val all=remember(activities,free,includeFree){activities+if(includeFree)free else emptyList()}
    val from=if(period<0)runCatching{LocalDate.parse(start)}.getOrDefault(today)else if(period==0)minOf(all.minOfOrNull{it.date}?:today,today)else today.minusDays(period-1L)
    val until=if(period<0)runCatching{LocalDate.parse(end)}.getOrDefault(today)else today
    val data=remember(all,from,until,discipline,topic,kind){all.filter{it.date>=from&&it.date<=until&&(discipline.isEmpty()||it.discipline==discipline)&&(topic.isEmpty()||it.topic==topic)&&(kind.isEmpty()||it.category==kind)}}
    val total=remember(data){StatisticsModel.total(data)}
    val byDiscipline=remember(data){data.groupBy{it.discipline}}
    val completed=remember(progress,plan.id){progress.filter{it.planId==plan.id&&it.completed}.map{it.topicId}.toSet()}
    val notebook=remember(raw,plan){NotebookLinks.index(raw,plan)}
    val metrics=StatisticsModel.metrics(displayed)
    val selectedMetric=metrics.find{it.key==metric}?:metrics.firstOrNull()
    Column(verticalArrangement=Arrangement.spacedBy(12.dp)){
        Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(6.dp)){
            Box(Modifier.weight(1f)){Choice("Período",period.toString(),listOf("7" to "7 dias","30" to "30 dias","90" to "90 dias","0" to "Tudo")+if(period<0)listOf("-1" to "Personalizado")else emptyList()){period=it.toInt()}}
            TextButton(onClick={filters=true}){Text("Filtros")};TextButton(onClick={displayDialog=true}){Text("Exibir")}
        }
        Text("${from.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))} a ${until.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))}${if(includeFree)" · Inclui estudos livres"else" · Somente este plano"}",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
        if(discipline.isNotEmpty()||topic.isNotEmpty()||kind.isNotEmpty())Row(verticalAlignment=Alignment.CenterVertically){Text(listOfNotNull(plan.disciplines.find{it.id==discipline}?.name,plan.topics.find{it.id==topic}?.name,kind.takeIf{it.isNotEmpty()}).joinToString(" · "),Modifier.weight(1f),style=MaterialTheme.typography.bodySmall);TextButton(onClick={discipline="";topic="";kind=""}){Text("Limpar")}}
        if("constancy" in displayed)ConstancyCard(data,from,until,today,"time" in displayed,plan.name,achievements)
        PrimaryTabRow(view){listOf("Resumo","Evolução","Disciplinas").forEachIndexed{i,t->Tab(view==i,{view=i},text={Text(t,fontSize=12.sp)})}}
        when(view){
            0->{
                if("accuracy" in displayed)AccuracyCard(total)
                if("questions" in displayed&&"accuracy" !in displayed)MetricTile("Questões resolvidas",StatisticsModel.number(total.questions.toDouble()),Modifier.fillMaxWidth())
                if("time" in displayed)MetricTile("Tempo estudado",StudyMetrics.time(total.minutes),Modifier.fillMaxWidth())
                if("progress" in displayed){val topics=plan.disciplines.filter{discipline.isEmpty()||it.id==discipline}.flatMap{it.topics}.filter{topic.isEmpty()||it.id==topic};val done=topics.count{it.id in completed}
                    Block{Text("Progresso no edital",style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.SemiBold);Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(14.dp)){Text(StatisticsModel.percent(if(topics.isEmpty())null else done*100.0/topics.size),style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Bold);Text("$done de ${topics.size} tópicos",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)};LinearProgressIndicator(progress={if(topics.isEmpty())0f else done.toFloat()/topics.size},modifier=Modifier.fillMaxWidth());Text("Acumulado; não depende do período.",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
                }
                if(displayed==setOf("constancy"))Text("Escolha outros indicadores em Exibir.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                if(data.isEmpty())Text("Nenhum estudo no período selecionado.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
            }
            1->{
                if(selectedMetric==null)Block{Text("Ative acertos, questões ou tempo em Exibir para acompanhar a evolução.",style=MaterialTheme.typography.bodyMedium);TextButton(onClick={displayDialog=true}){Text("Escolher indicadores")}}
                else{
                    val points=remember(data,from,until){StatisticsModel.series(data,from,until)}
                    Block{Text("Evolução no período",style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.SemiBold);Choice("Gráfico",selectedMetric.key,metrics.map{it.key to it.label}){metric=it};EvolutionChart(points,selectedMetric)}
                }
            }
            2->{
                var sort by rememberSaveable{mutableStateOf("accuracy")}
                Choice("Ordenar",sort,listOf("accuracy" to "Menor acerto","questions" to "Mais questões","name" to "Nome")){sort=it}
                val ds=plan.disciplines.filter{discipline.isEmpty()||it.id==discipline}.sortedWith(when(sort){"accuracy"->compareBy{d->StatisticsModel.total(byDiscipline[d.id].orEmpty()).accuracy?:101.0};"questions"->compareByDescending{d->StatisticsModel.total(byDiscipline[d.id].orEmpty()).questions};else->compareBy{it.name}})
                ds.forEach{d->var expanded by rememberSaveable(plan.id,d.id){mutableStateOf(false)};val rows=byDiscipline[d.id].orEmpty();val stats=StatisticsModel.total(rows)
                    Block{ExpandableTitle(d.name,expanded){expanded=!expanded}
                        if("accuracy" in displayed){Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(14.dp)){Text(StatisticsModel.percent(stats.accuracy),style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Bold,color=successColor());Text(if(stats.questions==0)"Sem questões no período"else"${stats.correct} acertos em ${stats.questions} questões",Modifier.weight(1f),style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)};LinearProgressIndicator(progress={((stats.accuracy?:0.0)/100).toFloat()},modifier=Modifier.fillMaxWidth(),color=successColor(),trackColor=MaterialTheme.colorScheme.surfaceVariant)}
                        else if("questions" in displayed)Text("${stats.questions} questões · ${stats.correct} acertos · ${stats.errors} erros",style=MaterialTheme.typography.bodyMedium)
                        if("time" in displayed)Text("Tempo: ${StudyMetrics.time(stats.minutes)}",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                        if("progress" in displayed)Text("Edital: ${d.topics.count{it.id in completed}} de ${d.topics.size} tópicos concluídos",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                        if(expanded)d.topics.filter{topic.isEmpty()||it.id==topic}.forEach{t->val samples=StatisticsModel.total(rows.filter{it.topic==t.id});HorizontalDivider();Text(t.name,fontSize=12.sp,lineHeight=17.sp)
                            if("accuracy" in displayed)Text(if(samples.questions==0)"Sem questões neste intervalo"else"${StatisticsModel.percent(samples.accuracy)} · ${samples.correct}/${samples.questions} acertos",style=MaterialTheme.typography.bodySmall)
                            else if("questions" in displayed)Text("${samples.questions} questões · ${samples.errors} erros",style=MaterialTheme.typography.bodySmall)
                            if("time" in displayed)Text(StudyMetrics.time(samples.minutes),style=MaterialTheme.typography.bodySmall)
                            if("progress" in displayed)Text(if(t.id in completed)"Concluído no edital"else"Pendente no edital",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                            if("accuracy" in displayed&&samples.questions in 1..9)Text("Poucas questões registradas.",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                            val links=notebook[t.id].orEmpty().distinctBy{it.url};if(links.isNotEmpty())TextButton(onClick={if(links.size==1)onOpen(links.single().url)else resolving=t}){Text("Resolver questões ↗")}
                        }
                    }
                }
                if(includeFree&&discipline.isEmpty())Block{Text("Estudos livres",fontWeight=FontWeight.SemiBold);val stats=StatisticsModel.total(data.filter{it.discipline==null&&!it.simulated});if("accuracy" in displayed)Text("${StatisticsModel.percent(stats.accuracy)} · ${stats.questions} questões",style=MaterialTheme.typography.bodyMedium)else if("questions" in displayed)Text("${stats.questions} questões",style=MaterialTheme.typography.bodyMedium);if("time" in displayed)Text(StudyMetrics.time(stats.minutes),style=MaterialTheme.typography.bodySmall)}
            }
        }
    }
    resolving?.let{t->NotebookChooser(t,notebook[t.id].orEmpty().distinctBy{it.url},onClose={resolving=null},onOpen={resolving=null;onOpen(it)})}
    if(displayDialog){var chosen by remember{mutableStateOf(displayed)};var invalid by remember{mutableStateOf(false)}
        AlertDialog(containerColor=MaterialTheme.colorScheme.surface,onDismissRequest={displayDialog=false},title={Text("O que deseja ver?")},text={Column(Modifier.verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(4.dp)){
            StatisticsModel.displays.forEach{(key,label)->Row(Modifier.fillMaxWidth().toggleable(value=key in chosen,role=Role.Checkbox,onValueChange={checked->chosen=if(checked)chosen+key else chosen-key;invalid=false}).heightIn(min=48.dp),verticalAlignment=Alignment.CenterVertically){Checkbox(key in chosen,null);Text(label,Modifier.weight(1f),style=MaterialTheme.typography.bodyMedium)}}
            TextButton(onClick={chosen=StatisticsModel.defaults;invalid=false}){Text("Restaurar padrão")}
            if(invalid)Text("Selecione pelo menos um indicador.",color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodySmall)
        }},confirmButton={TextButton(onClick={if(chosen.isEmpty())invalid=true else{displayed=chosen;preferences.edit().putStringSet(preferenceKey,chosen).apply();displayDialog=false}}){Text("Aplicar")}},dismissButton={TextButton(onClick={displayDialog=false}){Text("Cancelar")}})
    }
    if(filters){var d by remember{mutableStateOf(discipline)};var t by remember{mutableStateOf(topic)};var k by remember{mutableStateOf(kind)};var f by remember{mutableStateOf(includeFree)};var a by remember{mutableStateOf(from.toString())};var b by remember{mutableStateOf(until.toString())};var err by remember{mutableStateOf<String?>(null)}
        AlertDialog(containerColor=MaterialTheme.colorScheme.surface,onDismissRequest={filters=false},title={Text("Filtros")},text={Column(Modifier.heightIn(max=420.dp).verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(8.dp)){
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
                Card(Modifier.weight(1f),shape=RoundedCornerShape(14.dp),colors=CardDefaults.cardColors(containerColor=androidx.compose.ui.graphics.Color.Transparent),border=androidx.compose.foundation.BorderStroke(1.dp,MaterialTheme.colorScheme.outlineVariant)){
                    Column(Modifier.padding(10.dp).heightIn(min=100.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(5.dp)){
                        AchievementIcon(a,26);Text(a.name,fontSize=11.sp,lineHeight=15.sp,fontWeight=FontWeight.SemiBold)
                        Text(a.description,fontSize=9.sp,lineHeight=12.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)
                        if(a.earned)Text("Conquistado",fontSize=9.sp,lineHeight=12.sp,color=MaterialTheme.colorScheme.primary)
                    }
                }
            }}}
        }
        TextButton(onClick=onClose,modifier=Modifier.align(Alignment.End)){Text("Fechar")}
    }}}
}
