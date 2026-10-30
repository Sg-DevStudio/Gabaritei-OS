package br.com.gabaritei.piloto

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.KeyboardArrowUp
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable internal fun HomeLayoutEditor(raw:String,owner:String,onSave:(HomeArrangement,(String?)->Unit)->Unit){
    var draft by remember(owner){mutableStateOf(HomeLayouts.read(raw))}
    var busy by remember{mutableStateOf(false)};var message by remember{mutableStateOf<String?>(null)}
    Text("Sua tela inicial",style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.SemiBold)
    Text("Escolha o que aparece e use as setas para mudar a ordem.",style=MaterialTheme.typography.bodySmall)
    draft.order.forEachIndexed{index,id->
        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){
            Column(Modifier.weight(1f)){Text(HomeLayouts.labels.getValue(id),style=MaterialTheme.typography.bodyMedium);Text(if(id in draft.hidden)"Oculto"else"Visível",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
            IconButton(enabled=!busy&&index>0,onClick={val next=draft.order.toMutableList();java.util.Collections.swap(next,index,index-1);draft=draft.copy(order=next)}){Icon(Icons.Outlined.KeyboardArrowUp,"Mover ${HomeLayouts.labels[id]} para cima")}
            IconButton(enabled=!busy&&index<draft.order.lastIndex,onClick={val next=draft.order.toMutableList();java.util.Collections.swap(next,index,index+1);draft=draft.copy(order=next)}){Icon(Icons.Outlined.KeyboardArrowDown,"Mover ${HomeLayouts.labels[id]} para baixo")}
            Switch(modifier=Modifier.semantics{contentDescription="Mostrar ${HomeLayouts.labels[id]}"},checked=id !in draft.hidden,enabled=!busy,onCheckedChange={show->draft=draft.copy(hidden=if(show)draft.hidden-id else draft.hidden+id)})
        }
        HorizontalDivider(color=MaterialTheme.colorScheme.outlineVariant)
    }
    Text(if(owner.isBlank())"Salvo neste aparelho."else"Salvo na conta e sincronizado entre seus aparelhos Android.",style=MaterialTheme.typography.bodySmall)
    message?.let{Text(it,style=MaterialTheme.typography.bodySmall)}
    Button(enabled=!busy,onClick={busy=true;message=null;onSave(draft){error->busy=false;message=error?:"Layout salvo."}},modifier=Modifier.fillMaxWidth()){Text(if(busy)"Salvando…"else"Salvar layout")}
    TextButton(enabled=!busy,onClick={draft=HomeLayouts.defaults;message="Padrão restaurado na prévia. Toque em Salvar layout para aplicar."}){Text("Restaurar padrão")}
}
