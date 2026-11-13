package br.com.gabaritei.piloto

import org.junit.Assert.*
import org.junit.Test

class AlternativeEliminationTest {
    @Test fun cuttingTheSelectedOptionClearsOnlyTheDraftAndRestoringDoesNotSelectIt(){
        val original=setOf(2)
        val cut=AlternativeElimination.toggle(original,1,1,5)
        assertEquals(setOf(2),original);assertEquals(setOf(1,2),cut.eliminated);assertEquals(-1,cut.selected)
        val restored=AlternativeElimination.toggle(cut.eliminated,cut.selected,1,5)
        assertEquals(setOf(2),restored.eliminated);assertEquals(-1,restored.selected)
        assertEquals(0,AlternativeElimination.toggle(emptySet(),0,3,5).selected)
    }
    @Test fun anyOptionCanBeCrossedWithoutConsultingTheAnswerAndInvalidTargetsAreRejected(){
        var state=AlternativeDraft(emptySet(),0)
        (0..4).forEach{state=AlternativeElimination.toggle(state.eliminated,state.selected,it,5)}
        assertEquals(setOf(0,1,2,3,4),state.eliminated);assertEquals(-1,state.selected)
        assertThrows(IllegalArgumentException::class.java){AlternativeElimination.toggle(emptySet(),-1,5,5)}
    }
}
