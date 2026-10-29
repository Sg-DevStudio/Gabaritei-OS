package br.com.gabaritei.piloto

import java.text.Normalizer
import java.time.LocalDate
import java.util.Locale
import org.json.JSONObject
import kotlin.math.roundToInt

data class PlanComparisonResult(val overlap:Int,val commonTopics:Int,val onlyA:Int,val onlyB:Int,val sharedDisciplines:List<String>,val effort:Int,val savings:Int,val weekly:Double,val weeks:Int,val dated:Boolean,val level:String)
/** Mesma heurística de conciliarPlanos do site. É estimativa de conteúdo, não garantia de equivalência. */
object PlanComparison {
    private val stopDisc="de do da dos das e a o as os em ao nocoes nocao nocoe elementos fundamentos introducao basica basico geral gerais conhecimentos parte".split(' ').toSet()
    private val stopTop="de do da dos das e a o as os em no na nos nas ao aos com para por sua seu suas seus lei art artigo n".split(' ').toSet()
    private val anchors="quimica fisica biologia geografia historia filosofia sociologia redacao atualidades ingles espanhol".split(' ').toSet()
    private fun tokens(value:String,disc:Boolean):Set<String>{
        var n=" "+Normalizer.normalize(value.lowercase(Locale.ROOT),Normalizer.Form.NFD).replace(Regex("\\p{M}"),"").replace(Regex("[^a-z0-9]+")," ").trim()+" "
        listOf("portugues" to "lingua portuguesa","matematica" to "raciocinio logico","rlm" to "raciocinio logico","rh" to "recursos humanos","(cf|cf88|crfb|constituicao da republica|constituicao federal)" to "constituicao federal","(rju|regime juridico unico)" to "regime juridico servidores","cpc" to "codigo processo civil","cpp" to "codigo processo penal","clt" to "consolidacao leis trabalho","lgpd" to "protecao dados pessoais","improbidade" to "improbidade administrativa").forEach{(a,b)->n=n.replace(Regex(" $a ")," $b ")}
        val set=n.trim().split(' ').filter{it.length>1&&it !in if(disc)stopDisc else stopTop}.toSet().ifEmpty{setOf(n.trim().replace(Regex("\\s+"),"_")).filter{it.isNotEmpty()}.toSet()}
        val single=set.intersect(anchors);return if(disc&&single.size==1)single else set
    }
    private fun sim(a:Set<String>,b:Set<String>)=if(a.isEmpty()||b.isEmpty())0.0 else a.intersect(b).size.toDouble()/a.union(b).size
    private data class T(val tokens:Set<String>,val hours:Double)
    private data class D(val name:String,val tokens:Set<String>,val topics:List<T>){val hours get()=topics.sumOf{it.hours}}
    private fun rows(plan:Plan):List<D>{val source=JSONObject(plan.details).array("disciplinas").objects().flatMap{it.array("topicos").objects()}.associateBy{it.optString("id")}
        return plan.disciplines.filter{!it.archived}.map{d->D(d.name,tokens(d.name,true),d.topics.map{t->val h=source[t.id]?.optDouble("horas_estimadas",2.0)?:2.0;T(tokens(t.name,false),h.takeIf{it.isFinite()&&it>0&&it<=10000}?:2.0)})}
    }
    fun compare(a:Plan,b:Plan,hours:Double,today:LocalDate=LocalDate.now()):PlanComparisonResult{
        require(hours.isFinite()&&hours in 1.0..168.0)
        val da=rows(a);val db=rows(b);val ta=da.sumOf{it.topics.size};val tb=db.sumOf{it.topics.size};val ha=da.sumOf{it.hours};val hb=db.sumOf{it.hours}
        val used=mutableSetOf<Int>();val common=mutableListOf<String>();var floorTopics=0;var floorHours=0.0
        da.forEach{x->var best=-1;var score=.5;db.forEachIndexed{i,y->if(i !in used){val s=sim(x.tokens,y.tokens);if(s>=score){best=i;score=s}}};if(best>=0){used+=best;val y=db[best];common+=x.name;val f=if(score>=.8).7 else .5;floorTopics+=(minOf(x.topics.size,y.topics.size)*f).roundToInt();floorHours+=minOf(x.hours,y.hours)*f}}
        val topics=db.flatMap{it.topics};val usedTopics=mutableSetOf<Int>();var count=0;var reused=0.0
        da.flatMap{it.topics}.forEach{x->var best=-1;var score=.34;topics.forEachIndexed{i,y->if(i !in usedTopics){val s=sim(x.tokens,y.tokens);if(s>=score){best=i;score=s}}};if(best>=0){usedTopics+=best;count++;reused+=minOf(x.hours,topics[best].hours)}}
        val commonTopics=minOf(ta,tb,maxOf(count,floorTopics));val commonHours=maxOf(reused,floorHours).roundToInt();val effort=((ha+hb-commonHours)*1.8).roundToInt();val sum=((ha+hb)*1.8).roundToInt()
        fun months(p:Plan):Int?{val date=JSONObject(p.details).optJSONObject("janelaProva")?.optString("inicio").orEmpty().split('-');val y=date.getOrNull(0)?.toIntOrNull()?:return null;val m=date.getOrNull(1)?.toIntOrNull()?:1;return ((y-today.year)*12+m-today.monthValue).takeIf{it>0}}
        val remaining=listOfNotNull(months(a),months(b)).minOrNull();val weeks=remaining?.let{maxOf(2,(it*4.345).roundToInt())}?:26
        val weekly=(effort.toDouble()/weeks*10).roundToInt()/10.0;val ratio=weekly/hours;val overlap=minOf(100,(commonHours/maxOf(1.0,minOf(ha,hb))*100).roundToInt())
        var level=when{ratio<=.85->3;ratio<=1.1->2;ratio<=1.45->1;else->0}
        if(overlap>=45)level=minOf(3,level+1);if(overlap>=75&&ratio<=1.2)level=minOf(3,level+1);if(overlap>=30&&level==0)level=1
        val critical=remaining!=null&&weeks<8;if(overlap>=45&&!critical&&level<2)level=2;if(critical&&ratio>1.1)level=maxOf(0,level-1)
        return PlanComparisonResult(overlap,commonTopics,(ta-commonTopics).coerceAtLeast(0),(tb-commonTopics).coerceAtLeast(0),common,effort,sum-effort,weekly,weeks,remaining!=null,listOf("Não recomendada","Baixa","Moderada","Alta")[level])
    }
}
