package br.com.gabaritei.piloto

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow
import org.json.JSONObject

data class Topic(val id: String, val name: String, val link: String?, val note: String, val noQuestions: Boolean = false)
data class Discipline(val id: String, val name: String, val topics: List<Topic>, val color:String="#3B82F6", val paused:Boolean=false, val archived:Boolean=false)
data class Plan(val id: String, val name: String, val disciplines: List<Discipline>, val originId: String = id, val enrolled: Boolean = false, val owner: String = "", val logoAsset:String = "", val details:String = "{}") {
    val topics get() = disciplines.flatMap { it.topics }
    fun discipline(topic: Topic) = disciplines.first { d -> d.topics.any { it.id == topic.id } }
}
@Entity data class Session(@PrimaryKey val id: String, val planId: String, val topicId: String, val seconds: Long, val questions: Int, val correct: Int, val endedAt: Long)
@Entity(primaryKeys = ["planId", "topicId"]) data class Progress(val planId: String, val topicId: String, val completed: Boolean)
@Entity(primaryKeys = ["planId", "topicId"]) data class PersonalLink(val planId: String, val topicId: String, val url: String)
@Entity data class Settings(@PrimaryKey val id: Int = 1, val planId: String, val topicId: String)
@Entity data class Timer(@PrimaryKey val id: Int = 1, val sessionId: String, val planId: String, val topicId: String, val seconds: Long, val startedElapsed: Long?, val boot: Int, @ColumnInfo(defaultValue="0") val goalSeconds:Long=0)
@Entity data class RemoteSnapshot(@PrimaryKey val id: Int = 1, val json: String, val syncedAt: Long)
@Entity data class PendingMutation(@PrimaryKey val id: String, val kind: String, val payload: String, val generation: String, val createdAt: Long)
@Entity data class RecoveryCopy(@PrimaryKey val id: String, val json: String, val createdAt: Long)
@Dao abstract class PilotDao {
    @Insert abstract suspend fun recovery(value: RecoveryCopy)
    @Query("SELECT * FROM RecoveryCopy ORDER BY createdAt DESC") abstract suspend fun recoveryCopies(): List<RecoveryCopy>
    @Query("SELECT * FROM RemoteSnapshot WHERE id=1") abstract fun snapshot(): Flow<RemoteSnapshot?>
    @Query("SELECT * FROM PendingMutation ORDER BY createdAt,id") abstract fun pending(): Flow<List<PendingMutation>>
    @Query("SELECT * FROM RemoteSnapshot WHERE id=1") abstract suspend fun currentSnapshot(): RemoteSnapshot?
    @Query("SELECT * FROM PendingMutation ORDER BY createdAt,id") abstract suspend fun pendingNow(): List<PendingMutation>
    @Insert(onConflict = OnConflictStrategy.REPLACE) abstract suspend fun snapshot(value: RemoteSnapshot)
    @Insert(onConflict = OnConflictStrategy.IGNORE) abstract suspend fun enqueue(value: PendingMutation)
    @Query("DELETE FROM PendingMutation WHERE id IN (:ids)") abstract suspend fun acknowledge(ids: List<String>)
    @Query("SELECT * FROM Session ORDER BY endedAt DESC") abstract fun sessions(): Flow<List<Session>>
    @Query("SELECT * FROM Progress") abstract fun progress(): Flow<List<Progress>>
    @Query("SELECT * FROM PersonalLink") abstract fun links(): Flow<List<PersonalLink>>
    @Query("SELECT * FROM Settings WHERE id=1") abstract fun settings(): Flow<Settings?>
    @Query("SELECT * FROM Timer WHERE id=1") abstract fun timer(): Flow<Timer?>
    @Query("SELECT * FROM Timer WHERE id=1") abstract suspend fun currentTimer(): Timer?
    @Insert(onConflict = OnConflictStrategy.REPLACE) abstract suspend fun settings(value: Settings)
    @Insert(onConflict = OnConflictStrategy.REPLACE) abstract suspend fun timer(value: Timer)
    @Insert(onConflict = OnConflictStrategy.REPLACE) abstract suspend fun progress(value: Progress)
    @Insert(onConflict = OnConflictStrategy.REPLACE) abstract suspend fun link(value: PersonalLink)
    @Query("DELETE FROM PersonalLink WHERE planId=:plan AND topicId=:topic") abstract suspend fun resetLink(plan: String, topic: String)
    @Query("DELETE FROM Timer WHERE id=1 AND sessionId=:sessionId") abstract suspend fun clearTimer(sessionId: String)
    @Insert(onConflict = OnConflictStrategy.IGNORE) abstract suspend fun insert(value: Session): Long
    @Transaction open suspend fun startTimer(value: Timer): Boolean {
        if (currentTimer() != null) return false
        timer(value)
        return true
    }
    @Transaction open suspend fun record(value: Session, completed: Boolean, fromTimer: Boolean, metadata: String? = null) {
        if (insert(value) != -1L && completed) progress(Progress(value.planId, value.topicId, true))
        val current=currentSnapshot()
        if(current!=null&&JSONObject(current.json).array("planos").objects().any{it.optString("id")==value.planId}){
            val row=(metadata?.let{JSONObject(it)}?:JSONObject()).put("id",value.id).put("planoId",value.planId).put("topicoId",value.topicId).put("data",java.time.Instant.ofEpochMilli(value.endedAt).atZone(java.time.ZoneId.systemDefault()).toLocalDate().toString()).put("tipo",metadata?.let{JSONObject(it).optString("tipo")}?.takeIf{it.isNotBlank()}?:if(value.questions>0)"questoes" else "teoria").put("duracaoMin",value.seconds/60.0).put("qFeitas",value.questions).put("qCertas",value.correct)
            val op=PendingMutation(value.id,"session",JSONObject().put("planId",value.planId).put("topicId",value.topicId).put("session",row).put("completed",completed).toString(),"",value.endedAt)
            snapshot(current.copy(json=StateCompat.apply(current.json,listOf(op),true)))
        }
        if (fromTimer) clearTimer(value.id)
    }
    @Transaction open suspend fun recordFree(value:Session,row:String){
        insert(value)
        val op=PendingMutation(value.id,"free-session",JSONObject().put("session",JSONObject(row)).toString(),"",value.endedAt)
        localPlan(op)
    }
    @Transaction open suspend fun localPlan(op:PendingMutation){val current=currentSnapshot();snapshot(RemoteSnapshot(json=StateCompat.apply(current?.json?:StateCompat.empty().toString(),listOf(op),true),syncedAt=0))}
    @Transaction open suspend fun mutate(value: PendingMutation, clearTimerId: String? = null) {
        val current=currentSnapshot()?.json ?: StateCompat.empty().toString()
        val next=StateCompat.apply(current,listOf(value),true)
        enqueue(value)
        snapshot(RemoteSnapshot(json=next,syncedAt=currentSnapshot()?.syncedAt?:0))
        if(clearTimerId!=null)clearTimer(clearTimerId)
    }
    @Transaction open suspend fun acceptRemote(json: String, acknowledged: List<String>) {
        acknowledge(acknowledged)
        // Alterações novas feitas enquanto a rede estava ocupada continuam na fila.
        val next=StateCompat.apply(json,pendingNow(),true)
        snapshot(RemoteSnapshot(json=next,syncedAt=System.currentTimeMillis()))
    }
    @Transaction open suspend fun archivePending() {
        val pending=pendingNow()
        val backup=JSONObject().put("state",JSONObject(currentSnapshot()?.json?:StateCompat.empty().toString())).put("pending",org.json.JSONArray(pending.map{JSONObject().put("id",it.id).put("kind",it.kind).put("payload",JSONObject(it.payload)).put("generation",it.generation).put("createdAt",it.createdAt)}))
        recovery(RecoveryCopy(java.util.UUID.randomUUID().toString(),backup.toString(),System.currentTimeMillis()))
        acknowledge(pending.map{it.id})
    }
}
@Database(entities = [Session::class, Progress::class, PersonalLink::class, Settings::class, Timer::class, RemoteSnapshot::class, PendingMutation::class, RecoveryCopy::class], version = 3, exportSchema = true)
abstract class PilotDatabase : RoomDatabase() {
    abstract fun dao(): PilotDao
    companion object {
        private val instances=mutableMapOf<String,PilotDatabase>()
        val migration=object:androidx.room.migration.Migration(1,2){override fun migrate(db:androidx.sqlite.db.SupportSQLiteDatabase){
            db.execSQL("CREATE TABLE IF NOT EXISTS `RemoteSnapshot` (`id` INTEGER NOT NULL, `json` TEXT NOT NULL, `syncedAt` INTEGER NOT NULL, PRIMARY KEY(`id`))")
            db.execSQL("CREATE TABLE IF NOT EXISTS `PendingMutation` (`id` TEXT NOT NULL, `kind` TEXT NOT NULL, `payload` TEXT NOT NULL, `generation` TEXT NOT NULL, `createdAt` INTEGER NOT NULL, PRIMARY KEY(`id`))")
            db.execSQL("CREATE TABLE IF NOT EXISTS `RecoveryCopy` (`id` TEXT NOT NULL, `json` TEXT NOT NULL, `createdAt` INTEGER NOT NULL, PRIMARY KEY(`id`))")
        }}
        val migration2to3=object:androidx.room.migration.Migration(2,3){override fun migrate(db:androidx.sqlite.db.SupportSQLiteDatabase){db.execSQL("ALTER TABLE Timer ADD COLUMN goalSeconds INTEGER NOT NULL DEFAULT 0")}}
        fun get(context: Context, uid: String? = null):PilotDatabase = synchronized(instances) {
            val name=if(uid==null)"pilot.db" else "account-"+java.security.MessageDigest.getInstance("SHA-256").digest(uid.toByteArray()).joinToString(""){"%02x".format(it)}.take(32)+".db"
            instances.getOrPut(name){Room.databaseBuilder(context.applicationContext,PilotDatabase::class.java,name).addMigrations(migration,migration2to3).build()}
        }
    }
}
