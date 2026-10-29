package br.com.gabaritei.piloto
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Test
import org.junit.Assert.*
import org.junit.runner.RunWith
import org.json.JSONObject
import org.json.JSONArray
@RunWith(AndroidJUnit4::class)
class CatalogCacheDeviceTest {
 @Test fun lastPublicCatalogLoadsOfflineAndCorruptionFallsBackToBundledModels(){
    val c=InstrumentationRegistry.getInstrumentation().targetContext;require(c.packageName.endsWith(".qa"))
    val file=java.io.File(c.filesDir,"catalog-public.json");val previous=if(file.isFile)file.readBytes()else null
    try {
        val source=JSONObject().put("id","offline-only-test").put("titulo","Concurso offline").put("disciplinas",JSONArray().put(JSONObject().put("id","d").put("nome","Português").put("topicos",JSONArray().put(JSONObject().put("id","t").put("nome","Crase")))))
        file.writeText(JSONArray().put(source).toString());assertTrue(Catalog.load(c).any{it.id=="offline-only-test"})
        file.writeText("{interrompido");assertEquals(Catalog.bundled(c).map{it.id},Catalog.load(c).map{it.id})
    }finally{if(previous==null)file.delete()else file.writeBytes(previous)}
 }
}
