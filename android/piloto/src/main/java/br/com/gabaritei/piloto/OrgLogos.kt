package br.com.gabaritei.piloto
import android.content.Context
import android.graphics.BitmapFactory
object OrgLogos {
    fun load(c:Context,asset:String,photo:String):android.graphics.Bitmap?=runCatching{
        val bytes=when{
            asset.isNotBlank()->c.assets.open(asset).use{it.readBytes()}
            photo.startsWith("data:image/")&&photo.length<1400000->android.util.Base64.decode(photo.substringAfter(','),android.util.Base64.DEFAULT)
            else->{val url=if(photo.startsWith("assets/"))"https://sg-devstudio.github.io/Gabaritei-OS/$photo"else photo;val uri=java.net.URI(url);require(uri.scheme=="https"&&uri.host!=null&&uri.userInfo==null)
                val key=java.security.MessageDigest.getInstance("SHA-256").digest(url.toByteArray()).joinToString(""){"%02x".format(it)};val file=java.io.File(c.cacheDir,"org-logo-$key")
                if(file.isFile)file.readBytes()else{val conn=java.net.URL(url).openConnection().apply{connectTimeout=4000;readTimeout=4000};require(conn.contentLength<=1000000);val out=java.io.ByteArrayOutputStream();conn.getInputStream().use{input->val block=ByteArray(8192);while(true){val n=input.read(block);if(n<0)break;require(out.size()+n<=1000000);out.write(block,0,n)}};out.toByteArray().also{file.writeBytes(it)}}
            }
        }
        val bounds=BitmapFactory.Options().apply{inJustDecodeBounds=true};BitmapFactory.decodeByteArray(bytes,0,bytes.size,bounds);require(bounds.outWidth>0&&bounds.outHeight>0);val options=BitmapFactory.Options().apply{inSampleSize=(maxOf(bounds.outWidth,bounds.outHeight)/256).coerceAtLeast(1)};BitmapFactory.decodeByteArray(bytes,0,bytes.size,options)
    }.getOrNull()
}
