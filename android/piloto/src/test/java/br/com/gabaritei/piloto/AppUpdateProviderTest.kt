package br.com.gabaritei.piloto

import android.content.ComponentName
import android.content.pm.PackageManager
import androidx.core.content.FileProvider
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import java.io.File
import org.xmlpull.v1.XmlPullParser

@RunWith(RobolectricTestRunner::class)
@Config(sdk=[28])
class AppUpdateProviderTest {
    @Test fun updateSharingIsLimitedToItsOwnCacheFolder(){
        val app=RuntimeEnvironment.getApplication()
        val folder=File(app.cacheDir,"app-updates").apply{mkdirs()};val apk=File(folder,"Gabaritei-test.apk").apply{writeText("synthetic")}
        val outside=File(app.cacheDir,"private-state-test.json").apply{writeText("synthetic")}
        try{
            val provider=app.packageManager.getProviderInfo(ComponentName(app,FileProvider::class.java),PackageManager.GET_META_DATA)
            assertFalse(provider.exported);assertTrue(provider.grantUriPermissions)
            val parser=provider.loadXmlMetaData(app.packageManager,"android.support.FILE_PROVIDER_PATHS")!!
            val roots=mutableMapOf<String,Pair<String,String>>()
            parser.use{while(it.next()!=XmlPullParser.END_DOCUMENT){if(it.eventType==XmlPullParser.START_TAG&&it.name!="paths")roots[it.getAttributeValue(null,"name")]=it.name to it.getAttributeValue(null,"path")}}
            assertEquals(mapOf("constancy" to ("cache-path" to "shared-constancy/"),"updates" to ("cache-path" to "app-updates/")),roots)
            // FileProvider's Android path separator is '/', unlike Windows Robolectric.
            if(File.separatorChar=='/'){
                val uri=FileProvider.getUriForFile(app,app.packageName+".sharing",apk)
                assertEquals("content",uri.scheme);assertTrue(uri.path.orEmpty().startsWith("/updates/"))
                assertThrows(IllegalArgumentException::class.java){FileProvider.getUriForFile(app,app.packageName+".sharing",outside)}
            }
        }finally{apk.delete();outside.delete()}
    }
}
