function normalizeAnthropicResponse(rawText) {
  if (!rawText) {
    return { lancamentos: [] };
  }

  const cleaned = String(rawText)
    .replace(/```json|```/gi, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed?.lancamentos)) return parsed;
    if (Array.isArray(parsed)) return { lancamentos: parsed };
    return { lancamentos: [] };
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(cleaned.slice(start, end + 1));
        if (Array.isArray(parsed?.lancamentos)) return parsed;
        if (Array.isArray(parsed)) return { lancamentos: parsed };
      } catch {
        // fallback silencioso
      }
    }
  }

  return { lancamentos: [] };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido.",
      lancamentos: [],
    });
  }

  try {
    const { imageBase64, mimeType, prompt } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({
        error: "Imagem ausente.",
        lancamentos: [],
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Chave da Anthropic não configurada no servidor.",
        lancamentos: [],
      });
    }

    const systemText = `Você é um extrator de dados financeiros. Analise a imagem e retorne apenas JSON válido.`;
    const userText = `${prompt || ""}

Extraia todos os lançamentos financeiros visíveis em itens de transação. Se não tiver certeza, use categoria genérica.
Retorne apenas JSON válido, sem markdown, com a chave "lancamentos".
Cada item deve seguir exatamente este formato:
{"tipo":"entrada|saida","valor":123.45,"data":"YYYY-MM-DD","descricao":"texto curto","categoria_sugerida":"nome da categoria"}
Se não encontrar nada, retorne {"lancamentos":[]}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1200,
        system: systemText,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType || "image/jpeg",
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: userText,
              },
            ],
          },
        ],
      }),
    });

    const rawText = await response.text();
    if (!response.ok) {
      console.error("Anthropic error:", rawText);
      return res.status(502).json({
        error: "Falha na análise da imagem pela IA.",
        lancamentos: [],
      });
    }

    const payload = JSON.parse(rawText);
    const answer =
      payload?.content?.find((item) => item?.type === "text")?.text || "{}";

    return res.status(200).json(normalizeAnthropicResponse(answer));
  } catch (error) {
    console.error("Erro ao analisar imagem:", error);
    return res.status(500).json({
      error: "Erro interno ao processar a imagem.",
      lancamentos: [],
    });
  }
}
