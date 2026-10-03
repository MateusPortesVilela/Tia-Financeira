// Importa os componentes declarativos usados pelo @react-pdf/renderer para gerar o PDF.
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Centraliza a aparência do documento; essa API de estilos é própria do renderer de PDF,
// por isso não são usadas classes CSS do navegador.
const styles = StyleSheet.create({
  page: {
    padding: 28, // Mantém o conteúdo afastado das bordas da página A4.
    backgroundColor: "#ffffff", // Garante fundo branco na impressão e no arquivo.
    color: "#1f2937", // Define a cor de texto padrão para boa leitura.
    fontFamily: "Helvetica", // Usa uma fonte padrão disponível no gerador de PDF.
  },
  header: {
    marginBottom: 18, // Separa o cabeçalho da primeira seção.
    borderBottomWidth: 1, // Desenha a linha que encerra visualmente o cabeçalho.
    borderBottomColor: "#d1d5db", // Usa cinza claro para não competir com o título.
    paddingBottom: 12, // Cria espaço entre o texto do cabeçalho e a linha.
  },
  title: {
    fontSize: 22, // Destaca o título principal em relação ao restante do documento.
    fontWeight: "bold", // Reforça a hierarquia visual do título.
    marginBottom: 4, // Afasta o título do subtítulo do período.
  },
  subtitle: {
    fontSize: 11, // Mantém informações secundárias compactas.
    color: "#4b5563", // Reduz o contraste do texto auxiliar.
  },
  section: {
    marginBottom: 18, // Separa cada bloco temático do relatório.
  },
  sectionTitle: {
    fontSize: 13, // Dá destaque moderado ao título da seção.
    fontWeight: "bold", // Diferencia títulos de seção dos dados.
    marginBottom: 8, // Reserva espaço antes do conteúdo da seção.
    color: "#111827", // Usa texto escuro para manter a leitura nítida.
  },
  summaryGrid: {
    flexDirection: "row", // Coloca entradas, saídas e saldo lado a lado.
    borderWidth: 1, // Emoldura o conjunto de indicadores.
    borderColor: "#d1d5db", // Mantém a moldura discreta.
    borderRadius: 6, // Suaviza os cantos do quadro de resumo.
    overflow: "hidden", // Impede que os fundos das colunas ultrapassem os cantos.
  },
  summaryColumn: {
    flex: 1, // Divide igualmente o espaço com as outras colunas.
    padding: 10, // Dá respiro aos textos dentro da coluna.
    borderRightWidth: 1, // Separa esta coluna da seguinte.
    borderRightColor: "#e5e7eb", // Usa um divisor mais leve que a moldura externa.
    backgroundColor: "#f9fafb", // Diferencia visualmente os indicadores comuns.
  },
  summaryColumnLast: {
    flex: 1, // Mantém a última coluna com a mesma largura das anteriores.
    padding: 10, // Alinha o espaçamento interno com as demais colunas.
    backgroundColor: "#eef2ff", // Destaca o saldo, que sintetiza o resultado do mês.
  },
  summaryLabel: {
    fontSize: 9, // Mantém os rótulos compactos.
    color: "#4b5563", // Distingue o rótulo do valor principal.
    marginBottom: 4, // Separa o rótulo do número correspondente.
  },
  summaryValue: {
    fontSize: 15, // Torna os totais fáceis de localizar rapidamente.
    fontWeight: "bold", // Dá prioridade visual aos valores.
  },
  table: {
    borderWidth: 1, // Contorna a tabela para delimitar seus dados.
    borderColor: "#d1d5db", // Mantém a borda em tom neutro.
    borderRadius: 4, // Aplica cantos discretamente arredondados.
    overflow: "hidden", // Mantém cabeçalho e linhas dentro do contorno.
  },
  tableHeader: {
    flexDirection: "row", // Organiza os nomes das colunas horizontalmente.
    backgroundColor: "#f3f4f6", // Diferencia o cabeçalho das linhas de dados.
    borderBottomWidth: 1, // Marca a separação entre cabeçalho e conteúdo.
    borderBottomColor: "#d1d5db", // Usa o mesmo tom neutro das bordas das tabelas.
  },
  tableRow: {
    flexDirection: "row", // Alinha as células pertencentes ao mesmo registro.
    borderBottomWidth: 1, // Separa visualmente uma linha da próxima.
    borderBottomColor: "#e5e7eb", // Usa divisores suaves para não poluir a tabela.
  },
  tableCell: {
    padding: 7, // Cria espaço ao redor do conteúdo de cada célula.
    fontSize: 9, // Ajusta o tamanho para caberem várias colunas no A4.
    color: "#1f2937", // Define a cor padrão dos dados tabulares.
  },
  colCategoria: { width: "34%" }, // Reserva espaço para nomes de categoria.
  colTipo: { width: "14%" }, // Mantém compacta a coluna de entrada/saída.
  colValor: { width: "18%" }, // Reserva largura suficiente para valores em reais.
  colData: { width: "18%" }, // Acomoda datas formatadas localmente.
  colDescricao: { width: "36%" }, // Dá mais espaço às descrições dos lançamentos.
  rowStrong: {
    fontWeight: "bold", // Destaca o texto do cabeçalho das tabelas.
  },
  list: {
    gap: 6, // Define espaço entre elementos quando este estilo é aplicado a listas.
  },
  item: {
    marginBottom: 6, // Separa um compromisso do próximo.
    paddingBottom: 6, // Evita que o texto encoste no divisor.
    borderBottomWidth: 1, // Delimita cada compromisso.
    borderBottomColor: "#f3f4f6", // Usa um divisor sutil para itens da lista.
  },
  itemTitle: {
    fontSize: 10, // Mantém o título do compromisso legível e compacto.
    fontWeight: "bold", // Destaca o nome do compromisso.
    marginBottom: 2, // Separa o título dos metadados.
  },
  itemMeta: {
    fontSize: 9, // Exibe detalhes em tamanho secundário.
    color: "#4b5563", // Reduz o destaque dos metadados em relação ao título.
  },
  structuredBlock: {
    fontSize: 8, // Permite exibir o conteúdo estruturado em um bloco compacto.
    lineHeight: 1.6, // Melhora a leitura de várias linhas de texto.
    color: "#111827", // Mantém contraste adequado no bloco.
    backgroundColor: "#f8fafc", // Separa visualmente os dados estruturados.
    borderWidth: 1, // Delimita o bloco de texto.
    borderColor: "#dbe4ee", // Usa uma borda clara para não competir com o conteúdo.
    borderRadius: 4, // Mantém os cantos discretos.
    padding: 10, // Evita que o texto encoste na borda.
    marginTop: 8, // Separa o bloco do título da seção.
  },
  moneyPositive: {
    color: "#15803d", // Representa entradas e saldos não negativos em verde.
    fontWeight: "bold", // Reforça a importância dos valores financeiros.
  },
  moneyNegative: {
    color: "#b91c1c", // Representa saídas e saldos negativos em vermelho.
    fontWeight: "bold", // Mantém a mesma ênfase visual dos valores positivos.
  },
  neutral: {
    color: "#1f2937", // Cor neutra disponível para valores sem classificação financeira.
  },
});

// Recebe qualquer valor conversível em número e devolve uma string no padrão monetário brasileiro.
// Number(valor || 0) faz valores ausentes/falsy virarem zero; dados não numéricos podem resultar em "NaN".
function formatMoney(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Recebe uma data ISO (esperada como AAAA-MM-DD) e devolve a data em formato brasileiro.
// A hora fixa em meia-noite evita deslocamento de dia causado por fusos horários.
function formatDate(dateString) {
  // Sem data, exibe um marcador em vez de uma célula vazia.
  if (!dateString) return "-";
  // Acrescenta um horário local explícito antes de criar o objeto Date.
  const data = new Date(dateString + "T00:00:00");
  // Se a entrada não formar uma data válida, preserva e devolve o valor original.
  if (Number.isNaN(data.getTime())) return dateString;
  // Para datas válidas, usa a convenção de exibição brasileira.
  return data.toLocaleDateString("pt-BR");
}

// Componente de apresentação: recebe um relatório mensal e devolve o documento PDF do período.
// Espera report.ano, report.mes, report.resumo e as listas de dados usadas abaixo.
// Só report ausente é tratado; não há try/catch, então campos internos inválidos podem interromper a renderização
// e o erro se propaga ao componente chamador, que deve validar/preparar os dados antes de montar este PDF.
export function RelatorioMensalPDF({ report }) {
  // Não há documento para renderizar enquanto o relatório não estiver disponível.
  if (!report) {
    return null;
  }

  // Cria o rótulo do mês; o construtor Date usa mês indexado a partir de zero.
  const mesLabel = new Date(report.ano, report.mes, 1).toLocaleDateString(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    },
  );

  // Formata o saldo uma vez para reutilizar o resultado no resumo.
  const saldoFormatado = formatMoney(report.resumo.saldo);

  // Document e Page definem o arquivo e sua página; Views e Text organizam o conteúdo do PDF.
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Identifica o relatório e o período coberto. */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório Mensal Financeiro</Text>
          <Text style={styles.subtitle}>{mesLabel}</Text>
        </View>

        {/* Resume entradas, saídas e saldo final em colunas para facilitar a comparação. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo geral</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>Entradas</Text>
              <Text style={[styles.summaryValue, styles.moneyPositive]}>
                {formatMoney(report.resumo.totalEntradas)}
              </Text>
            </View>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryLabel}>Saídas</Text>
              <Text style={[styles.summaryValue, styles.moneyNegative]}>
                {formatMoney(report.resumo.totalSaidas)}
              </Text>
            </View>
            <View style={styles.summaryColumnLast}>
              <Text style={styles.summaryLabel}>Saldo final</Text>
              {/* O saldo usa cor positiva quando é zero ou maior e negativa abaixo de zero. */}
              <Text
                style={[
                  styles.summaryValue,
                  report.resumo.saldo >= 0
                    ? styles.moneyPositive
                    : styles.moneyNegative,
                ]}
              >
                {saldoFormatado}
              </Text>
            </View>
          </View>
        </View>

        {/* Apresenta os totais por categoria e escolhe um rótulo para cada composição. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Breakdown por categoria</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text
                style={[
                  styles.tableCell,
                  styles.colCategoria,
                  styles.rowStrong,
                ]}
              >
                Categoria
              </Text>
              <Text
                style={[styles.tableCell, styles.colTipo, styles.rowStrong]}
              >
                Tipo
              </Text>
              <Text
                style={[styles.tableCell, styles.colValor, styles.rowStrong]}
              >
                Valor
              </Text>
            </View>

            {/* Sem itens, mostra uma linha explícita; com itens, cria uma linha por categoria. */}
            {report.breakdownPorCategoria.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colCategoria]}>
                  Sem movimentação
                </Text>
                <Text style={[styles.tableCell, styles.colTipo]}>-</Text>
                <Text style={[styles.tableCell, styles.colValor]}>R$ 0,00</Text>
              </View>
            ) : (
              report.breakdownPorCategoria.map((item) => (
                <View key={`${item.nome}-${item.tipo}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colCategoria]}>
                    {item.nome}
                  </Text>
                  <Text style={[styles.tableCell, styles.colTipo]}>
                    {/* Classifica a categoria como entrada, saída ou combinação das duas. */}
                    {item.entradas > 0 && item.saidas === 0
                      ? "Entrada"
                      : item.saidas > 0 && item.entradas === 0
                        ? "Saída"
                        : "Mista"}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.colValor,
                      item.total >= 0
                        ? styles.moneyPositive
                        : styles.moneyNegative,
                    ]}
                  >
                    {formatMoney(item.total)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Lista os lançamentos do mês, com fallback textual quando a lista está vazia. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lançamentos do mês</Text>
          {report.lancamentos.length === 0 ? (
            <Text style={styles.subtitle}>
              Nenhum lançamento para este período.
            </Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text
                  style={[styles.tableCell, styles.colData, styles.rowStrong]}
                >
                  Data
                </Text>
                <Text
                  style={[styles.tableCell, styles.colTipo, styles.rowStrong]}
                >
                  Tipo
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.colCategoria,
                    styles.rowStrong,
                  ]}
                >
                  Categoria
                </Text>
                <Text
                  style={[styles.tableCell, styles.colValor, styles.rowStrong]}
                >
                  Valor
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.colDescricao,
                    styles.rowStrong,
                  ]}
                >
                  Descrição
                </Text>
              </View>
              {/* Usa o identificador como chave; na ausência dele, combina data e categoria. */}
              {report.lancamentos.map((lancamento) => (
                <View
                  key={
                    lancamento.id ||
                    `${lancamento.data}-${lancamento.categoriaNome}`
                  }
                  style={styles.tableRow}
                >
                  {/* Formata a data e colore tipo/valor de acordo com entrada ou saída. */}
                  <Text style={[styles.tableCell, styles.colData]}>
                    {formatDate(lancamento.dataIso)}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.colTipo,
                      lancamento.tipo === "entrada"
                        ? styles.moneyPositive
                        : styles.moneyNegative,
                    ]}
                  >
                    {lancamento.tipo === "entrada" ? "Entrada" : "Saída"}
                  </Text>
                  <Text style={[styles.tableCell, styles.colCategoria]}>
                    {lancamento.categoriaNome}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.colValor,
                      lancamento.tipo === "entrada"
                        ? styles.moneyPositive
                        : styles.moneyNegative,
                    ]}
                  >
                    {lancamento.tipo === "entrada" ? "+" : "-"}{" "}
                    {formatMoney(lancamento.valor)}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDescricao]}>
                    {lancamento.descricao || "-"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Exibe compromissos futuros ou pendentes com tipo, data, valor, status e nota opcional. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compromissos do mês</Text>
          {/* A chave alternativa mantém cada item identificável quando não há id. */}
          {report.compromissos.length === 0 ? (
            <Text style={styles.subtitle}>
              Nenhum compromisso para este período.
            </Text>
          ) : (
            report.compromissos.map((item) => (
              <View
                key={item.id || `${item.titulo}-${item.data}`}
                style={styles.item}
              >
                <Text style={styles.itemTitle}>{item.titulo}</Text>
                <Text style={styles.itemMeta}>
                  {item.tipo === "recebimento" ? "Recebimento" : "Cobrança"} •{" "}
                  {formatDate(item.dataIso)} • {formatMoney(item.valor)} •{" "}
                  {item.status}
                </Text>
                {/* Notas vazias são omitidas para não criar linhas sem conteúdo. */}
                {item.nota ? (
                  <Text style={styles.itemMeta}>{item.nota}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        {/* Inclui o texto previamente estruturado para leitura por ferramentas de IA. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Dados estruturados para leitura por IA
          </Text>
          <Text style={styles.structuredBlock}>{report.textoEstruturado}</Text>
        </View>
      </Page>
    </Document>
  );
}
