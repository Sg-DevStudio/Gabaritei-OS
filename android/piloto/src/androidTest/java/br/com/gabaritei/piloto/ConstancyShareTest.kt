package br.com.gabaritei.piloto

import android.content.Intent
import android.net.Uri
import android.graphics.BitmapFactory
import androidx.core.content.FileProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.time.LocalDate

@RunWith(AndroidJUnit4::class)
class ConstancyShareTest {
    @Test fun imageIsPrivateAndOnlyGrantedThroughShareIntent(){
        val context=InstrumentationRegistry.getInstrumentation().targetContext
        check(context.packageName.endsWith(".qa"))
        val date=LocalDate.now();val stats=StatisticsModel.constancy(listOf(StudyActivity("x",date,30.0,10,8,"d")),date.minusDays(6),date,date)
        val bitmap=ConstancyShare.render(context,"Concurso com nome bastante longo para conferir a quebra do título",date.minusDays(6),date,stats)
        try{
            assertEquals(1080,bitmap.width);assertTrue(bitmap.height>900)
            val intent=ConstancyShare.intent(context,bitmap);val uri=intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)!!
            assertEquals(Intent.ACTION_SEND,intent.action);assertEquals("image/png",intent.type);assertEquals("content",uri.scheme)
            assertTrue(intent.flags and Intent.FLAG_GRANT_READ_URI_PERMISSION!=0);assertEquals(uri,intent.clipData!!.getItemAt(0).uri)
            val provider=context.packageManager.resolveContentProvider(uri.authority!!,0)!!;assertFalse(provider.exported);assertTrue(provider.grantUriPermissions)
            context.contentResolver.openInputStream(uri).use{val decoded=BitmapFactory.decodeStream(it);assertEquals(1080,decoded.width);decoded.recycle()}
        }finally{bitmap.recycle()}
    }
    @Test fun onlyEarnedTrophiesAreIncludedAndLongNamesRemainBounded(){
        val c=InstrumentationRegistry.getInstrumentation().targetContext;check(c.packageName.endsWith(".qa"))
        val day=LocalDate.now();val stats=StatsConstancy(setOf(day,day.minusDays(1)),30,2,5)
        val title="Plano de estudos ".repeat(50)
        val base=ConstancyShare.render(c,title,day.minusDays(29),day,stats)
        val locked=ConstancyShare.render(c,title,day.minusDays(29),day,stats,listOf(Achievement("Não conquistado","", "🏆",false)))
        val earned=ConstancyShare.render(c,title,day.minusDays(29),day,stats,listOf(Achievement("Plano traçado","", "🚀",true),Achievement("Centena","", "💯",true),Achievement("Não conquistado","", "🏆",false)))
        try{assertEquals(base.height,locked.height);assertTrue(earned.height>base.height);assertTrue(earned.height<1600)
            java.io.File(c.filesDir,"constancy-with-trophies.png").outputStream().use{earned.compress(android.graphics.Bitmap.CompressFormat.PNG,100,it)}
        }finally{base.recycle();locked.recycle();earned.recycle()}
    }
    @Test fun providerCannotShareDatabasesOrProfileFiles(){val c=InstrumentationRegistry.getInstrumentation().targetContext;check(c.packageName.endsWith(".qa"));assertThrows(IllegalArgumentException::class.java){FileProvider.getUriForFile(c,c.packageName+".sharing",c.getDatabasePath("pilot.db"))}}
}
