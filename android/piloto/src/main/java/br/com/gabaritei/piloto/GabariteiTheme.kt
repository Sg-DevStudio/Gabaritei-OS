package br.com.gabaritei.piloto

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight

private val Inter=FontFamily(Font(R.font.inter_regular,FontWeight.Normal),Font(R.font.inter_semibold,FontWeight.SemiBold),Font(R.font.inter_bold,FontWeight.Bold))
private val BaseTypography=Typography()
private val GabariteiTypography=Typography(
    displayLarge=BaseTypography.displayLarge.copy(fontFamily=Inter),displayMedium=BaseTypography.displayMedium.copy(fontFamily=Inter),displaySmall=BaseTypography.displaySmall.copy(fontFamily=Inter),
    headlineLarge=BaseTypography.headlineLarge.copy(fontFamily=Inter),headlineMedium=BaseTypography.headlineMedium.copy(fontFamily=Inter),headlineSmall=BaseTypography.headlineSmall.copy(fontFamily=Inter),
    titleLarge=BaseTypography.titleLarge.copy(fontFamily=Inter),titleMedium=BaseTypography.titleMedium.copy(fontFamily=Inter),titleSmall=BaseTypography.titleSmall.copy(fontFamily=Inter),
    bodyLarge=BaseTypography.bodyLarge.copy(fontFamily=Inter),bodyMedium=BaseTypography.bodyMedium.copy(fontFamily=Inter),bodySmall=BaseTypography.bodySmall.copy(fontFamily=Inter),
    labelLarge=BaseTypography.labelLarge.copy(fontFamily=Inter),labelMedium=BaseTypography.labelMedium.copy(fontFamily=Inter),labelSmall=BaseTypography.labelSmall.copy(fontFamily=Inter)
)
@Composable fun GabariteiTheme(mode:String="system",content: @Composable () -> Unit){
    val dark=when(mode){"light"->false;"dark"->true;else->isSystemInDarkTheme()}
    val colors=if(dark)darkColorScheme(
        primary=Color(0xFF8EAFFF),onPrimary=Color(0xFF082253),primaryContainer=Color(0xFF2854D8),onPrimaryContainer=Color.White,
        secondary=Color(0xFF90ACD6),secondaryContainer=Color(0xFF203653),onSecondaryContainer=Color(0xFFDCE8FF),
        background=Color(0xFF0B1220),onBackground=Color(0xFFF2F6FF),surface=Color(0xFF142137),onSurface=Color(0xFFF2F6FF),
        surfaceVariant=Color(0xFF21314B),onSurfaceVariant=Color(0xFFACBCD5),outline=Color(0xFF526887),outlineVariant=Color(0xFF2B3B56)
    )else lightColorScheme(
        primary=Color(0xFF2854D8),onPrimary=Color.White,primaryContainer=Color(0xFFE7EEFF),onPrimaryContainer=Color(0xFF183D9F),
        secondary=Color(0xFF466384),secondaryContainer=Color(0xFFEAF0FA),onSecondaryContainer=Color(0xFF24446A),
        background=Color(0xFFF0F4FA),onBackground=Color(0xFF17243B),surface=Color.White,onSurface=Color(0xFF17243B),
        surfaceVariant=Color(0xFFE9EFF8),onSurfaceVariant=Color(0xFF62748D),outline=Color(0xFF93A4BC),outlineVariant=Color(0xFFDCE4F0)
    )
    MaterialTheme(colorScheme=colors,typography=GabariteiTypography,content=content)
}
