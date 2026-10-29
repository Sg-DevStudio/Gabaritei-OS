package br.com.gabaritei.piloto

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

internal fun planField(plan:Plan,key:String)=runCatching{JSONObject(plan.details).opt(key)?.takeIf{it!==JSONObject.NULL}?.toString()?.trim().orEmpty()}.getOrDefault("")
internal fun school(plan:Plan)=when(val n=planField(plan,"nivel")){"medio"->"Ensino médio";"superior"->"Ensino superior";"tecnico"->"Ensino técnico";else->n.ifBlank{"Não informado"}}
internal fun planReference(plan:Plan):Pair<String,String>{
    val root=JSONObject(plan.details);val source=listOf(root.opt("fonte"),root.opt("referencia")).firstOrNull{it!=null&&it!==JSONObject.NULL&&it.toString().isNotBlank()}
    val obj=source as? JSONObject
    val text=if(obj==null)source?.toString().orEmpty().takeIf{it!="null"}.orEmpty()else listOf("titulo","nome","edital","descricao").mapNotNull{obj.optString(it).takeIf{v->v.isNotBlank()}}.distinct().joinToString(" · ")
    val url=if(obj==null)text.takeIf{StudyRules.safeLink(it)}.orEmpty()else listOf("url","link","editalUrl").map{obj.optString(it)}.firstOrNull{StudyRules.safeLink(it)}.orEmpty()
    return text to url
}
@Composable fun PlanCatalogCards(plans:List<Plan>,active:String,status:String,busy:Boolean,onRefresh:()->Unit,onChoose:(Plan)->Unit,onNotebook:(Plan)->Unit,onManage:(Plan)->Unit,onOpen:(String)->Unit){
    var search by rememberSaveable{mutableStateOf("")};var detail by remember{mutableStateOf<Plan?>(null)};var comparing by remember{mutableStateOf(false)}
    Column(verticalArrangement=Arrangement.spacedBy(12.dp)){
        Row(verticalAlignment=Alignment.CenterVertically){Text("${plans.size} planos disponíveis",Modifier.weight(1f),style=MaterialTheme.typography.bodySmall);TextButton(onClick={comparing=true},enabled=plans.size>1){Text("Comparar")};IconButton(onClick=onRefresh,enabled=!busy){Icon(Icons.Outlined.Refresh,"Atualizar catálogo")}}
        if(busy)LinearProgressIndicator(Modifier.fillMaxWidth())
        Text(status,style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
        OutlinedTextField(search,{search=it},Modifier.fillMaxWidth(),label={Text("Buscar concurso ou órgão")},singleLine=true)
        val rows=plans.filter{searchKey(it.name+" "+planField(it,"orgao")).contains(searchKey(search))}
        if(rows.isEmpty())Text("Nenhum plano encontrado.")
        rows.forEach{p->Card(onClick={detail=p},shape=RoundedCornerShape(18.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface),border=androidx.compose.foundation.BorderStroke(1.dp,MaterialTheme.colorScheme.outlineVariant)){
            Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){
                Row(horizontalArrangement=Arrangement.spacedBy(12.dp),verticalAlignment=Alignment.CenterVertically){Surface(shape=RoundedCornerShape(12.dp),color=MaterialTheme.colorScheme.primaryContainer){PlanLogo(p,Modifier.size(52.dp).padding(4.dp))};Column(Modifier.weight(1f)){Text(p.name.replace(Regex(" \\(.*?\\)"),""),fontSize=15.sp,lineHeight=21.sp,fontWeight=FontWeight.SemiBold);Text("${p.disciplines.size} disciplinas · ${p.topics.size} tópicos",fontSize=11.sp,lineHeight=15.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)};Icon(Icons.Outlined.KeyboardArrowRight,"Ver detalhes",Modifier.size(20.dp))}
                Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Button(onClick={onChoose(p)},shape=RoundedCornerShape(10.dp)){Text(if(!p.enrolled)"Criar plano"else if(p.id==active)"Continuar plano"else "Estudar")};TextButton(onClick={onNotebook(p)}){Text("Caderno")};if(p.enrolled)IconButton(onClick={onManage(p)}){Icon(Icons.Outlined.Edit,"Organizar disciplinas de ${p.name}")}}
            }
        }}
    }
    detail?.let{p->PlanDetailsDialog(p,onClose={detail=null},onChoose={detail=null;onChoose(p)},onNotebook={detail=null;onNotebook(p)},onOpenSource=onOpen)}
    if(comparing)ComparePlansDialog(plans){comparing=false}
}
@Composable private fun DetailShell(title:String,onClose:()->Unit,content:@Composable ColumnScope.()->Unit){Dialog(onDismissRequest=onClose,properties=DialogProperties(usePlatformDefaultWidth=false)){Surface(Modifier.fillMaxWidth().fillMaxHeight(.94f).padding(8.dp),shape=RoundedCornerShape(22.dp),color=MaterialTheme.colorScheme.background){Column(Modifier.padding(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){Row(verticalAlignment=Alignment.CenterVertically){Text(title,Modifier.weight(1f),style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold);IconButton(onClick=onClose){Icon(Icons.Outlined.Close,"Fechar")}};content()}}}}
@Composable fun PlanDetailsDialog(plan:Plan,onClose:()->Unit,onChoose:()->Unit,onNotebook:()->Unit,onOpenSource:(String)->Unit={}){
    DetailShell("Detalhes do concurso",onClose){
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(10.dp)){
            item{Row(horizontalArrangement=Arrangement.spacedBy(12.dp),verticalAlignment=Alignment.CenterVertically){PlanLogo(plan,Modifier.size(54.dp));Text(plan.name,Modifier.weight(1f),fontWeight=FontWeight.SemiBold)}}
            item{Block{
                listOf("Órgão" to planField(plan,"orgao"),"Cargo" to planField(plan,"cargo"),"Escolaridade" to school(plan),"Banca" to planField(plan,"banca"),"Salário informado" to planField(plan,"salario"),"Benefícios" to planField(plan,"beneficios"),"Vagas" to planField(plan,"vagas"),"Requisito" to planField(plan,"requisito")).forEach{(label,value)->if(value.isNotBlank()){Text(label,style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant);Text(value,style=MaterialTheme.typography.bodyMedium)}}
                if(planField(plan,"salario").isBlank())Text("Salário: não informado no catálogo.",style=MaterialTheme.typography.bodySmall)
            }}
            item{val window=JSONObject(plan.details).optJSONObject("janelaProva");val start=window?.optString("inicio").orEmpty();val end=window?.optString("fim").orEmpty();if(start.isNotBlank())Block{Text("Previsão cadastrada",style=MaterialTheme.typography.labelSmall);Text(listOf(start,end).filter{it.isNotBlank()}.distinct().joinToString(" a "){it.split('-').take(2).reversed().joinToString("/")},style=MaterialTheme.typography.bodyMedium)}}
            item{Text("Disciplinas e tópicos",style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.SemiBold)}
            items(plan.disciplines,key={it.id}){d->var expanded by rememberSaveable(plan.id,d.id){mutableStateOf(false)};Block{ExpandableTitle("${d.name} (${d.topics.size} tópicos)",expanded){expanded=!expanded};if(expanded)d.topics.forEach{Text(it.name,style=MaterialTheme.typography.bodySmall);HorizontalDivider()}}}
            item{Block{Text("Referência do catálogo",fontWeight=FontWeight.SemiBold);val (source,url)=planReference(plan);Text(source.ifBlank{"Referência não cadastrada."},style=MaterialTheme.typography.bodySmall);if(url.isNotBlank())TextButton(onClick={onOpenSource(url)}){Text("Abrir referência ↗")};planField(plan,"atualizadoEm").takeIf{it.isNotBlank()}?.let{Text("Atualizado em ${it.take(10).split('-').reversed().joinToString("/")}",style=MaterialTheme.typography.labelSmall)}}}
        }
        Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Button(onClick=onChoose,Modifier.weight(1f)){Text(if(plan.enrolled)"Estudar"else"Criar plano")};OutlinedButton(onClick=onNotebook,Modifier.weight(1f)){Text("Caderno")}}
    }
}
@Composable fun ComparePlansDialog(plans:List<Plan>,onClose:()->Unit){
    var first by rememberSaveable{mutableStateOf(plans.first().id)};var second by rememberSaveable{mutableStateOf(plans[1].id)};var hours by rememberSaveable{mutableStateOf("18")};var help by remember{mutableStateOf(false)}
    val a=plans.find{it.id==first}?:plans.first();val b=plans.find{it.id==second}?:plans[1]
    val result by produceState<PlanComparisonResult?>(null,a,b,hours){value=null;val h=hours.replace(',','.').toDoubleOrNull();if(h!=null&&h in 1.0..168.0&&a.id!=b.id)value=withContext(Dispatchers.Default){PlanComparison.compare(a,b,h)}}
    DetailShell("Comparar planos",onClose){Column(Modifier.weight(1f).verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(12.dp)){
        Choice("Plano A",first,plans.map{it.id to it.name}){first=it};Choice("Plano B",second,plans.map{it.id to it.name}){second=it}
        OutlinedTextField(hours,{hours=it},label={Text("Horas disponíveis por semana")},keyboardOptions=androidx.compose.foundation.text.KeyboardOptions(keyboardType=androidx.compose.ui.text.input.KeyboardType.Decimal),singleLine=true,isError=hours.replace(',','.').toDoubleOrNull()?.let{it in 1.0..168.0}!=true)
        if(hours.replace(',','.').toDoubleOrNull()?.let{it in 1.0..168.0}!=true)Text("Informe de 1 a 168 horas por semana.",color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodySmall)
        TextButton(onClick={help=true}){Text("Como usar?")}
        if(a.id==b.id)Text("Escolha dois planos diferentes.")
        result?.let{r->
            Block{Text("Compatibilidade estimada: ${r.level}",fontWeight=FontWeight.SemiBold);Text("${r.overlap}% de conteúdo em comum",style=MaterialTheme.typography.titleLarge);Text("${r.commonTopics} tópicos em comum · ${r.sharedDisciplines.size} disciplinas",style=MaterialTheme.typography.bodySmall);Text("${r.effort}h de esforço combinado · economia estimada de ${r.savings}h",style=MaterialTheme.typography.bodySmall);Text("${java.text.NumberFormat.getNumberInstance(java.util.Locale("pt","BR")).format(r.weekly)}h por semana em ${r.weeks} semanas",style=MaterialTheme.typography.bodyMedium);Text(if(r.dated)"Prazo de referência do catálogo."else"Projeção de 26 semanas, sem data futura cadastrada.",style=MaterialTheme.typography.labelSmall)}
            Block{listOf("Escolaridade" to (school(a) to school(b)),"Banca" to (planField(a,"banca") to planField(b,"banca")),"Salário informado" to (planField(a,"salario") to planField(b,"salario")),"Tópicos exclusivos" to (r.onlyA.toString() to r.onlyB.toString())).forEach{(label,values)->Text(label,style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant);Row(horizontalArrangement=Arrangement.spacedBy(12.dp)){Text("A · ${values.first.ifBlank{"Não informado"}}",Modifier.weight(1f),style=MaterialTheme.typography.bodySmall);Text("B · ${values.second.ifBlank{"Não informado"}}",Modifier.weight(1f),style=MaterialTheme.typography.bodySmall)}}}
            if(r.sharedDisciplines.isNotEmpty())Block{Text("Disciplinas em comum",fontWeight=FontWeight.SemiBold);r.sharedDisciplines.forEach{Text(it,style=MaterialTheme.typography.bodySmall)}}
        }
    };OutlinedButton(onClick=onClose,Modifier.fillMaxWidth()){Text("Fechar comparação")}}
    if(help)AlertDialog(onDismissRequest={help=false},title={Text("Como usar?")},text={Text("Escolha dois planos e ajuste suas horas semanais. A comparação usa nomes dos conteúdos e cargas cadastradas, como no site. É uma estimativa; confira o recorte de cada edital.")},confirmButton={TextButton(onClick={help=false}){Text("Fechar")}})
}
