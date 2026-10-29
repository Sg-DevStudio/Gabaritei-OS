package br.com.gabaritei.piloto

import android.content.Context
import android.net.Uri
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.os.Build
import android.util.Base64
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.AccountCircle
import androidx.compose.material3.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import org.json.JSONObject

object ProfilePhoto {
    fun safe(value:String)=value.length<=50000&&Regex("data:image/jpeg;base64,/9j/[A-Za-z0-9+/]*={0,2}").matches(value)
    fun value(raw:String)=runCatching{JSONObject(raw).obj("config").optJSONObject("fotoPerfil")?.optString("imagem").orEmpty().takeIf{safe(it)}.orEmpty()}.getOrDefault("")
    fun encode(context:Context,uri:Uri):String {
        val decoded=if(Build.VERSION.SDK_INT>=28)ImageDecoder.decodeBitmap(ImageDecoder.createSource(context.contentResolver,uri)){decoder,info,_->
            require(info.size.width.toLong()*info.size.height<=100_000_000){"Escolha uma imagem menor."}
            decoder.allocator=ImageDecoder.ALLOCATOR_SOFTWARE
            val scale=minOf(256f/minOf(info.size.width,info.size.height).coerceAtLeast(1),1024f/maxOf(info.size.width,info.size.height).coerceAtLeast(1))
            decoder.setTargetSize((info.size.width*scale).toInt().coerceAtLeast(1),(info.size.height*scale).toInt().coerceAtLeast(1))
        }else {
            val bounds=BitmapFactory.Options().apply{inJustDecodeBounds=true};context.contentResolver.openInputStream(uri).use{BitmapFactory.decodeStream(it,null,bounds)}
            require(bounds.outWidth>0&&bounds.outHeight>0&&bounds.outWidth.toLong()*bounds.outHeight<=100_000_000){"Imagem inválida ou muito grande."}
            val options=BitmapFactory.Options().apply{inSampleSize=(maxOf(bounds.outWidth,bounds.outHeight)/1024).coerceAtLeast(1)}
            context.contentResolver.openInputStream(uri).use{BitmapFactory.decodeStream(it,null,options)}?:error("Não foi possível abrir a imagem.")
        }
        try {
            val side=minOf(decoded.width,decoded.height);val crop=Bitmap.createBitmap(decoded,(decoded.width-side)/2,(decoded.height-side)/2,side,side)
            val square=Bitmap.createScaledBitmap(crop,256,256,true)
            try {for(quality in listOf(85,65,45)){val bytes=java.io.ByteArrayOutputStream();square.compress(Bitmap.CompressFormat.JPEG,quality,bytes);val image="data:image/jpeg;base64,"+Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP);if(safe(image))return image};error("Escolha uma imagem mais simples.")}
            finally {if(square!==decoded&&square!==crop)square.recycle();if(crop!==decoded)crop.recycle()}
        }finally{decoded.recycle()}
    }
}
@Composable fun ProfileAvatar(image:String,modifier:Modifier=Modifier){
    val bitmap=remember(image){if(!ProfilePhoto.safe(image))null else runCatching{val bytes=Base64.decode(image.substringAfter(','),Base64.DEFAULT);BitmapFactory.decodeByteArray(bytes,0,bytes.size)?.asImageBitmap()}.getOrNull()}
    if(bitmap==null)Icon(Icons.Outlined.AccountCircle,null,modifier)else Image(bitmap,null,modifier.clip(CircleShape),contentScale=ContentScale.Crop)
}
