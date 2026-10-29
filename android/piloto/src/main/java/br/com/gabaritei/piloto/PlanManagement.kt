package br.com.gabaritei.piloto

import androidx.compose.foundation.gestures.detectDragGesturesAfterLongPress
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.json.JSONObject
import org.json.JSONArray
import java.time.LocalDate
import java.util.UUID

@Composable fun DisciplineManager(plan:Plan,raw:String,vm:PilotViewModel){
    var search by rememberSaveable{mutableStateOf("")};var archived by rememberSaveable{mutableStateOf(false)}
    var form by remember{mutableStateOf<JSONObject?>(null)};var confirmation by remember{mutableStateOf<JSONObject?>(null)}
    var order by remember(plan){mutableStateOf(plan.disciplines.map{it.id})}
    val threshold=with(LocalDensity.current){64.dp.toPx()}
    fun move(id:String,delta:Int){val rows=order.toMutableList();val from=rows.indexOf(id);val to=(from+delta).coerceIn(0,rows.lastIndex);if(from>=0&&from!=to){java.util.Collections.swap(rows,from,to);order=rows}}
    fun saveOrder(){vm.edit(plan,JSONObject().put("action","order").put("ids",JSONArray(order)))}
    Column(verticalArrangement=Arrangement.spacedBy(10.dp)){
        Row(verticalAlignment=Alignment.CenterVertically){Text("Disciplinas",Modifier.weight(1f),style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold);TextButton(onClick={form=JSONObject().put("action","add-discipline").put("disciplineId","android-disc-${UUID.randomUUID()}").put("newTopicId","android-top-${UUID.randomUUID()}")}){Text("Adicionar")}}
        OutlinedTextField(search,{search=it},Modifier.fillMaxWidth(),label={Text("Buscar disciplina")},singleLine=true)
        Row(verticalAlignment=Alignment.CenterVertically){Checkbox(archived,{archived=it});Text("Mostrar arquivadas",style=MaterialTheme.typography.bodySmall)}
        if(search.isBlank())Text("Segure a alça para mover ou use as setas.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
        order.mapNotNull{id->plan.disciplines.find{it.id==id}}.filter{(archived||!it.archived)&&searchKey(it.name).contains(searchKey(search))}.forEach{d->
            var expanded by rememberSaveable(d.id){mutableStateOf(false)}
            Block{
                Row(verticalAlignment=Alignment.CenterVertically){
                    Icon(Icons.Outlined.Menu,"Segure para mover ${d.name}",Modifier.size(48.dp).pointerInput(d.id){var amount=0f;detectDragGesturesAfterLongPress(onDragStart={amount=0f},onDragEnd={saveOrder()},onDragCancel={order=plan.disciplines.map{it.id}},onDrag={change,drag->change.consume();amount+=drag.y;if(kotlin.math.abs(amount)>threshold){move(d.id,if(amount>0)1 else -1);amount=0f}})}.padding(12.dp))
                    Spacer(Modifier.width(10.dp));Column(Modifier.weight(1f)){Text(d.name,fontSize=14.sp,lineHeight=20.sp,fontWeight=FontWeight.SemiBold);Text("${d.topics.size} tópicos${if(d.archived)" · Arquivada" else if(d.paused)" · Pausada" else ""}",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
                    IconButton(onClick={expanded=!expanded}){Icon(if(expanded)Icons.Outlined.KeyboardArrowUp else Icons.Outlined.KeyboardArrowDown,"Opções de ${d.name}")}
                }
                if(expanded){
                    Row{IconButton(onClick={move(d.id,-1);saveOrder()},enabled=order.firstOrNull()!=d.id){Icon(Icons.Outlined.KeyboardArrowUp,"Mover ${d.name} para cima")};IconButton(onClick={move(d.id,1);saveOrder()},enabled=order.lastOrNull()!=d.id){Icon(Icons.Outlined.KeyboardArrowDown,"Mover ${d.name} para baixo")};TextButton(onClick={form=JSONObject().put("action","discipline").put("disciplineId",d.id).put("name",d.name).put("beforeName",d.name).put("color",d.color)}){Text("Editar")}}
                    Row{TextButton(onClick={vm.edit(plan,JSONObject().put("action","discipline").put("disciplineId",d.id).put("paused",!d.paused))}){Text(if(d.paused)"Retomar" else "Pausar")};TextButton(onClick={confirmation=JSONObject().put("action","discipline").put("disciplineId",d.id).put("archived",!d.archived)}){Text(if(d.archived)"Restaurar" else "Arquivar")}}
                    HorizontalDivider()
                    val source=runCatching{JSONObject(raw).array("planos").objects().find{it.optString("id")==plan.id}?.array("disciplinas")?.objects()?.find{it.optString("id")==d.id}?.array("topicos")?.objects()}.getOrNull()
                    val topics=source?:d.topics.map{JSONObject().put("id",it.id).put("nome",it.name)}
                    topics.forEach{t->Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text(t.optString("nome"),fontSize=12.sp,lineHeight=17.sp);if(t.optBoolean("androidArquivado"))Text("Arquivado",style=MaterialTheme.typography.labelSmall)};IconButton(onClick={form=JSONObject().put("action","topic").put("disciplineId",d.id).put("topicId",t.getString("id")).put("name",t.optString("nome")).put("beforeName",t.optString("nome"))}){Icon(Icons.Outlined.Edit,"Editar tópico ${t.optString("nome")}",Modifier.size(18.dp))};IconButton(onClick={confirmation=JSONObject().put("action","topic").put("disciplineId",d.id).put("topicId",t.getString("id")).put("archived",!t.optBoolean("androidArquivado"))}){Icon(if(t.optBoolean("androidArquivado"))Icons.Outlined.Refresh else Icons.Outlined.Delete,if(t.optBoolean("androidArquivado"))"Restaurar tópico" else "Arquivar tópico",Modifier.size(18.dp))}}}
                    TextButton(onClick={form=JSONObject().put("action","topic").put("disciplineId",d.id).put("topicId","android-top-${UUID.randomUUID()}").put("new",true)}){Text("Adicionar tópico")}
                }
            }
        }
    }
    form?.let{payload->var value by remember(payload){mutableStateOf(payload.optString("name"))};var color by remember(payload){mutableStateOf(payload.optString("color","#3B82F6"))};var message by remember{mutableStateOf<String?>(null)};var saving by remember{mutableStateOf(false)}
        AlertDialog(containerColor=MaterialTheme.colorScheme.surface,onDismissRequest={if(!saving)form=null},title={Text(if(payload.optString("action")=="topic")"Editar tópico" else "Disciplina")},text={Column(verticalArrangement=Arrangement.spacedBy(8.dp)){OutlinedTextField(value,{value=it},label={Text("Nome")},modifier=Modifier.fillMaxWidth(),isError=value.isBlank());if(payload.optString("action")!="topic")Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){listOf("#3B82F6","#14B8A6","#A855F7","#F59E0B").forEachIndexed{i,c->FilterChip(selected=color==c,onClick={color=c},label={Text(listOf("Azul","Verde","Roxo","Ouro")[i],fontSize=10.sp)})}};message?.let{Text(it,color=MaterialTheme.colorScheme.error)} }},confirmButton={TextButton(enabled=value.isNotBlank()&&!saving,onClick={saving=true;payload.put("name",value.trim());if(payload.optString("action")!="topic")payload.put("color",color);vm.edit(plan,payload){err->saving=false;if(err==null)form=null else message=err}}){Text("Salvar")}},dismissButton={TextButton(enabled=!saving,onClick={form=null}){Text("Cancelar")}})
    }
    confirmation?.let{p->AlertDialog(onDismissRequest={confirmation=null},title={Text(if(p.optBoolean("archived"))"Arquivar na sua rotina?" else "Restaurar?")},text={Text("O histórico de estudos será preservado. Você pode restaurar o conteúdo depois. O edital original do catálogo não será alterado.")},confirmButton={TextButton(onClick={vm.edit(plan,p);confirmation=null}){Text("Confirmar")}},dismissButton={TextButton(onClick={confirmation=null}){Text("Cancelar")}})}
}

@Composable fun FreeStudyDialog(vm:PilotViewModel,onClose:()->Unit){
    val id=remember{UUID.randomUUID().toString()};var title by rememberSaveable{mutableStateOf("")};var minutes by rememberSaveable{mutableStateOf("")};var q by rememberSaveable{mutableStateOf("0")};var c by rememberSaveable{mutableStateOf("0")};var date by rememberSaveable{mutableStateOf(LocalDate.now().toString())};var type by rememberSaveable{mutableStateOf("teoria")};var error by remember{mutableStateOf<String?>(null)};var saving by remember{mutableStateOf(false)}
    AlertDialog(containerColor=MaterialTheme.colorScheme.surface,onDismissRequest={if(!saving)onClose()},title={Text("Estudo livre")},text={Column(Modifier.verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(8.dp)){
        Text("Fica separado das estatísticas do concurso.",style=MaterialTheme.typography.bodySmall)
        OutlinedTextField(title,{title=it},label={Text("O que você estudou?")});StudyDateField("Data",date){date=it}
        Row(horizontalArrangement=Arrangement.spacedBy(5.dp)){listOf("teoria" to "Teoria","questoes" to "Questões","revisao" to "Revisão").forEach{(key,label)->FilterChip(type==key,{type=key},label={Text(label,fontSize=11.sp)})}}
        OutlinedTextField(minutes,{minutes=it},label={Text("Minutos estudados")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number))
        OutlinedTextField(q,{q=it},label={Text("Questões")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number));OutlinedTextField(c,{c=it},label={Text("Acertos")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number));error?.let{Text(it,color=MaterialTheme.colorScheme.error)}
    }},confirmButton={TextButton(enabled=!saving,onClick={val day=runCatching{LocalDate.parse(date)}.getOrNull();val input=StudyInput((minutes.toLongOrNull()?:0)*60,q.toIntOrNull()?:-1,c.toIntOrNull()?:-1);val bad=StudyRules.error(input)
        if(day==null||day.isAfter(LocalDate.now())||title.isBlank()||bad!=null)error=bad?:"Confira o nome e a data." else {saving=true;vm.saveFree(title,input,type,day,id){err->saving=false;if(err==null)onClose()else error=err}}
    }){Text(if(saving)"Salvando…" else "Salvar estudo")}},dismissButton={TextButton(enabled=!saving,onClick=onClose){Text("Cancelar")}})
}

@Composable fun PlanningScreen(plan:Plan,raw:String,vm:PilotViewModel,onChoose:(Topic)->Unit,onStart:(Topic)->Unit){
    var date by rememberSaveable{mutableStateOf(LocalDate.now().toString())};var duration by remember{mutableStateOf<JSONObject?>(null)}
    val blocks=runCatching{JSONObject(raw).array("agenda").objects().filter{it.optString("planoId")==plan.id&&it.optString("data")==date&&plan.disciplines.none{d->d.id==it.optString("disciplinaId")&&(d.paused||d.archived)}}}.getOrDefault(emptyList())
    Column(verticalArrangement=Arrangement.spacedBy(10.dp)){
        Text("Planejamento",style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold)
        val cycle=runCatching{JSONObject(raw).array("planos").objects().find{it.optString("id")==plan.id}?.obj("plano")?.optJSONObject("ciclo")}.getOrNull()
        cycle?.let{c->Block{Text("Ciclo · volta ${c.optInt("volta",1)}",fontWeight=FontWeight.SemiBold);c.array("blocos").objects().filter{b->plan.disciplines.none{it.id==b.optString("disciplinaId")&&(it.paused||it.archived)}}.forEach{b->Text(plan.disciplines.find{it.id==b.optString("disciplinaId")}?.name?:"Etapa",style=MaterialTheme.typography.bodyMedium);Text("${b.optInt("feitoMin")} / ${b.optInt("metaMin")} min",style=MaterialTheme.typography.bodySmall);TextButton(onClick={duration=JSONObject(b.toString()).put("cycleBlock",true).put("duracaoMin",b.optInt("metaMin"))}){Text("Ajustar etapa")}}}}

        Row(verticalAlignment=Alignment.CenterVertically){IconButton(onClick={date=LocalDate.parse(date).minusDays(1).toString()}){Icon(Icons.Outlined.KeyboardArrowLeft,"Dia anterior")};Text(LocalDate.parse(date).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),Modifier.weight(1f));IconButton(onClick={date=LocalDate.parse(date).plusDays(1).toString()}){Icon(Icons.Outlined.KeyboardArrowRight,"Próximo dia")};TextButton(onClick={date=LocalDate.now().toString()}){Text("Hoje")}}
        if(blocks.isEmpty())Block{Text("Nenhum bloco neste dia.");Text("Escolha um tópico para estudar no seu ritmo.",style=MaterialTheme.typography.bodySmall)}
        blocks.forEach{b->val topic=plan.topics.find{it.id==b.optString("topicoId")};Block{Text(plan.disciplines.find{it.id==b.optString("disciplinaId")}?.name?:"Estudo",fontWeight=FontWeight.SemiBold);topic?.let{Text(it.name,style=MaterialTheme.typography.bodySmall)};Text("${b.optDouble("feitoMin").toInt()} / ${b.optDouble("duracaoMin").toInt()} min${if(b.optBoolean("feito"))" · Concluído" else ""}",style=MaterialTheme.typography.bodySmall);Row{if(topic!=null&&!b.optBoolean("feito"))TextButton(onClick={onStart(topic)}){Text("Estudar")};if(topic!=null)TextButton(onClick={onChoose(topic)}){Text("Escolher tópico")};if(!b.optBoolean("feito"))TextButton(onClick={duration=b}){Text("Ajustar tempo")}}}}
    }
    duration?.let{b->var value by remember{mutableStateOf(b.optInt("duracaoMin").toString())};var error by remember{mutableStateOf<String?>(null)}
        AlertDialog(onDismissRequest={duration=null},title={Text("Tempo deste bloco")},text={Column{OutlinedTextField(value,{value=it},label={Text("Minutos")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number));error?.let{Text(it)}}},confirmButton={TextButton(onClick={val m=value.toIntOrNull();if(m==null||m !in 1..720)error="Use de 1 a 720 minutos." else vm.edit(plan,JSONObject().put("action",if(b.optBoolean("cycleBlock"))"cycle-block" else "agenda").put("blockId",b.getString("id")).put("minutes",m)){err->if(err==null)duration=null else error=err}}){Text("Salvar")}},dismissButton={TextButton(onClick={duration=null}){Text("Cancelar")}})
    }
}

@Composable fun WeeklyGoals(activities:List<StudyActivity>){
    val context=androidx.compose.ui.platform.LocalContext.current
    val preferences=remember{context.getSharedPreferences("native_goals",0)}
    var minutes by rememberSaveable{mutableIntStateOf(preferences.getInt("minutes",600))};var questions by rememberSaveable{mutableIntStateOf(preferences.getInt("questions",100))};var edit by remember{mutableStateOf(false)}
    val start=LocalDate.now().with(java.time.DayOfWeek.MONDAY);val rows=activities.filter{!it.date.isBefore(start)&&!it.date.isAfter(LocalDate.now())};val m=rows.sumOf{it.minutes};val q=rows.sumOf{it.questions}
    Block{Row(verticalAlignment=Alignment.CenterVertically){Text("Metas da semana",Modifier.weight(1f),fontWeight=FontWeight.SemiBold);IconButton(onClick={edit=true}){Icon(Icons.Outlined.Settings,"Editar metas semanais",Modifier.size(20.dp))}};Text("${StudyMetrics.time(m)} / ${StudyMetrics.time(minutes.toDouble())} · $q / $questions questões",style=MaterialTheme.typography.bodySmall);LinearProgressIndicator(progress={(m/minutes.coerceAtLeast(1)).toFloat().coerceIn(0f,1f)},modifier=Modifier.fillMaxWidth());LinearProgressIndicator(progress={(q.toFloat()/questions.coerceAtLeast(1)).coerceIn(0f,1f)},modifier=Modifier.fillMaxWidth())}
    if(edit){var h by remember{mutableStateOf((minutes/60).toString())};var count by remember{mutableStateOf(questions.toString())};var error by remember{mutableStateOf<String?>(null)}
        AlertDialog(onDismissRequest={edit=false},title={Text("Metas semanais do app")},text={Column(verticalArrangement=Arrangement.spacedBy(8.dp)){OutlinedTextField(h,{h=it},label={Text("Horas por semana")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number));OutlinedTextField(count,{count=it},label={Text("Questões por semana")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number));Text("Preferência deste aparelho; não altera sua agenda.",style=MaterialTheme.typography.bodySmall);error?.let{Text(it)}}},confirmButton={TextButton(onClick={val hours=h.toIntOrNull();val n=count.toIntOrNull();if(hours==null||hours !in 1..168||n==null||n !in 1..10000)error="Confira as quantidades."else{minutes=hours*60;questions=n;preferences.edit().putInt("minutes",minutes).putInt("questions",questions).apply();edit=false}}){Text("Salvar")}},dismissButton={TextButton(onClick={edit=false}){Text("Cancelar")}})
    }
}
