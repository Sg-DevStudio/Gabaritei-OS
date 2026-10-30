package br.com.gabaritei.piloto

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.json.JSONArray
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.time.LocalDate
import java.time.ZoneId

/** Explicit, synthetic guest fixture. Never runs for the student package or a logged-in account. */
@RunWith(AndroidJUnit4::class)
class DesignFixtureTest {
    @Test fun prepareVisualQa()=runBlocking{
        assumeTrue(InstrumentationRegistry.getArguments().getString("designFixture")=="true")
        val c=InstrumentationRegistry.getInstrumentation().targetContext;check(c.packageName.endsWith(".qa"));val connection=AccountSync(c);check(connection.auth.currentUser==null);connection.close()
        val plan=Catalog.bundled(c).first();val source=Catalog.base(plan);val ds=source.getJSONArray("disciplinas");val topics=plan.topics
        val raw=StateCompat.empty().put("planoAtivoId",plan.id).put("planos",JSONArray().put(JSONObject().put("id",plan.id).put("plano",JSONObject().put("concurso",plan.name).put("origemEditalId",plan.id)).put("disciplinas",ds).put("links",JSONArray())))
        val d=PilotDatabase.get(c).dao();val today=LocalDate.now()
        listOf(0,1,2,4,5,7,9,10,14,15,20).forEachIndexed{i,n->val topic=topics[i%topics.size];val date=today.minusDays(n.toLong());val q=20+i;val right=q*4/5;val seconds=(30+i)*60L;val id="visual-fixture-$i"
            d.insert(Session(id,plan.id,topic.id,seconds,q,right,date.atTime(12,0).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()))
            raw.array("sessoes").put(JSONObject().put("id",id).put("planoId",plan.id).put("topicoId",topic.id).put("data",date.toString()).put("tipo",if(i%3==0)"revisao"else"questoes").put("duracaoMin",seconds/60).put("qFeitas",q).put("qCertas",right))
        }
        topics.take(4).forEach{t->d.progress(Progress(plan.id,t.id,true));ds.objects().flatMap{it.array("topicos").objects()}.find{it.optString("id")==t.id}?.put("status","teoria_concluida")}
        d.snapshot(RemoteSnapshot(json=raw.toString(),syncedAt=0));d.settings(Settings(planId=plan.id,topicId=topics.first().id))
        c.getSharedPreferences("native_display",0).edit().putString("theme","light").apply()
    }
}
