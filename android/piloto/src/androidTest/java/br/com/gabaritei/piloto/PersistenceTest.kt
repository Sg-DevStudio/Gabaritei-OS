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
}
