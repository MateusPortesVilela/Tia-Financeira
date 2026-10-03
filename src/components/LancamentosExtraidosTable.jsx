// Importa o hook que memoriza um cálculo enquanto suas dependências não mudam.
import { useMemo } from "react";

// Recebe um valor numérico e devolve uma string monetária no formato brasileiro (R$).
// Valores vazios ou falsy viram zero; erros de formatação não são capturados nesta função.
function formatCurrency(valor) {
  // Converte o valor para número e aplica os separadores e o símbolo da moeda brasileira.
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Recebe um valor armazenado e devolve o texto adequado para um campo decimal editável.
// O formato com vírgula é escolhido para acompanhar a convenção de entrada pt-BR.
function toCurrencyInput(value) {
  // Mantém valores ausentes vazios para não exibir zero antes de haver um valor.
  if (value === null || value === undefined || value === "") {
    return "";
  }

  // Converte o valor para número; se for finito, mostra duas casas e troca o ponto por vírgula.
  const number = Number(value || 0);
  // Usa um texto numérico seguro caso a conversão produza NaN ou infinito.
  return Number.isFinite(number) ? number.toFixed(2).replace(".", ",") : "0,00";
}

// Recebe texto digitado em um campo monetário e devolve um número, usando zero como fallback.
// A remoção dos separadores e símbolos permite aceitar entradas como "R$ 1.234,56".
function parseCurrencyString(value) {
  // Trata texto vazio/nulo como zero, mas permite que o número 0 siga pelo parser normalmente.
  if (!value && value !== 0) return 0;

  // Mantém dígitos, vírgula, ponto e sinal; depois remove ponto de milhar e converte vírgula decimal.
  const cleaned = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(".", "")
    .replace(",", ".");

  // Interpreta o texto convertido e devolve zero quando o resultado não for um número finito.
  const number = Number.parseFloat(cleaned || "0");
  return Number.isFinite(number) ? number : 0;
}

// Recebe uma data em texto e devolve sua apresentação local; datas vazias viram um hífen.
function formatDate(dateString) {
  // Indica que não há data disponível sem exibir um valor inválido.
  if (!dateString) return "-";
  // Acrescenta horário local explícito para evitar deslocamento de fuso ao interpretar YYYY-MM-DD.
  const date = new Date(`${dateString}T00:00:00`);
  // Se a string não formar uma data válida, preserva o texto original para inspeção.
  if (Number.isNaN(date.getTime())) return dateString;
  // Formata a data válida conforme a convenção brasileira.
  return date.toLocaleDateString("pt-BR");
}

// Componente de revisão dos lançamentos extraídos; recebe dados e callbacks do componente pai.
// itens contém os lançamentos, categorias as opções, e os callbacks comunicam mudanças/remoções/criações.
// Os callbacks de edição e remoção não são capturados aqui: erros síncronos ficam a cargo do chamador.
export function LancamentosExtraidosTable({
  itens,
  categorias,
  onChange,
  onRemove,
  onCreateCategory,
}) {
  // Calcula totais somente quando a lista de itens muda, evitando repetir o trabalho em outras renderizações.
  const resumo = useMemo(() => {
    // Soma os valores de todos os lançamentos classificados como entrada.
    const entradas = itens
      .filter((item) => item.tipo === "entrada")
      .reduce((sum, item) => sum + Number(item.valor || 0), 0);

    // Soma os valores de todos os lançamentos classificados como saída.
    const saidas = itens
      .filter((item) => item.tipo === "saida")
      .reduce((sum, item) => sum + Number(item.valor || 0), 0);

    // Devolve os dois totais e o saldo líquido para a área de resumo.
    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
    // A lista é a dependência: quando ela muda, os três números são recalculados.
  }, [itens]);

  // Mostra uma orientação em vez de uma tabela quando não há lançamentos para revisar.
  if (!itens.length) {
    return (
      <div className="empty-state compact">
        <div className="empty-state-icon">📎</div>
        <div className="empty-state-title">Nenhum lançamento detectado</div>
        <div className="empty-state-text">
          Envie uma imagem legível ou insira o lançamento manualmente.
        </div>
      </div>
    );
  }

  // Com lançamentos disponíveis, mostra o resumo e uma linha editável para cada item.
  return (
    <div className="extracted-review">
      {/* Exibe os totais calculados acima; a classe do saldo indica visualmente seu sinal. */}
      <div className="summary-cards extracted-summary">
        <div className="card card-entrada">
          <span className="card-label">Entradas</span>
          <span className="card-value">{formatCurrency(resumo.entradas)}</span>
        </div>
        <div className="card card-saida">
          <span className="card-label">Saídas</span>
          <span className="card-value">{formatCurrency(resumo.saidas)}</span>
        </div>
        <div
          className={`card card-saldo ${resumo.saldo >= 0 ? "positive" : "negative"}`}
        >
          <span className="card-label">Saldo</span>
          <span className="card-value">{formatCurrency(resumo.saldo)}</span>
        </div>
      </div>

      {/* Cabeçalho visual da tabela, seguido pelas linhas montadas a partir da lista recebida. */}
      <div className="table-shell extracted-table-shell">
        <div className="table-header extracted-table-header">
          <span>Data</span>
          <span>Tipo</span>
          <span>Categoria</span>
          <span>Valor</span>
          <span>Descrição</span>
          <span>Ação</span>
        </div>

        {/* Filtra as categorias pelo tipo do lançamento para não oferecer opções incompatíveis. */}
        {itens.map((item) => {
          const options = categorias.filter(
            (categoria) => categoria.tipo === item.tipo,
          );

          // Cada linha mantém os campos controlados pelo estado do pai e informa alterações por callback.
          return (
            <div key={item.id} className="table-row extracted-table-row">
              <div className="field-group">
                {/* Campo de data: envia ao pai o ID do item, o nome do campo e o novo valor. */}
                <input
                  type="date"
                  className="form-input small"
                  value={item.data || ""}
                  onChange={(event) =>
                    onChange(item.id, "data", event.target.value)
                  }
                />
              </div>

              <div className="field-group">
                {/* Ao trocar entrada/saída, também tenta selecionar a categoria sugerida para o novo tipo. */}
                <select
                  className="form-input small"
                  value={item.tipo}
                  onChange={(event) => {
                    // Lê o novo tipo escolhido pelo usuário.
                    const nextTipo = event.target.value;
                    // Atualiza o tipo do lançamento no estado controlado pelo componente pai.
                    onChange(item.id, "tipo", nextTipo);
                    // Procura uma categoria compatível com o novo tipo e com a sugestão do item.
                    const categoriaPadrao = categorias.find(
                      (categoria) =>
                        categoria.tipo === nextTipo &&
                        categoria.nome === item.categoria_sugerida,
                    );
                    // Seleciona a categoria encontrada; se não houver correspondência, deixa sem seleção.
                    onChange(
                      item.id,
                      "categoriaId",
                      categoriaPadrao ? categoriaPadrao.id : "",
                    );
                  }}
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>

              <div className="field-group category-field">
                {/* Lista apenas as categorias compatíveis calculadas para este lançamento. */}
                <select
                  className="form-input small"
                  value={item.categoriaId || ""}
                  onChange={(event) =>
                    onChange(item.id, "categoriaId", event.target.value)
                  }
                >
                  <option value="">Selecione...</option>
                  {options.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
                {/* Solicita uma nova categoria e associa-a ao item se o callback devolver uma categoria. */}
                <button
                  type="button"
                  className="btn-link"
                  onClick={async () => {
                    // Usa o diálogo nativo do navegador, sugerindo a categoria extraída ou um nome padrão.
                    const nome = window.prompt(
                      "Digite o nome da nova categoria:",
                      item.categoria_sugerida ||
                        (item.tipo === "entrada"
                          ? "Outros Ganhos"
                          : "Outros Gastos"),
                    );

                    // Cancelar o diálogo ou enviar texto vazio interrompe a ação sem alterar o item.
                    if (!nome) return;

                    // Aguarda o pai criar a categoria; uma rejeição não é capturada aqui e propaga como erro.
                    const categoriaCriada = await onCreateCategory(
                      nome.trim(),
                      item.tipo,
                    );
                    // Quando a criação retorna uma categoria válida, seleciona seu ID para este lançamento.
                    if (categoriaCriada) {
                      onChange(item.id, "categoriaId", categoriaCriada.id);
                    }
                  }}
                >
                  + nova
                </button>
              </div>

              <div className="field-group">
                {/* Exibe o valor em formato local e converte cada edição de volta para número. */}
                <input
                  className="form-input small"
                  value={toCurrencyInput(item.valor)}
                  inputMode="decimal"
                  onChange={(event) => {
                    // Converte o texto digitado e encaminha um número finito, usando zero como fallback.
                    const nextValue = parseCurrencyString(event.target.value);
                    onChange(
                      item.id,
                      "valor",
                      Number.isFinite(nextValue) ? nextValue : 0,
                    );
                  }}
                />
              </div>

              <div className="field-group description-field">
                {/* Campo de texto controlado para revisar a descrição reconhecida ou informada. */}
                <input
                  className="form-input small"
                  value={item.descricao || ""}
                  onChange={(event) =>
                    onChange(item.id, "descricao", event.target.value)
                  }
                  placeholder="Ex: Mercado, salário..."
                />
              </div>

              <div className="field-group action-field">
                {/* Solicita ao pai que remova o item identificado pelo ID. */}
                <button
                  type="button"
                  className="btn-remove-row"
                  onClick={() => onRemove(item.id)}
                  title="Remover questo lançamento"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mostra a data do primeiro item, ou a data de hoje se o primeiro item não tiver data. */}
      <div className="extracted-footer">
        <span className="muted-text">
          Última verificação:{" "}
          {formatDate(itens[0]?.data || new Date().toISOString().slice(0, 10))}
        </span>
      </div>
    </div>
  );
}
