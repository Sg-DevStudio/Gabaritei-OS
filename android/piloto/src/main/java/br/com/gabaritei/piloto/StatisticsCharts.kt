package br.com.gabaritei.piloto

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.roundToInt

private val ShortDate=DateTimeFormatter.ofPattern("dd/MM")
private val DayLabels=listOf("Seg","Ter","Qua","Qui","Sex","Sáb","Dom")
@Composable internal fun successColor()=if(MaterialTheme.colorScheme.surface.luminance()<.4f)Color(0xFF55D6AE)else Color(0xFF087D62)

@Composable internal fun ConstancyCard(rows:List<StudyActivity>,from:LocalDate,until:LocalDate,today:LocalDate,showTime:Boolean,planName:String="",achievements:List<Achievement> = emptyList()){
    val stats=remember(rows,from,until,today){StatisticsModel.constancy(rows,from,until,today)}
    var calendar by remember{mutableStateOf(false)}
    var sharing by remember{mutableStateOf(false)}
    var selected by remember(until){mutableStateOf(until)}
    Block{
        Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text("Constância",fontWeight=FontWeight.SemiBold,style=MaterialTheme.typography.titleMedium);Text("Últimos 7 dias do intervalo",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)};IconButton(onClick={selected=until;calendar=true}){Icon(Icons.Outlined.DateRange,"Ver calendário")};IconButton(onClick={sharing=true}){Icon(Icons.Outlined.Share,"Compartilhar constância")}}
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(4.dp)){
            (6 downTo 0).forEach{n->val day=until.minusDays(n.toLong());val enabled=day>=from&&day<=today;val studied=day in stats.active
                Column(Modifier.weight(1f).clickable(enabled=enabled){selected=day;calendar=true}.semantics(mergeDescendants=true){contentDescription="${day.format(ShortDate)}: ${if(!enabled)"fora do intervalo"else if(studied)"estudou"else if(day==today)"hoje, sem registro"else"sem estudo registrado"}"}.padding(vertical=5.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(5.dp)){
                    Text(DayLabels[day.dayOfWeek.value-1],fontSize=10.sp,lineHeight=14.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)
                    Surface(Modifier.size(32.dp),shape=CircleShape,color=if(studied)successColor()else MaterialTheme.colorScheme.surfaceVariant){Box(contentAlignment=Alignment.Center){
                        if(studied)Icon(Icons.Outlined.Check,null,Modifier.size(18.dp),tint=if(successColor().luminance()>.45f)Color(0xFF092B24)else Color.White)
                        else if(enabled&&day<today)Icon(Icons.Outlined.Close,null,Modifier.size(16.dp),tint=MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha=.7f))
                        else Text("·",color=MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha=.5f))
                    }}
                    Text(day.dayOfMonth.toString(),fontSize=10.sp,lineHeight=14.sp,color=MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha=if(enabled)1f else .4f))
                }
            }
        }
        HorizontalDivider(color=MaterialTheme.colorScheme.outlineVariant)
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(12.dp)){
            Column(Modifier.weight(1f)){Text("${stats.current} ${if(stats.current==1)"dia seguido"else"dias seguidos"}",fontWeight=FontWeight.SemiBold,style=MaterialTheme.typography.bodyMedium);Text("Maior sequência: ${stats.longest}",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
            Column(horizontalAlignment=Alignment.End){Text(StatisticsModel.percent(stats.percentage),fontWeight=FontWeight.Bold,color=MaterialTheme.colorScheme.primary,style=MaterialTheme.typography.titleMedium);Text("${stats.active.size}/${stats.totalDays} dias ativos",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
        }
    }
    if(sharing)ConstancyShareDialog(planName,from,until,stats,achievements,onClose={sharing=false})
    if(calendar)ConstancyCalendar(rows,from,until,today,stats.active,selected,showTime,onClose={calendar=false})
}
@Composable private fun ConstancyCalendar(rows:List<StudyActivity>,from:LocalDate,until:LocalDate,today:LocalDate,active:Set<LocalDate>,initial:LocalDate,showTime:Boolean,onClose:()->Unit){
    var month by remember{mutableStateOf(YearMonth.from(initial))};var selected by remember{mutableStateOf(initial)}
    val first=month.atDay(1);val offset=first.dayOfWeek.value-1;val cells=((offset+month.lengthOfMonth()+6)/7)*7
    val chosen=StatisticsModel.total(rows.filter{it.date==selected})
    AlertDialog(containerColor=MaterialTheme.colorScheme.surface,onDismissRequest=onClose,title={Text("Seu calendário")},text={Column(Modifier.verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(10.dp)){
        Row(verticalAlignment=Alignment.CenterVertically){IconButton(onClick={month=month.minusMonths(1)},enabled=month>YearMonth.from(from)){Icon(Icons.Outlined.KeyboardArrowLeft,"Mês anterior")};Text(month.format(DateTimeFormatter.ofPattern("MMMM yyyy",Locale.forLanguageTag("pt-BR"))),Modifier.weight(1f),fontWeight=FontWeight.SemiBold,style=MaterialTheme.typography.bodyMedium);IconButton(onClick={month=month.plusMonths(1)},enabled=month<YearMonth.from(until)){Icon(Icons.Outlined.KeyboardArrowRight,"Próximo mês")}}
        Row{DayLabels.forEach{Text(it,Modifier.weight(1f),fontSize=9.sp,lineHeight=13.sp,textAlign=androidx.compose.ui.text.style.TextAlign.Center)}}
        (0 until cells/7).forEach{week->Row(horizontalArrangement=Arrangement.spacedBy(3.dp)){
            (0..6).forEach{d->val index=week*7+d-offset;val day=first.plusDays(index.toLong());val valid=YearMonth.from(day)==month&&day>=from&&day<=until&&day<=today
                Box(Modifier.weight(1f).aspectRatio(1f),contentAlignment=Alignment.Center){if(YearMonth.from(day)==month){Surface(onClick={selected=day},enabled=valid,modifier=Modifier.fillMaxSize().semantics{contentDescription="${day.format(ShortDate)}: ${if(day in active)"estudou"else"sem registro"}"},shape=CircleShape,color=if(day in active)successColor()else MaterialTheme.colorScheme.surfaceVariant,border=if(day==selected)androidx.compose.foundation.BorderStroke(2.dp,MaterialTheme.colorScheme.primary)else null){Box(contentAlignment=Alignment.Center){Text(day.dayOfMonth.toString(),fontSize=11.sp,lineHeight=15.sp,color=if(day in active)if(successColor().luminance()>.45f)Color(0xFF092B24)else Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha=if(valid)1f else .35f))}}}}
            }
        }}
        Text("Colorido: dia com estudo registrado.",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
        HorizontalDivider()
        Text(selected.format(DateTimeFormatter.ofPattern("dd 'de' MMMM",Locale.forLanguageTag("pt-BR"))),fontWeight=FontWeight.SemiBold,style=MaterialTheme.typography.bodyMedium)
        Text(if(selected !in active)"Sem estudo registrado neste dia."else"${chosen.questions} questões · ${StatisticsModel.percent(chosen.accuracy)} de acertos",style=MaterialTheme.typography.bodySmall)
        if(showTime&&selected in active)Text(StudyMetrics.time(chosen.minutes),style=MaterialTheme.typography.bodySmall)
    }},confirmButton={TextButton(onClick=onClose){Text("Fechar")}})
}
@Composable internal fun AccuracyCard(total:StatsTotal){
    val hit=successColor();val miss=MaterialTheme.colorScheme.error;val track=MaterialTheme.colorScheme.surfaceVariant
    Block{
        Text("Desempenho nas questões",style=MaterialTheme.typography.titleMedium,fontWeight=FontWeight.SemiBold)
        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(16.dp)){
            Box(Modifier.size(128.dp),contentAlignment=Alignment.Center){
                Canvas(Modifier.fillMaxSize().semantics{contentDescription="${StatisticsModel.percent(total.accuracy)} de acertos em ${total.questions} questões"}){
                    val stroke=14.dp.toPx();val inset=stroke/2;val rect=Size(size.width-stroke,size.height-stroke)
                    drawCircle(if(total.questions>0)miss.copy(alpha=.8f)else track,radius=(size.minDimension-stroke)/2,style=Stroke(stroke))
                    if(total.correct>0)drawArc(hit,-90f,(360.0*total.correct/total.questions).toFloat(),false,Offset(inset,inset),rect,style=Stroke(stroke,cap=StrokeCap.Butt))
                }
                Column(horizontalAlignment=Alignment.CenterHorizontally){Text(StatisticsModel.percent(total.accuracy),fontSize=26.sp,lineHeight=32.sp,fontWeight=FontWeight.Bold);Text("de acertos",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
            }
            Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(12.dp)){
                Text("${StatisticsModel.number(total.questions.toDouble())} questões",fontWeight=FontWeight.SemiBold,style=MaterialTheme.typography.bodyMedium)
                listOf(Triple("Acertos",total.correct,hit),Triple("Erros",total.errors,miss)).forEach{(name,count,color)->
                    Column(verticalArrangement=Arrangement.spacedBy(2.dp)){Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(6.dp)){Surface(Modifier.size(8.dp),shape=CircleShape,color=color){};Text(name,style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)};Text("$count · ${StatisticsModel.percent(if(total.questions==0)null else count*100.0/total.questions)}",style=MaterialTheme.typography.bodyMedium,fontWeight=FontWeight.SemiBold)}
                }
            }
        }
        if(total.questions==0)Text("Registre questões para acompanhar seus acertos.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
@Composable internal fun EvolutionChart(points:List<StatsPoint>,metric:StatsMetric){
    val primary=MaterialTheme.colorScheme.primary;val grid=MaterialTheme.colorScheme.outlineVariant
    val values=remember(points,metric){points.map{it.total.value(metric)}}
    var selected by remember(points,metric){mutableIntStateOf(values.indexOfLast{it!=null}.coerceAtLeast(0))}
    if(points.isEmpty()||values.all{it==null}||(metric!=StatsMetric.ACCURACY&&values.all{it==0.0})){Text(if(metric==StatsMetric.TIME)"Sem tempo registrado neste período."else"Sem questões registradas neste período.",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant);return}
    val max=if(metric==StatsMetric.ACCURACY)100.0 else values.filterNotNull().maxOrNull()?.coerceAtLeast(1.0)?:1.0
    fun axis(value:Double)=when(metric){StatsMetric.ACCURACY->"${value.toInt()}%";StatsMetric.TIME->"${value.toInt()}m";else->StatisticsModel.number(value)}
    Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){
        Column(Modifier.height(132.dp),verticalArrangement=Arrangement.SpaceBetween){listOf(max,max/2,0.0).forEach{Text(axis(it),fontSize=9.sp,lineHeight=12.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)}}
        Canvas(Modifier.weight(1f).height(132.dp).semantics{contentDescription="${metric.label}, ${points.size} intervalos. Use os botões abaixo para consultar os valores."}.pointerInput(points,metric){detectTapGestures{p->selected=if(points.size==1)0 else ((p.x-10.dp.toPx())/(size.width-20.dp.toPx())*(points.lastIndex)).roundToInt().coerceIn(0,points.lastIndex)}}){
            val inset=10.dp.toPx();val width=(size.width-2*inset).coerceAtLeast(1f);val height=(size.height-8.dp.toPx()).coerceAtLeast(1f)
            fun x(i:Int)=inset+if(points.size==1)width/2 else width*i/points.lastIndex
            fun y(value:Double)=height*(1-value/max).toFloat()+4.dp.toPx()
            listOf(0.0,.5,1.0).forEach{v->val yy=y(v*max);drawLine(grid,Offset(0f,yy),Offset(size.width,yy),1.dp.toPx())}
            if(metric==StatsMetric.ACCURACY){
                var run=mutableListOf<Int>()
                fun segment(){if(run.size>1){val fill=Path().apply{moveTo(x(run.first()),y(0.0));run.forEach{lineTo(x(it),y(values[it]!!))};lineTo(x(run.last()),y(0.0));close()};drawPath(fill,Brush.verticalGradient(listOf(primary.copy(alpha=.18f),primary.copy(alpha=.01f))));val path=Path().apply{moveTo(x(run.first()),y(values[run.first()]!!));run.drop(1).forEach{lineTo(x(it),y(values[it]!!))}};drawPath(path,primary,style=Stroke(2.5.dp.toPx(),cap=StrokeCap.Round))};run=mutableListOf()}
                values.forEachIndexed{i,v->if(v==null)segment()else run.add(i)};segment()
                values.forEachIndexed{i,v->if(v!=null)drawCircle(primary,if(i==selected)5.dp.toPx()else 3.dp.toPx(),Offset(x(i),y(v)))}
            }else{
                val bar=minOf(22.dp.toPx(),width/(points.size*1.5f))
                values.forEachIndexed{i,v->if(v!=null&&v>0)drawRoundRect(Brush.verticalGradient(listOf(primary,primary.copy(alpha=.55f))),Offset(x(i)-bar/2,y(v)),Size(bar,y(0.0)-y(v)),CornerRadius(4.dp.toPx()))}
            }
            drawLine(primary.copy(alpha=.4f),Offset(x(selected),0f),Offset(x(selected),size.height),1.dp.toPx())
        }
    }
    Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){Text(points.first().from.format(ShortDate),style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant);Text(points.last().until.format(ShortDate),style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}
    Row(verticalAlignment=Alignment.CenterVertically){IconButton(onClick={selected--},enabled=selected>0){Icon(Icons.Outlined.KeyboardArrowLeft,"Intervalo anterior")};Column(Modifier.weight(1f),horizontalAlignment=Alignment.CenterHorizontally){val point=points[selected];Text(if(point.from==point.until)point.from.format(ShortDate)else"${point.from.format(ShortDate)} a ${point.until.format(ShortDate)}",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant);Text(StatisticsModel.format(values[selected],metric),fontWeight=FontWeight.Bold,style=MaterialTheme.typography.titleMedium);if(metric==StatsMetric.ACCURACY)Text("${point.total.questions} questões",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)};IconButton(onClick={selected++},enabled=selected<points.lastIndex){Icon(Icons.Outlined.KeyboardArrowRight,"Próximo intervalo")}}
    if(metric==StatsMetric.ACCURACY)Text("Sem questões: sem ponto no gráfico.",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
}
