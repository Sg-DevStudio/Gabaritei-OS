package br.com.gabaritei.piloto

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp

@Composable internal fun PersonalAICard(repo:NativePracticeRepository){
    val status by repo.aiStatus.collectAsState()
    val owner by repo.aiOwner.collectAsState()
    var show by remember(owner){mutableStateOf(false)}
    LaunchedEffect(repo){repo.refreshAI()}
    OutlinedCard(Modifier.fillMaxWidth()){
        Column(Modifier.padding(14.dp),verticalArrangement=Arrangement.spacedBy(6.dp)){
            Text(status,style=MaterialTheme.typography.bodySmall)
            TextButton(onClick={show=true}){Text("Ajustar minha IA")}
        }
    }
    if(show)PersonalAIDialog(repo){show=false}
}

@Composable private fun PersonalAIDialog(repo:NativePracticeRepository,onClose:()->Unit){
    // Credentials intentionally do not use rememberSaveable or persistent drafts.
    var key by remember{mutableStateOf("")}
    var provider by rememberSaveable{mutableStateOf("")}
    var model by rememberSaveable{mutableStateOf(PersonalAI.googleModels.first())}
    var acknowledged by remember{mutableStateOf(false)}
    val busy by repo.busy.collectAsState();val message by repo.message.collectAsState()
    val context=LocalContext.current
    fun close(){key="";onClose()}
    AlertDialog(onDismissRequest={if(!busy)close()},title={Text("Configurar minha IA")},text={
        Column(Modifier.verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(12.dp)){
            Text("Cada conta usa a própria chave. Ela fica privada no seu perfil.")
            Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){
                TextButton(onClick={context.startActivity(Intent(Intent.ACTION_VIEW,Uri.parse("https://aistudio.google.com/api-keys")))}){Text("Google AI Studio")}
                TextButton(onClick={context.startActivity(Intent(Intent.ACTION_VIEW,Uri.parse("https://console.groq.com/keys")))}){Text("Groq Console")}
            }
            OutlinedTextField(key,{value->key=value.trim();provider=PersonalAI.provider(key).orEmpty()},Modifier.fillMaxWidth(),label={Text("Chave de API (Gemini ou Groq)")},visualTransformation=PasswordVisualTransformation(),singleLine=true,enabled=!busy)
            Text(when(provider){"groq"->"Chave Groq identificada. Texto: questões e redações. PDF/foto precisam de Gemini.";"gemini"->"Chave Gemini identificada. Texto, PDF e foto.";else->"Cole sua chave: o provedor será identificado automaticamente."},style=MaterialTheme.typography.bodySmall)
            if(provider=="gemini")PersonalAI.googleModels.forEach{value->Row(verticalAlignment=Alignment.CenterVertically){RadioButton(model==value,{model=value},enabled=!busy);Text(value,style=MaterialTheme.typography.bodySmall)}}
            else if(provider=="groq") Text("Modelo: "+PersonalAI.groqModel,style=MaterialTheme.typography.bodySmall)
            Row(verticalAlignment=Alignment.CenterVertically){Checkbox(acknowledged,{acknowledged=it},enabled=!busy);Text("Para custo zero, use Groq Free ou um projeto Google sem faturamento. Uma conta com faturamento pode cobrar pelo uso.",style=MaterialTheme.typography.bodySmall)}
            if(busy)LinearProgressIndicator(Modifier.fillMaxWidth())
            if(message.isNotBlank())Text(message,style=MaterialTheme.typography.bodySmall)
        }
    },confirmButton={TextButton(onClick={repo.configureAI(key,provider,if(provider=="groq")PersonalAI.groqModel else model){close()}},enabled=!busy&&acknowledged&&provider.isNotBlank()&&key.isNotBlank()){Text(if(busy)"Conectando…"else"Conectar chave")}},dismissButton={TextButton(onClick={close()},enabled=!busy){Text("Fechar")}})
}
