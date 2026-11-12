package br.com.gabaritei.piloto

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.launch
import java.util.Locale

@Composable internal fun AppUpdateProfile(updates:AppUpdates,onOpen:()->Unit){
    val state by updates.state.collectAsState()
    HorizontalDivider()
    Text("Atualizações do app",style=MaterialTheme.typography.titleSmall)
    Text("Gabaritei ${updates.installedName}",style=MaterialTheme.typography.bodySmall)
    OutlinedButton(onClick=onOpen,modifier=Modifier.fillMaxWidth()){
        Text(if(state.release!=null)"Atualização ${state.release!!.name} disponível"else"Verificar atualizações")
    }
}

@Composable internal fun AppUpdateHost(updates:AppUpdates,manual:Boolean,allowPrompt:Boolean,installationBlock:String?,onClose:()->Unit){
    val state by updates.state.collectAsState();val context=LocalContext.current;val scope=rememberCoroutineScope()
    val lifecycle=LocalLifecycleOwner.current.lifecycle
    var preparing by remember{mutableStateOf(false)}
    val latestBlock by rememberUpdatedState(installationBlock)
    DisposableEffect(lifecycle,updates){
        val observer=LifecycleEventObserver{_,event->if(event==Lifecycle.Event.ON_RESUME)updates.check()}
        lifecycle.addObserver(observer);updates.check();onDispose{lifecycle.removeObserver(observer)}
    }
    fun install(){
        latestBlock?.let{updates.failure(it);return};if(preparing)return;preparing=true
        scope.launch{try{val intent=updates.installerIntent();check(latestBlock==null){latestBlock.orEmpty()};context.startActivity(intent);updates.installerOpened()}catch(e:Exception){updates.failure(e.message?:"Não foi possível abrir o instalador. Tente novamente.")}finally{preparing=false}}
    }
    val permission=rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()){
        if(updates.canInstall())install()else updates.failure("A permissão não foi ativada. Você pode tentar novamente quando quiser; o app atual continua funcionando.")
    }
    if(!manual&&!(allowPrompt&&state.release!=null&&!state.snoozed))return
    fun close(){if(preparing)return;updates.later();onClose()}
    val release=state.release
    AlertDialog(onDismissRequest={close()},title={Text(if(release==null)"Atualizações do Gabaritei"else"Nova versão disponível")},text={
        Column(Modifier.verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(12.dp)){
            Text("Versão instalada: ${updates.installedName}",style=MaterialTheme.typography.bodySmall)
            if(release!=null){
                Text("Gabaritei ${release.name} · ${String.format(Locale("pt","BR"),"%.1f MB",release.bytes/1000000.0)}",style=MaterialTheme.typography.titleMedium)
                Text("Baixe a atualização aqui e confirme a instalação no Android. Não é preciso desinstalar.")
                TextButton(onClick={context.startActivity(Intent(Intent.ACTION_VIEW,Uri.parse(release.page)))}){Text("Ver novidades desta versão")}
            }
            when{
                preparing-> {LinearProgressIndicator(Modifier.fillMaxWidth());Text("Conferindo a atualização…")}
                state.checking-> {LinearProgressIndicator(Modifier.fillMaxWidth());Text("Verificando novas versões…")}
                state.downloading-> {LinearProgressIndicator(progress={state.progress.coerceIn(0f,1f)},modifier=Modifier.fillMaxWidth());Text("Baixando… ${(state.progress*100).toInt()}%")}
                state.ready->Text(installationBlock?:"Salve seus rascunhos antes de instalar. Na primeira vez, o Android pode pedir permissão para instalar a partir do Gabaritei.",style=MaterialTheme.typography.bodySmall)
            }
            if(state.message.isNotBlank())Text(state.message,style=MaterialTheme.typography.bodySmall)
        }
    },confirmButton={
        TextButton(enabled=!preparing&&!state.checking&&!state.downloading&&(!state.ready||installationBlock==null),onClick={
            when{
                release==null->updates.check(true)
                state.ready->if(updates.canInstall())install()else permission.launch(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:${context.packageName}")))
                else->updates.download()
            }
        }){Text(when{preparing->"Conferindo…";state.checking->"Verificando…";state.downloading->"Baixando…";release==null->"Verificar novamente";state.ready->"Instalar atualização";else->"Baixar atualização"})}
    },dismissButton={
        Row{if(state.downloading)TextButton(onClick={updates.cancelDownload()}){Text("Cancelar download")};TextButton(onClick={close()},enabled=!preparing){Text(if(release==null)"Fechar"else"Depois")}}
    })
}
