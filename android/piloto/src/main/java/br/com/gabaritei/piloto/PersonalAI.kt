package br.com.gabaritei.piloto

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/** Keys belong to the signed-in account, never to the study state or backups. */
internal object PersonalAI {
    val googleModels=listOf("gemini-3.5-flash-lite","gemini-3.8-flash")
    const val groqModel="openai/gpt-oss-120b"
    fun provider(key:String)=when{key.trim().startsWith("gsk_")->"groq";key.trim().startsWith("AIza")->"gemini";else->null}
    fun validate(key:String,provider:String,model:String){
        require(provider in setOf("gemini","groq")){"Escolha Gemini ou Groq."}
        require(if(provider=="groq")Regex("^gsk_[A-Za-z0-9_-]{20,200}$").matches(key) else Regex("^AIza[A-Za-z0-9_-]{25,160}$").matches(key)){"Cole uma chave válida do ${if(provider=="groq")"Groq Console (gsk_…)"else"Google AI Studio (AIza…)"}."}
        require(if(provider=="groq")model==groqModel else model in googleModels){"Escolha um modelo disponível."}
    }
    fun validationError(status:Int)=when(status){
        401,403->"A chave foi recusada pelo provedor. Confira se está ativa e se tem acesso ao modelo."
        429->"O provedor limitou a consulta. Aguarde um pouco e tente conectar novamente."
        else->"Não foi possível validar a chave (HTTP $status). Tente novamente."
    }
    suspend fun checkAccess(key:String,provider:String,model:String)=withContext(Dispatchers.IO){
        validate(key,provider,model)
        val endpoint=if(provider=="groq")"https://api.groq.com/openai/v1/models"else"https://generativelanguage.googleapis.com/v1beta/models/$model"
        val connection=URL(endpoint).openConnection() as HttpURLConnection
        try{
            connection.connectTimeout=15000;connection.readTimeout=20000;connection.requestMethod="GET"
            connection.setRequestProperty(if(provider=="groq")"Authorization"else"x-goog-api-key",if(provider=="groq")"Bearer $key"else key)
            val status=connection.responseCode;require(status in 200..299){validationError(status)}
            if(provider=="groq"){
                val result=JSONObject(connection.inputStream.bufferedReader().use{it.readText()})
                require(result.optJSONArray("data")?.objects()?.any{it.optString("id")==model}==true){"O modelo não está disponível nesta conta Groq."}
            }
        }finally{connection.disconnect()}
    }
}
