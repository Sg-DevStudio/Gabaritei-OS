package br.com.gabaritei.piloto

import android.content.Intent
import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDate

@Composable internal fun ConstancyShareDialog(plan:String,from:LocalDate,until:LocalDate,stats:StatsConstancy,achievements:List<Achievement>,onClose:()->Unit){
    val context=LocalContext.current
    val result by produceState<Result<Bitmap>?>(null,plan,from,until,stats,achievements){value=withContext(Dispatchers.Default){runCatching{ConstancyShare.render(context,plan,from,until,stats,achievements)}}}
    var error by remember{mutableStateOf<String?>(null)}
    val bitmap=result?.getOrNull()
    AlertDialog(containerColor=MaterialTheme.colorScheme.surface,onDismissRequest=onClose,title={Text("Sua constância")},text={Column(verticalArrangement=Arrangement.spacedBy(8.dp)){
        when{bitmap!=null->Image(bitmap.asImageBitmap(),"Prévia da imagem de constância",Modifier.fillMaxWidth().aspectRatio(bitmap.width.toFloat()/bitmap.height));result==null->CircularProgressIndicator();else->Text("Não foi possível preparar a imagem.",color=MaterialTheme.colorScheme.error)}
        error?.let{Text(it,color=MaterialTheme.colorScheme.error,style=MaterialTheme.typography.bodySmall)}
    }},confirmButton={TextButton(enabled=bitmap!=null,onClick={try{context.startActivity(Intent.createChooser(ConstancyShare.intent(context,bitmap!!),"Compartilhar constância"));onClose()}catch(_:Exception){error="Não foi possível abrir o compartilhamento."}}){Text("Compartilhar")}},dismissButton={TextButton(onClick=onClose){Text("Cancelar")}})
}
