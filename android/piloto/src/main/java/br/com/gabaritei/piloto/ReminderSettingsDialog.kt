package br.com.gabaritei.piloto

import android.Manifest
import android.os.Build
import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable fun ReminderSettingsDialog(onClose:()->Unit){
    val c=LocalContext.current;val initial=remember{DailyReminders.read(c)}
    var enabled by rememberSaveable{mutableStateOf(initial.enabled)};var hour by rememberSaveable{mutableIntStateOf(initial.hour)};var minute by rememberSaveable{mutableIntStateOf(initial.minute)};var days by rememberSaveable{mutableStateOf(initial.days.toList())};var only by rememberSaveable{mutableStateOf(initial.onlyUnstudied)};var message by remember{mutableStateOf<String?>(null)};var action by remember{mutableStateOf("")}
    fun options()=ReminderOptions(enabled,hour,minute,days.toSet(),only)
    fun apply(){if(!ReminderRules.valid(options())){message="Escolha pelo menos um dia.";return};DailyReminders.save(c,options());if(enabled&&!DailyReminders.allowed(c))message="Configuração salva. Libere os lembretes nas configurações do Android."else onClose()}
    val permission=rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()){granted->if(granted){if(action=="test"){DailyReminders.show(c,true);message="Prévia enviada."}else apply()}else message="Ative as notificações nas configurações do Android para receber lembretes."}
    fun needPermission()=Build.VERSION.SDK_INT>=33&&androidx.core.content.ContextCompat.checkSelfPermission(c,Manifest.permission.POST_NOTIFICATIONS)!=android.content.pm.PackageManager.PERMISSION_GRANTED
    AlertDialog(containerColor=MaterialTheme.colorScheme.surface,onDismissRequest=onClose,title={Text("Lembretes de estudo")},text={Column(Modifier.verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(10.dp)){
        Row(verticalAlignment=Alignment.CenterVertically){Text("Ativar lembretes",Modifier.weight(1f));Switch(enabled,{enabled=it})}
        OutlinedButton(onClick={android.app.TimePickerDialog(c,{_,h,m->hour=h;minute=m},hour,minute,true).show()},modifier=Modifier.fillMaxWidth()){Text("Por volta de %02d:%02d".format(hour,minute))}
        listOf(listOf(1,2,3,4),listOf(5,6,7)).forEach{row->Row(horizontalArrangement=Arrangement.spacedBy(5.dp)){row.forEach{d->FilterChip(d in days,{days=if(d in days)days-d else days+d},label={Text(listOf("Seg","Ter","Qua","Qui","Sex","Sáb","Dom")[d-1],fontSize=11.sp)})}}}
        Row(Modifier.toggleable(only,role=Role.Checkbox,onValueChange={only=it}),verticalAlignment=Alignment.CenterVertically){Checkbox(only,null);Text("Só se eu ainda não registrei estudo hoje",style=MaterialTheme.typography.bodySmall)}
        Text("Uma mensagem leve com emoji, no máximo uma vez por dia. O Android pode adiar o horário.",style=MaterialTheme.typography.bodySmall)
        OutlinedButton(onClick={action="test";if(needPermission())permission.launch(Manifest.permission.POST_NOTIFICATIONS)else if(DailyReminders.show(c,true))message="Prévia enviada."else message="Libere os lembretes nas configurações do Android."},modifier=Modifier.fillMaxWidth()){Text("Enviar prévia 📚")}
        if(!DailyReminders.allowed(c))TextButton(onClick={c.startActivity(Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(android.provider.Settings.EXTRA_APP_PACKAGE,c.packageName))}){Text("Configurações do Android")}
        message?.let{Text(it,style=MaterialTheme.typography.bodySmall)}
    }},confirmButton={TextButton(onClick={action="save";if(enabled&&needPermission())permission.launch(Manifest.permission.POST_NOTIFICATIONS)else apply()}){Text("Salvar")}},dismissButton={TextButton(onClick=onClose){Text("Cancelar")}})
}
