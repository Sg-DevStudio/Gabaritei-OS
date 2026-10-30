package br.com.gabaritei.piloto

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Refresh
import java.time.LocalDate
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable internal fun MotivationCard(onOpen:(String)->Unit){
    val day=LocalDate.now()
    var offset by rememberSaveable(day.toString()){mutableStateOf(0)}
    val quote=InspirationQuotes.forDay(day,offset)
    Surface(shape=RoundedCornerShape(16.dp),color=MaterialTheme.colorScheme.primaryContainer){
        Row(Modifier.fillMaxWidth().padding(start=14.dp,end=4.dp,top=10.dp,bottom=10.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)){
            Text("“",fontSize=36.sp,lineHeight=40.sp,fontWeight=FontWeight.Bold,color=MaterialTheme.colorScheme.primary.copy(alpha=.45f))
            Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(2.dp)){
                Text(quote.text,style=MaterialTheme.typography.bodyMedium,fontStyle=FontStyle.Italic,color=MaterialTheme.colorScheme.onPrimaryContainer)
                TextButton(onClick={onOpen(quote.source)},contentPadding=PaddingValues(0.dp),modifier=Modifier.align(Alignment.End)){
                    Text(quote.author+if(quote.translated)" · Tradução livre"else"",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha=.8f))
                }
            }
            IconButton(onClick={offset=(offset+1)%InspirationQuotes.entries.size}){Icon(Icons.Outlined.Refresh,"Outra frase",Modifier.size(18.dp),tint=MaterialTheme.colorScheme.primary)}
        }
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
            items(achievements.sortedByDescending{it.earned},key={it.name}){a->Card(onClick={selected=a},modifier=Modifier.width(106.dp).heightIn(min=108.dp),shape=RoundedCornerShape(12.dp),colors=CardDefaults.cardColors(containerColor=if(a.earned)MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant)){
                Column(Modifier.fillMaxWidth().padding(8.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(4.dp)){
                    Text(a.icon,fontSize=28.sp,lineHeight=34.sp)
                    Text(a.name,fontSize=11.sp,lineHeight=15.sp,fontWeight=FontWeight.SemiBold,textAlign=androidx.compose.ui.text.style.TextAlign.Center)
                    Text(if(a.earned)"Conquistado"else"Em progresso",fontSize=9.sp,lineHeight=13.sp,color=MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }}
        }
    }
    selected?.let{a->AlertDialog(onDismissRequest={selected=null},title={Text("${a.icon}  ${a.name}")},text={Column(verticalArrangement=Arrangement.spacedBy(8.dp)){Text(a.description);Text(if(a.earned)"Conquista desbloqueada"else"Continue estudando para conquistar",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}},confirmButton={TextButton(onClick={selected=null}){Text("Fechar")}},dismissButton={TextButton(onClick={selected=null;onAll()}){Text("Ver coleção")}})}
}
