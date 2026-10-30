package br.com.gabaritei.piloto

import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.Locale
import kotlin.math.ceil

enum class StatsMetric(val key:String,val label:String){
    ACCURACY("accuracy","Acertos (%)"),QUESTIONS("questions","Questões"),CORRECT("correct","Acertos (quantidade)"),ERRORS("errors","Erros (quantidade)"),TIME("time","Tempo")
}
data class StatsTotal(val minutes:Double,val questions:Int,val correct:Int){
    val errors get()=questions-correct
    val accuracy:Double? get()=if(questions==0)null else 100.0*correct/questions
    fun value(metric:StatsMetric):Double?=when(metric){StatsMetric.ACCURACY->accuracy;StatsMetric.QUESTIONS->questions.toDouble();StatsMetric.CORRECT->correct.toDouble();StatsMetric.ERRORS->errors.toDouble();StatsMetric.TIME->minutes}
}
data class StatsPoint(val from:LocalDate,val until:LocalDate,val total:StatsTotal)
data class StatsConstancy(val active:Set<LocalDate>,val totalDays:Long,val current:Int,val longest:Int){
    val percentage get()=if(totalDays==0L)0.0 else active.size*100.0/totalDays
}
object StatisticsModel {
    val displays=linkedMapOf("constancy" to "Constância","accuracy" to "Acertos e erros (%)","questions" to "Quantidade de questões","time" to "Tempo de estudo","progress" to "Progresso no edital")
    val defaults=setOf("constancy","accuracy","questions","progress")
    fun display(saved:Set<String>?):Set<String> = saved?.intersect(displays.keys)?.takeIf{it.isNotEmpty()}?:defaults
    fun metrics(display:Set<String>)=buildList{if("accuracy" in display)add(StatsMetric.ACCURACY);if("questions" in display)addAll(listOf(StatsMetric.QUESTIONS,StatsMetric.CORRECT,StatsMetric.ERRORS));if("time" in display)add(StatsMetric.TIME)}
    fun total(rows:List<StudyActivity>)=StatsTotal(rows.sumOf{it.minutes.takeIf{n->n.isFinite()&&n>0}?:0.0},rows.sumOf{it.questions.coerceAtLeast(0)},rows.sumOf{it.correct.coerceIn(0,it.questions.coerceAtLeast(0))})
    fun percent(value:Double?):String=if(value==null)"—"else String.format(Locale.forLanguageTag("pt-BR"),"%.1f",value).removeSuffix(",0")+"%"
    fun number(value:Double)=java.text.NumberFormat.getIntegerInstance(Locale.forLanguageTag("pt-BR")).format(value)
    fun format(value:Double?,metric:StatsMetric):String=when{value==null->"Sem questões";metric==StatsMetric.ACCURACY->percent(value);metric==StatsMetric.TIME->StudyMetrics.time(value);else->number(value)}
    fun constancy(rows:List<StudyActivity>,from:LocalDate,until:LocalDate,today:LocalDate):StatsConstancy{
        val end=minOf(until,today)
        val active=rows.filter{it.date>=from&&it.date<=end&&(it.minutes.isFinite()&&it.minutes>0||it.questions>0)}.map{it.date}.toSet()
        val count=(ChronoUnit.DAYS.between(from,end)+1).coerceAtLeast(0)
        var cursor=end
        // Today remains open: yesterday's sequence does not disappear before the day ends.
        if(end==today&&cursor !in active)cursor=cursor.minusDays(1)
        var current=0
        while(cursor>=from&&cursor in active){current++;cursor=cursor.minusDays(1)}
        return StatsConstancy(active,count,current,StudyMetrics.streak(active.toList()))
    }
    fun series(rows:List<StudyActivity>,from:LocalDate,until:LocalDate):List<StatsPoint>{
        if(until<from)return emptyList()
        val days=ChronoUnit.DAYS.between(from,until)+1
        val step=ceil(days/12.0).toLong().coerceAtLeast(1)
        val groups=rows.filter{it.date>=from&&it.date<=until}.groupBy{ChronoUnit.DAYS.between(from,it.date)/step}
        return (0L until ceil(days.toDouble()/step).toLong()).map{i->val start=from.plusDays(i*step);StatsPoint(start,minOf(start.plusDays(step-1),until),total(groups[i].orEmpty()))}
    }
}
