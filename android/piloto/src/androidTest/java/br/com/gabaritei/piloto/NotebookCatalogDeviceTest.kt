package br.com.gabaritei.piloto

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test
import org.junit.Assert.*
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NotebookCatalogDeviceTest {
    @Test fun shippedCatalogExposesAllThreePlatformsAndCorrectedTecCategory(){
        val c=InstrumentationRegistry.getInstrumentation().targetContext
        require(c.packageName.endsWith(".qa"))
        val plans=Catalog.bundled(c)
        val links=plans.flatMap{it.topics}.flatMap{it.questionLinks}
        assertEquals(setOf("Gran Questões","TEC Concursos","Qconcursos"),links.map{it.platform}.toSet())
        val trf=plans.first{it.id=="carreira-trf2-tjaa-2024"}
        assertEquals(114,trf.topics.count{it.questionLinks.any{l->l.platform=="TEC Concursos"}})
        val tjsp=plans.first{it.id=="edt-mqifhb2v-yh9ym"}
        val percent=tjsp.topics.first{it.id=="MAT-02"}
        val url=percent.questionLinks.first{it.platform=="TEC Concursos"}.url
        assertTrue(url.contains("1026"));assertFalse(url.contains("5330"))
    }
}
