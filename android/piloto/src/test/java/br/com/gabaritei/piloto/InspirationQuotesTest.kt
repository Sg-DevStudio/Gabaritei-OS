package br.com.gabaritei.piloto

import java.time.LocalDate
import java.net.URI
import org.junit.Assert.*
import org.junit.Test

class InspirationQuotesTest {
    @Test fun dailyQuoteIsStableAndChangesOnFollowingDay(){val day=LocalDate.of(2026,10,30);assertEquals(InspirationQuotes.forDay(day),InspirationQuotes.forDay(day));assertNotEquals(InspirationQuotes.forDay(day),InspirationQuotes.forDay(day.plusDays(1)))}
    @Test fun rotationWrapsAndDatesBeforeEpochWork(){val day=LocalDate.of(1900,1,1);assertEquals(InspirationQuotes.forDay(day),InspirationQuotes.forDay(day,InspirationQuotes.entries.size));assertTrue(InspirationQuotes.forDay(day,-1) in InspirationQuotes.entries)}
    @Test fun sourcesAndTranslationCreditsArePresent(){assertTrue(InspirationQuotes.entries.all{URI(it.source).scheme=="https"&&it.author.isNotBlank()});assertTrue(InspirationQuotes.entries.filter{it.author=="Richard Feynman"||it.author=="Wisława Szymborska"}.all{it.translated});assertFalse(InspirationQuotes.entries.first().translated)}
}
