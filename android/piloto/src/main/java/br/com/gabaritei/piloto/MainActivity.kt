package br.com.gabaritei.piloto

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.delay
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.UUID

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState); enableEdgeToEdge()
        setContent {
            val dark=isSystemInDarkTheme()
            MaterialTheme(colorScheme=if(dark) darkColorScheme(primary=Color(0xFFB7C4FF)) else lightColorScheme(primary=Color(0xFF2852DF),background=Color(0xFFEDF1F9),surface=Color.White)) {
                PilotApp(onOpen={ url ->
                    if(StudyRules.safeLink(url))try { startActivity(Intent(Intent.ACTION_VIEW,Uri.parse(url))) }
                    catch (_:ActivityNotFoundException){Toast.makeText(this,"Nenhum aplicativo disponível para abrir este link.",Toast.LENGTH_LONG).show()}
                })
            }
        }
    }
}
private fun duration(seconds:Long):String = "%02d:%02d:%02d".format(seconds/3600,(seconds%3600)/60,seconds%60)
@Composable private fun Block(content:@Composable ColumnScope.()->Unit) {
    Card(Modifier.fillMaxWidth(),shape=RoundedCornerShape(16.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(8.dp),content=content)
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable fun PilotApp(vm:PilotViewModel=viewModel(),onOpen:(String)->Unit) {
    val plans by vm.plans.collectAsStateWithLifecycle()
    val settings by vm.settings.collectAsStateWithLifecycle()
    val sessions by vm.sessions.collectAsStateWithLifecycle()
    val progress by vm.progress.collectAsStateWithLifecycle()
    val personal by vm.links.collectAsStateWithLifecycle()
    val timer by vm.timer.collectAsStateWithLifecycle()
    val error by vm.error.collectAsStateWithLifecycle()
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var picker by rememberSaveable { mutableStateOf(false) }
    var record by remember { mutableStateOf<Pair<Plan,Topic>?>(null) }
    var recordingTimer by remember { mutableStateOf<Timer?>(null) }
    var editLink by remember { mutableStateOf<Topic?>(null) }
    var discard by remember { mutableStateOf<Timer?>(null) }
    val plan=plans.find { it.id==settings?.planId } ?: plans.firstOrNull()
    val selected=plan?.topics?.find { it.id==settings?.topicId } ?: plan?.topics?.firstOrNull { t -> progress.none { it.planId==plan.id && it.topicId==t.id && it.completed } } ?: plan?.topics?.firstOrNull()
    val current=sessions.filter { it.planId==plan?.id }
    val completed=progress.count { it.planId==plan?.id&&it.completed }
    val snackbar=remember { SnackbarHostState() }
    LaunchedEffect(error){error?.let { snackbar.showSnackbar(it);vm.error.value=null }}
    BackHandler(tab!=0){tab=0}
    Scaffold(snackbarHost={SnackbarHost(snackbar)},topBar={
        TopAppBar(title={Column {
            Text("Gabaritei",fontWeight=FontWeight.Bold,fontSize=19.sp)
            Text("Piloto local · sem sincronização",fontSize=11.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)
        }})
    },bottomBar={NavigationBar {
        val labels=listOf("Hoje","Planos","Questões","Histórico")
        val icons=listOf(Icons.Outlined.Home,Icons.Outlined.DateRange,Icons.AutoMirrored.Outlined.List,Icons.Outlined.Refresh)
        labels.forEachIndexed { i,label -> NavigationBarItem(selected=tab==i,onClick={tab=i},icon={Icon(icons[i],null)},label={Text(label,maxLines=1)}) }
    }}) { padding ->
        if(plans.isEmpty())Box(Modifier.fillMaxSize().padding(padding),contentAlignment=Alignment.Center){Text(error?:"Carregando planos…")}
        else if(plan!=null&&selected!=null) LazyColumn(Modifier.padding(padding).fillMaxSize(),contentPadding=PaddingValues(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
            item { Text(plan.name.replace(Regex(" \\(.*?\\)"),""),style=MaterialTheme.typography.titleSmall,color=MaterialTheme.colorScheme.primary) }
            when(tab) {
                0 -> {
                    item { Block {
                        Text("Próximo estudo",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(plan.discipline(selected).name,style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold)
                        Row(verticalAlignment=Alignment.CenterVertically) {
                            Text(selected.name,Modifier.weight(1f),style=MaterialTheme.typography.bodyMedium)
                            IconButton(onClick={picker=true}){Icon(Icons.Outlined.Edit,"Escolher tópico")}
                        }
                        Row(horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                            Button(onClick={vm.start(plan,selected)},enabled=timer==null){Icon(Icons.Outlined.PlayArrow,null);Text("Estudar")}
                            OutlinedButton(onClick={recordingTimer=null;record=plan to selected}){Text("Registrar")}
                        }
                        TextButton(onClick={tab=2}){Text("Abrir caderno de questões")}
                    } }
                    timer?.let { t -> item { TimerCard(t,vm,onFinish={
                        val p=plans.first { it.id==t.planId };val topic=p.topics.first { it.id==t.topicId }
                        vm.pause(t);recordingTimer=t.copy(seconds=vm.elapsed(t),startedElapsed=null);record=p to topic
                    },onDiscard={discard=t}) } }
                    item { Block {
                        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween) {
                            Column {Text("Desempenho",style=MaterialTheme.typography.labelMedium);Spacer(Modifier.height(6.dp));Text(if(current.sumOf { it.questions }==0)"—" else "${current.sumOf { it.correct }*100/current.sumOf { it.questions }}%",style=MaterialTheme.typography.headlineSmall);Text("${current.sumOf { it.questions }} questões",style=MaterialTheme.typography.bodySmall)}
                            Column {Text("Progresso no edital",style=MaterialTheme.typography.labelMedium);Spacer(Modifier.height(6.dp));Text("${completed*100/plan.topics.size}%",style=MaterialTheme.typography.headlineSmall);Text("$completed de ${plan.topics.size} tópicos",style=MaterialTheme.typography.bodySmall)}
                        }
                    } }
                    val next=plan.topics.firstOrNull { t -> t.id!=selected.id&&progress.none { it.planId==plan.id&&it.topicId==t.id&&it.completed } }
                    if(next!=null)item{Block {Text("Ainda hoje",style=MaterialTheme.typography.labelMedium);Text(plan.discipline(next).name,fontWeight=FontWeight.SemiBold);Text(next.name,style=MaterialTheme.typography.bodySmall);TextButton(onClick={vm.select(plan,next)}){Text("Escolher este tópico")}}}
                    item { Block {Text("Um tópico por vez. Cada sessão conta.",style=MaterialTheme.typography.bodyMedium);Text("Os dados deste piloto ficam apenas neste aparelho.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)} }
                }
                1 -> items(plans,key={it.id}) { p -> Block {
                    Text(p.name,style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.SemiBold)
                    Text("${p.disciplines.size} disciplinas · ${p.topics.size} tópicos",style=MaterialTheme.typography.bodySmall)
                    Row(horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                        Button(onClick={vm.select(p);tab=0}){Text(if(p.id==plan.id)"Continuar plano" else "Estudar este plano")}
                        TextButton(onClick={vm.select(p);tab=2}){Text("Caderno")}
                    }
                } }
                2 -> {
                    item{Text("Caderno de questões",style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold)}
                    items(plan.disciplines,key={it.id}) { d ->
                        var expanded by rememberSaveable(plan.id,d.id){mutableStateOf(false)}
                        Block {
                            TextButton(onClick={expanded=!expanded},contentPadding=PaddingValues(0.dp)) {
                                Text("${d.name} (${d.topics.size})",Modifier.weight(1f),color=MaterialTheme.colorScheme.onSurface,fontWeight=FontWeight.SemiBold)
                                Icon(if(expanded)Icons.Outlined.KeyboardArrowUp else Icons.Outlined.KeyboardArrowDown,if(expanded)"Recolher" else "Expandir")
                            }
                            if(expanded)d.topics.forEach { t ->
                                val link=personal.firstOrNull { it.planId==plan.id&&it.topicId==t.id }?.url ?: t.link
                                HorizontalDivider(color=MaterialTheme.colorScheme.outlineVariant)
                                Text(t.name,style=MaterialTheme.typography.bodyMedium)
                                if(t.note.isNotBlank()&&link==t.link)Text(t.note,style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                                Row(verticalAlignment=Alignment.CenterVertically) {
                                    if(link!=null)FilledTonalButton(onClick={onOpen(link)}){Text(if(Uri.parse(link).host=="questoes.grancursosonline.com.br"){if(t.noQuestions&&link==t.link)"Consultar no Gran ↗" else "Resolver no Gran ↗"} else "Abrir questões ↗")}
                                    IconButton(onClick={editLink=t}){Icon(Icons.Outlined.Edit,"Editar link de ${t.name}")}
                                }
                            }
                        }
                    }
                }
                3 -> {
                    item{Text("Histórico local",style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold)}
                    item{Text("${current.size} sessões · ${duration(current.sumOf { it.seconds })} estudados",style=MaterialTheme.typography.bodyMedium)}
                    if(current.isEmpty())item{Block{Text("Seu primeiro registro aparecerá aqui.");TextButton(onClick={recordingTimer=null;record=plan to selected}){Text("Registrar estudo")}}}
                    items(current,key={it.id}) { s -> Block {
                        Text(plan.topics.find { it.id==s.topicId }?.name?:s.topicId,fontWeight=FontWeight.SemiBold)
                        Text(DateTimeFormatter.ofPattern("dd/MM/yyyy · HH:mm").format(Instant.ofEpochMilli(s.endedAt).atZone(ZoneId.systemDefault())),style=MaterialTheme.typography.bodySmall)
                        Text("${duration(s.seconds)} · ${s.questions} questões · ${s.correct} acertos",style=MaterialTheme.typography.bodySmall)
                    } }
                }
            }
        }
    }
    if(picker&&plan!=null) TopicPicker(plan,progress.filter{it.planId==plan.id},selected?.id,onClose={picker=false},onSelect={vm.select(plan,it);picker=false})
    record?.let { (p,t) -> RecordDialog(p,t,recordingTimer,vm,onClose={record=null;recordingTimer=null}) }
    editLink?.let { t -> if(plan!=null) LinkDialog(personal.firstOrNull{it.planId==plan.id&&it.topicId==t.id}?.url?:t.link.orEmpty(),onClose={editLink=null},onSave={vm.setLink(plan,t,it){editLink=null}}) }
    discard?.let { t -> AlertDialog(onDismissRequest={discard=null},title={Text("Descartar cronômetro?")},text={Text("Este tempo não será registrado no histórico.")},confirmButton={TextButton(onClick={vm.discard(t);discard=null}){Text("Descartar")}},dismissButton={TextButton(onClick={discard=null}){Text("Continuar estudando")}}) }
}
@Composable private fun TimerCard(t:Timer,vm:PilotViewModel,onFinish:()->Unit,onDiscard:()->Unit) {
    val plans by vm.plans.collectAsStateWithLifecycle()
    var elapsed by remember(t){mutableLongStateOf(vm.elapsed(t))}
    LaunchedEffect(t){while(true){elapsed=vm.elapsed(t);delay(1000)}}
    Block {
        Text(if(t.startedElapsed==null)"Estudo pausado" else "Estudando agora",style=MaterialTheme.typography.labelMedium)
        Text(plans.firstOrNull{it.id==t.planId}?.topics?.firstOrNull{it.id==t.topicId}?.name.orEmpty(),style=MaterialTheme.typography.bodySmall)
        Text(duration(elapsed),style=MaterialTheme.typography.headlineLarge)
        Row(horizontalArrangement=Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick={if(t.startedElapsed==null)vm.resume(t) else vm.pause(t)}){Text(if(t.startedElapsed==null)"Retomar" else "Pausar")}
            Button(onClick=onFinish){Text("Concluir")}
            IconButton(onClick=onDiscard){Icon(Icons.Outlined.Delete,"Descartar cronômetro")}
        }
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun TopicPicker(plan:Plan,progress:List<Progress>,selected:String?,onClose:()->Unit,onSelect:(Topic)->Unit) {
    var search by rememberSaveable{mutableStateOf("")}
    Dialog(onDismissRequest=onClose,properties=DialogProperties(usePlatformDefaultWidth=false)) {
        Surface(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing),color=MaterialTheme.colorScheme.background) {
            Column(Modifier.padding(16.dp)) {
                Row(verticalAlignment=Alignment.CenterVertically){Text("O que estudar?",Modifier.weight(1f),style=MaterialTheme.typography.titleLarge);IconButton(onClick=onClose){Icon(Icons.Outlined.Close,"Fechar")}}
                OutlinedTextField(search,{search=it},label={Text("Buscar tópico do edital")},modifier=Modifier.fillMaxWidth(),singleLine=true)
                LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(8.dp),contentPadding=PaddingValues(vertical=12.dp)) {
                    val ds=plan.disciplines.filter { d -> d.topics.any{it.name.contains(search,true)}||d.name.contains(search,true) }
                    if(ds.isEmpty())item{Text("Nenhum tópico encontrado.")}
                    items(ds,key={it.id}) { d ->
                        var expanded by rememberSaveable(d.id){mutableStateOf(false)}
                        Block {
                            TextButton(onClick={expanded=!expanded},contentPadding=PaddingValues(0.dp)){Text(d.name,Modifier.weight(1f));Icon(if(expanded)Icons.Outlined.KeyboardArrowUp else Icons.Outlined.KeyboardArrowDown,null)}
                            if(expanded||search.isNotBlank())d.topics.filter{it.name.contains(search,true)||d.name.contains(search,true)}.forEach { t ->
                                TextButton(onClick={onSelect(t)},contentPadding=PaddingValues(0.dp)) {
                                    RadioButton(selected=t.id==selected,onClick=null)
                                    Column(Modifier.weight(1f)){Text(t.name,color=MaterialTheme.colorScheme.onSurface);if(progress.any{it.topicId==t.id&&it.completed})Text("Concluído",style=MaterialTheme.typography.labelSmall)}
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
@Composable private fun RecordDialog(plan:Plan,topic:Topic,timer:Timer?,vm:PilotViewModel,onClose:()->Unit) {
    val id=remember{timer?.sessionId?:UUID.randomUUID().toString()}
    var minutes by rememberSaveable{mutableStateOf("")};var questions by rememberSaveable{mutableStateOf("0")};var correct by rememberSaveable{mutableStateOf("0")}
    var completed by rememberSaveable{mutableStateOf(false)};var saving by remember{mutableStateOf(false)}
    var validationMessage by remember{mutableStateOf<String?>(null)}
    AlertDialog(onDismissRequest={if(!saving)onClose()},title={Text("Registrar estudo")},text={
        Column(verticalArrangement=Arrangement.spacedBy(8.dp)) {
            Text(topic.name)
            if(timer==null)OutlinedTextField(minutes,{minutes=it},label={Text("Minutos estudados")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number),singleLine=true)
            else Text("Tempo estudado: ${duration(timer.seconds)}")
            OutlinedTextField(questions,{questions=it},label={Text("Questões resolvidas")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number),singleLine=true)
            OutlinedTextField(correct,{correct=it},label={Text("Acertos")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number),singleLine=true)
            Row(verticalAlignment=Alignment.CenterVertically){Checkbox(completed,{completed=it});Text("Concluir tópico no edital")}
            validationMessage?.let{Text(it,color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodySmall)}
        }
    },confirmButton={TextButton(enabled=!saving,onClick={
        val m=minutes.toLongOrNull();val q=questions.toIntOrNull();val c=correct.toIntOrNull()
        if((timer==null&&(m==null||m !in 1..1440))||q==null||c==null){validationMessage="Informe de 1 a 1.440 minutos e quantidades válidas de questões.";return@TextButton}
        val input=StudyInput(timer?.seconds?:((m?:0)*60),q,c)
        val validation=StudyRules.error(input)
        if(validation!=null){validationMessage=validation;return@TextButton}
        validationMessage=null;saving=true;vm.save(plan,topic,input,completed,timer,id,failed={saving=false;validationMessage="Não foi possível salvar. Tente novamente."}){onClose()}
    }){Text(if(saving)"Salvando…" else "Salvar registro")}},dismissButton={TextButton(enabled=!saving,onClick=onClose){Text("Cancelar")}})
}
@Composable private fun LinkDialog(initial:String,onClose:()->Unit,onSave:(String)->Unit) {
    var value by rememberSaveable{mutableStateOf(initial)}
    var invalid by remember{mutableStateOf(false)}
    AlertDialog(onDismissRequest=onClose,title={Text("Editar link de questões")},text={Column(verticalArrangement=Arrangement.spacedBy(8.dp)){
        Text("Cole um link do Gran, NotebookLM ou de outra plataforma. Deixe vazio para restaurar o link original.")
        OutlinedTextField(value,{value=it},label={Text("Link HTTPS")},modifier=Modifier.fillMaxWidth(),maxLines=4,keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Uri))
        if(invalid)Text("Use um endereço HTTPS válido, sem usuário ou senha no link.",color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodySmall)
    }},confirmButton={TextButton(onClick={invalid=value.isNotBlank()&&!StudyRules.safeLink(value.trim());if(!invalid)onSave(value)}){Text("Salvar link")}},dismissButton={TextButton(onClick=onClose){Text("Cancelar")}})
}
