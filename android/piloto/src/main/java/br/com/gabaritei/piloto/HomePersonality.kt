package br.com.gabaritei.piloto

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import java.time.LocalDate
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable internal fun MotivationCard(onOpen:(String)->Unit){
    val day by produceState(LocalDate.now()){while(true){value=LocalDate.now();kotlinx.coroutines.delay(60_000)}}
    val quote=InspirationQuotes.forDay(day)
    Column(Modifier.fillMaxWidth().clickable(onClickLabel="Consultar fonte da frase"){onOpen(quote.source)}.padding(horizontal=4.dp,vertical=6.dp),verticalArrangement=Arrangement.spacedBy(4.dp)){
        Text(quote.text,style=MaterialTheme.typography.bodyMedium,fontStyle=FontStyle.Italic,fontWeight=FontWeight.Medium,color=MaterialTheme.colorScheme.primary)
        Text(quote.author,Modifier.align(Alignment.End),style=MaterialTheme.typography.labelSmall,fontWeight=FontWeight.Normal,color=MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
@Composable internal fun AchievementCarousel(achievements:List<Achievement>,onAll:()->Unit){
    var selected by remember{mutableStateOf<Achievement?>(null)}
    Card(Modifier.fillMaxWidth(),shape=RoundedCornerShape(16.dp),border=BorderStroke(1.dp,MaterialTheme.colorScheme.outlineVariant),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface)){
        Row(Modifier.fillMaxWidth().padding(horizontal=14.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(7.dp)){
            Text("🏆",fontSize=20.sp);Text("Conquistas",Modifier.weight(1f),style=MaterialTheme.typography.titleSmall,fontWeight=FontWeight.SemiBold)
            Text("${achievements.count{it.earned}}/${achievements.size}",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant);TextButton(onClick=onAll){Text("Ver todas",fontSize=11.sp)}
        }
        LazyRow(contentPadding=PaddingValues(start=14.dp,end=14.dp,bottom=12.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)){
            items(achievements.sortedByDescending{it.earned},key={it.name}){a->Card(onClick={selected=a},modifier=Modifier.width(106.dp).heightIn(min=108.dp),shape=RoundedCornerShape(12.dp),colors=CardDefaults.cardColors(containerColor=androidx.compose.ui.graphics.Color.Transparent)){
                Column(Modifier.fillMaxWidth().padding(8.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(4.dp)){
                    AchievementIcon(a,28)
                    Text(a.name,fontSize=11.sp,lineHeight=15.sp,fontWeight=FontWeight.SemiBold,textAlign=androidx.compose.ui.text.style.TextAlign.Center)
                    Text(if(a.earned)"Conquistado"else"Em progresso",fontSize=9.sp,lineHeight=13.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }}
        }
    }
    selected?.let{a->AlertDialog(onDismissRequest={selected=null},title={Text("${a.icon}  ${a.name}")},text={Column(verticalArrangement=Arrangement.spacedBy(8.dp)){Text(a.description);Text(if(a.earned)"Conquista desbloqueada"else"Continue estudando para conquistar",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}},confirmButton={TextButton(onClick={selected=null}){Text("Fechar")}},dismissButton={TextButton(onClick={selected=null;onAll()}){Text("Ver coleção")}})}
}

@Composable internal fun AchievementIcon(a:Achievement,size:Int){
    androidx.compose.foundation.Canvas(Modifier.size((size+8).dp)){
        drawContext.canvas.nativeCanvas.apply {
            val paint=android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
                textSize=size.sp.toPx()
                if(!a.earned){colorFilter=android.graphics.ColorMatrixColorFilter(android.graphics.ColorMatrix().apply{setSaturation(0f)});alpha=100}
            }
            drawText(a.icon,0f,size.sp.toPx(),paint)
        }
    }
}
