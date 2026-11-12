package br.com.gabaritei.piloto

import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.json.JSONObject

@Composable internal fun NotebookSections(selected:Int,onSelect:(Int)->Unit){
    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(6.dp)){
        listOf("Por edital","Meus cadernos","Criar com IA").forEachIndexed{index,label->FilterChip(selected==index,onClick={onSelect(index)},label={Text(label,fontSize=11.sp,maxLines=1)},modifier=Modifier.weight(1f))}
    }
}
@Composable private fun PracticeMessage(repo:NativePracticeRepository){
    val message by repo.message.collectAsState();val busy by repo.busy.collectAsState()
    if(busy||message.isNotBlank())Surface(shape=RoundedCornerShape(16.dp),color=MaterialTheme.colorScheme.secondaryContainer){Column(Modifier.fillMaxWidth().padding(14.dp),verticalArrangement=Arrangement.spacedBy(8.dp)){if(busy)LinearProgressIndicator(Modifier.fillMaxWidth());Text(message.ifBlank{"Preparando…"},style=MaterialTheme.typography.bodySmall)}}
}
@Composable private fun PracticePanel(content:@Composable ColumnScope.()->Unit){
    Card(Modifier.fillMaxWidth(),shape=RoundedCornerShape(22.dp),border=BorderStroke(1.dp,MaterialTheme.colorScheme.outlineVariant),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface)){
        Column(Modifier.padding(20.dp),verticalArrangement=Arrangement.spacedBy(14.dp),content=content)
    }
}
@Composable internal fun NativeQuestionScreen(repo:NativePracticeRepository,section:Int,onSection:(Int)->Unit,modifier:Modifier=Modifier){
    val banks by repo.banks.collectAsState();val bank by repo.currentBank.collectAsState();val busy by repo.busy.collectAsState();val draft by repo.questionDraft.collectAsState();val file by repo.file.collectAsState();val context=LocalContext.current
    var trash by rememberSaveable{mutableStateOf(false)};var search by rememberSaveable{mutableStateOf("")};var deleting by remember{mutableStateOf<JSONObject?>(null)}
    val picker=rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()){uri->if(uri!=null)repo.selectFile(context,uri,false)}
    LaunchedEffect(Unit){repo.load("questionSets")}
    if(bank!=null){NativeQuestionFocus(repo,bank!!,modifier,onCreate={repo.currentBank.value=null;repo.file.value=null;onSection(2)}){repo.currentBank.value=null};return}
    Column(modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),verticalArrangement=Arrangement.spacedBy(16.dp)){
        NotebookSections(section,onSection);PersonalAICard(repo);PracticeMessage(repo)
        if(section==2){
            Text("Crie com o seu material",style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Bold)
            Text("Questões autorais organizadas por disciplina e assunto.",style=MaterialTheme.typography.bodyMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)
            PracticePanel{
                fun edit(key:String,value:Any){repo.questionDraft.value=JSONObject(draft.toString()).put(key,value)}
                OutlinedTextField(draft.optString("nome"),{edit("nome",it.take(120))},Modifier.fillMaxWidth(),label={Text("Nome do caderno")},enabled=!busy)
                OutlinedTextField(draft.optString("disciplina"),{edit("disciplina",it.take(120))},Modifier.fillMaxWidth(),label={Text("Disciplina")},enabled=!busy)
                OutlinedTextField(draft.optString("assunto"),{edit("assunto",it.take(160))},Modifier.fillMaxWidth(),label={Text("Assunto (opcional)")},enabled=!busy)
                OutlinedButton(onClick={picker.launch(arrayOf("application/pdf","text/plain"))},enabled=!busy,modifier=Modifier.fillMaxWidth()){Icon(Icons.Outlined.Add,null);Spacer(Modifier.width(8.dp));Text("Enviar PDF ou TXT")}
                if(file!=null){Text(file!!.name,style=MaterialTheme.typography.bodySmall);TextButton(onClick={repo.file.value=null},enabled=!busy){Text("Retirar arquivo")}}
                Text("PDF de até 20 páginas e 10 MB. Ou cole um trecho abaixo.",style=MaterialTheme.typography.bodySmall)
                OutlinedTextField(draft.optString("texto"),{edit("texto",it.take(30000));repo.file.value=null},Modifier.fillMaxWidth(),label={Text("Seu material")},minLines=5,maxLines=10,enabled=!busy)
                Text("Formato",fontWeight=FontWeight.SemiBold)
                listOf("multipla5" to "Múltipla escolha · 5 alternativas","multipla4" to "Múltipla escolha · 4 alternativas","certoerrado" to "Certo ou errado").forEach{(id,label)->Row(Modifier.fillMaxWidth().selectable(draft.optString("formato")==id,enabled=!busy,role=Role.RadioButton,onClick={edit("formato",id)}),verticalAlignment=Alignment.CenterVertically){RadioButton(draft.optString("formato")==id,onClick=null);Text(label,style=MaterialTheme.typography.bodyMedium)}}
                var quantity by rememberSaveable{mutableStateOf(draft.optInt("quantidade",10).toString())}
                OutlinedTextField(quantity,{quantity=it.filter(Char::isDigit).take(3);edit("quantidade",quantity.toIntOrNull()?:0)},Modifier.fillMaxWidth(),label={Text("Quantidade · de 1 a 100")},keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number),singleLine=true,enabled=!busy)
                Text("Ao gerar, o material será enviado ao provedor configurado. Groq recebe texto; PDF e foto usam Gemini. Na cota gratuita, o Google pode usá-lo para melhorar seus produtos. O arquivo original não fica salvo. Disponível no perfil pessoal configurado.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
                Button(onClick={repo.generate()},enabled=!busy,modifier=Modifier.fillMaxWidth(),contentPadding=PaddingValues(16.dp)){Text(if(busy)"Gerando…"else"Gerar e salvar caderno")}
            }
        }else{
            Row(verticalAlignment=Alignment.CenterVertically){Text("Meus cadernos",Modifier.weight(1f),style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Bold);IconButton(onClick={repo.load("questionSets")},enabled=!busy){Icon(Icons.Outlined.Refresh,"Atualizar cadernos")}}
            Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){FilterChip(!trash,{trash=false},label={Text("Ativos")});FilterChip(trash,{trash=true},label={Text("Arquivados")})}
            OutlinedTextField(search,{search=it},Modifier.fillMaxWidth(),label={Text("Buscar disciplina ou caderno")},singleLine=true)
            val list=banks.filter{it.optString("excluidoEm").isBlank()&&it.optString("arquivadoEm").isNotBlank()==trash}.filter{NativePractice.normalized(it.optString("nome")+it.optJSONObject("config")?.toString().orEmpty()).contains(NativePractice.normalized(search))}
            if(list.isEmpty())PracticePanel{Text(if(trash)"Nenhum caderno arquivado."else"Seu próximo treino começa aqui.",fontWeight=FontWeight.SemiBold);if(!trash)Button(onClick={repo.file.value=null;onSection(2)}){Text("Criar caderno")}}
            list.forEach{b->PracticePanel{
                val cfg=b.optJSONObject("config");val answered=b.optJSONObject("respostas")?.length()?:0;val total=b.getJSONArray("questoes").length()
                if(!cfg?.optString("disciplina").isNullOrBlank())Text(cfg!!.optString("disciplina"),style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.primary)
                Text(b.optString("nome"),style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold)
                if(!cfg?.optString("assunto").isNullOrBlank())Text(cfg!!.optString("assunto"),style=MaterialTheme.typography.bodySmall)
                LinearProgressIndicator(progress={answered.toFloat()/total},modifier=Modifier.fillMaxWidth())
                Text("$answered de $total respondidas",style=MaterialTheme.typography.bodySmall)
                Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Button(onClick={repo.openBank(b)},enabled=!busy){Text("Continuar")};TextButton(onClick={repo.archive(b)},enabled=!busy){Text(if(trash)"Desarquivar"else"Arquivar")};TextButton(onClick={deleting=b},enabled=!busy){Text("Excluir",color=MaterialTheme.colorScheme.error)}}
            }}
        }
        Spacer(Modifier.height(16.dp))
    }
    deleting?.let{b->AlertDialog(onDismissRequest={deleting=null},title={Text("Excluir caderno?")},text={Text("As questões e respostas deste caderno serão excluídas definitivamente. Não será possível restaurá-lo.")},confirmButton={TextButton(onClick={deleting=null;repo.trash("questionSets",b)}){Text("Excluir definitivamente")}},dismissButton={TextButton(onClick={deleting=null}){Text("Cancelar")}})}
}
@Composable internal fun NativeQuestionFocus(repo:NativePracticeRepository,bank:JSONObject,modifier:Modifier=Modifier,onCreate:()->Unit={},onBack:()->Unit){
    var index by rememberSaveable(bank.optString("id")){mutableIntStateOf(0)};var checked by remember(bank.optString("id"),index){mutableStateOf(false)};var selected by remember(bank.optString("id"),index){mutableIntStateOf(-1)};var deleting by remember{mutableStateOf(false)}
    var cards by rememberSaveable{mutableStateOf(false)};var revealed by remember(bank.optString("id"),index,cards){mutableStateOf(false)}
    val busy by repo.busy.collectAsState();val rows=bank.getJSONArray("questoes");val q=rows.getJSONObject(index.coerceAtMost(rows.length()-1));val answers=bank.optJSONObject("respostas")?:JSONObject();val answered=answers.has(q.getString("id"));val marked=if(checked&&answered)answers.optInt(q.getString("id"),-1)else selected;val show=if(cards)revealed else checked;val correct=q.getInt("correta")
    val previous=if(answered)answers.optInt(q.getString("id"),-1)else -1
    BackHandler(!busy,onBack)
    Column(modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(16.dp)){
        Row(Modifier.fillMaxWidth().widthIn(max=760.dp),verticalAlignment=Alignment.CenterVertically){TextButton(onClick=onBack,enabled=!busy){Icon(Icons.AutoMirrored.Outlined.ArrowBack,null);Text("Voltar")};Spacer(Modifier.weight(1f));TextButton(onClick=onCreate,enabled=!busy){Text("Criar outras")};TextButton(onClick={deleting=true},enabled=!busy){Text("Excluir",color=MaterialTheme.colorScheme.error)}}
        Column(Modifier.widthIn(max=760.dp).fillMaxWidth(),verticalArrangement=Arrangement.spacedBy(16.dp)){
            Text(bank.optString("nome"),style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.SemiBold)
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text("Questão ${index+1} de ${rows.length()}",style=MaterialTheme.typography.labelLarge,color=MaterialTheme.colorScheme.primary);Text("${answers.length()} "+if(answers.length()==1)"respondida"else"respondidas",style=MaterialTheme.typography.labelMedium)}
            LinearProgressIndicator(progress={(index+1).toFloat()/rows.length()},modifier=Modifier.fillMaxWidth().height(5.dp))
            Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){FilterChip(!cards,{cards=false},label={Text("Resolver")});FilterChip(cards,{cards=true},label={Text("Cartões")})}
            PracticePanel{
                if(answered&&!show)Text(if(previous==correct)"✓ Acertou anteriormente"else"↻ Errou anteriormente",style=MaterialTheme.typography.labelLarge,color=if(previous==correct)MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error)
                Text(q.getString("enunciado"),style=MaterialTheme.typography.titleMedium.copy(lineHeight=28.sp),fontWeight=FontWeight.Medium)
                if(!cards)q.getJSONArray("alternativas").let{options->(0 until options.length()).forEach{i->
                    val color=when{show&&i==correct->MaterialTheme.colorScheme.primaryContainer;show&&i==marked->MaterialTheme.colorScheme.errorContainer;marked==i->MaterialTheme.colorScheme.secondaryContainer;else->MaterialTheme.colorScheme.surface}
                    Surface(onClick={selected=i},enabled=!busy&&!show,shape=RoundedCornerShape(16.dp),border=BorderStroke(if(marked==i)2.dp else 1.dp,if(marked==i)MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant),color=color,modifier=Modifier.fillMaxWidth()){
                        Row(Modifier.padding(16.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)){
                            Text(if(options.length()==2)if(i==0)"C"else"E"else('A'+i).toString(),fontWeight=FontWeight.Bold,color=MaterialTheme.colorScheme.primary)
                            Text(options.getString(i),style=MaterialTheme.typography.bodyLarge,modifier=Modifier.weight(1f))
                            if(show&&i==correct)Icon(Icons.Outlined.Check,"Alternativa correta",tint=MaterialTheme.colorScheme.primary)
                        }
                    }
                }}
                if(!show)Button(onClick={if(cards)revealed=true else{checked=true;repo.answer(index,selected)}},enabled=!busy&&(cards||selected>=0),modifier=Modifier.fillMaxWidth(),contentPadding=PaddingValues(15.dp)){Text(if(cards)"Revelar resposta"else"Conferir resposta")}
                if(show){
                    HorizontalDivider();Text(if(cards)"Resposta: ${q.getJSONArray("alternativas").getString(correct)}"else if(marked==correct)"Resposta correta"else"Vamos revisar",style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold,color=MaterialTheme.colorScheme.primary)
                    Text(q.getString("comentario"),style=MaterialTheme.typography.bodyLarge)
                    val page=q.optInt("pagina",0);Text(if(page>0)"Referência da resposta: página $page"else"Referência da resposta no material",style=MaterialTheme.typography.labelLarge,color=MaterialTheme.colorScheme.primary)
                    Surface(shape=RoundedCornerShape(12.dp),color=MaterialTheme.colorScheme.surfaceVariant){Text(q.getString("trecho"),Modifier.padding(14.dp),style=MaterialTheme.typography.bodyMedium)}
                }
            }
            PracticeMessage(repo)
            Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp)){OutlinedButton(onClick={index--;selected=-1},enabled=index>0&&!busy,modifier=Modifier.weight(1f)){Text("Anterior")};Button(onClick={index++;selected=-1},enabled=index<rows.length()-1&&!busy,modifier=Modifier.weight(1f)){Text("Próxima")}}
            val unsaved by repo.pendingBankSave.collectAsState();if(unsaved&&!busy)TextButton(onClick={repo.saveBank()},modifier=Modifier.fillMaxWidth()){Text("Tentar salvar novamente")}
        }
    }
    if(deleting)AlertDialog(onDismissRequest={deleting=false},title={Text("Excluir caderno?")},text={Text("As questões e respostas serão excluídas definitivamente. Não será possível restaurá-las.")},confirmButton={TextButton(onClick={deleting=false;repo.trash("questionSets",bank)}){Text("Excluir definitivamente")}},dismissButton={TextButton(onClick={deleting=false}){Text("Cancelar")}})
}
@Composable internal fun NativeEssaysScreen(repo:NativePracticeRepository,modifier:Modifier=Modifier){
    val essays by repo.essays.collectAsState();val current by repo.essay.collectAsState();val busy by repo.busy.collectAsState();val file by repo.file.collectAsState();val context=LocalContext.current
    var editingCorrected by rememberSaveable(current?.optString("id")){mutableStateOf(false)}
    var about by remember {mutableStateOf(false)}
    var trash by rememberSaveable{mutableStateOf(false)};var deleting by remember{mutableStateOf<JSONObject?>(null)};var details by rememberSaveable{mutableStateOf(false)};var replace by remember{mutableStateOf(false)};var leaving by remember{mutableStateOf(false)}
    val picker=rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()){uri->if(uri!=null)repo.selectFile(context,uri,true)}
    LaunchedEffect(Unit){repo.load("essays")}
    fun leave(){if(current?.optString("tema").orEmpty().length>=4)repo.saveEssay{repo.essay.value=null}else leaving=true}
    BackHandler(current!=null&&!busy){leave()}
    Column(modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),verticalArrangement=Arrangement.spacedBy(16.dp)){
        PracticeMessage(repo)
        Row(verticalAlignment=Alignment.CenterVertically){Text(if(current==null)"Minhas redações"else"Sua redação",Modifier.weight(1f),style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Bold);if(current==null)Button(onClick={repo.essay.value=NativePractice.newEssay();repo.file.value=null},enabled=!busy){Text("Nova")}}
        if(current==null){
            Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){FilterChip(!trash,{trash=false},label={Text("Ativas")});FilterChip(trash,{trash=true},label={Text("Lixeira")});TextButton(onClick={repo.load("essays")},enabled=!busy){Text("Atualizar")}}
            val list=essays.filter{it.optString("excluidoEm").isNotBlank()==trash}
            if(list.isEmpty())PracticePanel{Text(if(trash)"Nenhuma redação na lixeira."else"Do seu texto ao próximo treino.",fontWeight=FontWeight.SemiBold);Text("Envie uma foto ou PDF, ou escreva no editor. Confira a transcrição antes de corrigir.",style=MaterialTheme.typography.bodyMedium)}
            list.forEach{r->PracticePanel{Text(if(r.optJSONObject("avaliacao")!=null)"Corrigida"else"Rascunho",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.primary);Text(r.optString("tema"),style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold);Text("${r.optString("texto").trim().split(Regex("\\s+")).filter{it.isNotBlank()}.size} palavras",style=MaterialTheme.typography.bodySmall);Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Button(onClick={if(trash)repo.trash("essays",r)else repo.openEssay(r)},enabled=!busy){Text(if(trash)"Restaurar"else if(r.optJSONObject("avaliacao")!=null)"Ver correção"else"Continuar")};if(!trash)TextButton(onClick={deleting=r},enabled=!busy){Text("Excluir",color=MaterialTheme.colorScheme.error)}}}}
        }else{
            val r=current!!
            TextButton(onClick={leave()},enabled=!busy){Icon(Icons.AutoMirrored.Outlined.ArrowBack,null);Text("Voltar às redações")}
            if(r.optJSONObject("avaliacao")==null||editingCorrected)PracticePanel{
                OutlinedTextField(r.optString("tema"),{repo.editEssay("tema",it.take(240))},Modifier.fillMaxWidth(),label={Text("Tema da redação")},enabled=!busy)
                OutlinedButton(onClick={picker.launch(arrayOf("application/pdf","image/jpeg","image/png","image/webp"))},enabled=!busy,modifier=Modifier.fillMaxWidth()){Text("Enviar foto ou PDF")}
                Text("Foto nítida ou PDF de até 5 páginas e 10 MB. O arquivo não fica salvo.",style=MaterialTheme.typography.bodySmall)
                if(file!=null){Text(file!!.name,style=MaterialTheme.typography.bodySmall);Button(onClick={if(r.optString("texto").isNotBlank())replace=true else repo.transcribe()},enabled=!busy,modifier=Modifier.fillMaxWidth()){Text("Transcrever arquivo")}}
                TextButton(onClick={details=!details},enabled=!busy){Text(if(details)"Ocultar proposta e critérios"else"Proposta e critérios da prova")}
                if(details)listOf("banca" to "Banca ou concurso","proposta" to "Proposta e textos de apoio","criterios" to "Critérios do edital").forEach{(key,label)->OutlinedTextField(r.optString(key),{repo.editEssay(key,it.take(if(key=="banca")120 else 6000))},Modifier.fillMaxWidth(),label={Text(label)},minLines=if(key=="banca")1 else 3,enabled=!busy)}
                Text("${r.optString("texto").trim().split(Regex("\\s+")).filter{it.isNotBlank()}.size} palavras · texto original",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)
                OutlinedTextField(r.optString("texto"),{repo.editEssay("texto",it.take(16000))},Modifier.fillMaxWidth(),label={Text("Sua redação")},minLines=12,maxLines=20,enabled=!busy)
                Text("Ao editar uma redação corrigida, uma nova versão é criada. A anterior continua no histórico.",style=MaterialTheme.typography.bodySmall)
                Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){OutlinedButton(onClick={repo.saveEssay()},enabled=!busy,modifier=Modifier.weight(1f)){Text("Salvar")};Button(onClick={repo.correctEssay()},enabled=!busy,modifier=Modifier.weight(1f)){Text("Corrigir")}}
                TextButton(onClick={about=true}){Text("Privacidade e cota")}
            }
            else OutlinedButton(onClick={editingCorrected=true},enabled=!busy,modifier=Modifier.fillMaxWidth()){Text("Ver ou editar o texto original")}
            r.optJSONObject("avaliacao")?.let{a->
                PracticePanel{Text("Sua correção",style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Bold);Text(a.optString("resumo"),style=MaterialTheme.typography.bodyLarge)}
                a.getJSONArray("criterios").objects().forEach{c->PracticePanel{Text(c.optString("nome"),style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.Bold);Text(c.optString("analise"));if(c.optString("trecho").isNotBlank())Surface(shape=RoundedCornerShape(12.dp),color=MaterialTheme.colorScheme.surfaceVariant){Text(c.optString("trecho"),Modifier.padding(12.dp))};Text("Para o próximo texto",fontWeight=FontWeight.SemiBold,color=MaterialTheme.colorScheme.primary);Text(c.optString("sugestao"))}}
                a.getJSONArray("ajustes").objects().forEach{c->PracticePanel{Text("Você escreveu",style=MaterialTheme.typography.labelMedium);Text(c.optString("trecho"));Text(c.optString("explicacao"));Text("Sugestão",fontWeight=FontWeight.SemiBold,color=MaterialTheme.colorScheme.primary);Text(c.optString("sugestao"))}}
                PracticePanel{Text("Seu próximo treino",fontWeight=FontWeight.Bold);Text(a.optString("proximoTreino"))}
            }
        }
        Spacer(Modifier.height(16.dp))
    }
    if(about)AlertDialog(onDismissRequest={about=false},title={Text("Privacidade e cota")},text={Text("A transcrição e a correção usam o Gemini na sua cota pessoal configurada. Na modalidade gratuita, o Google pode usar o conteúdo para melhorar seus produtos. Evite dados pessoais. O parecer é formativo e não equivale à nota oficial da banca.")},confirmButton={TextButton(onClick={about=false}){Text("Entendi")}})
    if(leaving)AlertDialog(onDismissRequest={leaving=false},title={Text("Voltar sem salvar?")},text={Text("Informe o tema para guardar o rascunho, ou descarte esta versão ainda não salva.")},confirmButton={TextButton(onClick={leaving=false;repo.essay.value=null}){Text("Descartar rascunho")}},dismissButton={TextButton(onClick={leaving=false}){Text("Continuar escrevendo")}})
    if(replace)AlertDialog(onDismissRequest={replace=false},title={Text("Importar redação?")},text={Text("A transcrição substituirá o texto no editor. Uma correção já salva continuará no histórico.")},confirmButton={TextButton(onClick={replace=false;repo.transcribe()}){Text("Transcrever e substituir")}},dismissButton={TextButton(onClick={replace=false}){Text("Cancelar")}})
    deleting?.let{r->AlertDialog(onDismissRequest={deleting=null},title={Text("Excluir redação?")},text={Text("O texto e a correção poderão ser restaurados na lixeira.")},confirmButton={TextButton(onClick={deleting=null;repo.trash("essays",r)}){Text("Mover para a lixeira")}},dismissButton={TextButton(onClick={deleting=null}){Text("Cancelar")}})}
}
