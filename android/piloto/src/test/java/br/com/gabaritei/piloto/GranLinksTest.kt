package br.com.gabaritei.piloto
import org.junit.Assert.*
import org.junit.Test
class GranLinksTest {
 @Test fun preservesEveryEncodedFilterWithoutDoubleEncoding(){val query="assunto=%5B403701%5D&banca=%5B1%2C2%5D&anos=%5B2025%5D&nivel=2";assertEquals("https://questoes.grancursosonline.com.br/aluno/filtro/concursos?$query",GranLinks.appUrl("https://questoes.grancursosonline.com.br/questoes?$query"))}
 @Test fun preservesFragmentsAndAcceptsTheRegisteredRoute(){val url="https://questoes.grancursosonline.com.br/aluno/filtro/concursos?assunto=12#filtros";assertEquals(url,GranLinks.appUrl(url))}
 @Test fun unrelatedHostsAndIndividualQuestionsRemainUnchanged(){for(url in listOf("https://example.com/questoes?a=1","https://questoes.grancursosonline.com.br/questoes/123","http://questoes.grancursosonline.com.br/questoes","https://user:password@questoes.grancursosonline.com.br/questoes"))assertNull(GranLinks.appUrl(url))}
}
