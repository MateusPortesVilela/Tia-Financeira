import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    backgroundColor: "#ffffff",
    color: "#1f2937",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#4b5563",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
  },
  summaryGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    overflow: "hidden",
  },
  summaryColumn: {
    flex: 1,
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  summaryColumnLast: {
    flex: 1,
    padding: 10,
    backgroundColor: "#eef2ff",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "bold",
  },
  table: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableCell: {
    padding: 7,
    fontSize: 9,
    color: "#1f2937",
  },
  colCategoria: { width: "34%" },
  colTipo: { width: "14%" },
  colValor: { width: "18%" },
  colData: { width: "18%" },
  colDescricao: { width: "36%" },
  rowStrong: {
    fontWeight: "bold",
  },
  list: {
    gap: 6,
  },
  item: {
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 9,
    color: "#4b5563",
  },
  structuredBlock: {
    fontSize: 8,
    lineHeight: 1.6,
    color: "#111827",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe4ee",
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
  },
  moneyPositive: {
    color: "#15803d",
    fontWeight: "bold",
  },
  moneyNegative: {
    color: "#b91c1c",
    fontWeight: "bold",
  },
  neutral: {
    color: "#1f2937",
  },
});

function formatMoney(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const data = new Date(dateString + "T00:00:00");
  if (Number.isNaN(data.getTime())) return dateString;
  return data.toLocaleDateString("pt-BR");
}

export function RelatorioMensalPDF({ report }) {
  if (!report) {
    return null;
  }

  const mesLabel = new Date(report.ano, report.mes, 1).toLocaleDateString(
    "pt-BR",
    {
      month: "long",
      year: "numeric",
    },
  );

  const saldoFormatado = formatMoney(report.resumo.saldo);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Relatório Mensal Financeiro</Text>
          <Text style={styles.subtitle}>{mesLabel}</Text>
        </View>

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
              {report.lancamentos.map((lancamento) => (
                <View
                  key={
                    lancamento.id ||
                    `${lancamento.data}-${lancamento.categoriaNome}`
                  }
                  style={styles.tableRow}
                >
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compromissos do mês</Text>
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
                {item.nota ? (
                  <Text style={styles.itemMeta}>{item.nota}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

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
