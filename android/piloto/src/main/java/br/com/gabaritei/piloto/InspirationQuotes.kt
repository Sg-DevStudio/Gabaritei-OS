package br.com.gabaritei.piloto

import java.time.LocalDate

data class InspirationQuote(val text:String,val author:String,val source:String,val translated:Boolean=false)

/** Short excerpts with attribution; translated excerpts are labelled in the interface. */
object InspirationQuotes {
    val entries=listOf(
        InspirationQuote("Põe quanto és no mínimo que fazes.","Ricardo Reis · Fernando Pessoa","https://pt.wikisource.org/wiki/Para_ser_grande,_s%C3%AA_inteiro"),
        InspirationQuote("O que não consigo criar, não compreendo.","Richard Feynman","https://calteches.library.caltech.edu/684/1/ES65.2.2002.pdf#page=21",true),
        InspirationQuote("A inspiração nasce de um contínuo ‘não sei’.","Wisława Szymborska","https://newrepublic.com/article/100368/i-dont-know",true)
    )
    fun forDay(day:LocalDate,offset:Int=0)=entries[Math.floorMod(day.toEpochDay()+offset.toLong(),entries.size.toLong()).toInt()]
}
