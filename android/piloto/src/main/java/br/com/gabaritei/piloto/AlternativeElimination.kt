package br.com.gabaritei.piloto

/** Scratch work for the current attempt; never part of a bank or its answers. */
internal data class AlternativeDraft(val eliminated:Set<Int>,val selected:Int)
internal object AlternativeElimination {
    fun toggle(current:Set<Int>,selected:Int,index:Int,count:Int):AlternativeDraft {
        require(count in 2..5&&index in 0 until count)
        val next=current.filter{it in 0 until count}.toMutableSet()
        if(!next.add(index))next.remove(index)
        return AlternativeDraft(next,selected.takeIf{it in 0 until count&&it !in next}?:-1)
    }
}
