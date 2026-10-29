package br.com.gabaritei.piloto
import org.junit.Assert.*
import org.junit.Test

class StudyRulesTest {
    @Test fun percentagesMatchTheWebsiteRounding(){assertEquals(73,StudyRules.percentage(40,55));assertEquals(1,StudyRules.percentage(1,121));assertNull(StudyRules.percentage(0,0))}
    @Test fun invalidRecordsAreRejected() {
        assertNotNull(StudyRules.error(StudyInput(0,10,8)))
        assertNotNull(StudyRules.error(StudyInput(600,10,11)))
        assertNotNull(StudyRules.error(StudyInput(600,-1,0)))
        assertNull(StudyRules.error(StudyInput(600,0,0)))
        assertNull(StudyRules.error(StudyInput(86400,10,10)))
    }
    @Test fun elapsedDoesNotDependOnUiTicksOrWallClock() {
        assertEquals(70L,StudyRules.elapsed(10,10000,70000))
        assertEquals(10L,StudyRules.elapsed(10,null,70000))
        assertEquals(10L,StudyRules.elapsed(10,70000,10000))
    }
    @Test fun externalLinksRejectSchemesAndCredentials() {
        assertTrue(StudyRules.safeLink("https://questoes.grancursosonline.com.br/questoes?assunto=425028"))
        for(url in listOf("javascript:alert(1)","file:///etc/passwd","https://user:password@host.com","https://","intent://abc")) assertFalse(url,StudyRules.safeLink(url))
    }
}
