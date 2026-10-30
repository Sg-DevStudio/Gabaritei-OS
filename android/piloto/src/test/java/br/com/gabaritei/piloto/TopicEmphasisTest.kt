package br.com.gabaritei.piloto

import org.junit.Assert.*
import org.junit.Test

class TopicEmphasisTest {
    private fun plan(details:String)=Plan("p","Plano",listOf(Discipline("d","Matéria",listOf(Topic("t","Tema",null,"")))),details=details)
    @Test fun explicitPedagogicalPriorityIsReadById(){assertEquals(setOf("t"),TopicEmphasis.priorities(plan("""{"disciplinas":[{"topicos":[{"id":"t","prioridade":1},{"id":"foreign","prioridade":1}]}]}""")))}
    @Test fun estimatedPercentagesHoursAndMissingPriorityNeverInventAnEmphasis(){assertTrue(TopicEmphasis.priorities(plan("""{"disciplinas":[{"topicos":[{"id":"t","incidencia_pct":99,"horas_estimadas":100}]}]}""")).isEmpty())}
    @Test fun secondaryPrioritiesAreNotHighlighted(){assertTrue(TopicEmphasis.priorities(plan("""{"disciplinas":[{"topicos":[{"id":"t","prioridade":2}]}]}""")).isEmpty())}
    @Test fun invalidMetadataDoesNotBreakSyllabus(){assertTrue(TopicEmphasis.priorities(plan("broken")).isEmpty());assertTrue(TopicEmphasis.priorities(plan("{}")).isEmpty())}
}
