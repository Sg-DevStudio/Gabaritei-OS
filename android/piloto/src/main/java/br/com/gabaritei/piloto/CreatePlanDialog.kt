package br.com.gabaritei.piloto

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable fun CreatePlanDialog(plan:Plan,onClose:()->Unit,onCreate:(Routine,(String?)->Unit)->Unit){
    var step by rememberSaveable{mutableIntStateOf(0)};var days by rememberSaveable{mutableStateOf(listOf(1,2,3,4,5))}
    var daily by rememberSaveable{mutableStateOf("120")};var block by rememberSaveable{mutableStateOf("50")};var error by remember{mutableStateOf<String?>(null)};var saving by remember{mutableStateOf(false)}
    AlertDialog(onDismissRequest={if(!saving)onClose()},title={Text(if(step==0)"Monte sua rotina" else "Confira seu plano")},text={Column(Modifier.verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(10.dp)){
        Text(plan.name,fontSize=13.sp,lineHeight=18.sp,fontWeight=FontWeight.SemiBold)
        if(step==0){
            Text("Em quais dias você vai estudar?",style=MaterialTheme.typography.bodySmall)
            listOf(listOf(1,2,3,4),listOf(5,6,7)).forEach{row->Row(horizontalArrangement=Arrangement.spacedBy(5.dp)){row.forEach{d->FilterChip(selected=d in days,onClick={days=if(d in days)days-d else days+d},label={Text(listOf("Seg","Ter","Qua","Qui","Sex","Sáb","Dom")[d-1],fontSize=10.sp)})}}}
            OutlinedTextField(daily,{daily=it},label={Text("Minutos disponíveis por dia")},singleLine=true,keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number))
            OutlinedTextField(block,{block=it},label={Text("Minutos por bloco de estudo")},singleLine=true,keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number))
            Text("As disciplinas serão alternadas, seguindo os tópicos de cada matéria. A carga é uma estimativa para organizar sua rotina.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
        }else{
            Text("${days.size} dias por semana · ${daily} min por dia",fontWeight=FontWeight.SemiBold)
            Text("${plan.disciplines.size} disciplinas · ${plan.topics.size} tópicos")
            Text("A agenda usará blocos de até $block minutos. Nenhum tópico será marcado como estudado na criação.",style=MaterialTheme.typography.bodySmall)
        }
        error?.let{Text(it,color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodySmall)}
        if(saving)LinearProgressIndicator(Modifier.fillMaxWidth())
    }},confirmButton={TextButton(enabled=!saving,onClick={val routine=Routine(days.toSet(),daily.toIntOrNull()?:0,block.toIntOrNull()?:0)
        if(!PlanRoutine.validate(routine)){error="Escolha dias válidos, 15 a 720 min por dia e blocos de 15 a 120 min."}
        else if(step==0){error=null;step=1}else{saving=true;onCreate(routine){message->saving=false;error=message}}
    }){Text(if(step==0)"Revisar rotina" else "Criar plano")}},dismissButton={TextButton(enabled=!saving,onClick={if(step==1)step=0 else onClose()}){Text(if(step==1)"Voltar" else "Cancelar")}})
}
