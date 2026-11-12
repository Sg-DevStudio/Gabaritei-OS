package br.com.gabaritei.piloto

import org.junit.Assert.*
import org.junit.Test

class PersonalAITest {
    @Test fun pastedKeySelectsTheCorrectProvider(){
        assertEquals("groq",PersonalAI.provider("  gsk_"+"x".repeat(40)+"  "))
        assertEquals("gemini",PersonalAI.provider("AIza"+"x".repeat(35)))
        assertNull(PersonalAI.provider("unknown"))
        PersonalAI.validate("gsk_"+"x".repeat(40),"groq",PersonalAI.groqModel)
        PersonalAI.validate("AIza"+"x".repeat(35),"gemini",PersonalAI.googleModels.first())
    }
    @Test fun mismatchedProviderAndUnsupportedModelsCannotBeSaved(){
        listOf(
            Triple("gsk_"+"x".repeat(40),"gemini",PersonalAI.googleModels.first()),
            Triple("AIza"+"x".repeat(35),"groq",PersonalAI.groqModel),
            Triple("gsk_"+"x".repeat(40),"groq","unknown"),
            Triple("gsk_bad","groq",PersonalAI.groqModel)
        ).forEach{(key,provider,model)->assertThrows(IllegalArgumentException::class.java){PersonalAI.validate(key,provider,model)}}
    }
    @Test fun validationErrorsDistinguishInvalidKeysFromRateLimits(){
        assertTrue(PersonalAI.validationError(401).contains("recusada"))
        assertTrue(PersonalAI.validationError(429).contains("limitou"))
        assertFalse(PersonalAI.validationError(429).contains("Google"))
    }
}
