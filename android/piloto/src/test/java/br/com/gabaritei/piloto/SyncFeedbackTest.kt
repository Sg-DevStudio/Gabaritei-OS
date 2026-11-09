package br.com.gabaritei.piloto

import org.junit.Assert.*
import org.junit.Test

class SyncFeedbackTest {
    @Test fun pendingChangesNeverLookLikeCompletedSync(){
        val pending=SyncFeedbackRules.current(SyncStatus("Sincronizado"),2,false,true)!!
        assertTrue(pending.busy);assertEquals("Sincronizando…",pending.text)
        assertNull(SyncFeedbackRules.current(SyncStatus("Sincronizado"),0,false,true))
    }
    @Test fun offlineAndConflictNeverDisplayAWorkingSpinner(){
        val offline=SyncFeedbackRules.current(SyncStatus(busy=true),2,false,true,false)!!
        assertFalse(offline.busy);assertTrue(offline.attention)
        val conflict=SyncFeedbackRules.current(SyncStatus(conflict=true,failed=true),3,true,true)!!
        assertEquals("Revisar sincronização",conflict.text);assertFalse(conflict.busy)
    }
    @Test fun guestDoesNotInheritPreviousAccountErrors(){
        assertNull(SyncFeedbackRules.current(SyncStatus(failed=true),2,false,false))
        assertEquals("Atualizando planos…",SyncFeedbackRules.current(SyncStatus(),0,true,false)!!.text)
    }
}
