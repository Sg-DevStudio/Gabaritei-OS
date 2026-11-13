package br.com.gabaritei.piloto

import androidx.activity.compose.BackHandler
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.selection.selectable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlinx.coroutines.delay
import org.json.JSONObject
import org.json.JSONArray

@Composable internal fun NativeQuestionFocus(repo:NativePracticeRepository,bank:JSONObject,modifier:Modifier=Modifier,onCreate:()->Unit={},onBack:()->Unit){
    var index by rememberSaveable(bank.optString("id")){mutableIntStateOf(0)}
    var checked by remember(bank.optString("id"),index){mutableStateOf(false)}
    var selected by remember(bank.optString("id"),index){mutableIntStateOf(-1)}
    var eliminationJson by rememberSaveable(bank.optString("id")){mutableStateOf("{}")}
    var cards by rememberSaveable{mutableStateOf(false)}
    var revealed by remember(bank.optString("id"),index,cards){mutableStateOf(false)}
    var deleting by remember{mutableStateOf(false)}
    var full by rememberSaveable{mutableStateOf(false)}
    var feedback by remember{mutableStateOf("")}
    val busy by repo.busy.collectAsState();val unsaved by repo.pendingBankSave.collectAsState()
    val rows=bank.getJSONArray("questoes");val q=rows.getJSONObject(index.coerceAtMost(rows.length()-1))
    val eliminated=remember(eliminationJson,q.getString("id")){val a=JSONObject(eliminationJson).optJSONArray(q.getString("id"));(0 until (a?.length()?:0)).map{a!!.getInt(it)}.toSet()}
    val answers=bank.optJSONObject("respostas")?:JSONObject();val previous=answers.optInt(q.getString("id"),-1)
    val marked=if(checked)previous else selected;val show=if(cards)revealed else checked;val correct=q.getInt("correta")
    val green=if(MaterialTheme.colorScheme.surface.luminance()<.4f)Color(0xFF6ED5AC)else Color(0xFF227B58)
    val movement=remember{Animatable(0f)}
    LaunchedEffect(feedback){if(feedback.isNotBlank()){movement.animateTo(if(feedback=="acertou")-12f else 10f,tween(120));movement.animateTo(if(feedback=="acertou")0f else -10f,tween(120));movement.animateTo(0f,tween(120))}}
    LaunchedEffect(feedback,busy){if(feedback.isNotBlank()&&!busy){delay(550);feedback="";if(!unsaved&&index<rows.length()-1)index++}}
    val blocked=busy||feedback.isNotBlank()
    BackHandler(!busy){if(full)full=false else onBack()}
    val content:@Composable ()->Unit={
        Column((if(full)Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.safeDrawing)else modifier.fillMaxSize()).verticalScroll(rememberScrollState()).padding(16.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(16.dp)){
            Row(Modifier.widthIn(max=760.dp).fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){
                TextButton(onClick={if(full)full=false else onBack()},enabled=!busy){Icon(Icons.AutoMirrored.Outlined.ArrowBack,null);Text(if(full)"Sair"else"Voltar")}
                Spacer(Modifier.weight(1f));TextButton(onClick={full=!full}){Text(if(full)"Reduzir"else"Tela cheia",style=MaterialTheme.typography.bodySmall)}
                TextButton(onClick=onCreate,enabled=!blocked){Text("Criar outras",style=MaterialTheme.typography.bodySmall)}
                TextButton(onClick={deleting=true},enabled=!blocked){Text("Excluir",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.error)}
            }
            Column(Modifier.widthIn(max=760.dp).fillMaxWidth(),verticalArrangement=Arrangement.spacedBy(16.dp)){
                Text(bank.optString("nome"),style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.SemiBold)
                Text("${if(cards)"Cartão"else"Questão"} ${index+1} de ${rows.length()}",style=MaterialTheme.typography.labelLarge,color=MaterialTheme.colorScheme.primary)
                LinearProgressIndicator(progress={(index+1).toFloat()/rows.length()},modifier=Modifier.fillMaxWidth().height(5.dp))
                Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){FilterChip(!cards,{cards=false},enabled=!blocked,label={Text("Resolver")});FilterChip(cards,{cards=true},enabled=!blocked,label={Text("Cartões")})}
                if(cards){
                    val tone=when(feedback){"acertou"->green;"errou"->MaterialTheme.colorScheme.error;else->MaterialTheme.colorScheme.outlineVariant}
                    Card(onClick={revealed=!revealed},enabled=!blocked,modifier=Modifier.fillMaxWidth().graphicsLayer{if(feedback=="errou")translationX=movement.value else translationY=movement.value},shape=RoundedCornerShape(24.dp),border=BorderStroke(if(feedback.isBlank())1.dp else 2.dp,tone)){
                        Column(Modifier.fillMaxWidth().heightIn(min=320.dp).padding(28.dp),verticalArrangement=Arrangement.spacedBy(20.dp)){
                            Text(if(show)"RESPOSTA"else"LEMBRE SEM CONSULTAR",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(if(show)q.getJSONArray("alternativas").getString(correct)else q.getString("enunciado"),fontSize=25.sp,lineHeight=34.sp,fontWeight=FontWeight.Medium)
                            if(show)Text(q.getString("comentario"),style=MaterialTheme.typography.bodyLarge)
                            Spacer(Modifier.weight(1f));Text(if(show)"Toque para voltar à pergunta"else"Toque para ver a resposta",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    Text(when(feedback){"acertou"->"Muito bem! Resposta lembrada.";"errou"->"Vamos reforçar este conteúdo.";else->if(show)"Como foi sua resposta?"else"Revele a resposta para avaliar."},style=MaterialTheme.typography.bodySmall,color=tone)
                    val training=bank.optJSONObject("treinoCartoes");val totals=(0 until rows.length()).map{training?.optJSONObject(rows.getJSONObject(it).getString("id"))}
                    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp)){
                        OutlinedButton(onClick={feedback="errou";repo.assessCard(index,false)},enabled=show&&!blocked,modifier=Modifier.weight(1f)){Icon(Icons.Outlined.Close,null,tint=MaterialTheme.colorScheme.error);Text("Errei · ${totals.sumOf{it?.optInt("erros")?:0}}")}
                        OutlinedButton(onClick={feedback="acertou";repo.assessCard(index,true)},enabled=show&&!blocked,modifier=Modifier.weight(1f)){Icon(Icons.Outlined.Check,null,tint=green);Text("Acertei · ${totals.sumOf{it?.optInt("acertos")?:0}}")}
                    }
                    Text("Autoavaliação dos cartões. Não altera os acertos das questões.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                }else{
                    if(previous>=0&&!show)Text(if(previous==correct)"Acertou anteriormente"else"Errou anteriormente",style=MaterialTheme.typography.labelLarge,color=if(previous==correct)green else MaterialTheme.colorScheme.error)
                    Text(q.getString("enunciado"),style=MaterialTheme.typography.titleMedium.copy(lineHeight=28.sp))
                    if(!show)Text("Use a tesoura para riscar ou restaurar opções.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                    val options=q.getJSONArray("alternativas")
                    (0 until options.length()).forEach{i->key(q.getString("id"),i){
                        val right=show&&i==correct;val wrong=show&&i==marked&&i!=correct
                        val cut=!show&&i in eliminated
                        val textColor by animateColorAsState(if(cut)MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha=.65f)else MaterialTheme.colorScheme.onSurface,animationSpec=tween(170),label="alternative-text")
                        val cutAngle by animateFloatAsState(if(cut)-12f else 0f,animationSpec=tween(170),label="alternative-cut")
                        val tone=when{right->green;wrong->MaterialTheme.colorScheme.error;marked==i->MaterialTheme.colorScheme.primary;else->MaterialTheme.colorScheme.outlineVariant}
                        val reason=q.optJSONArray("explicacoes")?.optString(i).orEmpty()
                        Surface(shape=RoundedCornerShape(16.dp),border=BorderStroke(if(right||wrong||marked==i)2.dp else 1.dp,tone),color=when{right->green.copy(alpha=.08f);wrong->MaterialTheme.colorScheme.errorContainer;else->MaterialTheme.colorScheme.surface},modifier=Modifier.fillMaxWidth()){
                            Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.Top){
                            Column(Modifier.weight(1f).selectable(selected=marked==i,enabled=!blocked&&!show&&!cut,role=Role.RadioButton,onClick={selected=i}).padding(16.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){
                                Text("${('A'+i)}. ${options.getString(i)}",style=MaterialTheme.typography.bodyLarge.copy(textDecoration=if(cut)TextDecoration.LineThrough else TextDecoration.None),color=textColor)
                                if(right||wrong)Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Icon(if(right)Icons.Outlined.Check else Icons.Outlined.Close,null,tint=tone);Text(if(right)"Resposta correta"else"Não é essa",color=tone,fontWeight=FontWeight.SemiBold)}
                                if(show&&(reason.isNotBlank()||right))Text(reason.ifBlank{q.getString("comentario")},style=MaterialTheme.typography.bodyMedium)
                            }
                            if(!show)IconButton(onClick={val next=AlternativeElimination.toggle(eliminated,selected,i,options.length());selected=next.selected;eliminationJson=JSONObject(eliminationJson).put(q.getString("id"),JSONArray(next.eliminated.toList())).toString()},enabled=!blocked,modifier=Modifier.padding(top=6.dp,end=4.dp).semantics{stateDescription=if(cut)"Riscada"else"Disponível"}){
                                Icon(painterResource(if(cut)R.drawable.option_restore else R.drawable.option_cut),(if(cut)"Restaurar"else"Riscar")+" alternativa ${'A'+i}",Modifier.size(20.dp).graphicsLayer{rotationZ=cutAngle},tint=if(cut)MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            }
                        }
                        if(wrong&&reason.isBlank())OutlinedButton(onClick={repo.explainQuestion(index)},enabled=!blocked){Text("Explicar esta alternativa")}
                    }}
                    if(!show)Button(onClick={if(selected !in eliminated){checked=true;eliminationJson=JSONObject(eliminationJson).apply{remove(q.getString("id"))}.toString();repo.answer(index,selected)}},enabled=!blocked&&selected>=0&&selected !in eliminated,modifier=Modifier.fillMaxWidth()){Text("Conferir resposta")}
                }
                if(show){val page=q.optInt("pagina",0);Text(if(page>0)"Referência da resposta · página $page"else"Referência da resposta no material",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.primary);Text(q.getString("trecho"),style=MaterialTheme.typography.bodyMedium)}
                PracticeMessage(repo)
                Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp)){OutlinedButton(onClick={index--},enabled=index>0&&!blocked,modifier=Modifier.weight(1f)){Text("Anterior")};Button(onClick={index++},enabled=index<rows.length()-1&&!blocked,modifier=Modifier.weight(1f)){Text("Próxima")}}
                if(unsaved&&!busy)TextButton(onClick={repo.saveBank()}){Text("Tentar salvar novamente")}
            }
        }
    }
    if(full)Dialog(onDismissRequest={full=false},properties=DialogProperties(usePlatformDefaultWidth=false,decorFitsSystemWindows=false)){Surface(Modifier.fillMaxSize()){content()}}else content()
    if(deleting)AlertDialog(onDismissRequest={deleting=false},title={Text("Excluir caderno?")},text={Text("As questões e respostas serão excluídas definitivamente.")},confirmButton={TextButton(onClick={deleting=false;repo.trash("questionSets",bank)}){Text("Excluir definitivamente")}},dismissButton={TextButton(onClick={deleting=false}){Text("Cancelar")}})
}
