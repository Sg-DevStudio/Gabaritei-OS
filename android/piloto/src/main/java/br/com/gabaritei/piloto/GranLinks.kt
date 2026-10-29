package br.com.gabaritei.piloto

import java.net.URI
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.ActivityNotFoundException
import android.net.Uri

/** Rota declarada pelo Gran Questões 5.2.37 e conferida no aparelho. Nunca modifica os filtros. */
object GranLinks {
    const val PACKAGE="br.com.grancursosonline.questoes.app"
    fun appUrl(value:String):String? {
        if(!StudyRules.safeLink(value))return null
        val u=URI(value)
        if(!u.host.equals("questoes.grancursosonline.com.br",true)||u.port !in listOf(-1,443))return null
        if(u.path !in listOf("/questoes","/questoes/","/aluno/filtro/concursos","/aluno/filtro/concursos/"))return null
        return "https://questoes.grancursosonline.com.br/aluno/filtro/concursos"+(u.rawQuery?.let{"?$it"}?:"")+(u.rawFragment?.let{"#$it"}?:"")
    }
    fun open(context:Context,url:String,preferApp:Boolean){
        require(StudyRules.safeLink(url))
        fun intent(link:String)=Intent(Intent.ACTION_VIEW,Uri.parse(link)).apply{if(context !is Activity)addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)}
        if(preferApp)appUrl(url)?.let{target->try{context.startActivity(intent(target).setPackage(PACKAGE));return}catch(_:ActivityNotFoundException){}catch(_:SecurityException){}}
        context.startActivity(intent(url))
    }
}
