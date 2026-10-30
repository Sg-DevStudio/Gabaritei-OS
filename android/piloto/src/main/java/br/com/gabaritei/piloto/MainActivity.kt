package br.com.gabaritei.piloto

import android.Manifest
import android.app.AlarmManager
import android.provider.Settings as SystemSettings
import android.os.Build
import android.graphics.BitmapFactory
import androidx.compose.ui.graphics.asImageBitmap
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.clickable
import androidx.compose.foundation.Image
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
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
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.time.LocalDate
import java.util.Locale
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.UUID

class MainActivity : ComponentActivity() {
    override fun onResume(){super.onResume();DailyReminders.schedule(this)}
    override fun onWindowFocusChanged(hasFocus:Boolean){
        super.onWindowFocusChanged(hasFocus)
        if(hasFocus&&getSharedPreferences("native_display",MODE_PRIVATE).getBoolean("fullscreen",true)){
            WindowCompat.getInsetsController(window,window.decorView).apply{
                systemBarsBehavior=WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                hide(WindowInsetsCompat.Type.systemBars())
            }
        }
    }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState); enableEdgeToEdge()
        TimerNotices.createChannel(this)
        val preferences=getSharedPreferences("native_display",MODE_PRIVATE)
        setContent {
            var mode by rememberSaveable{mutableStateOf(preferences.getString("theme","system")?:"system")}
            var fullscreen by rememberSaveable{mutableStateOf(preferences.getBoolean("fullscreen",true))}
            LaunchedEffect(fullscreen){val bars=WindowCompat.getInsetsController(window,window.decorView);bars.systemBarsBehavior=WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE;if(fullscreen)bars.hide(WindowInsetsCompat.Type.systemBars())else bars.show(WindowInsetsCompat.Type.systemBars())}
            GabariteiTheme(mode) {
                PilotApp(theme=mode,onTheme={mode=it;preferences.edit().putString("theme",it).apply()},fullscreen=fullscreen,onFullscreen={fullscreen=it;preferences.edit().putBoolean("fullscreen",it).apply()},onOpen={ url ->
                    if(StudyRules.safeLink(url))try { GranLinks.open(this,url,preferences.getBoolean("prefer_gran_app",true)) }
                    catch (_:ActivityNotFoundException){Toast.makeText(this,"Nenhum aplicativo disponível para abrir este link.",Toast.LENGTH_LONG).show()}
                })
            }
        }
    }
}
private fun duration(seconds:Long):String = "%02d:%02d:%02d".format(seconds/3600,(seconds%3600)/60,seconds%60)
@Composable internal fun Block(content:@Composable ColumnScope.()->Unit) {
    Card(Modifier.fillMaxWidth(),shape=RoundedCornerShape(18.dp),border=BorderStroke(1.dp,MaterialTheme.colorScheme.outlineVariant),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface)) {
        Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(8.dp),content=content)
    }
}
@Composable internal fun ExpandableTitle(text:String,expanded:Boolean,onClick:()->Unit){
    Row(Modifier.fillMaxWidth().heightIn(min=48.dp).clickable(role=androidx.compose.ui.semantics.Role.Button,onClick=onClick).padding(horizontal=4.dp,vertical=8.dp),horizontalArrangement=Arrangement.spacedBy(10.dp),verticalAlignment=Alignment.CenterVertically){
        Text(text,Modifier.weight(1f),color=MaterialTheme.colorScheme.onSurface,fontSize=14.sp,lineHeight=20.sp,fontWeight=FontWeight.SemiBold)
        Icon(if(expanded)Icons.Outlined.KeyboardArrowUp else Icons.Outlined.KeyboardArrowDown,if(expanded)"Recolher"else"Expandir",Modifier.size(22.dp))
    }
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable fun PilotApp(vm:PilotViewModel=viewModel(),theme:String="system",onTheme:(String)->Unit={},fullscreen:Boolean=true,onFullscreen:(Boolean)->Unit={},onOpen:(String)->Unit) {
    val plans by vm.plans.collectAsStateWithLifecycle()
    val settings by vm.settings.collectAsStateWithLifecycle()
    val sessions by vm.sessions.collectAsStateWithLifecycle()
    val progress by vm.progress.collectAsStateWithLifecycle()
    val personal by vm.links.collectAsStateWithLifecycle()
    val timer by vm.timer.collectAsStateWithLifecycle()
    val error by vm.error.collectAsStateWithLifecycle()
    val account by vm.account.collectAsStateWithLifecycle()
    val sync by vm.syncStatus.collectAsStateWithLifecycle()
    val pending by vm.pendingCount.collectAsStateWithLifecycle()
    val guestCount by vm.guestRecords.collectAsStateWithLifecycle()
    var confirmImport by remember{mutableStateOf(false)}
    val ready by vm.ready.collectAsStateWithLifecycle()
    val context=LocalContext.current
    val raw by vm.rawSnapshot.collectAsStateWithLifecycle()
    val preferences=remember{context.getSharedPreferences("native_display",0)}
    var notifications by remember{mutableStateOf(TimerNotices.optedIn(context)&&TimerNotices.allowed(context))}
    var focusMinutes by rememberSaveable{mutableIntStateOf(preferences.getInt("focusMinutes",50))}
    var achievementDialog by remember{mutableStateOf(false)}
    var achievementFromSettings by remember{mutableStateOf(false)}
    var creatingPlan by remember{mutableStateOf<Plan?>(null)}
    var freeStudy by remember{mutableStateOf(false)}
    var preferGranApp by rememberSaveable{mutableStateOf(preferences.getBoolean("prefer_gran_app",true))}
    var reminderSettings by remember{mutableStateOf(false)}
    val catalogStatus by vm.catalogStatus.collectAsStateWithLifecycle()
    val catalogBusy by vm.catalogBusy.collectAsStateWithLifecycle()
    var recordCategory by remember{mutableStateOf("")}
    val notificationPermission=rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()){granted->notifications=granted;TimerNotices.optIn(context,granted);if(granted)vm.timer.value?.let{TimerNotices.schedule(context,it,vm.elapsed(it))}}

    val scope=rememberCoroutineScope()
    val profilePhoto=remember(raw){ProfilePhoto.value(raw)}
    var photoOwner by rememberSaveable{mutableStateOf("")};var photoBusy by remember{mutableStateOf(false)};var photoError by remember{mutableStateOf<String?>(null)}
    val photoPicker=rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()){uri->if(uri!=null){photoBusy=true;vm.setPhoto(uri,photoOwner){message->photoBusy=false;photoError=message}}}
    var exportOwner by rememberSaveable{mutableStateOf("")}
    val export=rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")){uri->
        if(uri!=null)scope.launch{try{val text=vm.backupJson(exportOwner);withContext(Dispatchers.IO){context.contentResolver.openOutputStream(uri)?.bufferedWriter()?.use{it.write(text)}?:error("Arquivo indisponível")};vm.error.value="Cópia de segurança salva."}catch(_:Exception){vm.error.value="Não foi possível exportar. Confira a conta e tente novamente."}}
    }
    var accountDialog by rememberSaveable{mutableStateOf(false)}
    var confirmRemote by remember{mutableStateOf(false)}
    var confirmLocal by remember{mutableStateOf(false)}
    var tab by rememberSaveable { mutableIntStateOf(0) }
    val scrollStates=(0..8).map{rememberLazyListState()}
    val pageScroll=scrollStates[tab]
    var moreMenu by remember{mutableStateOf(false)}
    var studyActions by remember{mutableStateOf(false)}
    var editalTopic by remember{mutableStateOf<Topic?>(null)}
    var picker by rememberSaveable { mutableStateOf(false) }
    var record by remember { mutableStateOf<Pair<Plan,Topic>?>(null) }
    var recordingTimer by remember { mutableStateOf<Timer?>(null) }
    var editLink by remember { mutableStateOf<Topic?>(null) }
    var chooseLink by remember { mutableStateOf<Topic?>(null) }
    var discard by remember { mutableStateOf<Timer?>(null) }
    val plan=plans.find { it.id==settings?.planId } ?: plans.firstOrNull()
    val outline=remember(plan,raw){plan?.let{EditalOutline.read(it,raw)}}
    val notebookLinks=remember(raw,outline,personal){outline?.let{NotebookLinks.index(raw,it,personal)}.orEmpty()}
    var personalNotebook by rememberSaveable(plan?.id){mutableStateOf(false)}
    var questionSearch by rememberSaveable(plan?.id){mutableStateOf("")}
    var historyDay by rememberSaveable{mutableStateOf<String?>(null)}
    var historyFree by rememberSaveable{mutableStateOf(false)}
    var howTo by remember{mutableStateOf(false)}
    val agenda=remember(raw,plan?.id){runCatching{JSONObject(raw).optJSONArray("agenda")?.objects()?.filter{it.optString("planoId")==plan?.id&&it.optString("data")==LocalDate.now().toString()&&!it.optBoolean("feito")}.orEmpty()}.getOrDefault(emptyList())}
    val activeTopics=plan?.disciplines?.filter{!it.paused&&!it.archived}?.flatMap{it.topics}.orEmpty()
    val selected=activeTopics.find { it.id==settings?.topicId } ?: activeTopics.firstOrNull { t -> progress.none { it.planId==plan?.id && it.topicId==t.id && it.completed } } ?: plan?.topics?.firstOrNull() ?: plan?.let{Topic("","Nenhum tópico ativo",null,"")}
    LaunchedEffect(account?.uid,plan?.id){moreMenu=false;studyActions=false;editalTopic=null;chooseLink=null;record=null;recordingTimer=null;editLink=null;picker=false;discard=null;freeStudy=false}
    val nextSuggested=agenda.firstNotNullOfOrNull{a->activeTopics.find{it.id==a.optString("topicoId")&&it.id!=selected?.id}}?:activeTopics.firstOrNull{t->t.id!=selected?.id&&progress.none{it.planId==plan?.id&&it.topicId==t.id&&it.completed}}
    val current=sessions.filter { it.planId==plan?.id }
    val historyRecords=if(historyFree)sessions.filter{it.planId.isEmpty()} else current
    val activities=remember(plan,current,raw){if(plan==null)emptyList() else StudyMetrics.activities(plan,current,raw)}
    val achievements=remember(plan,plans,sessions,progress,raw){StudyMetrics.achievements(plan,plans,sessions,progress,raw)}
    val completed=remember(outline,progress){outline?.let{EditalOutline.completed(it,progress)}.orEmpty()}
    val snackbar=remember { SnackbarHostState() }
    LaunchedEffect(error){error?.let { snackbar.showSnackbar(it);vm.error.value=null }}
    val destinations=listOf("Hoje","Planos","Caderno de questões","Estatísticas","Histórico","Planejamento","Disciplinas","Revisões","Edital")
    BackHandler(moreMenu||studyActions||tab!=0){when{moreMenu->moreMenu=false;studyActions->studyActions=false;else->tab=0}}
    Scaffold(snackbarHost={SnackbarHost(snackbar)},bottomBar={PrimaryNavigation(tab,moreMenu,onNavigate={tab=it},onStudy={studyActions=true},onMore={moreMenu=true})},topBar={
        TopAppBar(colors=TopAppBarDefaults.topAppBarColors(containerColor=MaterialTheme.colorScheme.background),navigationIcon={IconButton(onClick={tab=0}){Image(painterResource(R.drawable.pilot_icon),"Página inicial",Modifier.size(26.dp))}},title={Text(if(tab==0)"Gabaritei OS" else destinations[tab],fontWeight=FontWeight.SemiBold,fontSize=18.sp,lineHeight=24.sp)},actions={IconButton(onClick={accountDialog=true}){ProfileAvatar(profilePhoto,Modifier.size(28.dp).semantics{contentDescription="Conta e sincronização"})}})
    }) { padding ->
        if(!ready||plans.isEmpty())Box(Modifier.fillMaxSize().padding(padding),contentAlignment=Alignment.Center){Text(error?:"Carregando planos…")}
        else if(tab==8&&outline!=null)EditalScreen(outline,progress,pageScroll,Modifier.padding(padding),onTopic={editalTopic=it},onManage={tab=6})
        else if(plan!=null&&selected!=null) LazyColumn(Modifier.padding(padding).fillMaxSize(),state=pageScroll,contentPadding=PaddingValues(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)) {
            if(tab!=1)item { Surface(onClick={tab=1},shape=RoundedCornerShape(12.dp),color=MaterialTheme.colorScheme.secondaryContainer){Row(Modifier.fillMaxWidth().padding(horizontal=12.dp,vertical=6.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)){
                Icon(painterResource(R.drawable.book_outline),null,Modifier.size(20.dp),tint=MaterialTheme.colorScheme.primary)
                Column(Modifier.weight(1f)){Text(plan.name.replace(Regex(" \\(.*?\\)"),""),fontSize=12.sp,lineHeight=17.sp,fontWeight=FontWeight.SemiBold,maxLines=1,overflow=androidx.compose.ui.text.style.TextOverflow.Ellipsis)}
            }} }
            when(tab) {
                0 -> {
                    timer?.let { t -> item { TimerCard(t,vm,onFinish=finish@{
                        val p=plans.firstOrNull { it.id==t.planId };val topic=p?.topics?.firstOrNull { it.id==t.topicId }
                        if(p==null||topic==null){vm.error.value="O plano ou tópico foi removido. O tempo permanece salvo no aparelho.";return@finish}
                        vm.pause(t);recordingTimer=t.copy(seconds=vm.elapsed(t),startedElapsed=null);record=p to topic
                    },onDiscard={discard=t}) } }

                    val layout=HomeLayouts.read(raw)
                    if(layout.visible.isEmpty())item{Block{Text("Os cartões da inicial estão ocultos.");TextButton(onClick={accountDialog=true}){Text("Personalizar tela inicial")}}}
                    layout.visible.forEach{id->when(id){
                        "quote" -> {
                    item(key="home-quote") { MotivationCard(onOpen) }
                        }
                        "study" -> {
                    item(key="home-study") { if(activeTopics.isEmpty())Block{Text("Suas disciplinas estão pausadas ou arquivadas.");TextButton(onClick={tab=6}){Text("Organizar disciplinas")}}else Block {
                        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){Text("PLANEJAMENTO DO DIA",fontSize=10.sp,lineHeight=14.sp,fontWeight=FontWeight.SemiBold,color=MaterialTheme.colorScheme.onSurfaceVariant);Text(LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM",Locale("pt","BR"))),fontSize=11.sp,lineHeight=15.sp,color=MaterialTheme.colorScheme.primary)}
                        Surface(shape=RoundedCornerShape(12.dp),color=MaterialTheme.colorScheme.primaryContainer){Column(Modifier.fillMaxWidth().padding(12.dp),verticalArrangement=Arrangement.spacedBy(6.dp)){
                            Text("PRÓXIMO ESTUDO · ${agenda.firstOrNull{it.optString("topicoId")==selected.id}?.optInt("duracaoMin")?:focusMinutes.takeIf{it>0}?:50} MIN",fontSize=9.sp,lineHeight=13.sp,fontWeight=FontWeight.Bold,color=MaterialTheme.colorScheme.onPrimaryContainer)
                            Text(plan.discipline(selected).name,style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold)
                            Row(verticalAlignment=Alignment.CenterVertically) {
                                Text(selected.name,Modifier.weight(1f),fontSize=13.sp,lineHeight=19.sp)
                                IconButton(onClick={picker=true},modifier=Modifier.size(48.dp)){Icon(Icons.Outlined.Edit,"Escolher tópico",Modifier.size(18.dp))}
                            }
                        }}
                        Row(horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                            Button(onClick={if(!plan.enrolled)creatingPlan=plan else vm.start(plan,selected)},enabled=timer==null&&activeTopics.isNotEmpty(),modifier=Modifier.weight(1f),shape=RoundedCornerShape(10.dp)){Icon(Icons.Outlined.PlayArrow,null,Modifier.size(18.dp));Text("Iniciar estudo",fontSize=12.sp,lineHeight=17.sp)}
                            OutlinedButton(enabled=activeTopics.isNotEmpty(),onClick={if(!plan.enrolled)creatingPlan=plan else {recordingTimer=null;record=plan to selected}},shape=RoundedCornerShape(10.dp)){Text("Registrar",fontSize=12.sp,lineHeight=17.sp)}
                            IconButton(onClick={tab=2}){Icon(painterResource(R.drawable.book_outline),"Abrir caderno de questões",tint=MaterialTheme.colorScheme.primary)}
                        }
                        if(nextSuggested!=null){HorizontalDivider(color=MaterialTheme.colorScheme.outlineVariant);Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)){Text("AINDA HOJE",fontSize=9.sp,lineHeight=13.sp,fontWeight=FontWeight.SemiBold,color=MaterialTheme.colorScheme.onSurfaceVariant);Text(plan.discipline(nextSuggested).name,fontSize=12.sp,lineHeight=17.sp,fontWeight=FontWeight.SemiBold);Text(nextSuggested.name,fontSize=11.sp,lineHeight=15.sp,color=MaterialTheme.colorScheme.onSurfaceVariant,maxLines=2)};IconButton(onClick={vm.select(plan,nextSuggested)}){Icon(Icons.AutoMirrored.Outlined.ArrowForward,"Escolher próximo tópico",Modifier.size(18.dp))}}}
                    } }
                        }
                        "metrics" -> {
                    item(key="home-metrics") { val totals=StatisticsModel.total(activities);val content=outline?:plan
                        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(10.dp)){
                            DashboardMetric("Desempenho",StatisticsModel.percent(totals.accuracy),"${totals.questions} questões",totals.accuracy?.div(100)?.toFloat(),Modifier.weight(1f),onClick={tab=3})
                            DashboardMetric("Progresso no edital",StatisticsModel.percent(if(content.topics.isEmpty())null else completed.size*100.0/content.topics.size),"${completed.size} de ${content.topics.size} tópicos",if(content.topics.isEmpty())0f else completed.size.toFloat()/content.topics.size,Modifier.weight(1f),onClick={tab=8})
                        }
                    }
                        }
                        "achievements" -> {
                    item(key="home-achievements") { AchievementCarousel(achievements){achievementFromSettings=false;achievementDialog=true} }
                        }
                        "constancy" -> {
                    item(key="home-constancy") { ConstancyCard(activities,LocalDate.now().minusDays(29),LocalDate.now(),LocalDate.now(),false,plan.name,achievements) }
                        }
                        "goals" -> {
                    item(key="home-goals") { WeeklyGoals(activities) }
                        }
                        "reviews" -> {
                    val due=runCatching{JSONObject(raw).array("revisoes").objects().count{it.optString("planoId")==plan.id&&it.isNull("dataConcluida")&&it.optString("dataAgendada")<=LocalDate.now().toString()}}.getOrDefault(0)
                    if(due>0)item{Block{Text("$due revisões pendentes",fontWeight=FontWeight.SemiBold);TextButton(onClick={tab=7}){Text("Revisar agora")}}}
                        }
                    }}
                }
                1 -> item{PlanCatalogCards(plans,plan.id,catalogStatus,catalogBusy,onRefresh={vm.refreshCatalog()},onChoose={p->if(!p.enrolled)creatingPlan=p else {vm.select(p);tab=0}},onNotebook={p->personalNotebook=false;vm.preview(p);tab=2},onManage={p->vm.preview(p);tab=6},onOpen=onOpen)}
                2 -> {
                    item{Row(verticalAlignment=Alignment.CenterVertically){Text("Caderno de questões",Modifier.weight(1f),style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold);TextButton(onClick={howTo=true}){Text("Como usar?")}}}
                    val hasLinks=notebookLinks.values.any{it.isNotEmpty()}
                    if(!hasLinks&&!personalNotebook)item{Block{
                        Text("Caderno ainda não disponível",style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.SemiBold)
                        Text("Este concurso ainda não tem links organizados. Você pode montar seu caderno com links de outras plataformas.",style=MaterialTheme.typography.bodySmall)
                        Button(onClick={if(plan.enrolled)personalNotebook=true else creatingPlan=plan}){Text(if(plan.enrolled)"Adicionar meus links"else"Criar plano para adicionar links")}
                    }}
                    if(hasLinks||personalNotebook){
                    item{OutlinedTextField(questionSearch,{questionSearch=it},modifier=Modifier.fillMaxWidth(),singleLine=true,label={Text("Buscar disciplina ou tópico")},trailingIcon={if(questionSearch.isNotBlank())IconButton(onClick={questionSearch=""}){Icon(Icons.Outlined.Clear,"Limpar busca")}})}
                    val filtered=plan.disciplines.filter{d->searchKey(d.name).contains(searchKey(questionSearch))||d.topics.any{searchKey(it.name).contains(searchKey(questionSearch))}}
                    if(filtered.isEmpty())item{Block{Text("Nenhum tópico encontrado.")}}
                    items(filtered,key={it.id}) { d ->
                        var expanded by rememberSaveable(plan.id,d.id){mutableStateOf(false)}
                        Block {
                            ExpandableTitle(d.name,expanded){expanded=!expanded}
                            if(expanded||questionSearch.isNotBlank())d.topics.filter{searchKey(d.name).contains(searchKey(questionSearch))||searchKey(it.name).contains(searchKey(questionSearch))}.forEach { t ->
                                val options=notebookLinks[t.id].orEmpty().distinctBy{it.url}
                                HorizontalDivider(color=MaterialTheme.colorScheme.outlineVariant)
                                NotebookTopicRow(t,if(options.size==1&&options.single().id=="reference")t.note else "",onOpen={
                                    when(options.size){
                                        0->if(plan.enrolled)editLink=t else creatingPlan=plan
                                        1->onOpen(options.single().url)
                                        else->chooseLink=t
                                    }
                                },onEdit={if(plan.enrolled)editLink=t else creatingPlan=plan})
                            }
                        }
                    }
                }
                }
                3 -> {item{StatisticsScreen(outline?:plan,activities,progress,raw,sessions,onOpen,achievements)}}
                5 -> {item{PlanningScreen(plan,raw,vm,onChoose={vm.select(plan,it);picker=true},onStart={vm.start(plan,it);tab=0})}}
                6 -> {item{DisciplineManager(plan,raw,vm)}}
                7 -> {
                    val removed=runCatching{JSONObject(raw).obj("config").array("removidos").let{a->(0 until a.length()).map{a.optString(it)}}}.getOrDefault(emptyList())
                    val due=runCatching{JSONObject(raw).array("revisoes").objects().filter{it.optString("planoId")==plan.id&&it.isNull("dataConcluida")&&it.optString("id") !in removed}.sortedBy{it.optString("dataAgendada")}}.getOrDefault(emptyList())
                    item{Text("Revisões programadas",style=MaterialTheme.typography.titleMedium);Text("Registre a revisão para atualizar a fila.",style=MaterialTheme.typography.bodySmall)}
                    if(due.isEmpty())item{Block{Text("Nenhuma revisão pendente.");Text("As revisões são sugeridas ao concluir um tópico.",style=MaterialTheme.typography.bodySmall)}}
                    items(due,key={it.optString("id")}){r->val topic=plan.topics.find{it.id==r.optString("topicoId")};if(topic!=null)Block{Text(topic.name,fontWeight=FontWeight.SemiBold);Text("${r.optString("dataAgendada")} · ${r.optString("tipo")}",style=MaterialTheme.typography.bodySmall);TextButton(onClick={recordCategory="revisao";recordingTimer=null;record=plan to topic}){Text("Registrar revisão")};topic.link?.let{url->TextButton(onClick={onOpen(url)}){Text("Resolver questões ↗")}}}}
                }
                4 -> {
                    item{Row(verticalAlignment=Alignment.CenterVertically){Checkbox(historyFree,{historyFree=it;historyDay=null});Text("Ver estudos livres",style=MaterialTheme.typography.bodyMedium)}}
                    item{Text("${historyRecords.size} ${if(historyRecords.size==1)"sessão" else "sessões"} · ${duration(historyRecords.sumOf { it.seconds })} estudados",style=MaterialTheme.typography.bodyMedium)}
                    if(historyRecords.isEmpty())item{Block{Text("Seu primeiro registro aparecerá aqui.");TextButton(onClick={if(!plan.enrolled)creatingPlan=plan else {recordingTimer=null;record=plan to selected}}){Text("Registrar estudo")}}}
                    if(historyDay!=null)item{Row(verticalAlignment=Alignment.CenterVertically){Text("Registros de ${historyDay}",Modifier.weight(1f),style=MaterialTheme.typography.bodySmall);TextButton(onClick={historyDay=null}){Text("Ver todos")}}}
                    items(historyRecords.filter{historyDay==null||Instant.ofEpochMilli(it.endedAt).atZone(ZoneId.systemDefault()).toLocalDate().toString()==historyDay},key={it.id}) { s -> Block {
                        Text(StudyMetrics.sessionTitle(plan,s,raw),fontWeight=FontWeight.SemiBold)
                        Text(DateTimeFormatter.ofPattern("dd/MM/yyyy · HH:mm").format(Instant.ofEpochMilli(s.endedAt).atZone(ZoneId.systemDefault())),style=MaterialTheme.typography.bodySmall)
                        Text("${duration(s.seconds)} · ${s.questions} questões · ${s.correct} acertos",style=MaterialTheme.typography.bodySmall)
                    } }
                }
            }
        }
    }
    if(moreMenu)MoreNavigationSheet(onClose={moreMenu=false},onNavigate={tab=it},onProfile={accountDialog=true},onReminders={reminderSettings=true})
    if(studyActions&&plan!=null&&selected!=null)StudyActionsSheet(selected.name,onClose={studyActions=false},onStart={if(!plan.enrolled)creatingPlan=plan else{vm.start(plan,selected);tab=0}},onRecord={if(!plan.enrolled)creatingPlan=plan else{recordingTimer=null;record=plan to selected}},onFree={freeStudy=true},canStart=timer==null&&activeTopics.isNotEmpty())
    editalTopic?.let{t->if(outline!=null)ModalBottomSheet(onDismissRequest={editalTopic=null},sheetState=rememberModalBottomSheetState(skipPartiallyExpanded=true),containerColor=MaterialTheme.colorScheme.surface){
        Column(Modifier.padding(20.dp).padding(bottom=16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
            Text(outline.discipline(t).name,style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)
            Text(t.name,style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold)
            Text(if(t.id in completed)"Concluído no edital"else"Pendente no edital",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
            val active=activeTopics.any{it.id==t.id}
            Button(onClick={editalTopic=null;if(active&&plan!=null){vm.select(plan,t);tab=0}else tab=6},modifier=Modifier.fillMaxWidth()){Text(if(active)"Escolher para estudar"else"Organizar na rotina")}
            val links=notebookLinks[t.id].orEmpty().distinctBy{it.url}
            if(links.isNotEmpty())OutlinedButton(onClick={editalTopic=null;if(links.size==1)onOpen(links.single().url)else chooseLink=t},modifier=Modifier.fillMaxWidth()){Text("Resolver questões")}
        }
    }}
    if(freeStudy)FreeStudyDialog(vm){freeStudy=false}
    if(accountDialog)SettingsCenter(profilePhoto,account?.name?:"Perfil local",fullscreen,onClose={accountDialog=false},onStatistics={accountDialog=false;tab=3;scope.launch{scrollStates[3].scrollToItem(0)}},onPlanning={accountDialog=false;tab=5},onRevisions={accountDialog=false;tab=7},onNotebook={accountDialog=false;tab=2},home={if(ready)HomeLayoutEditor(raw,account?.uid.orEmpty()){value,done->vm.setHomeLayout(value,account?.uid.orEmpty(),done)}else Text("Carregando preferências…")},profile={
        Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)){
            ProfileAvatar(profilePhoto,Modifier.size(64.dp))
            Column{TextButton(enabled=!photoBusy,onClick={photoOwner=account?.uid.orEmpty();photoError=null;photoPicker.launch(androidx.activity.result.PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))}){Text(if(photoBusy)"Salvando foto…" else "Escolher foto")}
                if(profilePhoto.isNotEmpty())TextButton(enabled=!photoBusy,onClick={photoBusy=true;vm.setPhoto(null,account?.uid.orEmpty()){message->photoBusy=false;photoError=message}}){Text("Remover foto")}}
        }
        Text(if(account==null)"Foto salva neste aparelho." else "Foto compartilhada com o site nesta conta.",style=MaterialTheme.typography.bodySmall)
        photoError?.let{Text(it,color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodySmall)}
        Button(onClick={accountDialog=false;achievementFromSettings=true;achievementDialog=true},modifier=Modifier.fillMaxWidth()){Icon(Icons.Outlined.Star,null,Modifier.size(18.dp));Spacer(Modifier.width(8.dp));Text("Conquistas · ${achievements.count{it.earned}}/${achievements.size}")}
    },appearance={
        Text("Aparência",style=MaterialTheme.typography.titleSmall,fontWeight=FontWeight.SemiBold)
        Row(horizontalArrangement=Arrangement.spacedBy(5.dp)){listOf("system" to "Auto","light" to "Claro","dark" to "Escuro").forEach{(key,label)->FilterChip(selected=theme==key,onClick={onTheme(key)},label={Text(label,fontSize=11.sp,lineHeight=15.sp)})}}
        Row(verticalAlignment=Alignment.CenterVertically){Text("Tela cheia",Modifier.weight(1f),style=MaterialTheme.typography.bodyMedium);Switch(checked=fullscreen,onCheckedChange=onFullscreen)}
    },study={
        Text("Meta do cronômetro",style=MaterialTheme.typography.titleSmall,fontWeight=FontWeight.SemiBold)
        Row(horizontalArrangement=Arrangement.spacedBy(5.dp)){(listOf(0,25,50)+focusMinutes).distinct().sorted().forEach{min->FilterChip(selected=focusMinutes==min,onClick={focusMinutes=min;preferences.edit().putInt("focusMinutes",min).apply()},label={Text(if(min==0)"Livre" else "${min}min",fontSize=11.sp,lineHeight=15.sp)})}}
    },notifications={
        Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text("Aviso do cronômetro",style=MaterialTheme.typography.bodyMedium);Text("Avisar ao atingir a meta do cronômetro",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)};Switch(checked=notifications,onCheckedChange={enabled->if(enabled){if(Build.VERSION.SDK_INT>=33&&!TimerNotices.allowed(context))notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)else{TimerNotices.optIn(context,true);notifications=TimerNotices.allowed(context);vm.timer.value?.let{TimerNotices.schedule(context,it,vm.elapsed(it))}}}else{notifications=false;TimerNotices.optIn(context,false)}})}
        if(notifications){TextButton(onClick={TimerNotices.show(context,true)}){Text("Testar alerta")};if(Build.VERSION.SDK_INT>=31&&!context.getSystemService(AlarmManager::class.java).canScheduleExactAlarms())TextButton(onClick={context.startActivity(Intent(SystemSettings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,Uri.parse("package:${context.packageName}")))}){Text("Permitir avisos precisos")}}
        OutlinedButton(onClick={reminderSettings=true},modifier=Modifier.fillMaxWidth()){Text("Lembretes de estudo")}
        Text(if(DailyReminders.read(context).enabled)"Lembretes configurados neste aparelho."else"Lembretes diários desativados.",style=MaterialTheme.typography.bodySmall)
    },integrations={
        Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text("Preferir app do Gran",style=MaterialTheme.typography.bodyMedium);Text("Abrir questões com os filtros do caderno",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)};Switch(preferGranApp,{preferGranApp=it;preferences.edit().putBoolean("prefer_gran_app",it).apply()})}
    },account={
        HorizontalDivider()
        if(account==null){
            Text("Entre com a mesma conta Google usada no site para compartilhar planos, estudos e links.")
            Text("Os registros feitos no modo local continuam separados da conta.",style=MaterialTheme.typography.bodySmall)
            Button(onClick={vm.signIn(context as Activity)}){Text("Entrar com Google")}
        }else{
            Text(account!!.name,fontWeight=FontWeight.Bold);Text(account!!.email,style=MaterialTheme.typography.bodySmall)
            Text(sync.text,color=if(sync.failed)MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface)
            Text(if(pending==0)"Nenhuma alteração aguardando envio." else "$pending alterações aguardando envio.",style=MaterialTheme.typography.bodySmall)
            if(sync.busy)LinearProgressIndicator(Modifier.fillMaxWidth())
            Button(enabled=!sync.busy,onClick={vm.synchronize()}){Text("Sincronizar agora")}
            if(sync.conflict){
                OutlinedButton(onClick={confirmLocal=true}){Text("Reaplicar alterações locais")}
                TextButton(onClick={confirmRemote=true}){Text("Manter versão do site")}
            }
            if(guestCount>0)OutlinedButton(onClick={confirmImport=true}){Text("Trazer $guestCount registros deste aparelho")}
            TextButton(onClick={exportOwner=account!!.uid;export.launch("gabaritei-backup-${LocalDate.now()}.json")}){Text("Exportar cópia de segurança")}
            TextButton(onClick={vm.signOut();accountDialog=false}){Text("Sair desta conta")}
        }
    })
    if(reminderSettings)ReminderSettingsDialog{reminderSettings=false}
    if(achievementDialog)AchievementsDialog(achievements){achievementDialog=false;accountDialog=achievementFromSettings}
    creatingPlan?.let{p->CreatePlanDialog(p,onClose={creatingPlan=null},onCreate={routine,done->vm.createPlan(p,routine){message->if(message==null){creatingPlan=null;tab=0;focusMinutes=routine.blockMinutes}else done(message)}})}
    if(confirmImport)AlertDialog(onDismissRequest={confirmImport=false},title={Text("Trazer os estudos locais?")},text={Text("Os $guestCount registros locais serão incluídos na conta ${account?.email.orEmpty()}. A cópia local será mantida e repetir a importação não duplicará os mesmos registros.")},confirmButton={TextButton(onClick={confirmImport=false;vm.importGuest()}){Text("Trazer estudos")}},dismissButton={TextButton(onClick={confirmImport=false}){Text("Cancelar")}})
    if(confirmLocal)AlertDialog(onDismissRequest={confirmLocal=false},title={Text("Reaplicar alterações locais?")},text={Text("Os registros e links pendentes serão aplicados sobre o histórico atual. Exclusões de planos e tópicos feitas no site continuam protegidas.")},confirmButton={TextButton(onClick={confirmLocal=false;vm.synchronize(true)}){Text("Reaplicar")}},dismissButton={TextButton(onClick={confirmLocal=false}){Text("Cancelar")}})
    if(confirmRemote)AlertDialog(onDismissRequest={confirmRemote=false},title={Text("Manter os dados do site?")},text={Text("As alterações pendentes serão guardadas em uma cópia local de recuperação e deixarão de ser enviadas. O app baixará o histórico do site.")},confirmButton={TextButton(onClick={confirmRemote=false;vm.keepRemote()}){Text("Manter versão do site")}},dismissButton={TextButton(onClick={confirmRemote=false}){Text("Cancelar")}})
    if(howTo)AlertDialog(onDismissRequest={howTo=false},title={Text("Como usar?")},text={Text("Toque no subtópico para resolver. Se houver mais de um link, escolha a plataforma. Pressione o subtópico para editar ou adicionar links.")},confirmButton={TextButton(onClick={howTo=false}){Text("Fechar")}})
    if(picker&&plan!=null) TopicPicker(plan,progress.filter{it.planId==plan.id},selected?.id,onClose={picker=false},onSelect={vm.select(plan,it);picker=false})
    record?.let { (p,t) -> RecordDialog(p,t,recordingTimer,vm,recordCategory,onClose={record=null;recordingTimer=null;recordCategory=""}) }
    chooseLink?.let{t->if(plan!=null)NotebookChooser(t,notebookLinks[t.id].orEmpty().distinctBy{it.url},onClose={chooseLink=null},onOpen={chooseLink=null;onOpen(it)})}
    editLink?.let{t->if(plan!=null)NotebookLinksDialog(t,notebookLinks[t.id].orEmpty(),onClose={editLink=null},onSave={old,url,name,remove,done->vm.saveNotebookLink(plan,t,old,url,name,remove,done)})}
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
        if(t.goalSeconds>0)Text(if(elapsed>=t.goalSeconds)"Meta atingida · continue ou conclua o estudo" else "Meta: ${t.goalSeconds/60} min",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
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
                            ExpandableTitle(d.name,expanded){expanded=!expanded}
                            if(expanded||search.isNotBlank())d.topics.filter{it.name.contains(search,true)||d.name.contains(search,true)}.forEach { t ->
                                TextButton(onClick={onSelect(t)},contentPadding=PaddingValues(horizontal=8.dp,vertical=6.dp),shape=RoundedCornerShape(8.dp),modifier=Modifier.fillMaxWidth()) {
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
@Composable private fun RecordDialog(plan:Plan,topic:Topic,timer:Timer?,vm:PilotViewModel,initialCategory:String="",onClose:()->Unit) {
    val id=remember{timer?.sessionId?:UUID.randomUUID().toString()}
    var minutes by rememberSaveable{mutableStateOf("")};var questions by rememberSaveable{mutableStateOf("0")};var correct by rememberSaveable{mutableStateOf("0")}
    var completed by rememberSaveable{mutableStateOf(false)};var saving by remember{mutableStateOf(false)}
    var validationMessage by remember{mutableStateOf<String?>(null)}
    var category by rememberSaveable{mutableStateOf(initialCategory)}
    var studyDate by rememberSaveable{mutableStateOf(LocalDate.now().toString())}
    AlertDialog(onDismissRequest={if(!saving)onClose()},title={Text("Registrar estudo")},text={
        Column(Modifier.verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(8.dp)) {
            Text(topic.name)
            Choice("Categoria",category,listOf("" to "Automática","teoria" to "Teoria","questoes" to "Questões","revisao" to "Revisão")){category=it}
            if(timer==null)StudyDateField("Data do estudo",studyDate){studyDate=it}
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
        val day=runCatching{LocalDate.parse(studyDate)}.getOrNull();if(day==null||day.isAfter(LocalDate.now())){validationMessage="Confira a data do estudo.";return@TextButton}
        validationMessage=null;saving=true;vm.save(plan,topic,input,completed,timer,id,category,day,failed={saving=false;validationMessage="Não foi possível salvar. Tente novamente."}){onClose()}
    }){Text(if(saving)"Salvando…" else "Salvar registro")}},dismissButton={TextButton(enabled=!saving,onClick=onClose){Text("Cancelar")}})
}
internal fun searchKey(value:String)=java.text.Normalizer.normalize(value,java.text.Normalizer.Form.NFD).replace(Regex("\\p{M}"),"").lowercase(Locale.ROOT)
@Composable private fun WeekSummary(sessions:List<StudyActivity>,onDay:(LocalDate)->Unit){
    val today=LocalDate.now();val monday=today.minusDays((today.dayOfWeek.value-1).toLong())
    Block{
        Text("Sua semana",style=MaterialTheme.typography.titleSmall,fontWeight=FontWeight.SemiBold)
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(3.dp)){
            (0..6).forEach{i->val day=monday.plusDays(i.toLong());val min=sessions.filter{it.date==day}.sumOf{it.minutes}.toInt()
                Surface(onClick={onDay(day)},modifier=Modifier.weight(1f),shape=RoundedCornerShape(10.dp),color=if(day==today)MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface){
                    Column(Modifier.padding(vertical=10.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(5.dp)){
                        Text(listOf("Seg","Ter","Qua","Qui","Sex","Sáb","Dom")[i],fontSize=11.sp,lineHeight=15.sp)
                        Text("${day.dayOfMonth}",fontWeight=FontWeight.SemiBold,fontSize=14.sp,lineHeight=20.sp)
                        Text("${min}m",fontSize=10.sp,lineHeight=14.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
    }
}

@Composable internal fun PlanLogo(plan:Plan,modifier:Modifier=Modifier){
    val context=LocalContext.current
    val photo=remember(plan.details){runCatching{JSONObject(plan.details).optString("foto")}.getOrDefault("")}
    val bitmap by produceState<androidx.compose.ui.graphics.ImageBitmap?>(null,plan.logoAsset,photo){value=withContext(Dispatchers.IO){OrgLogos.load(context,plan.logoAsset,photo)?.asImageBitmap()}}
    if(bitmap==null)Icon(painterResource(R.drawable.book_outline),null,modifier,tint=MaterialTheme.colorScheme.primary)else Image(bitmap!!,null,modifier)
}
