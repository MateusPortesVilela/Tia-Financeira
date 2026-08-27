import { useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes("base64,")
        ? result.split("base64,")[1]
        : result;
      resolve(base64);
    };

    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

function normalizeMoney(value) {
  if (value === null || value === undefined || value === "") return 0;

  const cleaned = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const number = Number.parseFloat(cleaned || "0");
  return Number.isFinite(number) ? number : 0;
}

function parseDateCandidate(value) {
  if (!value) return "";

  const raw = String(value).trim();
  if (!raw) return "";

  const patterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{2}-\d{2}-\d{4}$/,
    /^\d{4}\/\d{2}\/\d{2}$/,
  ];

  if (patterns.some((pattern) => pattern.test(raw))) {
    if (raw.includes("/")) {
      const [dia, mes, ano] = raw.split("/");
      return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    }

    if (raw.includes("-")) {
      const [partOne, partTwo, partThree] = raw.split("-");
      if (partOne.length === 4) {
        return raw;
      }
      return `${partTwo}-${String(partOne).padStart(2, "0")}-${String(partThree).padStart(2, "0")}`;
    }
  }

  const date = new Date(raw);
  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
}

function normalizeTipo(value) {
  const text = String(value || "")
    .toLowerCase()
    .trim();
  if (
    [
      "entrada",
      "ent",
      "receita",
      "credito",
      "crédito",
      "ganho",
      "deposito",
      "depósito",
      "recebimento",
    ].includes(text)
  ) {
    return "entrada";
  }
  if (
    [
      "saida",
      "saída",
      "despesa",
      "gasto",
      "debito",
      "débito",
      "pagamento",
      "cobrança",
      "cobranca",
    ].includes(text)
  ) {
    return "saida";
  }

  return "saida";
}

function normalizeDescricao(value) {
  return String(value || "").trim();
}

function normalizeCategoriaName(value, tipo) {
  const raw = String(value || "").trim();
  if (!raw) {
    return tipo === "entrada" ? "Outros Ganhos" : "Outros Gastos";
  }

  return raw
    .replace(/\s+/g, " ")
    .replace(/\b(\d+)\b/g, "")
    .trim();
}

function normalizeItem(item, index) {
  const tipo = normalizeTipo(
    item?.tipo ||
      item?.natureza ||
      item?.movimento ||
      item?.categoria_tipo ||
      "saida",
  );
  const valor = normalizeMoney(
    item?.valor ||
      item?.valor_total ||
      item?.amount ||
      item?.montante ||
      item?.valorPago ||
      item?.total ||
      0,
  );

  const descricao = normalizeDescricao(
    item?.descricao ||
      item?.descricao_lancamento ||
      item?.titulo ||
      item?.nome ||
      item?.observacao ||
      `Lançamento ${index + 1}`,
  );

  const categoria = normalizeCategoriaName(
    item?.categoria ||
      item?.categoria_sugerida ||
      item?.categoriaNome ||
      item?.nomeCategoria,
    tipo,
  );

  const data = parseDateCandidate(
    item?.data ||
      item?.date ||
      item?.data_movimento ||
      item?.dataTransacao ||
      item?.vencimento,
  );

  return {
    id: `extract_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
    tipo,
    valor,
    data: data || new Date().toISOString().slice(0, 10),
    descricao,
    categoria_sugerida: categoria,
    categoriaId: "",
  };
}

function extractDataFromPayload(payload) {
  if (!payload || typeof payload !== "object") return [];

  const possibleCollections = [
    payload.lancamentos,
    payload.movimentos,
    payload.itens,
    payload.transacoes,
    payload.result,
    payload.resultado,
    payload.data,
    payload.dados,
    payload.extract,
    payload.extracao,
    payload.items,
  ];

  for (const candidate of possibleCollections) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload?.lancamento && typeof payload.lancamento === "object") {
    return [payload.lancamento];
  }

  return [];
}

function extractJsonFromText(text) {
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1]);
      } catch {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start >= 0 && end > start) {
          try {
            return JSON.parse(text.substring(start, end + 1));
          } catch {
            return null;
          }
        }
      }
    }
  }

  return null;
}

export function useImageAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState([]);

  async function analyzeImage(file, options = {}) {
    if (!file) {
      const message = "Selecione uma imagem antes de enviar para análise.";
      setError(message);
      throw new Error(message);
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      const message = "Formato inválido. Envie uma imagem em JPG ou PNG.";
      setError(message);
      throw new Error(message);
    }

    setLoading(true);
    setError("");

    try {
      const base64 = await toBase64(file);
      const endpoint =
        options.endpoint ||
        import.meta.env.VITE_IMAGE_ANALYSIS_ENDPOINT ||
        "/api/analisar-imagem";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          mimeType: file.type || "image/jpeg",
          filename: file.name,
          imageBase64: base64,
          prompt:
            "Extraia lançamentos financeiros de um extrato, documento ou comprovante. Retorne apenas JSON válido com uma lista chamada lancamentos. Cada item deve conter: tipo, valor, data, descricao, categoria_sugerida. Se não houver certeza da categoria, use uma categoria genérica como 'Outros Gastos' ou 'Outros Ganhos'.",
        }),
      });

      const rawText = await response.text();
      if (!response.ok) {
        throw new Error(
          "Não foi possível analisar a imagem. Verifique se a função de IA está ativa e tente novamente.",
        );
      }

      const parsed = extractJsonFromText(rawText);
      const extracted = extractDataFromPayload(parsed);

      if (!extracted.length) {
        throw new Error(
          "Nenhum valor financeiro foi identificado nesta imagem. Tente outra imagem ou insira os dados manualmente.",
        );
      }

      const normalized = extracted.map((item, index) =>
        normalizeItem(item, index),
      );

      if (!normalized.length) {
        throw new Error(
          "A imagem não retornou informações válidas. Revise o documento e tente novamente.",
        );
      }

      setResult(normalized);
      return normalized;
    } catch (errorCaught) {
      const message =
        errorCaught?.message ||
        "Não foi possível extrair os dados. Tente outra imagem ou insira manualmente.";
      setError(message);
      setResult([]);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    result,
    analyzeImage,
    clearError: () => setError(""),
  };
}
