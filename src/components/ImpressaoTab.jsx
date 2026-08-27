import { useEffect, useRef, useState } from "react";
import { useImageAnalysis } from "../hooks/useImageAnalysis";
import { LancamentosExtraidosTable } from "./LancamentosExtraidosTable";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function todayISO() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createRowFromExtract(item) {
  return {
    ...item,
    id:
      item.id || `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tipo: item.tipo || "saida",
    valor: Number(item.valor || 0),
    data: item.data || todayISO(),
    descricao: item.descricao || "",
    categoriaId: item.categoriaId || "",
    categoria_sugerida: item.categoria_sugerida || "",
  };
}

export function ImpressaoTab({ categorias, onSave, onCreateCategoria }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);
  const { analyzeImage, loading, error } = useImageAnalysis();

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelection = (file) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("Apenas imagens JPG ou PNG podem ser importadas.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(nextUrl);
    setLocalError("");
    startAnalysis(file);
  };

  const startAnalysis = async (file) => {
    try {
      const parsedItems = await analyzeImage(file, {
        endpoint:
          import.meta.env.VITE_IMAGE_ANALYSIS_ENDPOINT ||
          "/api/analisar-imagem",
      });

      const mapped = parsedItems.map((item) => {
        const categoriaCompatible = categorias.find(
          (categoria) =>
            categoria.tipo === item.tipo &&
            categoria.nome.toLowerCase() ===
              String(item.categoria_sugerida || "").toLowerCase(),
        );

        return createRowFromExtract({
          ...item,
          categoriaId: categoriaCompatible ? categoriaCompatible.id : "",
        });
      });

      setExtractedItems(mapped);
      if (!mapped.length) {
        setLocalError("Nenhum valor foi identificado na imagem.");
      }
    } catch (caughtError) {
      setLocalError(
        caughtError?.message || "Não foi possível completar a análise.",
      );
      setExtractedItems([]);
    }
  };

  function handleChange(itemId, field, value) {
    setExtractedItems((previous) =>
      previous.map((item) => {
        if (item.id !== itemId) return item;

        const nextItem = { ...item, [field]: value };

        if (field === "tipo") {
          nextItem.categoriaId = "";
          nextItem.categoria_sugerida =
            value === "entrada" ? "Outros Ganhos" : "Outros Gastos";
        }

        return nextItem;
      }),
    );
  }

  function handleRemove(itemId) {
    setExtractedItems((previous) =>
      previous.filter((item) => item.id !== itemId),
    );
  }

  function addManualItem() {
    setExtractedItems((previous) => [
      ...previous,
      createRowFromExtract({
        id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        tipo: "saida",
        valor: 0,
        data: todayISO(),
        descricao: "",
        categoria_sugerida: "Outros Gastos",
        categoriaId: "",
      }),
    ]);
  }

  async function saveAll() {
    const validItems = extractedItems.filter((item) => {
      const valor = Number(item.valor || 0);
      return (
        valor > 0 && item.data && item.descricao?.trim() && item.categoriaId
      );
    });

    if (!validItems.length) {
      setLocalError(
        "Antes de salvar, revise os valores e selecione uma categoria válida para cada item.",
      );
      return;
    }

    try {
      await onSave(validItems);
      setLocalError("");
      setSelectedFile(null);
      setExtractedItems([]);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl("");
    } catch (caughtError) {
      setLocalError(
        caughtError?.message ||
          "Não foi possível salvar os lançamentos importados.",
      );
    }
  }

  const combinedError = localError || error;

  return (
    <div className="impressao-tab">
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <div className="panel-kicker">Importação de imagem</div>
            <h3 className="panel-title">Impressão</h3>
          </div>
        </div>

        <label
          className={`upload-box ${isDragging ? "dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files?.[0];
            if (file) handleFileSelection(file);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFileSelection(file);
            }}
          />

          <div className="upload-icon">🖼️</div>
          <div className="upload-copy">
            <strong>Arraste a imagem aqui</strong>
            <span>ou clique para selecionar</span>
          </div>
          <button
            type="button"
            className="btn-primary btn-upload"
            onClick={(event) => {
              event.preventDefault();
              inputRef.current?.click();
            }}
          >
            Selecionar arquivo
          </button>
        </label>

        {previewUrl && (
          <div className="image-preview-wrapper">
            <div className="image-preview-caption">
              <strong>{selectedFile?.name || "Imagem carregada"}</strong>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl("");
                  setExtractedItems([]);
                }}
              >
                Remover
              </button>
            </div>
            <img
              src={previewUrl}
              alt="Preview do extrato ou comprovante"
              className="image-preview"
            />
          </div>
        )}

        {combinedError && <div className="form-error">{combinedError}</div>}

        {selectedFile && (
          <div className="import-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => startAnalysis(selectedFile)}
              disabled={loading}
            >
              {loading ? "Analisando..." : "Tentar novamente"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={addManualItem}
            >
              Inserir manualmente
            </button>
          </div>
        )}
      </div>

      {extractedItems.length > 0 && (
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Revisão</div>
              <h3 className="panel-title">Lançamentos identificados</h3>
            </div>
          </div>

          <LancamentosExtraidosTable
            itens={extractedItems}
            categorias={categorias}
            onChange={handleChange}
            onRemove={handleRemove}
            onCreateCategory={async (nome, tipo) => {
              const categoriaCriada = await onCreateCategoria(nome, tipo);
              return categoriaCriada;
            }}
          />

          <div className="save-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={saveAll}
              disabled={loading}
            >
              Confirmar e salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
