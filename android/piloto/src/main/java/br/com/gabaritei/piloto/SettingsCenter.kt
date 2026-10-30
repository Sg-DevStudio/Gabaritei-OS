package br.com.gabaritei.piloto

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.window.DialogWindowProvider
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

private data class SettingsGroup(val id:String,val title:String,val detail:String,val keywords:String)
@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun SettingsCenter(photo:String,name:String,fullscreen:Boolean,onClose:()->Unit,onStatistics:()->Unit,onPlanning:()->Unit,onRevisions:()->Unit,onNotebook:()->Unit,
    profile:@Composable ColumnScope.()->Unit,appearance:@Composable ColumnScope.()->Unit,study:@Composable ColumnScope.()->Unit,notifications:@Composable ColumnScope.()->Unit,integrations:@Composable ColumnScope.()->Unit,account:@Composable ColumnScope.()->Unit){
    val context=LocalContext.current
    val version=remember{context.packageManager.getPackageInfo(context.packageName,0).versionName.orEmpty().substringBefore("-")}
    var section by remember{mutableStateOf<String?>(null)};var search by remember{mutableStateOf("")}
    val groups=listOf(SettingsGroup("profile","Perfil e conquistas","Foto e coleção de troféus","perfil foto conquistas"),SettingsGroup("appearance","Aparência e tela","Tema e modo de exibição","aparencia claro escuro tema tela cheia"),SettingsGroup("study","Estudos e revisão","Rotina, revisões e cronômetro","estudo dias rotina cronometro revisao"),SettingsGroup("notifications","Avisos e lembretes","Horários e notificações","notificacao som aviso lembrete permissao"),SettingsGroup("integrations","Questões e plataformas","Cadernos e abertura do Gran","gran questoes links plataforma"),SettingsGroup("statistics","Estatísticas","Filtros e indicadores visíveis","estatistica dados grafico constancia desempenho"),SettingsGroup("account","Conta e dados","Sincronização e cópia de segurança","google conta backup sincronizar dados"))
    fun back(){if(section==null)onClose()else section=null}
    Dialog(onDismissRequest={back()},properties=DialogProperties(usePlatformDefaultWidth=false,decorFitsSystemWindows=false)){
        val view=LocalView.current
        val lightBars=MaterialTheme.colorScheme.background.luminance()>.5f
        SideEffect{(view.parent as? DialogWindowProvider)?.window?.let{window->
            WindowCompat.getInsetsController(window,window.decorView).apply{
                isAppearanceLightStatusBars=lightBars;isAppearanceLightNavigationBars=lightBars
                systemBarsBehavior=WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                if(fullscreen)hide(WindowInsetsCompat.Type.systemBars())else show(WindowInsetsCompat.Type.systemBars())
            }
        }}
        BackHandler{back()}
        Surface(Modifier.fillMaxSize(),color=MaterialTheme.colorScheme.background){Scaffold(topBar={TopAppBar(title={Text(groups.find{it.id==section}?.title?:"Configurações",style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.SemiBold)},navigationIcon={IconButton(onClick={back()}){Icon(Icons.AutoMirrored.Outlined.ArrowBack,"Voltar")}},colors=TopAppBarDefaults.topAppBarColors(containerColor=MaterialTheme.colorScheme.background))}){padding->
            LazyColumn(Modifier.fillMaxSize().padding(padding),contentPadding=PaddingValues(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
                if(section==null){
                    item{Card(onClick={section="profile"},modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(16.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.primaryContainer)){Row(Modifier.padding(16.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)){ProfileAvatar(photo,Modifier.size(46.dp));Column(Modifier.weight(1f)){Text(name,style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.SemiBold);Text("Seu perfil e suas conquistas",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)};Icon(Icons.Outlined.KeyboardArrowRight,null)}}}
                    item{OutlinedTextField(search,{search=it},Modifier.fillMaxWidth(),singleLine=true,label={Text("Buscar configuração")})}
                    val results=groups.filter{(it.id!="profile"||search.isNotBlank())&&searchKey(it.title+" "+it.keywords).contains(searchKey(search))}
                    if(results.isEmpty())item{Text("Nenhuma configuração encontrada.",style=MaterialTheme.typography.bodyMedium)}
                    results.forEach{g->item(key=g.id){Surface(shape=RoundedCornerShape(14.dp),color=MaterialTheme.colorScheme.surface){ListItem(headlineContent={Text(g.title,style=MaterialTheme.typography.bodyMedium,fontWeight=FontWeight.SemiBold)},supportingContent={Text(g.detail,style=MaterialTheme.typography.bodySmall)},trailingContent={Icon(Icons.Outlined.KeyboardArrowRight,null)},modifier=Modifier.clickable{if(g.id=="statistics")onStatistics()else section=g.id})}}}
                }else item{Block{
                    when(section){"profile"->profile();"appearance"->appearance();"study"->{study();HorizontalDivider();OutlinedButton(onClick=onPlanning,Modifier.fillMaxWidth()){Text("Rotina e planejamento")};OutlinedButton(onClick=onRevisions,Modifier.fillMaxWidth()){Text("Revisões")}};"notifications"->notifications();"integrations"->{integrations();OutlinedButton(onClick=onNotebook,Modifier.fillMaxWidth()){Text("Abrir caderno de questões")}};"account"->account()}
                }}
                item{Text("Gabaritei OS · $version",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
            }
        }}
    }
}
