import { useMemo } from "react";

function formatCurrency(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function toCurrencyInput(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value || 0);
  return Number.isFinite(number) ? number.toFixed(2).replace(".", ",") : "0,00";
}

function parseCurrencyString(value) {
  if (!value && value !== 0) return 0;

  const cleaned = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(".", "")
    .replace(",", ".");

  const number = Number.parseFloat(cleaned || "0");
  return Number.isFinite(number) ? number : 0;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("pt-BR");
}

export function LancamentosExtraidosTable({
  itens,
  categorias,
  onChange,
  onRemove,
  onCreateCategory,
}) {
  const resumo = useMemo(() => {
    const entradas = itens
      .filter((item) => item.tipo === "entrada")
      .reduce((sum, item) => sum + Number(item.valor || 0), 0);

    const saidas = itens
      .filter((item) => item.tipo === "saida")
      .reduce((sum, item) => sum + Number(item.valor || 0), 0);

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }, [itens]);

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

  return (
    <div className="extracted-review">
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

      <div className="table-shell extracted-table-shell">
        <div className="table-header extracted-table-header">
          <span>Data</span>
          <span>Tipo</span>
          <span>Categoria</span>
          <span>Valor</span>
          <span>Descrição</span>
          <span>Ação</span>
        </div>

        {itens.map((item) => {
          const options = categorias.filter(
            (categoria) => categoria.tipo === item.tipo,
          );

          return (
            <div key={item.id} className="table-row extracted-table-row">
              <div className="field-group">
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
                <select
                  className="form-input small"
                  value={item.tipo}
                  onChange={(event) => {
                    const nextTipo = event.target.value;
                    onChange(item.id, "tipo", nextTipo);
                    const categoriaPadrao = categorias.find(
                      (categoria) =>
                        categoria.tipo === nextTipo &&
                        categoria.nome === item.categoria_sugerida,
                    );
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
                <button
                  type="button"
                  className="btn-link"
                  onClick={async () => {
                    const nome = window.prompt(
                      "Digite o nome da nova categoria:",
                      item.categoria_sugerida ||
                        (item.tipo === "entrada"
                          ? "Outros Ganhos"
                          : "Outros Gastos"),
                    );

                    if (!nome) return;

                    const categoriaCriada = await onCreateCategory(
                      nome.trim(),
                      item.tipo,
                    );
                    if (categoriaCriada) {
                      onChange(item.id, "categoriaId", categoriaCriada.id);
                    }
                  }}
                >
                  + nova
                </button>
              </div>

              <div className="field-group">
                <input
                  className="form-input small"
                  value={toCurrencyInput(item.valor)}
                  inputMode="decimal"
                  onChange={(event) => {
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

      <div className="extracted-footer">
        <span className="muted-text">
          Última verificação:{" "}
          {formatDate(itens[0]?.data || new Date().toISOString().slice(0, 10))}
        </span>
      </div>
    </div>
  );
}
