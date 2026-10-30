package br.com.gabaritei.piloto

import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate

class StatisticsModelTest {
    private val today=LocalDate.parse("2026-10-30")
    private fun row(day:LocalDate=today,minutes:Double=30.0,q:Int=10,right:Int=8,id:String="s")=StudyActivity(id,day,minutes,q,right,"d",category="questoes")
    @Test fun accuracyIsWeightedByQuestionsRatherThanSessionPercentages(){
        val stats=StatisticsModel.total(listOf(row(q=1,right=1),row(q=99,right=0)))
        assertEquals(1.0,stats.accuracy!!,0.0);assertEquals(99,stats.errors);assertEquals("1%",StatisticsModel.percent(stats.accuracy))
    }
    @Test fun noQuestionsAndZeroCorrectAreDifferentStates(){
        assertNull(StatisticsModel.total(listOf(row(q=0,right=0))).accuracy)
        assertEquals("—",StatisticsModel.percent(null))
        assertEquals(0.0,StatisticsModel.total(listOf(row(right=0))).accuracy!!,0.0)
        assertEquals("66,7%",StatisticsModel.percent(200.0/3))
    }
    @Test fun invalidRemoteCountersCannotCreateNegativeErrorsOrInvalidChartValues(){
        val total=StatisticsModel.total(listOf(row(minutes=Double.NaN,q=3,right=99),row(minutes=-5.0,q=-10,right=-2)))
        assertEquals(3,total.questions);assertEquals(3,total.correct);assertEquals(0,total.errors);assertEquals(0.0,total.minutes,0.0)
    }
    @Test fun duplicateSessionsOnOneDayCountOnlyOnceForConstancy(){
        val rows=listOf(row(today.minusDays(1)),row(today.minusDays(1),id="second"),row(today.minusDays(2)))
        val stats=StatisticsModel.constancy(rows,today.minusDays(6),today,today)
        assertEquals(2,stats.active.size);assertEquals(2,stats.current);assertEquals(2,stats.longest);assertEquals(7L,stats.totalDays);assertEquals(200.0/7,stats.percentage,0.0001)
    }
    @Test fun finishedPastIntervalDoesNotBorrowAnExtraDayToExtendStreak(){
        val stats=StatisticsModel.constancy(listOf(row(today.minusDays(2))),today.minusDays(6),today.minusDays(1),today)
        assertEquals(0,stats.current);assertEquals(1,stats.longest)
    }
    @Test fun futureOutOfRangeAndZeroActivityDaysNeverCountAsStudy(){
        val rows=listOf(row(today.plusDays(1)),row(today.minusDays(20)),row(q=0,right=0,minutes=0.0),row(today.minusDays(1),q=5,minutes=0.0))
        val stats=StatisticsModel.constancy(rows,today.minusDays(6),today.plusDays(2),today)
        assertEquals(setOf(today.minusDays(1)),stats.active);assertEquals(7L,stats.totalDays)
    }
    @Test fun questionOnlySimulatedRowsAreActiveButNeverDuplicateStudyTime(){
        val rows=listOf(row(q=0,right=0,minutes=60.0,id="sim"),row(q=40,right=30,minutes=0.0,id="sim:a"),row(q=60,right=50,minutes=0.0,id="sim:b"))
        val total=StatisticsModel.total(rows)
        assertEquals(60.0,total.minutes,0.0);assertEquals(80.0,total.accuracy!!,0.0)
        assertEquals(1,StatisticsModel.constancy(rows,today,today,today).active.size)
    }
    @Test fun evolutionKeepsMissingAccuracyNullInsteadOfInventingZero(){
        val first=today.minusDays(2)
        val points=StatisticsModel.series(listOf(row(first,right=0),row(today)),first,today)
        assertEquals(3,points.size);assertEquals(0.0,points[0].total.accuracy!!,0.0);assertNull(points[1].total.accuracy);assertEquals(80.0,points[2].total.accuracy!!,0.0)
    }
    @Test fun longIntervalsRemainBoundedAndRetainEveryQuestionAndEndpoint(){
        val from=today.minusDays(399)
        val rows=(0L..399L).map{i->row(from.plusDays(i),q=3,right=2,id=i.toString())}
        val points=StatisticsModel.series(rows,from,today)
        assertTrue(points.size<=12);assertEquals(from,points.first().from);assertEquals(today,points.last().until)
        assertEquals(1200,points.sumOf{it.total.questions});assertEquals(800,points.sumOf{it.total.correct})
        points.zipWithNext().forEach{(a,b)->assertEquals(a.until.plusDays(1),b.from)}
    }
    @Test fun customDateBoundsExcludeOutsideSamples(){
        val points=StatisticsModel.series(listOf(row(today.minusDays(2)),row(today),row(today.plusDays(1))),today,today)
        assertEquals(10,points.single().total.questions)
        assertTrue(StatisticsModel.series(emptyList(),today,today.minusDays(1)).isEmpty())
    }
    @Test fun metricSelectionIsValidatedAndKeepsTimeOptional(){
        assertFalse("time" in StatisticsModel.display(null));assertEquals(StatisticsModel.defaults,StatisticsModel.display(setOf("unknown")))
        assertEquals(setOf("time"),StatisticsModel.display(setOf("time","unknown")))
        assertEquals(listOf(StatsMetric.TIME),StatisticsModel.metrics(setOf("time")))
        assertTrue(StatisticsModel.metrics(setOf("progress")).isEmpty())
        assertEquals(listOf(StatsMetric.ACCURACY,StatsMetric.QUESTIONS,StatsMetric.CORRECT,StatsMetric.ERRORS),StatisticsModel.metrics(StatisticsModel.defaults))
    }
}
