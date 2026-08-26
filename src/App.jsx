import { useEffect, useMemo, useState } from "react";
import "./App.css";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DEFAULT_CATEGORIAS = [
  { id: "cat_1", nome: "Salário", tipo: "entrada" },
  { id: "cat_2", nome: "Freelas", tipo: "entrada" },
  { id: "cat_3", nome: "Outros Ganhos", tipo: "entrada" },
  { id: "cat_4", nome: "Mercado", tipo: "saida" },
  { id: "cat_5", nome: "Contas de Casa", tipo: "saida" },
  { id: "cat_6", nome: "Transporte", tipo: "saida" },
  { id: "cat_7", nome: "Saúde", tipo: "saida" },
  { id: "cat_8", nome: "Alimentação", tipo: "saida" },
  { id: "cat_9", nome: "Lazer", tipo: "saida" },
  { id: "cat_10", nome: "Educação", tipo: "saida" },
  { id: "cat_11", nome: "Outros Gastos", tipo: "saida" },
];

const emptyLancamentoForm = () => ({
  tipo: "saida",
  valor: "",
  categoriaId: "",
  data: todayISO(),
  descricao: "",
});

const emptyCategoriaForm = () => ({ nome: "", tipo: "saida" });

const emptyCompromissoForm = () => ({
  tipo: "cobranca",
  titulo: "",
  valor: "",
  data: todayISO(),
  nota: "",
});

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toISODate(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatCurrencyInput(value) {
  return Number(value || 0)
    .toFixed(2)
    .replace(".", ",");
}

function normalizeCurrencyInput(raw) {
  const value = String(raw).replace(/[^\d,\.]/g, "");
  if (!value) return "";

  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");
  const lastSep = Math.max(lastComma, lastDot);

  let intDigits = "";
  let decDigits = "";
  let hasDecimal = false;

  if (lastSep === -1) {
    intDigits = value;
  } else if (lastComma !== -1 && lastDot !== -1) {
    intDigits = value.slice(0, lastSep).replace(/\D/g, "");
    decDigits = value
      .slice(lastSep + 1)
      .replace(/\D/g, "")
      .slice(0, 2);
    hasDecimal = true;
  } else {
    const after = value.slice(lastSep + 1).replace(/\D/g, "");
    const before = value.slice(0, lastSep).replace(/\D/g, "");
    const isThousandsDot =
      lastDot !== -1 && lastComma === -1 && after.length >= 3;

    if (isThousandsDot) {
      intDigits = before + after;
    } else {
      intDigits = before;
      decDigits = after.slice(0, 2);
      hasDecimal = true;
    }
  }

  if (hasDecimal) return intDigits + "," + decDigits;
  return intDigits;
}

function parseCurrency(str) {
  if (!str) return 0;
  const normalized = normalizeCurrencyInput(str).replace(",", ".");
  return Number.parseFloat(normalized || "0") || 0;
}

function generateId() {
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("tia-financeira-theme");
    return saved === "light" ? "light" : "dark";
  });

  const [categorias, setCategorias] = useState(() => {
    try {
      const saved = localStorage.getItem("tia-financeira-data");
      if (!saved) return DEFAULT_CATEGORIAS;
      const parsed = JSON.parse(saved);
      return parsed.categorias?.length ? parsed.categorias : DEFAULT_CATEGORIAS;
    } catch {
      return DEFAULT_CATEGORIAS;
    }
  });

  const [lancamentos, setLancamentos] = useState(() => {
    try {
      const saved = localStorage.getItem("tia-financeira-data");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.lancamentos || [];
    } catch {
      return [];
    }
  });

  const [compromissos, setCompromissos] = useState(() => {
    try {
      const saved = localStorage.getItem("tia-financeira-data");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.compromissos || [];
    } catch {
      return [];
    }
  });

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentTab, setCurrentTab] = useState("lancamentos");
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isCompromissoModalOpen, setIsCompromissoModalOpen] = useState(false);
  const [isOpeningAlertVisible, setIsOpeningAlertVisible] = useState(false);
  const [editingLancamentoId, setEditingLancamentoId] = useState(null);
  const [editingCategoriaId, setEditingCategoriaId] = useState(null);
  const [editingCompromissoId, setEditingCompromissoId] = useState(null);
  const [lancamentoForm, setLancamentoForm] = useState(emptyLancamentoForm());
  const [categoriaForm, setCategoriaForm] = useState(emptyCategoriaForm());
  const [compromissoForm, setCompromissoForm] = useState(
    emptyCompromissoForm(),
  );

  useEffect(() => {
    localStorage.setItem(
      "tia-financeira-data",
      JSON.stringify({ categorias, lancamentos, compromissos }),
    );
  }, [categorias, lancamentos, compromissos]);

  useEffect(() => {
    localStorage.setItem("tia-financeira-theme", theme);
  }, [theme]);

  const lancamentosMes = useMemo(
    () =>
      lancamentos
        .filter((l) => {
          const d = new Date(l.data + "T00:00:00");
          return (
            d.getMonth() === currentMonth && d.getFullYear() === currentYear
          );
        })
        .sort((a, b) => b.data.localeCompare(a.data)),
    [currentMonth, currentYear, lancamentos],
  );

  const compromissosMes = useMemo(
    () =>
      compromissos
        .filter((c) => {
          const d = new Date(c.data + "T00:00:00");
          return (
            d.getMonth() === currentMonth && d.getFullYear() === currentYear
          );
        })
        .sort((a, b) => a.data.localeCompare(b.data)),
    [compromissos, currentMonth, currentYear],
  );

  const compromissosCriticos = useMemo(
    () =>
      compromissos.filter((compromisso) => {
        const status = getCompromissoStatus(compromisso);
        return status.className === "vencido" || status.className === "hoje";
      }),
    [compromissos],
  );

  useEffect(() => {
    if (compromissosCriticos.length === 0) {
      setIsOpeningAlertVisible(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsOpeningAlertVisible(true);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [compromissosCriticos.length]);

  const totalEntradas = lancamentosMes
    .filter((l) => l.tipo === "entrada")
    .reduce((sum, l) => sum + Number(l.valor || 0), 0);

  const totalSaidas = lancamentosMes
    .filter((l) => l.tipo === "saida")
    .reduce((sum, l) => sum + Number(l.valor || 0), 0);

  const saldoMes = totalEntradas - totalSaidas;

  function changeMonth(delta) {
    let nextMonth = currentMonth + delta;
    let nextYear = currentYear;

    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    } else if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    }

    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  }

  function goToCurrentMonth() {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  }

  function changeTab(nextTab) {
    if (nextTab === currentTab) return;

    if (typeof document.startViewTransition === "function") {
      document.startViewTransition(() => setCurrentTab(nextTab));
      return;
    }

    setCurrentTab(nextTab);
  }

  function openLancamentoModal(item = null) {
    if (item) {
      setEditingLancamentoId(item.id);
      setLancamentoForm({
        tipo: item.tipo,
        valor: formatCurrencyInput(item.valor),
        categoriaId: item.categoriaId,
        data: item.data,
        descricao: item.descricao || "",
      });
    } else {
      setEditingLancamentoId(null);
      setLancamentoForm(emptyLancamentoForm());
    }
    setIsLancamentoModalOpen(true);
  }

  function closeLancamentoModal() {
    setIsLancamentoModalOpen(false);
    setEditingLancamentoId(null);
    setLancamentoForm(emptyLancamentoForm());
  }

  function openCategoriaModal(item = null) {
    if (item) {
      setEditingCategoriaId(item.id);
      setCategoriaForm({ nome: item.nome, tipo: item.tipo });
    } else {
      setEditingCategoriaId(null);
      setCategoriaForm(emptyCategoriaForm());
    }
    setIsCategoriaModalOpen(true);
  }

  function closeCategoriaModal() {
    setIsCategoriaModalOpen(false);
    setEditingCategoriaId(null);
    setCategoriaForm(emptyCategoriaForm());
  }

  function openCompromissoModal(item = null) {
    if (item) {
      setEditingCompromissoId(item.id);
      setCompromissoForm({
        tipo: item.tipo,
        titulo: item.titulo,
        valor: formatCurrencyInput(item.valor),
        data: item.data,
        nota: item.nota || "",
      });
    } else {
      setEditingCompromissoId(null);
      setCompromissoForm(emptyCompromissoForm());
    }
    setIsCompromissoModalOpen(true);
  }

  function closeCompromissoModal() {
    setIsCompromissoModalOpen(false);
    setEditingCompromissoId(null);
    setCompromissoForm(emptyCompromissoForm());
  }

  function saveLancamento(event) {
    event.preventDefault();

    const valor = parseCurrency(lancamentoForm.valor);
    if (!valor || valor <= 0) return;
    if (!lancamentoForm.categoriaId) return;
    if (!lancamentoForm.data) return;

    const payload = {
      tipo: lancamentoForm.tipo,
      valor,
      categoriaId: lancamentoForm.categoriaId,
      data: lancamentoForm.data,
      descricao: lancamentoForm.descricao.trim(),
    };

    if (editingLancamentoId) {
      setLancamentos((prev) =>
        prev.map((item) =>
          item.id === editingLancamentoId ? { ...item, ...payload } : item,
        ),
      );
    } else {
      setLancamentos((prev) => [...prev, { id: generateId(), ...payload }]);
    }

    closeLancamentoModal();
  }

  function deleteLancamento(id) {
    if (!window.confirm("Tem certeza que quer excluir este lançamento?"))
      return;
    setLancamentos((prev) => prev.filter((item) => item.id !== id));
  }

  function saveCategoria(event) {
    event.preventDefault();
    const nome = categoriaForm.nome.trim();
    if (!nome) return;

    const duplicada = categorias.some(
      (c) =>
        c.id !== editingCategoriaId &&
        c.tipo === categoriaForm.tipo &&
        c.nome.toLowerCase() === nome.toLowerCase(),
    );

    if (duplicada) {
      window.alert("Já existe uma categoria com esse nome neste tipo.");
      return;
    }

    if (editingCategoriaId) {
      setCategorias((prev) =>
        prev.map((item) =>
          item.id === editingCategoriaId ? { ...item, nome } : item,
        ),
      );
    } else {
      setCategorias((prev) => [
        ...prev,
        { id: generateId(), nome, tipo: categoriaForm.tipo },
      ]);
    }

    closeCategoriaModal();
  }

  function deleteCategoria(id) {
    const categoria = categorias.find((item) => item.id === id);
    if (!categoria) return;

    const usadas = lancamentos.filter((l) => l.categoriaId === id).length;
    const mensagem =
      usadas > 0
        ? `A categoria "${categoria.nome}" está em ${usadas} lançamento(s). Quer mesmo excluir?`
        : `Excluir a categoria "${categoria.nome}"?`;

    if (!window.confirm(mensagem)) return;
    setCategorias((prev) => prev.filter((item) => item.id !== id));
  }

  function saveCompromisso(event) {
    event.preventDefault();

    const valor = parseCurrency(compromissoForm.valor);
    if (!compromissoForm.titulo.trim()) return;
    if (!valor || valor <= 0) return;
    if (!compromissoForm.data) return;

    const payload = {
      tipo: compromissoForm.tipo,
      titulo: compromissoForm.titulo.trim(),
      valor,
      data: compromissoForm.data,
      nota: compromissoForm.nota.trim(),
    };

    if (editingCompromissoId) {
      setCompromissos((prev) =>
        prev.map((item) =>
          item.id === editingCompromissoId ? { ...item, ...payload } : item,
        ),
      );
    } else {
      setCompromissos((prev) => [...prev, { id: generateId(), ...payload }]);
    }

    closeCompromissoModal();
  }

  function deleteCompromisso(id) {
    if (!window.confirm("Tem certeza que quer excluir este compromisso?"))
      return;
    setCompromissos((prev) => prev.filter((item) => item.id !== id));
  }

  function handleThemeToggle() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  function getCategoriaOptions(tipo) {
    return categorias.filter((item) => item.tipo === tipo);
  }

  const filtroResumo = useMemo(() => {
    const entradas = lancamentosMes.filter((l) => l.tipo === "entrada");
    const saidas = lancamentosMes.filter((l) => l.tipo === "saida");

    return {
      entradas,
      saidas,
      totalEntradas: entradas.reduce((sum, l) => sum + Number(l.valor || 0), 0),
      totalSaidas: saidas.reduce((sum, l) => sum + Number(l.valor || 0), 0),
    };
  }, [lancamentosMes]);

  const historicoMeses = useMemo(() => {
    const hoje = new Date();
    const array = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(hoje.getFullYear(), hoje.getMonth() - offset, 1);
      const mes = date.getMonth();
      const ano = date.getFullYear();
      const itens = lancamentos.filter((l) => {
        const d = new Date(l.data + "T00:00:00");
        return d.getMonth() === mes && d.getFullYear() === ano;
      });

      const entradas = itens
        .filter((l) => l.tipo === "entrada")
        .reduce((sum, l) => sum + Number(l.valor || 0), 0);
      const saidas = itens
        .filter((l) => l.tipo === "saida")
        .reduce((sum, l) => sum + Number(l.valor || 0), 0);

      array.push({
        label: `${MESES[mes]} ${ano}`,
        entradas,
        saidas,
        saldo: entradas - saidas,
        totalLancamentos: itens.length,
        isCurrent: mes === currentMonth && ano === currentYear,
      });
    }

    return array.filter((item) => item.totalLancamentos > 0);
  }, [currentMonth, currentYear, lancamentos]);

  function groupByDate(items) {
    const groups = {};
    items.forEach((item) => {
      if (!groups[item.data]) groups[item.data] = [];
      groups[item.data].push(item);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({ date, items: groups[date] }));
  }

  function agruparPorCategoria(items) {
    const map = {};
    items.forEach((item) => {
      if (!map[item.categoriaId]) {
        const categoria = categorias.find((c) => c.id === item.categoriaId);
        map[item.categoriaId] = {
          nome: categoria ? categoria.nome : "Sem categoria",
          total: 0,
        };
      }
      map[item.categoriaId].total += Number(item.valor || 0);
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }

  function getCompromissoStatus(compromisso) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const data = new Date(compromisso.data + "T00:00:00");
    const diferencaDias = Math.ceil((data - hoje) / 86400000);

    if (diferencaDias < 0) return { label: "Vencido", className: "vencido" };
    if (diferencaDias === 0) return { label: "Vence hoje", className: "hoje" };
    if (diferencaDias <= 3) {
      return {
        label: `Vence em ${diferencaDias} dia${diferencaDias === 1 ? "" : "s"}`,
        className: "proximo",
      };
    }
    return { label: "A vencer", className: "a-vencer" };
  }

  function formatDateDisplay(dateStr) {
    const [year, month, day] = dateStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) return "Hoje";
    if (date.getTime() === yesterday.getTime()) return "Ontem";

    return `${date.getDate()} de ${MESES[date.getMonth()]}`;
  }

  function renderLancamentosTab() {
    if (lancamentosMes.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">Nenhum lançamento neste mês</div>
          <div className="empty-state-text">
            Toque no botão <strong>+</strong> para registrar sua primeira
            entrada ou saída.
          </div>
        </div>
      );
    }

    return (
      <div className="date-groups">
        {groupByDate(lancamentosMes).map((group) => (
          <div key={group.date} className="date-group">
            <div className="date-group-header">
              {formatDateDisplay(group.date)}
            </div>
            <div className="lancamentos-list">
              {group.items.map((lancamento) => {
                const categoria = categorias.find(
                  (c) => c.id === lancamento.categoriaId,
                );
                const categoriaNome = categoria
                  ? categoria.nome
                  : "Sem categoria";
                const shouldBePositive = lancamento.tipo === "entrada";

                return (
                  <div
                    key={lancamento.id}
                    className="lancamento-item"
                    onClick={() => openLancamentoModal(lancamento)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openLancamentoModal(lancamento);
                      }
                    }}
                  >
                    <div className={`lancamento-icon ${lancamento.tipo}`}>
                      {lancamento.tipo === "entrada" ? "↑" : "↓"}
                    </div>
                    <div className="lancamento-info">
                      <div className="lancamento-categoria">
                        {escapeHtml(categoriaNome)}
                      </div>
                      {lancamento.descricao ? (
                        <div className="lancamento-descricao">
                          {escapeHtml(lancamento.descricao)}
                        </div>
                      ) : null}
                    </div>
                    <div className={`lancamento-valor ${lancamento.tipo}`}>
                      {shouldBePositive ? "+" : "-"}{" "}
                      {formatCurrency(lancamento.valor)}
                    </div>
                    <button
                      type="button"
                      className="lancamento-delete"
                      aria-label="Excluir lançamento"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteLancamento(lancamento.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderResumoTab() {
    const categoriaEntradas = agruparPorCategoria(filtroResumo.entradas);
    const categoriaSaidas = agruparPorCategoria(filtroResumo.saidas);

    if (lancamentosMes.length === 0 && historicoMeses.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">Sem dados para o resumo</div>
          <div className="empty-state-text">
            Adicione lançamentos para ver o resumo por categoria deste mês.
          </div>
        </div>
      );
    }

    const totalEntradas = filtroResumo.totalEntradas || 1;
    const pizzaSegmentsEntradas = categoriaEntradas.map((categoria, index) => ({
      ...categoria,
      color: ["#bbf7d0", "#86efac", "#4ade80", "#22c55e", "#16a34a", "#166534"][
        index % 6
      ],
    }));
    let startEntradas = 0;
    const segsEntradas = pizzaSegmentsEntradas.map((segment) => {
      const percent = (segment.total / totalEntradas) * 100;
      const end = startEntradas + percent;
      const result = `${segment.color} ${startEntradas}% ${end}%`;
      startEntradas = end;
      return result;
    });

    const total = filtroResumo.totalSaidas || 1;
    const pizzaSegments = categoriaSaidas.map((categoria, index) => ({
      ...categoria,
      color: ["#fecaca", "#fca5a5", "#f87171", "#ef4444", "#dc2626", "#991b1b"][
        index % 6
      ],
    }));

    let start = 0;
    const segs = pizzaSegments.map((segment) => {
      const percent = (segment.total / total) * 100;
      const end = start + percent;
      const result = `${segment.color} ${start}% ${end}%`;
      start = end;
      return result;
    });

    return (
      <div className="resumo-sections">
        {categoriaEntradas.length > 0 && (
          <div className="resumo-section">
            <div className="resumo-section-title">↑ Entradas por categoria</div>
            {categoriaEntradas.map((categoria) => (
              <div key={categoria.nome} className="resumo-category-item">
                <span className="resumo-category-name">{categoria.nome}</span>
                <span className="resumo-category-value entrada">
                  + {formatCurrency(categoria.total)}
                </span>
              </div>
            ))}
            <div className="resumo-total-row">
              <span>Total Entradas</span>
              <span className="saldo-positivo">
                {formatCurrency(filtroResumo.totalEntradas)}
              </span>
            </div>

            <div className="resumo-section pizza-section">
              <div className="resumo-section-title">
                Distribuição das entradas
              </div>
              <div className="pizza-chart-layout">
                <div
                  className="pizza-chart"
                  style={{
                    background: `conic-gradient(${segsEntradas.join(", ")})`,
                  }}
                  aria-label="Distribuição das entradas por categoria"
                >
                  <div className="pizza-chart-center">
                    <span>Total</span>
                    <strong>
                      {formatCurrency(filtroResumo.totalEntradas)}
                    </strong>
                  </div>
                </div>

                <div className="pizza-legend">
                  {pizzaSegmentsEntradas.map((item) => (
                    <div key={item.nome} className="pizza-legend-item">
                      <span
                        className="pizza-legend-color"
                        style={{ background: item.color }}
                      ></span>
                      <span className="pizza-legend-name">{item.nome}</span>
                      <span className="pizza-legend-percent">
                        {((item.total / totalEntradas) * 100)
                          .toFixed(1)
                          .replace(".", ",")}
                        %
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {categoriaSaidas.length > 0 && (
          <>
            <div className="resumo-section">
              <div className="resumo-section-title">↓ Saídas por categoria</div>
              {categoriaSaidas.map((categoria) => (
                <div key={categoria.nome} className="resumo-category-item">
                  <span className="resumo-category-name">{categoria.nome}</span>
                  <span className="resumo-category-value saida">
                    − {formatCurrency(categoria.total)}
                  </span>
                </div>
              ))}
              <div className="resumo-total-row">
                <span>Total Saídas</span>
                <span className="saldo-negativo">
                  {formatCurrency(filtroResumo.totalSaidas)}
                </span>
              </div>
            </div>

            <div className="resumo-section pizza-section">
              <div className="resumo-section-title">
                🍕 Distribuição das saídas
              </div>
              <div className="pizza-chart-layout">
                <div
                  className="pizza-chart"
                  style={{
                    background: `conic-gradient(${segs.join(", ")})`,
                  }}
                  aria-label="Distribuição das saídas por categoria"
                >
                  <div className="pizza-chart-center">
                    <span>Total</span>
                    <strong>{formatCurrency(filtroResumo.totalSaidas)}</strong>
                  </div>
                </div>

                <div className="pizza-legend">
                  {pizzaSegments.map((item) => (
                    <div key={item.nome} className="pizza-legend-item">
                      <span
                        className="pizza-legend-color"
                        style={{ background: item.color }}
                      ></span>
                      <span className="pizza-legend-name">{item.nome}</span>
                      <span className="pizza-legend-percent">
                        {((item.total / total) * 100)
                          .toFixed(1)
                          .replace(".", ",")}
                        %
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="resumo-section">
          <div className="resumo-total-row" style={{ fontSize: "1.1rem" }}>
            <span>💰 Saldo do Mês</span>
            <span
              className={saldoMes >= 0 ? "saldo-positivo" : "saldo-negativo"}
            >
              {saldoMes >= 0 ? "+ " : "- "}
              {formatCurrency(Math.abs(saldoMes))}
            </span>
          </div>
        </div>

        {historicoMeses.length > 0 && (
          <div className="resumo-section">
            <div className="resumo-section-title">📅 Histórico entre meses</div>
            <div className="historico-chart-wrapper">
              <div className="historico-chart-legend" aria-hidden="true">
                <span><i className="historico-legend-swatch entrada"></i>Recebimentos</span>
                <span><i className="historico-legend-swatch saida"></i>Cobranças</span>
              </div>
              <div
                className="historico-chart"
                role="img"
                aria-label="Gráfico de colunas com recebimentos e cobranças dos últimos meses"
              >
                {historicoMeses.map((item) => {
                  const maiorValor = Math.max(
                    ...historicoMeses.flatMap((mes) => [mes.entradas, mes.saidas]),
                    1,
                  );
                  const nomeMes = item.label.split(" ")[0];
                  return (
                    <div
                      key={item.label}
                      className={`historico-column-group ${item.isCurrent ? "current" : ""}`}
                      title={`${item.label}: recebimentos ${formatCurrency(item.entradas)}, cobranças ${formatCurrency(item.saidas)}`}
                    >
                      <div className="historico-bars">
                        <span
                          className="historico-bar entrada"
                          style={{ height: `${(item.entradas / maiorValor) * 100}%` }}
                        ></span>
                        <span
                          className="historico-bar saida"
                          style={{ height: `${(item.saidas / maiorValor) * 100}%` }}
                        ></span>
                      </div>
                      <span className="historico-column-label">{nomeMes}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderCategoriasTab() {
    const entradas = categorias.filter((c) => c.tipo === "entrada");
    const saidas = categorias.filter((c) => c.tipo === "saida");

    return (
      <div>
        <p className="categorias-hint">
          Toque numa categoria para editar o nome. O tipo (entrada ou saída) não
          muda depois de criada.
        </p>
        <button
          type="button"
          className="btn-primary btn-nova-categoria"
          onClick={() => openCategoriaModal()}
        >
          + Nova categoria
        </button>

        <div className="resumo-section">
          <div className="resumo-section-title">↑ Categorias de entrada</div>
          <div className="categorias-list">
            {entradas.length === 0 ? (
              <div className="categorias-empty">
                Nenhuma categoria de entrada ainda.
              </div>
            ) : (
              entradas.map((categoria) => {
                const usadas = lancamentos.filter(
                  (l) => l.categoriaId === categoria.id,
                ).length;
                return (
                  <div
                    key={categoria.id}
                    className="categoria-item"
                    onClick={() => openCategoriaModal(categoria)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openCategoriaModal(categoria);
                      }
                    }}
                  >
                    <div className="lancamento-icon entrada">↑</div>
                    <div className="lancamento-info">
                      <div className="lancamento-categoria">
                        {categoria.nome}
                      </div>
                      <div className="lancamento-descricao">
                        {usadas === 0
                          ? "Ainda não usada"
                          : `${usadas} lançamento${usadas === 1 ? "" : "s"}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="categoria-delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteCategoria(categoria.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="resumo-section">
          <div className="resumo-section-title">↓ Categorias de saída</div>
          <div className="categorias-list">
            {saidas.length === 0 ? (
              <div className="categorias-empty">
                Nenhuma categoria de saída ainda.
              </div>
            ) : (
              saidas.map((categoria) => {
                const usadas = lancamentos.filter(
                  (l) => l.categoriaId === categoria.id,
                ).length;
                return (
                  <div
                    key={categoria.id}
                    className="categoria-item"
                    onClick={() => openCategoriaModal(categoria)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openCategoriaModal(categoria);
                      }
                    }}
                  >
                    <div className="lancamento-icon saida">↓</div>
                    <div className="lancamento-info">
                      <div className="lancamento-categoria">
                        {categoria.nome}
                      </div>
                      <div className="lancamento-descricao">
                        {usadas === 0
                          ? "Ainda não usada"
                          : `${usadas} lançamento${usadas === 1 ? "" : "s"}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="categoria-delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteCategoria(categoria.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderCalendarioTab() {
    const diasDoMes = new Date(currentYear, currentMonth + 1, 0).getDate();
    const primeiroDia = new Date(currentYear, currentMonth, 1);
    const diaDaSemana = (primeiroDia.getDay() + 6) % 7;
    const diasMesAnterior = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    for (let i = 0; i < diaDaSemana; i += 1) {
      const numero = diasMesAnterior - diaDaSemana + i + 1;
      cells.push(
        <div key={`prev-${numero}`} className="calendar-day muted">
          <span className="day-number">{numero}</span>
        </div>,
      );
    }

    for (let dia = 1; dia <= diasDoMes; dia += 1) {
      const data = toISODate(currentYear, currentMonth, dia);
      const eventos = compromissos.filter((item) => item.data === data);
      const hoje = new Date();
      const isHoje =
        dia === hoje.getDate() &&
        currentMonth === hoje.getMonth() &&
        currentYear === hoje.getFullYear();

      const dots = eventos.slice(0, 3).map((evento) => (
        <span
          key={`${data}-${evento.id}`}
          className={`calendar-event-image ${evento.tipo === "recebimento" ? "recebimento" : "cobranca"}`}
          title={evento.titulo}
        >
          {evento.tipo === "recebimento" ? "↑" : "↓"}
        </span>
      ));

      cells.push(
        <div
          key={data}
          className={`calendar-day ${isHoje ? "today" : ""} ${eventos.length ? "has-events" : ""}`}
        >
          <span className="day-number">{dia}</span>
          <div className="calendar-day-events">
            {dots}
            {eventos.length > 3 && (
              <span className="calendar-more">+{eventos.length - 3}</span>
            )}
          </div>
        </div>,
      );
    }

    const restante = 42 - cells.length;
    for (let i = 1; i <= restante; i += 1) {
      cells.push(
        <div key={`next-${i}`} className="calendar-day muted">
          <span className="day-number">{i}</span>
        </div>,
      );
    }

    return (
      <div className="calendario-wrapper">
        <div className="calendario-header">
          <div className="calendario-legend">
            <span>
              <i className="legend-dot recebimento"></i> Recebimento
            </span>
            <span>
              <i className="legend-dot cobranca"></i> Cobrança
            </span>
          </div>
          <button
            type="button"
            className="btn-primary btn-nova-categoria"
            onClick={() => openCompromissoModal()}
          >
            + Novo compromisso
          </button>
        </div>

        <div className="calendar-weekdays">
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sab</span>
          <span>Dom</span>
        </div>

        <div className="calendar-grid">{cells}</div>

        <div className="compromisso-section">
          <div className="resumo-section-title">Compromissos do mês</div>
          <div className="compromisso-list">
            {compromissosMes.length === 0 ? (
              <div className="empty-state compact">
                <div className="empty-state-icon">📌</div>
                <div className="empty-state-title">
                  Sem compromissos neste mês
                </div>
                <div className="empty-state-text">
                  Use o botão + para cadastrar um recebimento ou cobrança.
                </div>
              </div>
            ) : (
              compromissosMes.map((compromisso) => {
                const status = getCompromissoStatus(compromisso);

                return (
                  <div
                    key={compromisso.id}
                    className={`compromisso-item ${status.className}`}
                    onClick={() => openCompromissoModal(compromisso)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openCompromissoModal(compromisso);
                      }
                    }}
                  >
                    <div className="compromisso-header">
                      <span className={`status-badge ${status.className}`}>
                        {status.label}
                      </span>
                      <button
                        type="button"
                        className="compromisso-delete"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteCompromisso(compromisso.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="compromisso-line">
                      <span
                        className={`compromisso-type ${compromisso.tipo === "recebimento" ? "recebimento" : "cobranca"}`}
                      >
                        {compromisso.tipo === "recebimento"
                          ? "Recebimento"
                          : "Cobrança"}
                      </span>
                      <strong>{compromisso.titulo}</strong>
                    </div>
                    <div className="compromisso-meta">
                      {formatDateDisplay(compromisso.data)} ·{" "}
                      {formatCurrency(compromisso.valor)}
                    </div>
                    {compromisso.nota && (
                      <div className="compromisso-nota">{compromisso.nota}</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${theme === "light" ? "theme-light" : ""}`}>
      <header className="app-header">
        <div className="brand-group">
          <h1 className="app-logo">🐶 Tia Financeira</h1>
          <label className="theme-switch" htmlFor="theme-toggle">
            <input
              id="theme-toggle"
              type="checkbox"
              checked={theme === "light"}
              onChange={handleThemeToggle}
            />
            <span className="theme-slider"></span>
            <span className="theme-label">Claro</span>
          </label>
        </div>

        <div className="header-actions">
          <div
            className="month-nav"
            style={{ display: currentTab === "categorias" ? "none" : "flex" }}
          >
            <button
              type="button"
              className="btn-icon"
              onClick={() => changeMonth(-1)}
              aria-label="Mês anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="btn-today"
              onClick={goToCurrentMonth}
            >
              Este mês
            </button>
            <span className="month-label">
              {MESES[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              className="btn-icon"
              onClick={() => changeMonth(1)}
              aria-label="Próximo mês"
            >
              ›
            </button>
          </div>
        </div>
      </header>

      <nav className="tab-bar" aria-label="Menu principal">
        {[
          { key: "resumo", label: "Resumo" },
          { key: "lancamentos", label: "Lançamentos" },
          { key: "categorias", label: "Categorias" },
          { key: "calendario", label: "Calendário" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab ${currentTab === tab.key ? "active" : ""}`}
            onClick={() => changeTab(tab.key)}
          >
            <span aria-hidden="true">
              {tab.key === "lancamentos"
                ? "🧾︎"
                : tab.key === "resumo"
                  ? "📊︎"
                  : tab.key === "categorias"
                    ? "🏷︎"
                    : "📅︎"}
            </span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {isOpeningAlertVisible && compromissosCriticos.length > 0 && (
        <section className="opening-alert" role="alert" aria-live="polite">
          <div className="opening-alert-icon" aria-hidden="true">
            !
          </div>
          <div className="opening-alert-content">
            <strong>
              {compromissosCriticos.length === 1
                ? "Você tem um compromisso vencido ou vencendo hoje"
                : `Você tem ${compromissosCriticos.length} compromissos vencidos ou vencendo hoje`}
            </strong>
            <span>
              {compromissosCriticos
                .slice(0, 2)
                .map((compromisso) => compromisso.titulo)
                .join(" • ")}
              {compromissosCriticos.length > 2 ? " • e outros" : ""}
            </span>
            <button
              type="button"
              className="opening-alert-action"
              onClick={() => {
                changeTab("calendario");
                setIsOpeningAlertVisible(false);
              }}
            >
              Ver compromissos
            </button>
          </div>
          <button
            type="button"
            className="opening-alert-close"
            aria-label="Fechar alerta"
            title="Fechar alerta"
            onClick={() => setIsOpeningAlertVisible(false)}
          >
            ×
          </button>
        </section>
      )}

      {currentTab !== "categorias" && (
        <section className="summary-cards">
          <div className="card card-entrada">
            <span className="card-label">Entradas</span>
            <span className="card-value">{formatCurrency(totalEntradas)}</span>
          </div>
          <div className="card card-saida">
            <span className="card-label">Saídas</span>
            <span className="card-value">{formatCurrency(totalSaidas)}</span>
          </div>
          <div
            className={`card card-saldo ${saldoMes >= 0 ? "positive" : "negative"}`}
          >
            <span className="card-label">Saldo</span>
            <span className="card-value">{formatCurrency(saldoMes)}</span>
          </div>
        </section>
      )}

      <main className="tab-content">
        {currentTab === "lancamentos" && renderLancamentosTab()}
        {currentTab === "resumo" && renderResumoTab()}
        {currentTab === "categorias" && renderCategoriasTab()}
        {currentTab === "calendario" && renderCalendarioTab()}
      </main>

      <button
        type="button"
        className="fab"
        aria-label={
          currentTab === "categorias"
            ? "Nova categoria"
            : currentTab === "calendario"
              ? "Novo compromisso"
              : "Novo lançamento"
        }
        title={
          currentTab === "categorias"
            ? "Nova categoria"
            : currentTab === "calendario"
              ? "Novo compromisso"
              : "Novo lançamento"
        }
        onClick={() => {
          if (currentTab === "categorias") openCategoriaModal();
          else if (currentTab === "calendario") openCompromissoModal();
          else openLancamentoModal();
        }}
      >
        +
      </button>

      {isLancamentoModalOpen && (
        <div
          className="modal-overlay visible"
          onClick={(event) =>
            event.target === event.currentTarget && closeLancamentoModal()
          }
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <h2 id="modal-title">
                {editingLancamentoId ? "Editar Lançamento" : "Novo Lançamento"}
              </h2>
              <button
                type="button"
                className="btn-icon btn-close"
                onClick={closeLancamentoModal}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form className="form" onSubmit={saveLancamento}>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${lancamentoForm.tipo === "entrada" ? "active" : ""}`}
                    onClick={() =>
                      setLancamentoForm((prev) => ({
                        ...prev,
                        tipo: "entrada",
                        categoriaId: "",
                      }))
                    }
                  >
                    ↑ Entrada
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${lancamentoForm.tipo === "saida" ? "active" : ""}`}
                    onClick={() =>
                      setLancamentoForm((prev) => ({
                        ...prev,
                        tipo: "saida",
                        categoriaId: "",
                      }))
                    }
                  >
                    ↓ Saída
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-valor">
                  Valor (R$)
                </label>
                <input
                  id="input-valor"
                  className="form-input input-valor"
                  value={lancamentoForm.valor}
                  onChange={(event) =>
                    setLancamentoForm((prev) => ({
                      ...prev,
                      valor: normalizeCurrencyInput(event.target.value),
                    }))
                  }
                  placeholder="0,00"
                  inputMode="decimal"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="select-categoria">
                  Categoria
                </label>
                <select
                  id="select-categoria"
                  className="form-input"
                  value={lancamentoForm.categoriaId}
                  onChange={(event) =>
                    setLancamentoForm((prev) => ({
                      ...prev,
                      categoriaId: event.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Selecione...</option>
                  {getCategoriaOptions(lancamentoForm.tipo).map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-data">
                  Data
                </label>
                <input
                  id="input-data"
                  type="date"
                  className="form-input"
                  value={lancamentoForm.data}
                  onChange={(event) =>
                    setLancamentoForm((prev) => ({
                      ...prev,
                      data: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-descricao">
                  Descrição <span className="optional">(opcional)</span>
                </label>
                <input
                  id="input-descricao"
                  className="form-input"
                  value={lancamentoForm.descricao}
                  onChange={(event) =>
                    setLancamentoForm((prev) => ({
                      ...prev,
                      descricao: event.target.value,
                    }))
                  }
                  placeholder="Ex: Compras da semana"
                />
              </div>

              <button type="submit" className="btn-primary">
                Salvar Lançamento
              </button>
            </form>
          </div>
        </div>
      )}

      {isCategoriaModalOpen && (
        <div
          className="modal-overlay visible"
          onClick={(event) =>
            event.target === event.currentTarget && closeCategoriaModal()
          }
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-categoria-title"
          >
            <div className="modal-header">
              <h2 id="modal-categoria-title">
                {editingCategoriaId ? "Editar Categoria" : "Nova Categoria"}
              </h2>
              <button
                type="button"
                className="btn-icon btn-close"
                onClick={closeCategoriaModal}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form className="form" onSubmit={saveCategoria}>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${categoriaForm.tipo === "entrada" ? "active" : ""}`}
                    onClick={() =>
                      setCategoriaForm((prev) => ({ ...prev, tipo: "entrada" }))
                    }
                  >
                    ↑ Entrada
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${categoriaForm.tipo === "saida" ? "active" : ""}`}
                    onClick={() =>
                      setCategoriaForm((prev) => ({ ...prev, tipo: "saida" }))
                    }
                  >
                    ↓ Saída
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-categoria-nome">
                  Nome
                </label>
                <input
                  id="input-categoria-nome"
                  className="form-input"
                  value={categoriaForm.nome}
                  onChange={(event) =>
                    setCategoriaForm((prev) => ({
                      ...prev,
                      nome: event.target.value,
                    }))
                  }
                  placeholder="Ex: Mercado, Salário..."
                  required
                />
              </div>

              <button type="submit" className="btn-primary">
                Salvar Categoria
              </button>
            </form>
          </div>
        </div>
      )}

      {isCompromissoModalOpen && (
        <div
          className="modal-overlay visible"
          onClick={(event) =>
            event.target === event.currentTarget && closeCompromissoModal()
          }
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-compromisso-title"
          >
            <div className="modal-header">
              <h2 id="modal-compromisso-title">
                {editingCompromissoId
                  ? "Editar Compromisso"
                  : "Novo Compromisso"}
              </h2>
              <button
                type="button"
                className="btn-icon btn-close"
                onClick={closeCompromissoModal}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form className="form" onSubmit={saveCompromisso}>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${compromissoForm.tipo === "recebimento" ? "active" : ""}`}
                    onClick={() =>
                      setCompromissoForm((prev) => ({
                        ...prev,
                        tipo: "recebimento",
                      }))
                    }
                  >
                    ↑ Recebimento
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${compromissoForm.tipo === "cobranca" ? "active" : ""}`}
                    onClick={() =>
                      setCompromissoForm((prev) => ({
                        ...prev,
                        tipo: "cobranca",
                      }))
                    }
                  >
                    ↓ Cobrança
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="input-compromisso-titulo"
                >
                  Título
                </label>
                <input
                  id="input-compromisso-titulo"
                  className="form-input"
                  value={compromissoForm.titulo}
                  onChange={(event) =>
                    setCompromissoForm((prev) => ({
                      ...prev,
                      titulo: event.target.value,
                    }))
                  }
                  placeholder="Ex: Salário, Conta de luz"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-compromisso-valor">
                  Valor (R$)
                </label>
                <input
                  id="input-compromisso-valor"
                  className="form-input"
                  value={compromissoForm.valor}
                  onChange={(event) =>
                    setCompromissoForm((prev) => ({
                      ...prev,
                      valor: normalizeCurrencyInput(event.target.value),
                    }))
                  }
                  placeholder="0,00"
                  inputMode="decimal"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-compromisso-data">
                  Data
                </label>
                <input
                  id="input-compromisso-data"
                  type="date"
                  className="form-input"
                  value={compromissoForm.data}
                  onChange={(event) =>
                    setCompromissoForm((prev) => ({
                      ...prev,
                      data: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-compromisso-nota">
                  Nota
                </label>
                <input
                  id="input-compromisso-nota"
                  className="form-input"
                  value={compromissoForm.nota}
                  onChange={(event) =>
                    setCompromissoForm((prev) => ({
                      ...prev,
                      nota: event.target.value,
                    }))
                  }
                  placeholder="Observação opcional"
                />
              </div>

              <button type="submit" className="btn-primary">
                Salvar Compromisso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
