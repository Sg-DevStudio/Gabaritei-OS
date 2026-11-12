package br.com.gabaritei.piloto

import org.junit.Assert.*
import org.junit.Test
import org.json.JSONObject
import kotlinx.coroutines.runBlocking
import java.io.ByteArrayInputStream
import java.io.File

class AppUpdatesTest {
    private fun release()=AndroidRelease(28,"0.22.0","https://github.com/Sg-DevStudio/Gabaritei-OS/releases/download/android-native-v0.22.0/Gabaritei.apk","a".repeat(64),1024,26)
    @Test fun metadataIsBoundToOurPackageAndReleaseAsset(){
        val r=release();assertEquals(r,UpdatePolicy.parse(r.json()));assertTrue(UpdatePolicy.newer(r,27,26));assertFalse(UpdatePolicy.newer(r,28,26));assertFalse(UpdatePolicy.newer(r,27,25))
        listOf(JSONObject(r.json()).put("packageName","outro.app"),JSONObject(r.json()).put("apkUrl","https://evil.example/Gabaritei.apk"),JSONObject(r.json()).put("apkUrl",r.url+"?redirect=evil"),JSONObject(r.json()).put("sha256","bad"),JSONObject(r.json()).put("versionCode",28.5),JSONObject(r.json()).put("sizeBytes",UpdatePolicy.MAX_APK+1)).forEach{assertThrows(Exception::class.java){UpdatePolicy.parse(it.toString())}}
    }
    @Test fun redirectsCannotDowngradeHttpsOrSendTheUserElsewhere(){
        assertTrue(UpdatePolicy.safeRedirect("https://release-assets.githubusercontent.com/release?token=public"))
        listOf("http://github.com/release","https://github.com.evil.example/release","https://user:pass@github.com/release","https://github.com:8080/release","file:///tmp/app.apk").forEach{assertFalse(UpdatePolicy.safeRedirect(it))}
    }
    @Test fun replacementMustHaveTheSamePackageVersionAndSigner(){
        val r=release();UpdatePolicy.verifyIdentity(r,UpdatePolicy.PACKAGE,28,setOf("ours"),setOf("ours"))
        assertThrows(Exception::class.java){UpdatePolicy.verifyIdentity(r,"outro.app",28,setOf("ours"),setOf("ours"))}
        assertThrows(Exception::class.java){UpdatePolicy.verifyIdentity(r,UpdatePolicy.PACKAGE,27,setOf("ours"),setOf("ours"))}
        assertThrows(Exception::class.java){UpdatePolicy.verifyIdentity(r,UpdatePolicy.PACKAGE,28,setOf("other"),setOf("ours"))}
        assertThrows(Exception::class.java){UpdatePolicy.verifyIdentity(r,UpdatePolicy.PACKAGE,28,emptySet(),emptySet())}
    }
    @Test fun downloadRejectsTruncationOversizeAndWrongHash()=runBlocking{
        val file=File.createTempFile("gabaritei-update-",".part")
        try{
            UpdatePolicy.copy(ByteArrayInputStream("abc".toByteArray()),file,3){}
            assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",UpdatePolicy.hash(file));val r=release().copy(bytes=3,sha256=UpdatePolicy.hash(file));UpdatePolicy.verifyFile(r,file)
            assertThrows(Exception::class.java){UpdatePolicy.verifyFile(r.copy(sha256="f".repeat(64)),file)}
            try{UpdatePolicy.copy(ByteArrayInputStream("abcd".toByteArray()),file,3){};fail("Oversize accepted")}catch(_:IllegalArgumentException){}
            try{UpdatePolicy.copy(ByteArrayInputStream("ab".toByteArray()),file,3){};fail("Truncated download accepted")}catch(_:IllegalArgumentException){}
        }finally{file.delete()}
    }
}
