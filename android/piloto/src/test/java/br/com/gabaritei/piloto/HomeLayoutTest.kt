package br.com.gabaritei.piloto

import org.json.JSONObject
import org.json.JSONArray
import org.junit.Assert.*
import org.junit.Test

class HomeLayoutTest {
    private fun raw()=StateCompat.empty().put("config",JSONObject().put("otherPreference",42)).toString()
    private fun operation(raw:String,value:HomeArrangement,time:Long=1000)=PendingMutation("layout","home-layout",HomeLayouts.payload(raw,value).toString(),"",time)
    @Test fun missingInvalidAndPartialMetadataRemainUsable(){assertEquals(HomeLayouts.defaults,HomeLayouts.read("broken"));val r=JSONObject(raw());r.obj("config").put("inicioLayout",JSONObject().put("ordem",JSONArray().put("goals").put("goals").put("future-card")));assertEquals("goals",HomeLayouts.read(r.toString()).order.first());assertEquals(7,HomeLayouts.read(r.toString()).order.size)}
    @Test fun preferencesPersistWithoutChangingStudiesAndReplayIsIdempotent(){val base=raw();val value=HomeArrangement(HomeLayouts.defaults.order.reversed(),setOf("quote","metrics"));val op=operation(base,value);val once=StateCompat.apply(base,listOf(op));val twice=StateCompat.apply(once,listOf(op));assertEquals(value,HomeLayouts.read(twice));val r=JSONObject(twice);assertEquals(1,r.obj("config").obj("inicioLayout").optInt("rev"));assertEquals(42,r.obj("config").optInt("otherPreference"));assertEquals(0,r.array("planos").length())}
    @Test fun conflictsDoNotOverwriteOtherDevices(){val base=raw();val a=StateCompat.apply(base,listOf(operation(base,HomeLayouts.defaults.copy(hidden=setOf("quote")))));assertThrows(SyncConflict::class.java){StateCompat.apply(a,listOf(operation(base,HomeLayouts.defaults.copy(hidden=setOf("goals")))))} }
    @Test fun resettingHasANewRevisionAndPreservesUnknownMetadata(){val r=JSONObject(raw());r.obj("config").put("inicioLayout",JSONObject().put("ordem",JSONArray().put("future").put("quote")).put("ocultos",JSONArray().put("future").put("quote")).put("futureProperty",true).put("rev",5));val next=JSONObject(StateCompat.apply(r.toString(),listOf(operation(r.toString(),HomeLayouts.defaults))));val layout=next.obj("config").obj("inicioLayout");assertEquals(6,layout.optInt("rev"));assertTrue(layout.optBoolean("futureProperty"));assertTrue(layout.array("ocultos").toString().contains("future"));assertEquals(HomeLayouts.defaults,HomeLayouts.read(next.toString()))}
    @Test fun allCardsMayBeHiddenAndDefaultCanRestoreThem(){val all=HomeLayouts.defaults.copy(hidden=HomeLayouts.labels.keys);val saved=StateCompat.apply(raw(),listOf(operation(raw(),all)));assertTrue(HomeLayouts.read(saved).visible.isEmpty());val restored=StateCompat.apply(saved,listOf(operation(saved,HomeLayouts.defaults,2000)));assertEquals(HomeLayouts.defaults,HomeLayouts.read(restored))}
}
