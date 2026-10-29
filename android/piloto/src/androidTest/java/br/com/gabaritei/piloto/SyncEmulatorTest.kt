package br.com.gabaritei.piloto

import androidx.room.Room
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.tasks.await
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.util.UUID

/** Executa somente com a opção explícita e contra localhost, nunca em produção.
 * adb reverse tcp:8080 tcp:8080 e tcp:9099 tcp:9099 são pré-requisitos. */
@RunWith(AndroidJUnit4::class)
class SyncEmulatorTest {
    @Test fun nativeTransactionRoundTripConcurrencyAndOwnerRules()=runBlocking {
        assumeTrue(InstrumentationRegistry.getArguments().getString("firebaseEmulator")=="true")
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        val id=UUID.randomUUID().toString()
        val app=FirebaseApp.initializeApp(context,FirebaseOptions.Builder().setProjectId("demo-gabaritei-android").setApplicationId("1:123456:android:abcdef").setApiKey("AIzaSyEmulatorOnlyNotAProductionKey1234567").build(),"emulator-$id")
        require(app.options.projectId!!.startsWith("demo-"))
        val auth=FirebaseAuth.getInstance(app);auth.useEmulator("127.0.0.1",9099)
        val db=FirebaseFirestore.getInstance(app);db.useEmulator("127.0.0.1",8080);db.firestoreSettings=FirebaseFirestoreSettings.Builder().setPersistenceEnabled(false).build()
        val a=Room.inMemoryDatabaseBuilder(context,PilotDatabase::class.java).build();val b=Room.inMemoryDatabaseBuilder(context,PilotDatabase::class.java).build()
        val clientA=AccountSync(context,app);val clientB=AccountSync(context,app)
        try {
            val uid=auth.createUserWithEmailAndPassword("android-$id@example.test","OnlyLocalTest123!").await().user!!.uid
            withTimeout(10000){clientA.account.first{it?.uid==uid};clientB.account.first{it?.uid==uid}}
            val raw=StateCompat.empty().put("campoDesconhecido","á🙂".repeat(100000))
            raw.obj("config").put("syncGeneration","principal-emulator").put("rev",1)
            raw.array("planos").put(JSONObject().put("id","p").put("plano",JSONObject().put("concurso","Teste local"))
                .put("disciplinas",JSONArray().put(JSONObject().put("id","d").put("nome","Direito").put("topicos",JSONArray().put(JSONObject().put("id","t").put("nome","Tópico").put("status","pendente"))))).put("links",JSONArray()))
            val ref=db.document("users/$uid/state/current");val parts=StateCompat.chunks(raw.toString());assertTrue(parts.size>1)
            val batch=db.batch();parts.forEachIndexed{i,p->batch.set(ref.parent.document("current-chunk-${i.toString().padStart(2,'0')}"),mapOf("payload" to p,"index" to i,"rev" to 1,"savedAt" to FieldValue.serverTimestamp()))}
            batch.set(ref,mapOf("formato" to 2,"chunks" to parts.size,"updatedAt" to "2026-10-29T00:00:00Z","clientId" to "emulator-fixture","syncGeneration" to "principal-emulator","rev" to 1,"resumo" to StateCompat.summary(raw),"savedAt" to FieldValue.serverTimestamp())).commit().await()
            fun mutation(sid:String)=PendingMutation(sid,"session",JSONObject().put("planId","p").put("topicId","t").put("completed",false).put("session",JSONObject().put("id",sid).put("planoId","p").put("topicoId","t").put("data","2026-10-29").put("tipo","teoria").put("duracaoMin",30).put("qFeitas",10).put("qCertas",8)).toString(),"principal-emulator",System.currentTimeMillis())
            a.dao().snapshot(RemoteSnapshot(json=raw.toString(),syncedAt=0));b.dao().snapshot(RemoteSnapshot(json=raw.toString(),syncedAt=0))
            a.dao().mutate(mutation("a"));b.dao().mutate(mutation("b"))
            awaitAll(async{clientA.synchronize(uid,a.dao())},async{clientB.synchronize(uid,b.dao())})
            assertFalse(clientA.status.value.text,clientA.status.value.failed);assertFalse(clientB.status.value.text,clientB.status.value.failed)
            clientA.synchronize(uid,a.dao())
            val roundTrip=JSONObject(a.dao().currentSnapshot()!!.json)
            assertEquals(2,roundTrip.getJSONArray("sessoes").length());assertEquals(raw.getString("campoDesconhecido"),roundTrip.getString("campoDesconhecido"))
            assertTrue(a.dao().pendingNow().isEmpty());assertTrue(b.dao().pendingNow().isEmpty());assertEquals(2,roundTrip.getJSONArray("agenda").length())
            // Uma conta nova não pode ler o histórico da anterior.
            auth.signOut();auth.createUserWithEmailAndPassword("other-$id@example.test","OnlyLocalTest123!").await()
            try{ref.get(Source.SERVER).await();fail("Outra conta conseguiu ler o histórico.")}catch(e:FirebaseFirestoreException){assertEquals(FirebaseFirestoreException.Code.PERMISSION_DENIED,e.code)}
        }finally{clientA.close();clientB.close();a.close();b.close();auth.signOut();db.terminate().await();app.delete()}
    }
}
