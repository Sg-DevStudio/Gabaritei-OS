package br.com.gabaritei.piloto

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import androidx.room.Room

@RunWith(AndroidJUnit4::class)
class PersistenceTest {
    @Test fun sessionIsIdempotentAndCompletionIsAtomic() = runBlocking {
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        val db=Room.inMemoryDatabaseBuilder(context,PilotDatabase::class.java).build()
        try {
            val dao=db.dao()
            val timer=Timer(sessionId="same-id",planId="plan",topicId="topic",seconds=60,startedElapsed=null,boot=1)
            assertTrue(dao.startTimer(timer));assertFalse(dao.startTimer(timer.copy(sessionId="other")))
            val s=Session("same-id","plan","topic",60,10,8,1000)
            dao.record(s,true,true);dao.record(s,true,true)
            assertEquals(1,dao.sessions().first().size)
            assertEquals(1,dao.progress().first().size)
            assertNull(dao.currentTimer())
        } finally { db.close() }
    }
    @Test fun dataSurvivesDatabaseReopening() = runBlocking {
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        val name="persistence-test.db";context.deleteDatabase(name)
        var db=Room.databaseBuilder(context,PilotDatabase::class.java,name).build()
        try {
            db.dao().settings(Settings(planId="plan",topicId="topic"))
            db.dao().link(PersonalLink("plan","topic","https://example.com"))
            db.close();db=Room.databaseBuilder(context,PilotDatabase::class.java,name).build()
            assertEquals("plan",db.dao().settings().first()?.planId)
            assertEquals("https://example.com",db.dao().links().first().single().url)
        } finally { db.close();context.deleteDatabase(name) }
    }

    @Test fun explicitCategorySurvivesLocalRecord()=runBlocking {
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        val db=Room.inMemoryDatabaseBuilder(context,PilotDatabase::class.java).build()
        try {
            val raw=StateCompat.empty().put("planos",org.json.JSONArray().put(org.json.JSONObject().put("id","p").put("plano",org.json.JSONObject()).put("disciplinas",org.json.JSONArray().put(org.json.JSONObject().put("id","d").put("nome","Direito").put("topicos",org.json.JSONArray().put(org.json.JSONObject().put("id","t").put("nome","Tema")))))))
            db.dao().snapshot(RemoteSnapshot(json=raw.toString(),syncedAt=0))
            db.dao().record(Session("review","p","t",1800,10,8,System.currentTimeMillis()),false,false,org.json.JSONObject().put("tipo","revisao").toString())
            assertEquals("revisao",org.json.JSONObject(db.dao().currentSnapshot()!!.json).array("sessoes").getJSONObject(0).getString("tipo"))
        }finally{db.close()}
    }
    @Test fun selectedPhotoIsReducedToPrivateJpeg(){
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        val file=java.io.File(context.cacheDir,"avatar-test.png")
        val bitmap=android.graphics.Bitmap.createBitmap(128,256,android.graphics.Bitmap.Config.ARGB_8888)
        try {bitmap.eraseColor(android.graphics.Color.BLUE);file.outputStream().use{bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG,100,it)}
            val image=ProfilePhoto.encode(context,android.net.Uri.fromFile(file));assertTrue(ProfilePhoto.safe(image))
            val bytes=android.util.Base64.decode(image.substringAfter(','),android.util.Base64.DEFAULT);val result=android.graphics.BitmapFactory.decodeByteArray(bytes,0,bytes.size)
            assertEquals(256,result.width);assertEquals(256,result.height);result.recycle()
        }finally{bitmap.recycle();file.delete()}
    }
}
