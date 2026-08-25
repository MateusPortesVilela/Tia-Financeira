import { db } from "./firebase-config.js";
import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ============================================
//  Meu Financeiro — App de Controle Mensal
//  Etapa 1–3: Lançamentos + Resumo + Categorias
// ============================================

const App = {
  // ---- State ----
  state: {
    categorias: [],
    lancamentos: [],
    compromissos: [],
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    currentTab: "lancamentos",
    editingId: null,
    editingCategoriaId: null,
    editingCompromissoId: null,
  },

  // Month names in Portuguese
  MESES: [
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
  ],

  // Default categories
  DEFAULT_CATEGORIAS: [
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
  ],

  // ================================================================
  //  INITIALIZATION
  // ================================================================

  async init() {
    await this.loadData();
    this.initTheme();
    this.bindEvents();
    this.render();
  },

  // ================================================================
  //  THEME
  // ================================================================

  initTheme() {
    const savedTheme = localStorage.getItem("meuFinanceiro-theme");
    const isLight = savedTheme === "light";
    const toggle = document.getElementById("theme-toggle");

    document.body.classList.toggle("theme-light", isLight);
    if (toggle) toggle.checked = isLight;
  },

  setTheme(isLight) {
    document.body.classList.toggle("theme-light", isLight);
    const toggle = document.getElementById("theme-toggle");
    if (toggle) toggle.checked = isLight;
    localStorage.setItem("meuFinanceiro-theme", isLight ? "light" : "dark");
  },

  // ================================================================
  //  DATA PERSISTENCE (localStorage)
  // ================================================================

  async loadData() {
    try {
      const saved = await getDoc(doc(db, "appData", "meuFinanceiro"));
      if (saved.exists()) {
        const data = saved.data();
        this.state.categorias = data.categorias || [];
        this.state.lancamentos = data.lancamentos || [];
        this.state.compromissos = data.compromissos || [];
      } else {
        this.state.categorias = [...this.DEFAULT_CATEGORIAS];
        await this.saveData();
      }
      localStorage.setItem("meuFinanceiro", JSON.stringify(this.getData()));
    } catch (e) {
      console.error("Erro ao carregar dados do Firebase:", e);
      const saved = localStorage.getItem("meuFinanceiro");
      if (saved) {
        const data = JSON.parse(saved);
        this.state.categorias = data.categorias || [];
        this.state.lancamentos = data.lancamentos || [];
        this.state.compromissos = data.compromissos || [];
      } else {
        this.state.categorias = [...this.DEFAULT_CATEGORIAS];
      }
      alert(
        "Não foi possível conectar ao Firebase. Os dados locais serão usados temporariamente.",
      );
    }
  },

  getData() {
    return {
      categorias: this.state.categorias,
      lancamentos: this.state.lancamentos,
      compromissos: this.state.compromissos,
    };
  },

  async saveData() {
    try {
      const data = this.getData();
      await setDoc(doc(db, "appData", "meuFinanceiro"), data);
      localStorage.setItem("meuFinanceiro", JSON.stringify(data));
    } catch (e) {
      console.error("Erro ao salvar dados no Firebase:", e);
      localStorage.setItem("meuFinanceiro", JSON.stringify(this.getData()));
      alert(
        "Não foi possível salvar no Firebase. Os dados foram mantidos localmente.",
      );
    }
  },

  // ================================================================
  //  EVENT BINDING
  // ================================================================

  bindEvents() {
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("change", (e) => {
        this.setTheme(e.target.checked);
      });
    }

    // Month navigation
    document
      .getElementById("btn-prev-month")
      .addEventListener("click", () => this.changeMonth(-1));
    document
      .getElementById("btn-next-month")
      .addEventListener("click", () => this.changeMonth(1));
    document
      .getElementById("btn-current-month")
      .addEventListener("click", () => this.goToCurrentMonth());

    // Tabs
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        if (e.target.disabled) return;
        this.state.currentTab = e.target.dataset.tab;
        this.render();
      });
    });

    // FAB
    document.getElementById("fab-add").addEventListener("click", () => {
      if (this.state.currentTab === "categorias") {
        this.openCategoriaModal();
      } else {
        this.openModal();
      }
    });

    // Modal close (lançamento)
    document
      .getElementById("btn-close-modal")
      .addEventListener("click", () => this.closeModal());
    document.getElementById("modal-overlay").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.closeModal();
    });

    // Modal close (categoria)
    document
      .getElementById("btn-close-categoria-modal")
      .addEventListener("click", () => this.closeCategoriaModal());
    document
      .getElementById("modal-categoria-overlay")
      .addEventListener("click", (e) => {
        if (e.target === e.currentTarget) this.closeCategoriaModal();
      });

    // Modal close (compromisso)
    document
      .getElementById("btn-close-compromisso-modal")
      .addEventListener("click", () => this.closeCompromissoModal());
    document
      .getElementById("modal-compromisso-overlay")
      .addEventListener("click", (e) => {
        if (e.target === e.currentTarget) this.closeCompromissoModal();
      });

    // Form tipo toggle
    document
      .getElementById("toggle-entrada")
      .addEventListener("click", () => this.setTipo("entrada"));
    document
      .getElementById("toggle-saida")
      .addEventListener("click", () => this.setTipo("saida"));

    document
      .getElementById("compromisso-toggle-recebimento")
      .addEventListener("click", () => this.setCompromissoTipo("recebimento"));
    document
      .getElementById("compromisso-toggle-cobranca")
      .addEventListener("click", () => this.setCompromissoTipo("cobranca"));

    // Form submit
    document
      .getElementById("form-lancamento")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveLancamento();
      });

    document
      .getElementById("form-categoria")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveCategoria();
      });

    document
      .getElementById("form-compromisso")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveCompromisso();
      });

    document
      .getElementById("cat-toggle-entrada")
      .addEventListener("click", () => this.setCategoriaTipo("entrada"));
    document
      .getElementById("cat-toggle-saida")
      .addEventListener("click", () => this.setCategoriaTipo("saida"));

    // Valor input mask
    document.getElementById("input-valor").addEventListener("input", (e) => {
      this.maskCurrency(e.target);
    });

    document
      .getElementById("input-compromisso-valor")
      .addEventListener("input", (e) => {
        this.maskCurrency(e.target);
      });

    // Keyboard: Escape to close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeModal();
        this.closeCategoriaModal();
        this.closeCompromissoModal();
      }
    });
  },

  // ================================================================
  //  MONTH NAVIGATION
  // ================================================================

  changeMonth(delta) {
    this.state.currentMonth += delta;
    if (this.state.currentMonth > 11) {
      this.state.currentMonth = 0;
      this.state.currentYear++;
    } else if (this.state.currentMonth < 0) {
      this.state.currentMonth = 11;
      this.state.currentYear--;
    }
    this.render();
  },

  goToCurrentMonth() {
    const today = new Date();
    this.state.currentMonth = today.getMonth();
    this.state.currentYear = today.getFullYear();
    this.render();
  },

  // ================================================================
  //  MODAL
  // ================================================================

  openModal(lancamento = null) {
    const overlay = document.getElementById("modal-overlay");
    const title = document.getElementById("modal-title");
    const form = document.getElementById("form-lancamento");

    overlay.classList.remove("hidden");
    overlay.classList.add("visible");
    document.getElementById("fab-add").classList.add("hidden");

    if (lancamento) {
      // Editing existing entry
      this.state.editingId = lancamento.id;
      title.textContent = "Editar Lançamento";
      this.setTipo(lancamento.tipo);
      document.getElementById("input-valor").value = this.formatCurrencyInput(
        lancamento.valor,
      );
      document.getElementById("select-categoria").value =
        lancamento.categoriaId;
      document.getElementById("input-data").value = lancamento.data;
      document.getElementById("input-descricao").value =
        lancamento.descricao || "";
    } else {
      // New entry
      this.state.editingId = null;
      title.textContent = "Novo Lançamento";
      form.reset();
      this.setTipo("saida"); // Default to expense (most common)
      document.getElementById("input-data").value = this.todayISO();
    }

    this.updateCategoryOptions();

    // Focus valor input after animation
    setTimeout(() => document.getElementById("input-valor").focus(), 300);
  },

  closeModal() {
    const overlay = document.getElementById("modal-overlay");
    overlay.classList.remove("visible");
    overlay.classList.add("hidden");
    this.updateFabVisibility();
    this.state.editingId = null;
  },

  // ================================================================
  //  MODAL — CATEGORIA
  // ================================================================

  openCategoriaModal(categoria = null) {
    const overlay = document.getElementById("modal-categoria-overlay");
    const title = document.getElementById("modal-categoria-title");
    const form = document.getElementById("form-categoria");
    const tipoToggles = document.querySelectorAll(
      "#form-categoria .toggle-btn",
    );

    overlay.classList.remove("hidden");
    overlay.classList.add("visible");
    document.getElementById("fab-add").classList.add("hidden");

    if (categoria) {
      this.state.editingCategoriaId = categoria.id;
      title.textContent = "Editar Categoria";
      document.getElementById("input-categoria-nome").value = categoria.nome;
      this.setCategoriaTipo(categoria.tipo);
      tipoToggles.forEach((btn) => {
        btn.disabled = true;
        btn.title = "O tipo não pode ser alterado depois de criada";
      });
    } else {
      this.state.editingCategoriaId = null;
      title.textContent = "Nova Categoria";
      form.reset();
      tipoToggles.forEach((btn) => {
        btn.disabled = false;
        btn.title = "";
      });
      this.setCategoriaTipo("saida");
    }

    setTimeout(
      () => document.getElementById("input-categoria-nome").focus(),
      300,
    );
  },

  closeCategoriaModal() {
    const overlay = document.getElementById("modal-categoria-overlay");
    overlay.classList.remove("visible");
    overlay.classList.add("hidden");
    this.updateFabVisibility();
    this.state.editingCategoriaId = null;
  },

  setCategoriaTipo(tipo) {
    const btnEntrada = document.getElementById("cat-toggle-entrada");
    const btnSaida = document.getElementById("cat-toggle-saida");
    btnEntrada.classList.toggle("active", tipo === "entrada");
    btnSaida.classList.toggle("active", tipo === "saida");
  },

  getSelectedCategoriaTipo() {
    return document
      .getElementById("cat-toggle-entrada")
      .classList.contains("active")
      ? "entrada"
      : "saida";
  },

  updateFabVisibility() {
    const fab = document.getElementById("fab-add");
    const lancModalOpen = document
      .getElementById("modal-overlay")
      .classList.contains("visible");
    const catModalOpen = document
      .getElementById("modal-categoria-overlay")
      .classList.contains("visible");
    const compModalOpen = document
      .getElementById("modal-compromisso-overlay")
      .classList.contains("visible");
    fab.classList.toggle(
      "hidden",
      lancModalOpen || catModalOpen || compModalOpen,
    );

    if (this.state.currentTab === "categorias") {
      fab.setAttribute("aria-label", "Nova categoria");
      fab.title = "Nova categoria";
    } else if (this.state.currentTab === "calendario") {
      fab.setAttribute("aria-label", "Novo compromisso");
      fab.title = "Novo compromisso";
    } else {
      fab.setAttribute("aria-label", "Novo lançamento");
      fab.title = "Novo lançamento";
    }
  },

  setTipo(tipo) {
    const btnEntrada = document.getElementById("toggle-entrada");
    const btnSaida = document.getElementById("toggle-saida");

    btnEntrada.classList.toggle("active", tipo === "entrada");
    btnSaida.classList.toggle("active", tipo === "saida");

    this.updateCategoryOptions();
  },

  getSelectedTipo() {
    return document
      .getElementById("toggle-entrada")
      .classList.contains("active")
      ? "entrada"
      : "saida";
  },

  updateCategoryOptions() {
    const select = document.getElementById("select-categoria");
    const tipo = this.getSelectedTipo();
    const currentValue = select.value;

    select.innerHTML = '<option value="">Selecione...</option>';

    this.state.categorias
      .filter((c) => c.tipo === tipo)
      .forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.nome;
        select.appendChild(option);
      });

    // Restore selection if still valid for the current tipo
    if (currentValue) {
      select.value = currentValue;
    }
  },

  // ================================================================
  //  CRUD — LANÇAMENTOS
  // ================================================================

  saveLancamento() {
    const tipo = this.getSelectedTipo();
    const valorStr = document.getElementById("input-valor").value;
    const categoriaId = document.getElementById("select-categoria").value;
    const data = document.getElementById("input-data").value;
    const descricao = document.getElementById("input-descricao").value.trim();

    // Validation
    const valor = this.parseCurrency(valorStr);
    if (!valor || valor <= 0) {
      this.shakeElement(document.getElementById("input-valor"));
      return;
    }
    if (!categoriaId) {
      this.shakeElement(document.getElementById("select-categoria"));
      return;
    }
    if (!data) {
      this.shakeElement(document.getElementById("input-data"));
      return;
    }

    if (this.state.editingId) {
      // Update existing
      const idx = this.state.lancamentos.findIndex(
        (l) => l.id === this.state.editingId,
      );
      if (idx !== -1) {
        this.state.lancamentos[idx] = {
          ...this.state.lancamentos[idx],
          tipo,
          valor,
          categoriaId,
          data,
          descricao,
        };
      }
    } else {
      // Create new
      this.state.lancamentos.push({
        id: this.generateId(),
        tipo,
        valor,
        categoriaId,
        data,
        descricao,
      });
    }

    this.saveData();
    this.closeModal();
    this.render();
  },

  deleteLancamento(id) {
    if (!confirm("Tem certeza que quer excluir este lançamento?")) return;
    this.state.lancamentos = this.state.lancamentos.filter((l) => l.id !== id);
    this.saveData();
    this.render();
  },

  // ================================================================
  //  CRUD — CATEGORIAS
  // ================================================================

  saveCategoria() {
    const nome = document.getElementById("input-categoria-nome").value.trim();
    const tipo = this.getSelectedCategoriaTipo();

    if (!nome) {
      this.shakeElement(document.getElementById("input-categoria-nome"));
      return;
    }

    const duplicada = this.state.categorias.some(
      (c) =>
        c.id !== this.state.editingCategoriaId &&
        c.tipo === tipo &&
        c.nome.toLowerCase() === nome.toLowerCase(),
    );
    if (duplicada) {
      alert("Já existe uma categoria com esse nome neste tipo.");
      this.shakeElement(document.getElementById("input-categoria-nome"));
      return;
    }

    if (this.state.editingCategoriaId) {
      const idx = this.state.categorias.findIndex(
        (c) => c.id === this.state.editingCategoriaId,
      );
      if (idx !== -1) {
        this.state.categorias[idx] = {
          ...this.state.categorias[idx],
          nome,
        };
      }
    } else {
      this.state.categorias.push({
        id: this.generateId(),
        nome,
        tipo,
      });
    }

    this.saveData();
    this.closeCategoriaModal();
    this.render();
  },

  deleteCategoria(id) {
    const categoria = this.state.categorias.find((c) => c.id === id);
    if (!categoria) return;

    const usadas = this.state.lancamentos.filter(
      (l) => l.categoriaId === id,
    ).length;
    const mensagem =
      usadas > 0
        ? `A categoria "${categoria.nome}" está em ${usadas} lançamento(s). Se excluir, esses lançamentos ficam sem categoria. Quer mesmo excluir?`
        : `Excluir a categoria "${categoria.nome}"?`;

    if (!confirm(mensagem)) return;

    this.state.categorias = this.state.categorias.filter((c) => c.id !== id);
    this.saveData();
    this.render();
  },

  // ================================================================
  //  CRUD — COMPROMISSOS
  // ================================================================

  openCompromissoModal(compromisso = null) {
    const overlay = document.getElementById("modal-compromisso-overlay");
    const title = document.getElementById("modal-compromisso-title");
    const form = document.getElementById("form-compromisso");

    overlay.classList.remove("hidden");
    overlay.classList.add("visible");
    document.getElementById("fab-add").classList.add("hidden");

    if (compromisso) {
      this.state.editingCompromissoId = compromisso.id;
      title.textContent = "Editar Compromisso";
      this.setCompromissoTipo(compromisso.tipo);
      document.getElementById("input-compromisso-titulo").value =
        compromisso.titulo || "";
      document.getElementById("input-compromisso-valor").value =
        this.formatCurrencyInput(compromisso.valor);
      document.getElementById("input-compromisso-data").value =
        compromisso.data;
      document.getElementById("input-compromisso-nota").value =
        compromisso.nota || "";
    } else {
      this.state.editingCompromissoId = null;
      title.textContent = "Novo Compromisso";
      form.reset();
      this.setCompromissoTipo("cobranca");
      document.getElementById("input-compromisso-data").value = this.todayISO();
    }

    setTimeout(
      () => document.getElementById("input-compromisso-titulo").focus(),
      300,
    );
  },

  closeCompromissoModal() {
    const overlay = document.getElementById("modal-compromisso-overlay");
    overlay.classList.remove("visible");
    overlay.classList.add("hidden");
    this.updateFabVisibility();
    this.state.editingCompromissoId = null;
  },

  setCompromissoTipo(tipo) {
    const btnRecebimento = document.getElementById(
      "compromisso-toggle-recebimento",
    );
    const btnCobranca = document.getElementById("compromisso-toggle-cobranca");
    btnRecebimento.classList.toggle("active", tipo === "recebimento");
    btnCobranca.classList.toggle("active", tipo === "cobranca");
  },

  getSelectedCompromissoTipo() {
    return document
      .getElementById("compromisso-toggle-recebimento")
      .classList.contains("active")
      ? "recebimento"
      : "cobranca";
  },

  saveCompromisso() {
    const tipo = this.getSelectedCompromissoTipo();
    const titulo = document
      .getElementById("input-compromisso-titulo")
      .value.trim();
    const valorStr = document.getElementById("input-compromisso-valor").value;
    const data = document.getElementById("input-compromisso-data").value;
    const nota = document.getElementById("input-compromisso-nota").value.trim();

    if (!titulo) {
      this.shakeElement(document.getElementById("input-compromisso-titulo"));
      return;
    }

    const valor = this.parseCurrency(valorStr);
    if (!valor || valor <= 0) {
      this.shakeElement(document.getElementById("input-compromisso-valor"));
      return;
    }

    if (!data) {
      this.shakeElement(document.getElementById("input-compromisso-data"));
      return;
    }

    if (this.state.editingCompromissoId) {
      const idx = this.state.compromissos.findIndex(
        (c) => c.id === this.state.editingCompromissoId,
      );
      if (idx !== -1) {
        this.state.compromissos[idx] = {
          ...this.state.compromissos[idx],
          tipo,
          titulo,
          valor,
          data,
          nota,
        };
      }
    } else {
      this.state.compromissos.push({
        id: this.generateId(),
        tipo,
        titulo,
        valor,
        data,
        nota,
      });
    }

    this.saveData();
    this.closeCompromissoModal();
    this.render();
  },

  deleteCompromisso(id) {
    if (!confirm("Tem certeza que quer excluir este compromisso?")) return;
    this.state.compromissos = this.state.compromissos.filter(
      (c) => c.id !== id,
    );
    this.saveData();
    this.render();
  },

  // ================================================================
  //  RENDERING
  // ================================================================

  render() {
    this.renderMonthLabel();
    this.renderTabs();
    this.renderSummaryCards();
    this.renderTabContent();
    this.updateFabVisibility();

    const isCategorias = this.state.currentTab === "categorias";
    document
      .querySelector(".month-nav")
      .classList.toggle("hidden", isCategorias);
    document
      .getElementById("summary-cards")
      .classList.toggle("hidden", isCategorias);
  },

  renderMonthLabel() {
    document.getElementById("current-month-label").textContent =
      `${this.MESES[this.state.currentMonth]} ${this.state.currentYear}`;
  },

  renderTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === this.state.currentTab);
    });
  },

  renderSummaryCards() {
    const lancamentos = this.getLancamentosCurrentMonth();

    const totalEntradas = lancamentos
      .filter((l) => l.tipo === "entrada")
      .reduce((sum, l) => sum + l.valor, 0);

    const totalSaidas = lancamentos
      .filter((l) => l.tipo === "saida")
      .reduce((sum, l) => sum + l.valor, 0);

    const saldo = totalEntradas - totalSaidas;

    document.getElementById("total-entradas").textContent =
      this.formatCurrency(totalEntradas);
    document.getElementById("total-saidas").textContent =
      this.formatCurrency(totalSaidas);
    document.getElementById("total-saldo").textContent =
      this.formatCurrency(saldo);

    const saldoCard = document.querySelector(".card-saldo");
    saldoCard.classList.toggle("positive", saldo >= 0);
    saldoCard.classList.toggle("negative", saldo < 0);
  },

  renderTabContent() {
    const content = document.getElementById("tab-content");

    switch (this.state.currentTab) {
      case "lancamentos":
        content.innerHTML = this.renderLancamentosTab();
        break;
      case "resumo":
        content.innerHTML = this.renderResumoTab();
        break;
      case "categorias":
        content.innerHTML = this.renderCategoriasTab();
        break;
      case "calendario":
        content.innerHTML = this.renderCalendarioTab();
        break;
      default:
        content.innerHTML = this.renderComingSoon();
    }

    // Bind delete buttons
    content.querySelectorAll(".lancamento-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteLancamento(btn.dataset.id);
      });
    });

    // Bind click-to-edit on items
    content.querySelectorAll(".lancamento-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".lancamento-delete")) return;
        const lancamento = this.state.lancamentos.find(
          (l) => l.id === item.dataset.id,
        );
        if (lancamento) this.openModal(lancamento);
      });
    });

    content.querySelectorAll(".categoria-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteCategoria(btn.dataset.id);
      });
    });

    content.querySelectorAll(".categoria-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".categoria-delete")) return;
        const categoria = this.state.categorias.find(
          (c) => c.id === item.dataset.id,
        );
        if (categoria) this.openCategoriaModal(categoria);
      });
    });

    content.querySelectorAll(".compromisso-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteCompromisso(btn.dataset.id);
      });
    });

    content.querySelectorAll(".compromisso-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.closest(".compromisso-delete")) return;
        const compromisso = this.state.compromissos.find(
          (c) => c.id === item.dataset.id,
        );
        if (compromisso) this.openCompromissoModal(compromisso);
      });
    });

    const btnNova = content.querySelector("#btn-nova-categoria");
    if (btnNova) {
      btnNova.addEventListener("click", () => this.openCategoriaModal());
    }

    const btnNovoCompromisso = content.querySelector("#btn-novo-compromisso");
    if (btnNovoCompromisso) {
      btnNovoCompromisso.addEventListener("click", () =>
        this.openCompromissoModal(),
      );
    }
  },

  // ---- Lançamentos Tab ----

  renderLancamentosTab() {
    const lancamentos = this.getLancamentosCurrentMonth();

    if (lancamentos.length === 0) {
      return `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div class="empty-state-title">Nenhum lançamento neste mês</div>
                    <div class="empty-state-text">
                        Toque no botão <strong>+</strong> para registrar<br>
                        sua primeira entrada ou saída.
                    </div>
                </div>
            `;
      html += this.renderPizzaChart(porCategoria, totalSaidas);
    }

    // Group by date, most recent first
    const grouped = this.groupByDate(lancamentos);

    return grouped
      .map(
        (group) => `
            <div class="date-group">
                <div class="date-group-header">${this.formatDateDisplay(group.date)}</div>
                <div class="lancamentos-list">
                    ${group.items.map((l, i) => this.renderLancamentoItem(l, i)).join("")}
                </div>
            </div>
        `,
      )
      .join("");
  },

  renderLancamentoItem(lancamento, index) {
    const categoria = this.state.categorias.find(
      (c) => c.id === lancamento.categoriaId,
    );
    const categoriaNome = categoria ? categoria.nome : "Sem categoria";
    const icon = lancamento.tipo === "entrada" ? "↑" : "↓";

    return `
            <div class="lancamento-item" data-id="${lancamento.id}" style="animation-delay: ${index * 50}ms">
                <div class="lancamento-icon ${lancamento.tipo}">${icon}</div>
                <div class="lancamento-info">
                    <div class="lancamento-categoria">${this.escapeHtml(categoriaNome)}</div>
                    ${
                      lancamento.descricao
                        ? `<div class="lancamento-descricao">${this.escapeHtml(lancamento.descricao)}</div>`
                        : ""
                    }
                </div>
                <div class="lancamento-valor ${lancamento.tipo}">
                    ${lancamento.tipo === "saida" ? "−" : "+"} ${this.formatCurrency(lancamento.valor)}
                </div>
                <button class="lancamento-delete" data-id="${lancamento.id}" aria-label="Excluir" title="Excluir">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;
  },

  // ---- Resumo Tab ----

  renderResumoTab() {
    const lancamentos = this.getLancamentosCurrentMonth();
    const historico = this.getHistoricoMeses();

    if (
      lancamentos.length === 0 &&
      !historico.some((item) => item.totalLancamentos > 0)
    ) {
      return `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-title">Sem dados para o resumo</div>
                    <div class="empty-state-text">
                        Adicione lançamentos para ver o resumo<br>
                        por categoria deste mês.
                    </div>
                </div>
            `;
    }

    const entradas = lancamentos.filter((l) => l.tipo === "entrada");
    const saidas = lancamentos.filter((l) => l.tipo === "saida");
    const totalEntradas = entradas.reduce((s, l) => s + l.valor, 0);
    const totalSaidas = saidas.reduce((s, l) => s + l.valor, 0);
    const saldo = totalEntradas - totalSaidas;

    let html = "";

    // Entradas por categoria
    if (entradas.length > 0) {
      const porCategoria = this.agruparPorCategoria(entradas);
      html += `
                <div class="resumo-section">
                    <div class="resumo-section-title">↑ Entradas por categoria</div>
                    ${porCategoria
                      .map(
                        (c) => `
                        <div class="resumo-category-item">
                            <span class="resumo-category-name">${this.escapeHtml(c.nome)}</span>
                            <span class="resumo-category-value entrada">+ ${this.formatCurrency(c.total)}</span>
                        </div>
                    `,
                      )
                      .join("")}
                    <div class="resumo-total-row">
                        <span>Total Entradas</span>
                        <span class="saldo-positivo">${this.formatCurrency(totalEntradas)}</span>
                    </div>
                </div>
            `;
    }

    // Saídas por categoria
    if (saidas.length > 0) {
      const porCategoria = this.agruparPorCategoria(saidas);
      html += `
                <div class="resumo-section">
                    <div class="resumo-section-title">↓ Saídas por categoria</div>
                    ${porCategoria
                      .map(
                        (c) => `
                        <div class="resumo-category-item">
                            <span class="resumo-category-name">${this.escapeHtml(c.nome)}</span>
                            <span class="resumo-category-value saida">− ${this.formatCurrency(c.total)}</span>
                        </div>
                    `,
                      )
                      .join("")}
                    <div class="resumo-total-row">
                        <span>Total Saídas</span>
                        <span class="saldo-negativo">${this.formatCurrency(totalSaidas)}</span>
                    </div>
                </div>
            `;
    }

    // Saldo do mês
    html += `
            <div class="resumo-section">
                <div class="resumo-total-row" style="font-size: 1.1rem;">
                    <span>💰 Saldo do Mês</span>
                    <span class="${saldo >= 0 ? "saldo-positivo" : "saldo-negativo"}">
                        ${saldo >= 0 ? "+" : "−"} ${this.formatCurrency(Math.abs(saldo))}
                    </span>
                </div>
            </div>
        `;

    html += this.renderHistoricoMeses(historico);

    return html;
  },

  renderPizzaChart(categorias, total) {
    if (!categorias.length || total <= 0) return "";

    const cores = [
      "#8b7cf6",
      "#34d399",
      "#fbbf24",
      "#f87171",
      "#60a5fa",
      "#fb7185",
      "#a78bfa",
      "#2dd4bf",
    ];
    let inicio = 0;
    const segmentos = categorias.map((categoria, index) => {
      const porcentagem = (categoria.total / total) * 100;
      const fim = inicio + porcentagem;
      const segmento = `${cores[index % cores.length]} ${inicio}% ${fim}%`;
      inicio = fim;
      return {
        ...categoria,
        porcentagem,
        cor: cores[index % cores.length],
        segmento,
      };
    });

    return `
            <div class="resumo-section pizza-section">
                <div class="resumo-section-title">🍕 Distribuição das saídas</div>
                <div class="pizza-chart-layout">
                    <div class="pizza-chart" style="background: conic-gradient(${segmentos.map((item) => item.segmento).join(", ")});" role="img" aria-label="Distribuição das saídas por categoria">
                        <div class="pizza-chart-center">
                            <span>Total</span>
                            <strong>${this.formatCurrency(total)}</strong>
                        </div>
                    </div>
                    <div class="pizza-legend">
                        ${segmentos
                          .map(
                            (item) => `
                            <div class="pizza-legend-item">
                                <span class="pizza-legend-color" style="background: ${item.cor};"></span>
                                <span class="pizza-legend-name">${this.escapeHtml(item.nome)}</span>
                                <span class="pizza-legend-percent">${item.porcentagem.toFixed(1).replace(".", ",")}%</span>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                </div>
            </div>
        `;
  },

  renderHistoricoMeses(historico = this.getHistoricoMeses()) {
    const historicoFiltrado = historico.filter(
      (item) => item.totalLancamentos > 0,
    );

    if (historicoFiltrado.length === 0) {
      return "";
    }

    return `
            <div class="resumo-section">
                <div class="resumo-section-title">📅 Histórico entre meses</div>
                <div class="historico-list">
                    ${historicoFiltrado
                      .map(
                        (item) => `
                        <div class="historico-item ${item.isCurrent ? "current" : ""}">
                            <div class="historico-main">
                                <span class="historico-label">${this.escapeHtml(item.label)}</span>
                                <span class="historico-meta">${item.totalLancamentos} lançamento${item.totalLancamentos === 1 ? "" : "s"}</span>
                            </div>
                            <div class="historico-values">
                                <span class="historico-valor entrada">+ ${this.formatCurrency(item.entradas)}</span>
                                <span class="historico-valor saida">− ${this.formatCurrency(item.saidas)}</span>
                                <span class="historico-saldo ${item.saldo >= 0 ? "positivo" : "negativo"}">
                                    ${item.saldo >= 0 ? "+" : "−"} ${this.formatCurrency(Math.abs(item.saldo))}
                                </span>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `;
  },

  renderCalendarioTab() {
    const compromissos = this.getCompromissosCurrentMonth();
    const diasDoMes = new Date(
      this.state.currentYear,
      this.state.currentMonth + 1,
      0,
    ).getDate();
    const primeiroDia = new Date(
      this.state.currentYear,
      this.state.currentMonth,
      1,
    );
    const diaDaSemana = (primeiroDia.getDay() + 6) % 7;
    const diasMesAnterior = new Date(
      this.state.currentYear,
      this.state.currentMonth,
      0,
    ).getDate();

    const grid = [];
    for (let i = 0; i < diaDaSemana; i++) {
      const numero = diasMesAnterior - diaDaSemana + i + 1;
      grid.push(`
        <div class="calendar-day muted">
          <span class="day-number">${numero}</span>
        </div>
      `);
    }

    for (let dia = 1; dia <= diasDoMes; dia++) {
      const data = this.toISODate(
        this.state.currentYear,
        this.state.currentMonth,
        dia,
      );
      const eventos = this.state.compromissos.filter((c) => c.data === data);
      const hoje = new Date();
      const isHoje =
        dia === hoje.getDate() &&
        this.state.currentMonth === hoje.getMonth() &&
        this.state.currentYear === hoje.getFullYear();

      const dots = eventos
        .slice(0, 3)
        .map(
          (evento) =>
            `<img class="calendar-event-image ${evento.tipo === "recebimento" ? "recebimento" : "cobranca"}" src="imagens/${evento.tipo === "recebimento" ? "recebimento" : "cobranca"}.png" alt="${evento.tipo === "recebimento" ? "Recebimento" : "Cobrança"}" title="${evento.titulo}">`,
        )
        .join("");

      const extra =
        eventos.length > 3
          ? `<span class="calendar-more">+${eventos.length - 3}</span>`
          : "";

      grid.push(`
        <div class="calendar-day ${isHoje ? "today" : ""} ${eventos.length ? "has-events" : ""}">
          <span class="day-number">${dia}</span>
          <div class="calendar-day-events">
            ${dots}
            ${extra}
          </div>
        </div>
      `);
    }

    const proximoMes = 42 - grid.length;
    for (let i = 1; i <= proximoMes; i++) {
      grid.push(`
        <div class="calendar-day muted">
          <span class="day-number">${i}</span>
        </div>
      `);
    }

    const lista = compromissos.length
      ? compromissos
          .sort((a, b) => a.data.localeCompare(b.data))
          .map((compromisso) => this.renderCompromissoItem(compromisso))
          .join("")
      : `
        <div class="empty-state compact">
          <div class="empty-state-icon">📌</div>
          <div class="empty-state-title">Sem compromissos neste mês</div>
          <div class="empty-state-text">Use o botão + para cadastrar um recebimento ou cobrança.</div>
        </div>
      `;

    return `
      <div class="calendario-wrapper">
        <div class="calendario-header">
          <div class="calendario-legend">
            <span><i class="legend-dot recebimento"></i> Recebimento</span>
            <span><i class="legend-dot cobranca"></i> Cobrança</span>
          </div>
          <button type="button" id="btn-novo-compromisso" class="btn-primary btn-nova-categoria">+ Novo compromisso</button>
        </div>

        <div class="calendar-weekdays">
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sab</span>
          <span>Dom</span>
        </div>

        <div class="calendar-grid">
          ${grid.join("")}
        </div>

        <div class="compromisso-section">
          <div class="resumo-section-title">Compromissos do mês</div>
          <div class="compromisso-list">
            ${lista}
          </div>
        </div>
      </div>
    `;
  },

  renderCompromissoItem(compromisso) {
    const status = this.getCompromissoStatus(compromisso);
    const dataFormatada = this.formatDateDisplay(compromisso.data);

    return `
      <div class="compromisso-item ${status.className}" data-id="${compromisso.id}">
        <div class="compromisso-header">
          <span class="status-badge ${status.className}">${status.label}</span>
          <button class="compromisso-delete" data-id="${compromisso.id}" aria-label="Excluir compromisso" title="Excluir compromisso">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="compromisso-line">
          <span class="compromisso-type ${compromisso.tipo === "recebimento" ? "recebimento" : "cobranca"}">${compromisso.tipo === "recebimento" ? "Recebimento" : "Cobrança"}</span>
          <strong class="compromisso-title">${this.escapeHtml(compromisso.titulo)}</strong>
        </div>
        <div class="compromisso-meta">${dataFormatada} · ${this.formatCurrency(compromisso.valor)}</div>
        ${compromisso.nota ? `<div class="compromisso-nota">${this.escapeHtml(compromisso.nota)}</div>` : ""}
      </div>
    `;
  },

  // ---- Categorias Tab ----

  renderCategoriasTab() {
    const entradas = this.state.categorias.filter((c) => c.tipo === "entrada");
    const saidas = this.state.categorias.filter((c) => c.tipo === "saida");

    return `
            <p class="categorias-hint">Toque numa categoria para editar o nome. O tipo (entrada ou saída) não muda depois de criada.</p>
            <button type="button" id="btn-nova-categoria" class="btn-primary btn-nova-categoria">+ Nova categoria</button>
            ${this.renderCategoriaSection("↑ Categorias de entrada", entradas, "entrada")}
            ${this.renderCategoriaSection("↓ Categorias de saída", saidas, "saida")}
        `;
  },

  renderCategoriaSection(title, categorias, tipo) {
    if (categorias.length === 0) {
      return `
                <div class="resumo-section">
                    <div class="resumo-section-title">${title}</div>
                    <p class="categorias-empty">Nenhuma categoria de ${tipo === "entrada" ? "entrada" : "saída"} ainda.</p>
                </div>
            `;
    }

    return `
            <div class="resumo-section">
                <div class="resumo-section-title">${title}</div>
                <div class="categorias-list">
                    ${categorias.map((c, i) => this.renderCategoriaItem(c, i)).join("")}
                </div>
            </div>
        `;
  },

  renderCategoriaItem(categoria, index) {
    const usadas = this.state.lancamentos.filter(
      (l) => l.categoriaId === categoria.id,
    ).length;
    const usoTexto =
      usadas === 0
        ? "Ainda não usada"
        : usadas === 1
          ? "1 lançamento"
          : `${usadas} lançamentos`;

    return `
            <div class="categoria-item" data-id="${categoria.id}" style="animation-delay: ${index * 40}ms">
                <div class="lancamento-icon ${categoria.tipo}">${categoria.tipo === "entrada" ? "↑" : "↓"}</div>
                <div class="lancamento-info">
                    <div class="lancamento-categoria">${this.escapeHtml(categoria.nome)}</div>
                    <div class="lancamento-descricao">${usoTexto}</div>
                </div>
                <button class="categoria-delete" data-id="${categoria.id}" aria-label="Excluir categoria" title="Excluir">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;
  },

  // ---- Coming Soon ----

  renderComingSoon() {
    return `
            <div class="empty-state">
                <div class="empty-state-icon">🚧</div>
                <div class="empty-state-title">Em breve!</div>
                <div class="empty-state-text">
                    Esta funcionalidade será adicionada<br>
                    nas próximas etapas.
                </div>
            </div>
        `;
  },

  // ================================================================
  //  DATA HELPERS
  // ================================================================

  getLancamentosCurrentMonth() {
    return this.state.lancamentos
      .filter((l) => {
        const d = new Date(l.data + "T00:00:00");
        return (
          d.getMonth() === this.state.currentMonth &&
          d.getFullYear() === this.state.currentYear
        );
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  },

  getHistoricoMeses() {
    const hoje = new Date();
    const months = [];

    for (let offset = 5; offset >= 0; offset--) {
      const date = new Date(hoje.getFullYear(), hoje.getMonth() - offset, 1);
      const mes = date.getMonth();
      const ano = date.getFullYear();
      const lancamentos = this.state.lancamentos.filter((l) => {
        const d = new Date(l.data + "T00:00:00");
        return d.getMonth() === mes && d.getFullYear() === ano;
      });

      const entradas = lancamentos
        .filter((l) => l.tipo === "entrada")
        .reduce((sum, l) => sum + l.valor, 0);
      const saidas = lancamentos
        .filter((l) => l.tipo === "saida")
        .reduce((sum, l) => sum + l.valor, 0);
      const saldo = entradas - saidas;

      months.push({
        label: `${this.MESES[mes]} ${ano}`,
        entradas,
        saidas,
        saldo,
        totalLancamentos: lancamentos.length,
        isCurrent:
          mes === this.state.currentMonth && ano === this.state.currentYear,
      });
    }

    return months.filter((item) => item.totalLancamentos > 0);
  },

  getCompromissosCurrentMonth() {
    return this.state.compromissos
      .filter((c) => {
        const d = new Date(c.data + "T00:00:00");
        return (
          d.getMonth() === this.state.currentMonth &&
          d.getFullYear() === this.state.currentYear
        );
      })
      .sort((a, b) => a.data.localeCompare(b.data));
  },

  getCompromissoStatus(compromisso) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const data = new Date(compromisso.data + "T00:00:00");
    const diferencaDias = Math.ceil((data - hoje) / 86400000);

    if (diferencaDias < 0) {
      return { label: "Vencido", className: "vencido" };
    }
    if (diferencaDias === 0) {
      return { label: "Vence hoje", className: "hoje" };
    }
    if (diferencaDias <= 3) {
      return {
        label: `Vence em ${diferencaDias} dia${diferencaDias === 1 ? "" : "s"}`,
        className: "proximo",
      };
    }
    return { label: "A vencer", className: "a-vencer" };
  },

  groupByDate(lancamentos) {
    const groups = {};
    lancamentos.forEach((l) => {
      if (!groups[l.data]) groups[l.data] = [];
      groups[l.data].push(l);
    });
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({ date, items: groups[date] }));
  },

  agruparPorCategoria(lancamentos) {
    const map = {};
    lancamentos.forEach((l) => {
      if (!map[l.categoriaId]) {
        const cat = this.state.categorias.find((c) => c.id === l.categoriaId);
        map[l.categoriaId] = {
          nome: cat ? cat.nome : "Sem categoria",
          total: 0,
        };
      }
      map[l.categoriaId].total += l.valor;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  },

  // ================================================================
  //  FORMATTING HELPERS
  // ================================================================

  formatCurrency(value) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  },

  formatCurrencyInput(value) {
    return value.toFixed(2).replace(".", ",");
  },

  parseCurrency(str) {
    if (!str) return 0;
    const normalized = this.normalizeCurrencyInput(str);
    return parseFloat(normalized.replace(",", ".")) || 0;
  },

  maskCurrency(input) {
    input.value = this.normalizeCurrencyInput(input.value);
  },

  // pt-BR: vírgula decimal, ponto como milhar. Uma vírgula e até 2 centavos.
  normalizeCurrencyInput(raw) {
    const value = String(raw).replace(/[^\d,.]/g, "");
    if (!value) return "";

    const lastComma = value.lastIndexOf(",");
    const lastDot = value.lastIndexOf(".");
    const lastSep = Math.max(lastComma, lastDot);

    let intDigits;
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
  },

  formatDateDisplay(dateStr) {
    const [year, month, day] = dateStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) return "Hoje";
    if (date.getTime() === yesterday.getTime()) return "Ontem";

    return `${date.getDate()} de ${this.MESES[date.getMonth()]}`;
  },

  todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  },

  toISODate(year, month, day) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  },

  generateId() {
    return (
      "id_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).substr(2, 5)
    );
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  // Visual feedback: shake an element to indicate validation error
  shakeElement(el) {
    el.style.animation = "none";
    el.offsetHeight; // trigger reflow
    el.style.animation = "shake 0.4s ease";
    el.style.borderColor = "var(--saida)";
    setTimeout(() => {
      el.style.borderColor = "";
      el.style.animation = "";
    }, 1000);
  },
};

// Add shake animation via JS (so we don't need to add it to CSS)
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
    }
`;
document.head.appendChild(shakeStyle);

// Start the app when DOM is ready
document.addEventListener("DOMContentLoaded", () => App.init());
