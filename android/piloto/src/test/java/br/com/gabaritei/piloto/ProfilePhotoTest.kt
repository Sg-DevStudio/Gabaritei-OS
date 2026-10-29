package br.com.gabaritei.piloto
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
class ProfilePhotoTest {
 private val photo="data:image/jpeg;base64,/9j/AA=="
 private fun op(image:String,before:String="")=PendingMutation("photo","profile-photo",JSONObject().put("image",image).put("before",before).toString(),"",1793280000000)
 @Test fun acceptsOnlySmallJpegData(){assertTrue(ProfilePhoto.safe(photo));assertFalse(ProfilePhoto.safe("https://example.com/me.jpg"));assertFalse(ProfilePhoto.safe("data:image/svg+xml;base64,PHN2Zz4="));assertFalse(ProfilePhoto.safe(photo+"A".repeat(50000)))}
 @Test fun photoIsIdempotentAndRemovalKeepsRevision(){val base=StateCompat.empty().put("future",true).toString();val first=StateCompat.apply(base,listOf(op(photo)));val again=StateCompat.apply(first,listOf(op(photo,photo)));assertEquals(1,JSONObject(again).obj("config").obj("fotoPerfil").getInt("rev"));val removed=StateCompat.apply(again,listOf(op("",photo)));assertEquals("",ProfilePhoto.value(removed));assertEquals(2,JSONObject(removed).obj("config").obj("fotoPerfil").getInt("rev"));assertTrue(JSONObject(removed).getBoolean("future"))}
 @Test fun concurrentPhotoChangeRequiresReview(){val first=StateCompat.apply(StateCompat.empty().toString(),listOf(op(photo)));assertThrows(SyncConflict::class.java){StateCompat.apply(first,listOf(op("data:image/jpeg;base64,/9j/BBBB")))}}
}
