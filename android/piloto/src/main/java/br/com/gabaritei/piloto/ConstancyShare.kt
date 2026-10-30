package br.com.gabaritei.piloto

import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.text.StaticLayout
import android.text.TextPaint
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.content.res.ResourcesCompat
import java.io.File
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

object ConstancyShare {
    fun render(context:Context,plan:String,from:LocalDate,until:LocalDate,stats:StatsConstancy,achievements:List<Achievement> = emptyList()):Bitmap{
        val regular=ResourcesCompat.getFont(context,R.font.inter_regular)
        val bold=ResourcesCompat.getFont(context,R.font.inter_bold)
        val text=TextPaint(Paint.ANTI_ALIAS_FLAG).apply{color=Color.rgb(23,36,59);textSize=34f;typeface=bold}
        val title=plan.replace(Regex(""" \(.*?\)"""),"").let{if(it.length>300)it.take(299)+"…"else it}
        val layoutPaint=TextPaint(text)
        val layout=StaticLayout.Builder.obtain(title,0,title.length,layoutPaint,884).setIncludePad(false).setMaxLines(3).setEllipsize(android.text.TextUtils.TruncateAt.END).setLineSpacing(4f,1f).build()
        val earned=achievements.filter{it.earned}.take(10)
        val height=920+layout.height+if(earned.isEmpty())0 else 110+((earned.size+4)/5)*136
        val bitmap=Bitmap.createBitmap(1080,height,Bitmap.Config.ARGB_8888);val c=Canvas(bitmap)
        val p=Paint(Paint.ANTI_ALIAS_FLAG)
        c.drawColor(Color.rgb(240,244,250));p.color=Color.WHITE;c.drawRoundRect(36f,36f,1044f,height-36f,36f,36f,p)
        ContextCompat.getDrawable(context,R.drawable.pilot_icon)?.let{it.setBounds(84,76,138,130);it.draw(c)}
        text.textSize=30f;text.typeface=bold;text.color=Color.rgb(40,84,216);c.drawText("Gabaritei OS",158f,115f,text)
        text.textSize=48f;text.color=Color.rgb(23,36,59);c.drawText("Minha constância",84f,203f,text)
        c.save();c.translate(84f,235f);layout.draw(c);c.restore()
        val y=285f+layout.height
        text.typeface=regular;text.textSize=26f;text.color=Color.rgb(98,116,141)
        c.drawText("${from.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))} a ${until.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))}",84f,y,text)
        c.drawText("Últimos 7 dias do intervalo",84f,y+52f,text)
        val names=listOf("Seg","Ter","Qua","Qui","Sex","Sáb","Dom")
        (6 downTo 0).forEachIndexed{i,n->val day=until.minusDays(n.toLong());val x=135f+i*135f
            text.textAlign=Paint.Align.CENTER;c.drawText(names[day.dayOfWeek.value-1],x,y+112f,text)
            p.color=if(day in stats.active)Color.rgb(8,125,98)else Color.rgb(233,239,248);c.drawCircle(x,y+179f,43f,p)
            p.color=if(day in stats.active)Color.WHITE else Color.rgb(147,164,188);c.drawCircle(x,y+179f,if(day in stats.active)12f else 5f,p)
            text.textSize=24f;c.drawText(day.dayOfMonth.toString(),x,y+253f,text);text.textSize=26f
        }
        text.textAlign=Paint.Align.LEFT;p.color=Color.rgb(220,228,240);c.drawRect(84f,y+292f,996f,y+294f,p)
        text.typeface=bold;text.textSize=46f;text.color=Color.rgb(23,36,59);c.drawText("${stats.current} ${if(stats.current==1)"dia seguido"else"dias seguidos"}",84f,y+366f,text)
        text.typeface=regular;text.textSize=28f;text.color=Color.rgb(98,116,141);c.drawText("Maior sequência: ${stats.longest} ${if(stats.longest==1)"dia"else"dias"}",84f,y+414f,text)
        c.drawText("${stats.active.size} de ${stats.totalDays} dias com estudo · ${StatisticsModel.percent(stats.percentage)}",84f,y+468f,text)
        if(earned.isNotEmpty()){
            text.typeface=bold;text.textSize=30f;text.color=Color.rgb(40,84,216);val top=y+526f;c.drawText("Minhas conquistas · ${earned.size}",84f,top,text)
            earned.forEachIndexed{i,a->val x=84f+(i%5)*182;val cy=top+80f+(i/5)*136
                p.color=Color.rgb(231,238,255);c.drawCircle(x+86f,cy,35f,p)
                val emoji=TextPaint(Paint.ANTI_ALIAS_FLAG).apply{typeface=android.graphics.Typeface.DEFAULT;textSize=43f;textAlign=Paint.Align.CENTER};c.drawText(a.icon,x+86f,cy+15f,emoji)
                val label=TextPaint(Paint.ANTI_ALIAS_FLAG).apply{typeface=bold;textSize=22f;color=Color.rgb(23,36,59)}
                val l=StaticLayout.Builder.obtain(a.name,0,a.name.length,label,172).setAlignment(android.text.Layout.Alignment.ALIGN_CENTER).setMaxLines(2).setIncludePad(false).build()
                c.save();c.translate(x,cy+44f);l.draw(c);c.restore()
            }
        }
        text.textSize=23f;c.drawText("Um tópico por vez. Cada sessão conta.",84f,height-90f,text)
        return bitmap
    }
    fun intent(context:Context,bitmap:Bitmap):Intent{
        val folder=File(context.cacheDir,"shared-constancy");check(folder.exists()||folder.mkdirs())
        val file=File(folder,"constancia-${UUID.randomUUID()}.png")
        file.outputStream().use{check(bitmap.compress(Bitmap.CompressFormat.PNG,100,it))}
        val uri=FileProvider.getUriForFile(context,context.packageName+".sharing",file)
        return Intent(Intent.ACTION_SEND).setType("image/png").putExtra(Intent.EXTRA_STREAM,uri).putExtra(Intent.EXTRA_TEXT,"Minha constância nos estudos · Gabaritei OS").apply{clipData=ClipData.newUri(context.contentResolver,"Constância",uri);addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)}
    }
}
