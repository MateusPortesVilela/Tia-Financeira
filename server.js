import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/api/analisar-imagem", async (req, res) => {
  try {
    const { imageBase64, mimeType, filename, prompt } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({
        error: "Imagem ausente.",
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Chave da Anthropic não configurada no servidor.",
      });
    }

    const requestBody = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1200,
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
              text:
                (prompt || "") +
                '\n\nExtraia todos os lançamentos financeiros visíveis. Responda apenas em JSON válido, sem markdown. Estrutura esperada: {"lancamentos":[{"tipo":"entrada|saida","valor":123.45,"data":"YYYY-MM-DD","descricao":"texto","categoria_sugerida":"nome da categoria"}]}. Se não encontrar dados, retorne {"lancamentos":[]}.',
            },
          ],
        },
      ],
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    const rawText = await response.text();
    if (!response.ok) {
      console.error("Anthropic error:", rawText);
      return res.status(502).json({
        error: "Falha na análise da imagem pela IA.",
      });
    }

    const payload = JSON.parse(rawText);
    const answer =
      payload?.content?.find((item) => item?.type === "text")?.text || "{}";

    const cleaned = answer.replace(/```json|```/gi, "").trim();
    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
      } else {
        parsed = { lancamentos: [] };
      }
    }

    return res.json(parsed);
  } catch (error) {
    console.error("Erro ao analisar imagem:", error);
    return res.status(500).json({
      error: "Erro interno ao processar a imagem.",
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API de análise de imagem rodando em http://localhost:${PORT}`);
});
