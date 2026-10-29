package br.com.gabaritei.piloto

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow
import org.json.JSONObject

data class Topic(val id: String, val name: String, val link: String?, val note: String, val noQuestions: Boolean = false)
data class Discipline(val id: String, val name: String, val topics: List<Topic>)
data class Plan(val id: String, val name: String, val disciplines: List<Discipline>) {
    val topics get() = disciplines.flatMap { it.topics }
    fun discipline(topic: Topic) = disciplines.first { d -> d.topics.any { it.id == topic.id } }
}
object Catalog {
    fun load(context: Context): List<Plan> {
        val array = JSONObject(context.assets.open("catalog.json").bufferedReader().use { it.readText() }).getJSONArray("plans")
        return (0 until array.length()).map { i ->
            val p = array.getJSONObject(i); val ds = p.getJSONArray("disciplines")
            Plan(p.getString("id"), p.getString("name"), (0 until ds.length()).map { j ->
                val d = ds.getJSONObject(j); val ts = d.getJSONArray("topics")
                Discipline(d.getString("id"), d.getString("name"), (0 until ts.length()).map { k ->
                    val t = ts.getJSONObject(k)
                    Topic(t.getString("id"), t.getString("name"), t.optString("link").takeIf { it.isNotBlank() }, t.optString("note"), t.optBoolean("noQuestions"))
                })
            })
        }
    }
}
@Entity data class Session(@PrimaryKey val id: String, val planId: String, val topicId: String, val seconds: Long, val questions: Int, val correct: Int, val endedAt: Long)
@Entity(primaryKeys = ["planId", "topicId"]) data class Progress(val planId: String, val topicId: String, val completed: Boolean)
@Entity(primaryKeys = ["planId", "topicId"]) data class PersonalLink(val planId: String, val topicId: String, val url: String)
@Entity data class Settings(@PrimaryKey val id: Int = 1, val planId: String, val topicId: String)
@Entity data class Timer(@PrimaryKey val id: Int = 1, val sessionId: String, val planId: String, val topicId: String, val seconds: Long, val startedElapsed: Long?, val boot: Int)
@Dao abstract class PilotDao {
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
    @Transaction open suspend fun record(value: Session, completed: Boolean, fromTimer: Boolean) {
        if (insert(value) != -1L && completed) progress(Progress(value.planId, value.topicId, true))
        if (fromTimer) clearTimer(value.id)
    }
}
@Database(entities = [Session::class, Progress::class, PersonalLink::class, Settings::class, Timer::class], version = 1, exportSchema = true)
abstract class PilotDatabase : RoomDatabase() {
    abstract fun dao(): PilotDao
    companion object {
        @Volatile private var instance: PilotDatabase? = null
        fun get(context: Context) = instance ?: synchronized(this) {
            instance ?: Room.databaseBuilder(context.applicationContext, PilotDatabase::class.java, "pilot.db").build().also { instance = it }
        }
    }
}
