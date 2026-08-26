import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { useMonthlyReport } from "../hooks/useMonthlyReport";
import { RelatorioMensalPDF } from "./RelatorioMensalPDF";

export function GerarRelatorioMensalButton({
  mes,
  ano,
  label = "Gerar Relatório do Mês",
}) {
  const { data, loading, error } = useMonthlyReport(mes, ano);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (loading || isGenerating) return;

    if (error) {
      window.alert(error);
      return;
    }

    if (!data) {
      window.alert("Ainda não foi possível montar o relatório para este mês.");
      return;
    }

    try {
      setIsGenerating(true);

      const blob = await pdf(<RelatorioMensalPDF report={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-mensal-${ano}-${String(mes + 1).padStart(2, "0")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      window.alert(
        "Não foi possível gerar o PDF. Tente novamente em instantes.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      className="btn-primary"
      onClick={handleGenerate}
      disabled={loading || isGenerating}
      title={error || label}
    >
      {loading ? "Buscando dados..." : isGenerating ? "Gerando PDF..." : label}
    </button>
  );
}
