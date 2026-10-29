package br.com.gabaritei.piloto

import android.app.Application
import android.database.sqlite.SQLiteDatabase
import androidx.room.Room
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk=[28],manifest=Config.NONE)
class AccountStorageTest {
    private val app:Application get()=RuntimeEnvironment.getApplication()
    @Test fun guestAndTwoGoogleAccountsRemainIsolated()=runBlocking{
        val a=PilotDatabase.get(app,"test-account-A").dao();val b=PilotDatabase.get(app,"test-account-B").dao();val guest=PilotDatabase.get(app).dao()
        a.insert(Session("account-a-record","p","t",60,10,8,1000))
        b.insert(Session("account-b-record","p","t",120,20,18,2000))
        guest.insert(Session("guest-record","p","t",300,0,0,3000))
        assertEquals(listOf("account-a-record"),a.sessions().first().map{it.id});assertEquals(listOf("account-b-record"),b.sessions().first().map{it.id})
        assertEquals(listOf("guest-record"),guest.sessions().first().map{it.id})
    }
    @Test fun acknowledgingOneBatchDoesNotEraseNewOfflineMutations()=runBlocking{
        val db=Room.inMemoryDatabaseBuilder(app,PilotDatabase::class.java).build()
        try{val d=db.dao();val first=PendingMutation("first","plan","{}","",1000);val second=first.copy(id="second",createdAt=2000)
            d.enqueue(first);d.enqueue(second);d.acknowledge(listOf(first.id))
            assertEquals(listOf("second"),d.pendingNow().map{it.id})
        }finally{db.close()}
    }
    @Test fun choosingRemoteKeepsRecoverableSnapshotAndOutbox()=runBlocking{
        val db=Room.inMemoryDatabaseBuilder(app,PilotDatabase::class.java).build()
        try{val d=db.dao();d.snapshot(RemoteSnapshot(json=StateCompat.empty().toString(),syncedAt=0));d.enqueue(PendingMutation("pending","plan","{}","",1000))
            d.archivePending();assertTrue(d.pendingNow().isEmpty());val copies=d.recoveryCopies();assertEquals(1,copies.size);assertTrue(copies.single().json.contains("pending"))
        }finally{db.close()}
    }
    @Test fun versionOneMigrationKeepsExistingStudiesAndLinks()=runBlocking{
        val name="migration-one-to-two.db";app.deleteDatabase(name)
        val legacy=SQLiteDatabase.openOrCreateDatabase(app.getDatabasePath(name),null)
        legacy.execSQL("CREATE TABLE Session (id TEXT NOT NULL PRIMARY KEY, planId TEXT NOT NULL, topicId TEXT NOT NULL, seconds INTEGER NOT NULL, questions INTEGER NOT NULL, correct INTEGER NOT NULL, endedAt INTEGER NOT NULL)")
        legacy.execSQL("CREATE TABLE Progress (planId TEXT NOT NULL, topicId TEXT NOT NULL, completed INTEGER NOT NULL, PRIMARY KEY(planId,topicId))")
        legacy.execSQL("CREATE TABLE PersonalLink (planId TEXT NOT NULL, topicId TEXT NOT NULL, url TEXT NOT NULL, PRIMARY KEY(planId,topicId))")
        legacy.execSQL("CREATE TABLE Settings (id INTEGER NOT NULL PRIMARY KEY, planId TEXT NOT NULL, topicId TEXT NOT NULL)")
        legacy.execSQL("CREATE TABLE Timer (id INTEGER NOT NULL PRIMARY KEY, sessionId TEXT NOT NULL, planId TEXT NOT NULL, topicId TEXT NOT NULL, seconds INTEGER NOT NULL, startedElapsed INTEGER, boot INTEGER NOT NULL)")
        legacy.execSQL("INSERT INTO Session VALUES ('old-session','p','t',60,10,8,1000)");legacy.execSQL("INSERT INTO PersonalLink VALUES ('p','t','https://example.com')")
        legacy.version=1;legacy.close()
        val db=Room.databaseBuilder(app,PilotDatabase::class.java,name).addMigrations(PilotDatabase.migration,PilotDatabase.migration2to3).build()
        try{assertEquals("old-session",db.dao().sessions().first().single().id);assertEquals("https://example.com",db.dao().links().first().single().url);assertTrue(db.dao().pendingNow().isEmpty())}
        finally{db.close();app.deleteDatabase(name)}
    }
}
