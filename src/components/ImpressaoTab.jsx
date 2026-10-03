// useState guarda os dados da tela; useRef acessa o input de arquivo; useEffect libera recursos temporários.
import { useEffect, useRef, useState } from "react";
// Hook responsável por enviar a imagem para análise e expor carregamento/erro.
import { useImageAnalysis } from "../hooks/useImageAnalysis";
// Tabela que permite revisar e editar os lançamentos extraídos antes de salvar.
import { LancamentosExtraidosTable } from "./LancamentosExtraidosTable";

// Tipos MIME permitidos para upload; os demais arquivos são recusados antes da análise.
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

// Devolve a data de hoje no formato AAAA-MM-DD, adequado para campos de data.
function todayISO() {
  // Usa a data local do navegador para compor o dia atual.
  const date = new Date();
  // Extrai o ano sem conversão de fuso horário.
  const year = date.getFullYear();
  // Converte o mês, que começa em zero no JavaScript, e completa com zero à esquerda.
  const month = String(date.getMonth() + 1).padStart(2, "0");
  // Completa o dia com zero à esquerda quando necessário.
  const day = String(date.getDate()).padStart(2, "0");
  // Monta a string no padrão ISO esperado pelos campos e pelo restante do app.
  return `${year}-${month}-${day}`;
}

// Recebe um item extraído ou criado manualmente e devolve uma linha completa com valores padrão.
function createRowFromExtract(item) {
  // Mantém os campos originais e sobrescreve/define os campos padronizados abaixo.
  return {
    ...item,
    // Preserva o id recebido; sem id, cria uma chave local pseudoaleatória para React.
    id:
      item.id || `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    // Classifica como saída quando a análise não informou um tipo.
    tipo: item.tipo || "saida",
    // Garante valor numérico; valor ausente ou falsy vira zero.
    valor: Number(item.valor || 0),
    // Usa hoje quando a origem não trouxe uma data.
    data: item.data || todayISO(),
    // Mantém a descrição sempre como texto.
    descricao: item.descricao || "",
    // Categoria ainda não selecionada fica representada por string vazia.
    categoriaId: item.categoriaId || "",
    // Guarda a sugestão textual da análise, separada da categoria confirmada.
    categoria_sugerida: item.categoria_sugerida || "",
  };
}

// Componente de importação; recebe categorias disponíveis e callbacks para salvar/criar categoria.
// Não retorna valor de negócio: renderiza a interface e comunica alterações pelos callbacks recebidos.
export function ImpressaoTab({ categorias, onSave, onCreateCategoria }) {
  // URL temporária usada para exibir a imagem selecionada no navegador.
  const [previewUrl, setPreviewUrl] = useState("");
  // Arquivo original, mantido para permitir uma nova tentativa de análise.
  const [selectedFile, setSelectedFile] = useState(null);
  // Controla a aparência da área de upload durante o arraste.
  const [isDragging, setIsDragging] = useState(false);
  // Linhas extraídas ou adicionadas manualmente, ainda não confirmadas.
  const [extractedItems, setExtractedItems] = useState([]);
  // Erros locais de validação, análise e salvamento.
  const [localError, setLocalError] = useState("");
  // Referência ao input oculto, acionado pelo botão de seleção.
  const inputRef = useRef(null);
  // Função de análise e estados de carregamento/erro fornecidos pelo hook.
  const { analyzeImage, loading, error } = useImageAnalysis();

  // Libera a URL criada pelo navegador quando a prévia muda ou o componente desmonta.
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Recebe um File do input ou do arraste, valida o tipo e inicia sua prévia/análise.
  const handleFileSelection = (file) => {
    // Nenhuma ação é necessária quando o usuário não selecionou um arquivo.
    if (!file) return;

    // Recusa tipos não suportados e mostra uma mensagem sem iniciar upload/análise.
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("Apenas imagens JPG ou PNG podem ser importadas.");
      return;
    }

    // Revoga a URL anterior antes de criar outra para evitar manter recursos na memória.
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Cria uma URL local para pré-visualizar o conteúdo sem enviar o arquivo neste passo.
    const nextUrl = URL.createObjectURL(file);
    // Guarda arquivo e URL para exibir a imagem e permitir nova tentativa.
    setSelectedFile(file);
    setPreviewUrl(nextUrl);
    setLocalError("");
    // Inicia a extração automaticamente após aceitar o arquivo.
    startAnalysis(file);
  };

  // Envia um arquivo ao hook de análise e transforma a resposta em linhas editáveis.
  const startAnalysis = async (file) => {
    try {
      // Usa endpoint configurável por variável de ambiente ou a rota local padrão.
      const parsedItems = await analyzeImage(file, {
        endpoint:
          import.meta.env.VITE_IMAGE_ANALYSIS_ENDPOINT ||
          "/api/analisar-imagem",
      });

      // Relaciona sugestões com categorias existentes pelo tipo e nome, sem forçar correspondência.
      const mapped = parsedItems.map((item) => {
        const categoriaCompatible = categorias.find(
          (categoria) =>
            categoria.tipo === item.tipo &&
            categoria.nome.toLowerCase() ===
              String(item.categoria_sugerida || "").toLowerCase(),
        );

        // Normaliza cada extração e associa o id somente quando encontrou categoria compatível.
        return createRowFromExtract({
          ...item,
          categoriaId: categoriaCompatible ? categoriaCompatible.id : "",
        });
      });

      // Substitui a lista atual pelo resultado mais recente da análise.
      setExtractedItems(mapped);
      // Uma resposta vazia não é exceção; informa que nada foi reconhecido.
      if (!mapped.length) {
        setLocalError("Nenhum valor foi identificado na imagem.");
      }
    } catch (caughtError) {
      // Em falha de rede/processamento, mostra a mensagem recebida ou uma mensagem genérica.
      setLocalError(
        caughtError?.message || "Não foi possível completar a análise.",
      );
      // Limpa resultados anteriores para não confundir o usuário com dados desatualizados.
      setExtractedItems([]);
    }
  };

  // Atualiza um campo da linha identificada e devolve uma nova lista sem mutar o estado anterior.
  function handleChange(itemId, field, value) {
    setExtractedItems((previous) =>
      previous.map((item) => {
        if (item.id !== itemId) return item;

        // Copia apenas a linha alterada e atualiza dinamicamente o campo editado.
        const nextItem = { ...item, [field]: value };

        // Ao mudar entrada/saída, limpa a categoria incompatível e atualiza uma sugestão padrão.
        if (field === "tipo") {
          nextItem.categoriaId = "";
          nextItem.categoria_sugerida =
            value === "entrada" ? "Outros Ganhos" : "Outros Gastos";
        }

        return nextItem;
      }),
    );
  }

  // Remove da revisão a linha que corresponde ao id informado.
  function handleRemove(itemId) {
    setExtractedItems((previous) =>
      previous.filter((item) => item.id !== itemId),
    );
  }

  // Acrescenta uma linha vazia de saída para permitir cadastrar dados não reconhecidos pela imagem.
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

  // Valida as linhas revisadas e envia somente as que têm dados obrigatórios preenchidos.
  async function saveAll() {
    // Exige valor positivo, data, descrição não vazia e categoria escolhida.
    const validItems = extractedItems.filter((item) => {
      const valor = Number(item.valor || 0);
      return (
        valor > 0 && item.data && item.descricao?.trim() && item.categoriaId
      );
    });

    // Impede o salvamento e informa o que precisa ser revisado quando nenhuma linha é válida.
    if (!validItems.length) {
      setLocalError(
        "Antes de salvar, revise os valores e selecione uma categoria válida para cada item.",
      );
      return;
    }

    try {
      // Aguarda o callback do componente pai, que é responsável pela persistência efetiva.
      await onSave(validItems);
      // Em sucesso, limpa erro, arquivo, linhas e prévia para encerrar o fluxo de importação.
      setLocalError("");
      setSelectedFile(null);
      setExtractedItems([]);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl("");
    } catch (caughtError) {
      // Se o callback rejeitar a operação, preserva os dados para nova tentativa e exibe o motivo.
      setLocalError(
        caughtError?.message ||
          "Não foi possível salvar os lançamentos importados.",
      );
    }
  }

  // Dá prioridade ao erro local; se não houver, exibe o erro informado pelo hook de análise.
  const combinedError = localError || error;

  // Renderiza upload, prévia, mensagens de estado e tabela de revisão condicionalmente.
  return (
    <div className="impressao-tab">
      {/* Painel inicial para seleção/arraste de arquivo e apresentação dos estados da análise. */}
      <div className="panel-card">
        <div className="panel-header">
          <div>
            <div className="panel-kicker">Importação de imagem</div>
            <h3 className="panel-title">Impressão</h3>
          </div>
        </div>

        {/* O label torna toda a área clicável; os handlers também aceitam arquivos arrastados. */}
        <label
          className={`upload-box ${isDragging ? "dragging" : ""}`}
          onDragOver={(event) => {
            // Evita que o navegador abra o arquivo e ativa o destaque da área de soltar.
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            // Interrompe a navegação padrão e encerra o estado visual de arraste.
            event.preventDefault();
            setIsDragging(false);
            // Usa o primeiro arquivo recebido; a validação ocorre em handleFileSelection.
            const file = event.dataTransfer.files?.[0];
            if (file) handleFileSelection(file);
          }}
        >
          {/* Input nativo fica oculto, mas sua referência permite acioná-lo pelo botão visível. */}
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            hidden
            onChange={(event) => {
              // Lê o primeiro arquivo selecionado no diálogo do navegador.
              const file = event.target.files?.[0];
              if (file) handleFileSelection(file);
            }}
          />

          <div className="upload-icon">🖼️</div>
          <div className="upload-copy">
            <strong>Arraste a imagem aqui</strong>
            <span>ou clique para selecionar</span>
          </div>
          {/* Abre o seletor nativo; preventDefault evita submeter o label/formulário por engano. */}
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

        {/* Só mostra a imagem e a ação de remoção quando existe URL de prévia. */}
        {previewUrl && (
          <div className="image-preview-wrapper">
            <div className="image-preview-caption">
              <strong>{selectedFile?.name || "Imagem carregada"}</strong>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  // Limpa os dados visíveis; o efeito revoga a URL quando previewUrl for atualizado.
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

        {/* Renderiza a mensagem somente quando algum fluxo produziu erro. */}
        {combinedError && <div className="form-error">{combinedError}</div>}

        {/* As ações de nova análise e cadastro manual só aparecem após selecionar um arquivo. */}
        {selectedFile && (
          <div className="import-actions">
            {/* Impede nova análise enquanto a requisição atual está em andamento. */}
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

      {/* A área de revisão só existe quando há linhas extraídas ou adicionadas manualmente. */}
      {extractedItems.length > 0 && (
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Revisão</div>
              <h3 className="panel-title">Lançamentos identificados</h3>
            </div>
          </div>

          {/* Delega edição, remoção e criação de categorias ao componente de tabela. */}
          <LancamentosExtraidosTable
            itens={extractedItems}
            categorias={categorias}
            onChange={handleChange}
            onRemove={handleRemove}
            onCreateCategory={async (nome, tipo) => {
              // Encaminha os dados ao callback do pai e devolve a categoria criada à tabela.
              const categoriaCriada = await onCreateCategoria(nome, tipo);
              return categoriaCriada;
            }}
          />

          {/* A confirmação envia as linhas válidas; fica desabilitada durante a análise. */}
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
