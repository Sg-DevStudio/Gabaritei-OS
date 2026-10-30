package br.com.gabaritei.piloto

import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp

@Composable internal fun NotebookTopicRow(topic:Topic,note:String,onOpen:()->Unit,onEdit:()->Unit){
    Column(Modifier.fillMaxWidth().heightIn(min=56.dp).combinedClickable(role=Role.Button,onClickLabel="Resolver questões",onLongClickLabel="Editar ou adicionar links",onClick=onOpen,onLongClick=onEdit).padding(horizontal=4.dp,vertical=12.dp),verticalArrangement=Arrangement.spacedBy(5.dp)){
        Text(topic.name,style=MaterialTheme.typography.bodyMedium,fontWeight=FontWeight.Medium)
        if(note.isNotBlank())Text(note,style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
@Composable internal fun NotebookChooser(topic:Topic,links:List<QuestionLink>,onClose:()->Unit,onOpen:(String)->Unit){
    AlertDialog(onDismissRequest=onClose,title={Text("Onde deseja resolver?")},text={Column(Modifier.heightIn(max=380.dp).verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(8.dp)){
        Text(topic.name,style=MaterialTheme.typography.bodyMedium)
        links.forEach{link->OutlinedButton(onClick={onOpen(link.url)},Modifier.fillMaxWidth()){
            Column(Modifier.weight(1f)){Text(link.label);if(link.label!=link.platform)Text(link.platform,style=MaterialTheme.typography.bodySmall)}
            Text("↗",Modifier.padding(start=12.dp))
        }}
    }},confirmButton={TextButton(onClick=onClose){Text("Cancelar")}})
}
@Composable internal fun NotebookLinksDialog(topic:Topic,links:List<QuestionLink>,onClose:()->Unit,onSave:(QuestionLink?,String,String,Boolean,(String?)->Unit)->Unit){
    var adding by rememberSaveable{mutableStateOf(links.isEmpty())}
    var editing by remember{mutableStateOf<QuestionLink?>(null)}
    var url by rememberSaveable{mutableStateOf("")}
    var name by rememberSaveable{mutableStateOf("")}
    var error by remember{mutableStateOf<String?>(null)}
    var busy by remember{mutableStateOf(false)}
    var deleting by remember{mutableStateOf<QuestionLink?>(null)}
    val form=adding||editing!=null
    fun back(){adding=false;editing=null;url="";name="";error=null}
    fun save(remove:Boolean=false){
        val target=if(remove)deleting else editing
        if(!remove&&!StudyRules.safeLink(NotebookLinks.cleanUrl(url))){error="Use um endereço HTTPS válido.";return}
        busy=true
        onSave(target,if(remove)target!!.url else url,if(remove)target!!.name else name,remove){message->busy=false;if(message==null){deleting=null;back()}else{deleting=null;error=message}}
    }
    AlertDialog(onDismissRequest={if(!busy)onClose()},title={Text(if(form)if(adding)"Adicionar link"else"Editar link"else"Links deste tópico")},text={Column(Modifier.heightIn(max=420.dp).verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(12.dp)){
        Text(topic.name,style=MaterialTheme.typography.bodyMedium)
        if(form){
            OutlinedTextField(name,{name=it.take(120)},enabled=!busy,label={Text("Nome (opcional)")},placeholder={Text("Ex.: NotebookLM")},modifier=Modifier.fillMaxWidth(),singleLine=true)
            OutlinedTextField(url,{url=it;error=null},enabled=!busy,label={Text("Link HTTPS")},modifier=Modifier.fillMaxWidth(),maxLines=4,keyboardOptions=KeyboardOptions(capitalization=KeyboardCapitalization.None,autoCorrectEnabled=false,keyboardType=KeyboardType.Uri),isError=error!=null)
        }else{
            if(links.isEmpty())Text("Nenhum link salvo. Adicione um endereço para resolver as questões.",style=MaterialTheme.typography.bodySmall)
            links.forEach{link->
                OutlinedButton(onClick={editing=link;url=link.url;name=link.label;error=null},Modifier.fillMaxWidth(),enabled=!busy){
                    Column(Modifier.weight(1f)){Text(link.label);if(link.label!=link.platform)Text(link.platform,style=MaterialTheme.typography.bodySmall)}
                    Text("Editar",Modifier.padding(start=8.dp),style=MaterialTheme.typography.labelSmall)
                }
            }
        }
        if(error!=null)Text(error!!,color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodySmall)
        if(editing!=null)TextButton(onClick={deleting=editing},enabled=!busy){Text("Remover link",color=MaterialTheme.colorScheme.error)}
    }},confirmButton={TextButton(enabled=!busy,onClick={if(form)save()else{adding=true;url="";name="";error=null}}){Text(if(busy)"Salvando…"else if(form)"Salvar"else"Adicionar link")}},dismissButton={TextButton(enabled=!busy,onClick={if(form)back()else onClose()}){Text(if(form)"Voltar"else"Concluir")}})
    deleting?.let{link->AlertDialog(onDismissRequest={if(!busy)deleting=null},title={Text("Remover este link?")},text={Text(link.label)},confirmButton={TextButton(enabled=!busy,onClick={save(true)}){Text("Remover")}},dismissButton={TextButton(enabled=!busy,onClick={deleting=null}){Text("Cancelar")}})}
}
