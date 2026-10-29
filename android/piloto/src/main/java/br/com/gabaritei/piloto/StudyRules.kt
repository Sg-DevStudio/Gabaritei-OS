package br.com.gabaritei.piloto

data class StudyInput(val seconds: Long, val questions: Int, val correct: Int)
object StudyRules {
    fun percentage(value:Int,total:Int):Int? = if(total<=0)null else Math.round(value.coerceIn(0,total).toDouble()*100/total).toInt()
    fun error(input: StudyInput): String? = when {
        input.seconds !in 1..86400 -> "Informe um tempo entre 1 segundo e 24 horas."
        input.questions !in 0..100000 -> "Informe uma quantidade válida de questões."
        input.correct !in 0..input.questions -> "Os acertos devem ficar entre zero e o total de questões."
        else -> null
    }
    fun elapsed(accumulated: Long, startedElapsed: Long?, nowElapsed: Long): Long =
        accumulated + if (startedElapsed == null) 0 else (nowElapsed - startedElapsed).coerceAtLeast(0) / 1000
    fun safeLink(value: String): Boolean = try {
        val uri = java.net.URI(value)
        uri.scheme == "https" && !uri.host.isNullOrBlank() && uri.userInfo == null
    } catch (_: Exception) { false }
}
