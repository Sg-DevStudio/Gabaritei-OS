package br.com.gabaritei.piloto

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable fun EditalScreen(plan:Plan,progress:List<Progress>,state:LazyListState,modifier:Modifier=Modifier,onTopic:(Topic)->Unit,onManage:()->Unit){
    var search by rememberSaveable(plan.id){mutableStateOf("")};var filter by rememberSaveable(plan.id){mutableStateOf("all")}
    var collapsed by rememberSaveable(plan.id){mutableStateOf(emptyList<String>())}
    var help by remember{mutableStateOf(false)}
    val priorities=remember(plan){TopicEmphasis.priorities(plan)}
    val completed=remember(plan,progress){EditalOutline.completed(plan,progress)}
    val query=searchKey(search)
    val groups=plan.disciplines.map{d->d to d.topics.filter{t->(query.isEmpty()||searchKey(d.name).contains(query)||searchKey(t.name).contains(query))&&(filter=="all"||if(filter=="done")t.id in completed else t.id !in completed)}}.filter{it.second.isNotEmpty()}
    LazyColumn(modifier.fillMaxSize(),state=state,contentPadding=PaddingValues(16.dp),verticalArrangement=Arrangement.spacedBy(0.dp)){
        item{Block{
            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(16.dp)){
                Box(Modifier.size(58.dp),contentAlignment=Alignment.Center){CircularProgressIndicator(progress={if(plan.topics.isEmpty())0f else completed.size.toFloat()/plan.topics.size},Modifier.fillMaxSize(),strokeWidth=5.dp);Text(StatisticsModel.percent(if(plan.topics.isEmpty())null else completed.size*100.0/plan.topics.size),style=MaterialTheme.typography.labelMedium,fontWeight=FontWeight.Bold)}
                Column(Modifier.weight(1f)){Text("Seu edital",style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold);Text("${completed.size} de ${plan.topics.size} tópicos concluídos",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
            }
            Text(plan.name.replace(Regex(""" \(.*?\)"""),""),style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
            Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.SpaceBetween){TextButton(onClick=onManage){Text("Organizar disciplinas")};TextButton(onClick={help=true}){Text("Como usar?")}}
        };Spacer(Modifier.height(12.dp))}
        item{OutlinedTextField(search,{search=it},Modifier.fillMaxWidth(),singleLine=true,label={Text("Buscar disciplina ou tópico")});Spacer(Modifier.height(8.dp))}
        item{Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)){Box(Modifier.weight(1f)){Choice("Mostrar",filter,listOf("all" to "Todos","pending" to "Pendentes","done" to "Concluídos")){filter=it}};TextButton(onClick={collapsed=if(collapsed.isEmpty())plan.disciplines.map{it.id}else emptyList()}){Text(if(collapsed.isEmpty())"Recolher"else"Expandir")}};Spacer(Modifier.height(12.dp))}
        if(groups.isEmpty())item{Block{Text("Nenhum tópico encontrado.");TextButton(onClick={search="";filter="all"}){Text("Limpar filtros")}}}
        groups.forEach{(d,topics)->
            val expanded=d.id !in collapsed||query.isNotEmpty()
            item(key="discipline:${d.id}"){Surface(color=MaterialTheme.colorScheme.surface,shape=RoundedCornerShape(topStart=16.dp,topEnd=16.dp,bottomStart=if(expanded)0.dp else 16.dp,bottomEnd=if(expanded)0.dp else 16.dp)){
                Column(Modifier.padding(horizontal=14.dp,vertical=6.dp)){ExpandableTitle(d.name,expanded){collapsed=if(d.id in collapsed)collapsed-d.id else collapsed+d.id};Text("${d.topics.count{it.id in completed}} de ${d.topics.size} concluídos${if(d.archived)" · Arquivada na rotina"else""}",Modifier.padding(bottom=8.dp),style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
            }}
            if(expanded)items(topics,key={"topic:${it.id}"}){t->
                Surface(color=MaterialTheme.colorScheme.surface,shape=if(t==topics.last())RoundedCornerShape(bottomStart=16.dp,bottomEnd=16.dp)else RoundedCornerShape(0.dp)){
                    Column(Modifier.fillMaxWidth()){HorizontalDivider(Modifier.padding(horizontal=14.dp),color=MaterialTheme.colorScheme.outlineVariant);Row(Modifier.fillMaxWidth().clickable(onClickLabel="Consultar tópico"){onTopic(t)}.padding(14.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)){
                        Surface(Modifier.size(26.dp),shape=CircleShape,color=if(t.id in completed)successColor().copy(alpha=.12f)else MaterialTheme.colorScheme.surfaceVariant){Box(contentAlignment=Alignment.Center){if(t.id in completed)Icon(Icons.Outlined.Check,null,Modifier.size(17.dp),tint=successColor())else Text((d.topics.indexOf(t)+1).toString(),style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}}
                        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(3.dp)){Text(t.name+if(t.id in priorities)" 🔥"else"",style=MaterialTheme.typography.bodyMedium);Text((if(t.note=="Arquivado na rotina")t.note else if(t.id in completed)"Concluído"else"Pendente")+if(t.id in priorities)" · Prioridade do plano"else"",style=MaterialTheme.typography.labelSmall,color=if(t.id in completed)successColor()else MaterialTheme.colorScheme.onSurfaceVariant)}
                        Icon(Icons.Outlined.KeyboardArrowRight,null,Modifier.size(18.dp),tint=MaterialTheme.colorScheme.onSurfaceVariant)
                    }}
                }
            }
            item(key="space:${d.id}"){Spacer(Modifier.height(12.dp))}
        }
    }
    if(help)AlertDialog(onDismissRequest={help=false},title={Text("Como usar?")},text={Text("Toque em um tópico para estudar ou abrir suas questões. 🔥 indica prioridade pedagógica do plano, não frequência comprovada em provas. Tópicos sem essa indicação continuam no edital.")},confirmButton={TextButton(onClick={help=false}){Text("Entendi")}})

}
