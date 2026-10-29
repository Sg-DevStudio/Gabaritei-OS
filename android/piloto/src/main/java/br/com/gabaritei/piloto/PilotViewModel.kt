package br.com.gabaritei.piloto

import android.app.Application
import android.os.SystemClock
import android.provider.Settings as AndroidSettings
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID

class PilotViewModel(application: Application) : AndroidViewModel(application) {
    private val dao = PilotDatabase.get(application).dao()
    val plans = MutableStateFlow<List<Plan>>(emptyList())
    val error = MutableStateFlow<String?>(null)
    val sessions = dao.sessions().stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
    val progress = dao.progress().stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
    val links = dao.links().stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())
    val settings = dao.settings().stateIn(viewModelScope, SharingStarted.Eagerly, null)
    val timer = dao.timer().stateIn(viewModelScope, SharingStarted.Eagerly, null)
    private fun boot() = AndroidSettings.Global.getInt(getApplication<Application>().contentResolver, AndroidSettings.Global.BOOT_COUNT, -1)
    init {
        viewModelScope.launch(Dispatchers.IO) {
            try { plans.value = Catalog.load(application) }
            catch (_: Exception) { error.value = "Não foi possível carregar os planos. Reabra o app para tentar novamente." }
        }
        viewModelScope.launch {
            dao.timer().collect { t ->
                // Não somar períodos anteriores à reinicialização como estudo.
                if (t != null && t.startedElapsed != null && t.boot != boot())
                    dao.timer(t.copy(startedElapsed = null, boot = boot()))
            }
        }
    }
    fun select(plan: Plan, topic: Topic) = viewModelScope.launch { dao.settings(Settings(planId=plan.id, topicId=topic.id)) }
    fun select(plan: Plan) = select(plan, plan.topics.firstOrNull { t -> progress.value.none { it.planId==plan.id && it.topicId==t.id && it.completed } } ?: plan.topics.first())
    fun start(plan: Plan, topic: Topic) = viewModelScope.launch {
        if (!dao.startTimer(Timer(sessionId=UUID.randomUUID().toString(),planId=plan.id,topicId=topic.id,seconds=0,startedElapsed=SystemClock.elapsedRealtime(),boot=boot())))
            error.value="Conclua ou descarte o cronômetro atual antes de iniciar outro."
    }
    fun elapsed(t: Timer) = StudyRules.elapsed(t.seconds, if(t.boot==boot())t.startedElapsed else null, SystemClock.elapsedRealtime())
    fun pause(t: Timer) = viewModelScope.launch { dao.timer(t.copy(seconds=elapsed(t),startedElapsed=null)) }
    fun resume(t: Timer) = viewModelScope.launch { dao.timer(t.copy(startedElapsed=SystemClock.elapsedRealtime(),boot=boot())) }
    fun discard(t: Timer) = viewModelScope.launch { dao.clearTimer(t.sessionId) }
    fun save(plan: Plan, topic: Topic, input: StudyInput, completed: Boolean, timer: Timer?, id: String, failed: () -> Unit = {}, success: () -> Unit) {
        val validation=StudyRules.error(input)
        if(validation!=null){error.value=validation;return}
        viewModelScope.launch {
            try {
                dao.record(Session(id,plan.id,topic.id,input.seconds,input.questions,input.correct,System.currentTimeMillis()),completed,timer!=null)
                success()
            } catch (_: Exception) { error.value="Não foi possível salvar. Seu registro continua aberto para tentar novamente."; failed() }
        }
    }
    fun setLink(plan: Plan, topic: Topic, url: String, success: () -> Unit) {
        if(url.isNotBlank()&&!StudyRules.safeLink(url.trim())){error.value="Use um link HTTPS válido, sem usuário ou senha no endereço.";return}
        viewModelScope.launch {
            if(url.isBlank())dao.resetLink(plan.id,topic.id) else dao.link(PersonalLink(plan.id,topic.id,url.trim()))
            success()
        }
    }
}
