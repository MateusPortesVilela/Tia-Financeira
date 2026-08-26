import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const STORAGE_KEY = "tia-financeira-data";
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
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
const DEFAULT_CATEGORIES = [
  { id: "cat_1", nome: "Salario", tipo: "entrada" },
  { id: "cat_2", nome: "Freelas", tipo: "entrada" },
  { id: "cat_3", nome: "Outros ganhos", tipo: "entrada" },
  { id: "cat_4", nome: "Mercado", tipo: "saida" },
  { id: "cat_5", nome: "Contas de casa", tipo: "saida" },
  { id: "cat_6", nome: "Transporte", tipo: "saida" },
  { id: "cat_7", nome: "Saude", tipo: "saida" },
  { id: "cat_8", nome: "Alimentacao", tipo: "saida" },
  { id: "cat_9", nome: "Lazer", tipo: "saida" },
];
const TABS = [
  ["lancamentos", "Lancamentos"],
  ["resumo", "Resumo"],
  ["categorias", "Categorias"],
  ["calendario", "Agenda"],
];

function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function newId() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function parseMoney(value) {
  const normalized = String(value || "")
    .replace(/[^0-9,]/g, "")
    .replace(",", ".");
  return Number.parseFloat(normalized) || 0;
}

function dateLabel(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function inMonth(item, month, year) {
  const date = new Date(`${item.data}T00:00:00`);
  return date.getMonth() === month && date.getFullYear() === year;
}

export default function MobileApp() {
  const now = new Date();
  const [tab, setTab] = useState("lancamentos");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [entries, setEntries] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!saved) return;
        const data = JSON.parse(saved);
        setCategories(
          data.categorias?.length ? data.categorias : DEFAULT_CATEGORIES,
        );
        setEntries(data.lancamentos || []);
        setCommitments(data.compromissos || []);
      })
      .catch(() => Alert.alert("Erro", "Nao foi possivel carregar seus dados."))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        categorias: categories,
        lancamentos: entries,
        compromissos: commitments,
      }),
    ).catch(() => Alert.alert("Erro", "Nao foi possivel salvar seus dados."));
  }, [categories, entries, commitments, ready]);

  const monthEntries = useMemo(
    () =>
      entries
        .filter((item) => inMonth(item, month, year))
        .sort((a, b) => b.data.localeCompare(a.data)),
    [entries, month, year],
  );
  const monthCommitments = useMemo(
    () =>
      commitments
        .filter((item) => inMonth(item, month, year))
        .sort((a, b) => a.data.localeCompare(b.data)),
    [commitments, month, year],
  );
  const income = monthEntries
    .filter((item) => item.tipo === "entrada")
    .reduce((sum, item) => sum + item.valor, 0);
  const expense = monthEntries
    .filter((item) => item.tipo === "saida")
    .reduce((sum, item) => sum + item.valor, 0);

  function moveMonth(delta) {
    const date = new Date(year, month + delta, 1);
    setMonth(date.getMonth());
    setYear(date.getFullYear());
  }

  function openEntry(item) {
    setModal("entry");
    setForm(
      item
        ? { ...item, valor: String(item.valor).replace(".", ",") }
        : {
            tipo: "saida",
            valor: "",
            categoriaId: categories.find((c) => c.tipo === "saida")?.id || "",
            data: todayISO(),
            descricao: "",
          },
    );
  }

  function openCommitment(item) {
    setModal("commitment");
    setForm(
      item
        ? { ...item, valor: String(item.valor).replace(".", ",") }
        : {
            tipo: "cobranca",
            titulo: "",
            valor: "",
            data: todayISO(),
            nota: "",
          },
    );
  }

  function closeModal() {
    setModal(null);
    setForm({});
  }

  function saveEntry() {
    const value = parseMoney(form.valor);
    if (!value || !form.categoriaId || !form.data)
      return Alert.alert(
        "Confira os dados",
        "Informe valor, categoria e data.",
      );
    const item = {
      id: form.id || newId(),
      tipo: form.tipo,
      valor: value,
      categoriaId: form.categoriaId,
      data: form.data,
      descricao: (form.descricao || "").trim(),
    };
    setEntries((current) =>
      form.id
        ? current.map((entry) => (entry.id === form.id ? item : entry))
        : [...current, item],
    );
    closeModal();
  }

  function saveCommitment() {
    const value = parseMoney(form.valor);
    if (!value || !form.titulo?.trim() || !form.data)
      return Alert.alert("Confira os dados", "Informe titulo, valor e data.");
    const item = {
      id: form.id || newId(),
      tipo: form.tipo,
      valor: value,
      titulo: form.titulo.trim(),
      data: form.data,
      nota: (form.nota || "").trim(),
    };
    setCommitments((current) =>
      form.id
        ? current.map((entry) => (entry.id === form.id ? item : entry))
        : [...current, item],
    );
    closeModal();
  }

  function removeEntry(item) {
    Alert.alert("Excluir lancamento?", item.descricao || money(item.valor), [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          setEntries((current) =>
            current.filter((entry) => entry.id !== item.id),
          ),
      },
    ]);
  }

  function removeCommitment(item) {
    Alert.alert("Excluir compromisso?", item.titulo, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          setCommitments((current) =>
            current.filter((entry) => entry.id !== item.id),
          ),
      },
    ]);
  }

  const categoryName = (id) =>
    categories.find((category) => category.id === id)?.nome || "Sem categoria";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CONTROLE FINANCEIRO</Text>
          <Text style={styles.title}>Tia Financeira</Text>
        </View>
        {tab !== "categorias" && (
          <View style={styles.monthNav}>
            <Pressable onPress={() => moveMonth(-1)} style={styles.monthButton}>
              <Text style={styles.monthArrow}>‹</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMonth(now.getMonth());
                setYear(now.getFullYear());
              }}
            >
              <Text style={styles.monthText}>
                {MONTHS[month]} {year}
              </Text>
            </Pressable>
            <Pressable onPress={() => moveMonth(1)} style={styles.monthButton}>
              <Text style={styles.monthArrow}>›</Text>
            </Pressable>
          </View>
        )}
      </View>

      {tab !== "categorias" && (
        <View style={styles.summaryRow}>
          <Summary label="Entradas" value={income} color="#8ee3b2" />
          <Summary label="Saidas" value={expense} color="#ff9a8b" />
          <Summary
            label="Saldo"
            value={income - expense}
            color={income - expense >= 0 ? "#f5d77b" : "#ff9a8b"}
          />
        </View>
      )}

      <View style={styles.content}>
        {!ready ? (
          <Text style={styles.empty}>Carregando...</Text>
        ) : (
          <>
            {tab === "lancamentos" && (
              <EntryList
                items={monthEntries}
                categoryName={categoryName}
                onEdit={openEntry}
                onRemove={removeEntry}
              />
            )}
            {tab === "resumo" && (
              <SummaryView
                entries={monthEntries}
                categories={categories}
                income={income}
                expense={expense}
                month={month}
                year={year}
              />
            )}
            {tab === "categorias" && (
              <CategoryView
                categories={categories}
                setCategories={setCategories}
              />
            )}
            {tab === "calendario" && (
              <CommitmentList
                items={monthCommitments}
                onEdit={openCommitment}
                onRemove={removeCommitment}
              />
            )}
          </>
        )}
      </View>

      <View style={styles.tabs}>
        {TABS.map(([key, label]) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[styles.tab, tab === key && styles.activeTab]}
          >
            <Text style={[styles.tabIcon, tab === key && styles.activeTabText]}>
              {key === "lancamentos"
                ? "▣"
                : key === "resumo"
                  ? "◒"
                  : key === "categorias"
                    ? "◇"
                    : "□"}
            </Text>
            <Text style={[styles.tabText, tab === key && styles.activeTabText]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab !== "categorias" && (
        <Pressable
          style={styles.fab}
          onPress={() =>
            tab === "calendario" ? openCommitment() : openEntry()
          }
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      <EntryModal
        visible={modal === "entry"}
        form={form}
        setForm={setForm}
        categories={categories}
        onClose={closeModal}
        onSave={saveEntry}
      />
      <CommitmentModal
        visible={modal === "commitment"}
        form={form}
        setForm={setForm}
        onClose={closeModal}
        onSave={saveCommitment}
      />
    </SafeAreaView>
  );
}

function Summary({ label, value, color }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{money(value)}</Text>
    </View>
  );
}

function EntryList({ items, categoryName, onEdit, onRemove }) {
  if (!items.length)
    return (
      <EmptyState
        title="Nenhum lancamento"
        text="Toque em + para registrar sua primeira movimentacao."
      />
    );
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onEdit(item)}
          onLongPress={() => onRemove(item)}
          style={styles.item}
        >
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  item.tipo === "entrada" ? "#8ee3b2" : "#ff9a8b",
              },
            ]}
          />
          <View style={styles.itemMain}>
            <Text style={styles.itemTitle}>
              {item.descricao || categoryName(item.categoriaId)}
            </Text>
            <Text style={styles.itemMeta}>
              {categoryName(item.categoriaId)} · {dateLabel(item.data)}
            </Text>
          </View>
          <Text
            style={[
              styles.itemValue,
              { color: item.tipo === "entrada" ? "#8ee3b2" : "#ff9a8b" },
            ]}
          >
            {item.tipo === "entrada" ? "+" : "-"}
            {money(item.valor)}
          </Text>
        </Pressable>
      )}
    />
  );
}

function SummaryView({ entries, categories, income, expense, month, year }) {
  const byCategory = categories
    .map((category) => ({
      ...category,
      total: entries
        .filter((item) => item.categoriaId === category.id)
        .reduce((sum, item) => sum + item.valor, 0),
    }))
    .filter((category) => category.total);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.sectionTitle}>
        Resumo de {MONTHS[month]} de {year}
      </Text>
      <View style={styles.bigBalance}>
        <Text style={styles.balanceLabel}>Saldo do mes</Text>
        <Text style={styles.balance}>{money(income - expense)}</Text>
        <Text style={styles.balanceMeta}>
          {entries.length} movimentacao(oes)
        </Text>
      </View>
      <Text style={styles.sectionTitle}>Por categoria</Text>
      {byCategory.length ? (
        byCategory.map((item) => (
          <View key={item.id} style={styles.categoryRow}>
            <Text style={styles.categoryName}>{item.nome}</Text>
            <Text
              style={[
                styles.categoryTotal,
                { color: item.tipo === "entrada" ? "#8ee3b2" : "#ff9a8b" },
              ]}
            >
              {money(item.total)}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>Ainda nao ha dados neste mes.</Text>
      )}
    </ScrollView>
  );
}

function CategoryView({ categories, setCategories }) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("saida");
  const [adding, setAdding] = useState(false);

  function add(type) {
    setNewType(type);
    setNewName("");
    setAdding(true);
  }

  function saveCategory() {
    const name = newName.trim();
    if (!name) return;
    if (
      categories.some(
        (item) =>
          item.tipo === newType &&
          item.nome.toLowerCase() === name.toLowerCase(),
      )
    )
      return Alert.alert("Categoria duplicada");
    setCategories([...categories, { id: newId(), nome: name, tipo: newType }]);
    setAdding(false);
  }
  function remove(item) {
    Alert.alert("Excluir categoria?", item.nome, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () =>
          setCategories(
            categories.filter((category) => category.id !== item.id),
          ),
      },
    ]);
  }
  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
        {["entrada", "saida"].map((type) => (
          <View key={type} style={styles.categoryBlock}>
            <View style={styles.categoryHeader}>
              <Text style={styles.sectionTitle}>
                {type === "entrada" ? "Entradas" : "Saidas"}
              </Text>
              <Pressable onPress={() => add(type)} style={styles.smallAdd}>
                <Text style={styles.smallAddText}>+ Adicionar</Text>
              </Pressable>
            </View>
            {categories
              .filter((item) => item.tipo === type)
              .map((item) => (
                <Pressable
                  key={item.id}
                  onLongPress={() => remove(item)}
                  style={styles.categoryRow}
                >
                  <Text style={styles.categoryName}>{item.nome}</Text>
                  <Text style={styles.muted}>segure para excluir</Text>
                </Pressable>
              ))}
          </View>
        ))}
      </ScrollView>
      <Modal
        visible={adding}
        animationType="slide"
        transparent
        onRequestClose={() => setAdding(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova categoria</Text>
              <Pressable onPress={() => setAdding(false)}>
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.fieldLabel}>Tipo</Text>
            <TypeChoice
              value={newType}
              setValue={setNewType}
              first={["entrada", "↑ Entrada"]}
              second={["saida", "↓ Saida"]}
            />
            <Field
              label="Nome"
              value={newName}
              onChangeText={setNewName}
              placeholder="Ex: Academia"
            />
            <Pressable onPress={saveCategory} style={styles.save}>
              <Text style={styles.saveText}>Salvar categoria</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function CommitmentList({ items, onEdit, onRemove }) {
  return items.length ? (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onEdit(item)}
          onLongPress={() => onRemove(item)}
          style={styles.item}
        >
          <View
            style={[
              styles.dot,
              {
                backgroundColor:
                  item.tipo === "recebimento" ? "#8ee3b2" : "#f5d77b",
              },
            ]}
          />
          <View style={styles.itemMain}>
            <Text style={styles.itemTitle}>{item.titulo}</Text>
            <Text style={styles.itemMeta}>
              {dateLabel(item.data)}
              {item.nota ? ` · ${item.nota}` : ""}
            </Text>
          </View>
          <Text style={styles.itemValue}>{money(item.valor)}</Text>
        </Pressable>
      )}
    />
  ) : (
    <EmptyState
      title="Agenda vazia"
      text="Cadastre contas, cobrancas e recebimentos."
    />
  );
}
function EmptyState({ title, text }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#718096"
        keyboardType={keyboardType}
      />
    </View>
  );
}
function TypeChoice({ value, setValue, first, second }) {
  return (
    <View style={styles.choiceRow}>
      {[first, second].map(([key, label]) => (
        <Pressable
          key={key}
          onPress={() => setValue(key)}
          style={[styles.choice, value === key && styles.choiceActive]}
        >
          <Text
            style={[
              styles.choiceText,
              value === key && styles.choiceActiveText,
            ]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function EntryModal({ visible, form, setForm, categories, onClose, onSave }) {
  const options = categories.filter((item) => item.tipo === form.tipo);
  return (
    <FormModal
      visible={visible}
      title={form.id ? "Editar lancamento" : "Novo lancamento"}
      onClose={onClose}
      onSave={onSave}
      saveLabel="Salvar lancamento"
    >
      <Text style={styles.fieldLabel}>Tipo</Text>
      <TypeChoice
        value={form.tipo}
        setValue={(tipo) =>
          setForm({
            ...form,
            tipo,
            categoriaId:
              categories.find((item) => item.tipo === tipo)?.id || "",
          })
        }
        first={["entrada", "↑ Entrada"]}
        second={["saida", "↓ Saida"]}
      />
      <Field
        label="Valor (R$)"
        value={form.valor}
        onChangeText={(valor) => setForm({ ...form, valor })}
        placeholder="0,00"
        keyboardType="decimal-pad"
      />
      <Text style={styles.fieldLabel}>Categoria</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.optionScroll}
      >
        {options.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setForm({ ...form, categoriaId: item.id })}
            style={[
              styles.option,
              form.categoriaId === item.id && styles.optionActive,
            ]}
          >
            <Text style={styles.optionText}>{item.nome}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Field
        label="Data (AAAA-MM-DD)"
        value={form.data}
        onChangeText={(data) => setForm({ ...form, data })}
        placeholder={todayISO()}
      />
      <Field
        label="Descricao"
        value={form.descricao}
        onChangeText={(descricao) => setForm({ ...form, descricao })}
        placeholder="Opcional"
      />
    </FormModal>
  );
}
function CommitmentModal({ visible, form, setForm, onClose, onSave }) {
  return (
    <FormModal
      visible={visible}
      title={form.id ? "Editar compromisso" : "Novo compromisso"}
      onClose={onClose}
      onSave={onSave}
      saveLabel="Salvar compromisso"
    >
      <Text style={styles.fieldLabel}>Tipo</Text>
      <TypeChoice
        value={form.tipo}
        setValue={(tipo) => setForm({ ...form, tipo })}
        first={["recebimento", "↑ Recebimento"]}
        second={["cobranca", "↓ Cobranca"]}
      />
      <Field
        label="Titulo"
        value={form.titulo}
        onChangeText={(titulo) => setForm({ ...form, titulo })}
        placeholder="Ex: Conta de luz"
      />
      <Field
        label="Valor (R$)"
        value={form.valor}
        onChangeText={(valor) => setForm({ ...form, valor })}
        placeholder="0,00"
        keyboardType="decimal-pad"
      />
      <Field
        label="Data (AAAA-MM-DD)"
        value={form.data}
        onChangeText={(data) => setForm({ ...form, data })}
        placeholder={todayISO()}
      />
      <Field
        label="Observacao"
        value={form.nota}
        onChangeText={(nota) => setForm({ ...form, nota })}
        placeholder="Opcional"
      />
    </FormModal>
  );
}
function FormModal({ visible, title, onClose, onSave, saveLabel, children }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.form}>
            {children}
            <Pressable onPress={onSave} style={styles.save}>
              <Text style={styles.saveText}>{saveLabel}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#101722" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "#182433",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  eyebrow: {
    color: "#8ee3b2",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  title: { color: "#f4f7f5", fontSize: 28, fontWeight: "800", marginTop: 4 },
  monthNav: { flexDirection: "row", alignItems: "center", gap: 5 },
  monthButton: { padding: 8 },
  monthArrow: { color: "#8ee3b2", fontSize: 28 },
  monthText: { color: "#f4f7f5", fontWeight: "700", fontSize: 12 },
  summaryRow: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: "#182433",
  },
  summary: {
    flex: 1,
    backgroundColor: "#213143",
    padding: 11,
    borderRadius: 10,
  },
  summaryLabel: { color: "#9aaabb", fontSize: 11 },
  summaryValue: { fontSize: 14, fontWeight: "800", marginTop: 5 },
  content: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  item: {
    backgroundColor: "#1a2736",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 12 },
  itemMain: { flex: 1 },
  itemTitle: { color: "#f4f7f5", fontSize: 15, fontWeight: "700" },
  itemMeta: { color: "#8c9bad", fontSize: 12, marginTop: 5 },
  itemValue: { color: "#f4f7f5", fontWeight: "800", fontSize: 13 },
  tabs: {
    height: 78,
    backgroundColor: "#182433",
    borderTopWidth: 1,
    borderTopColor: "#2b3a4b",
    flexDirection: "row",
    paddingBottom: 8,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 5 },
  activeTab: { borderTopWidth: 3, borderTopColor: "#8ee3b2" },
  tabIcon: { color: "#718096", fontSize: 20 },
  tabText: { color: "#718096", fontSize: 11, fontWeight: "600" },
  activeTabText: { color: "#8ee3b2" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 89,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#8ee3b2",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  fabText: {
    color: "#102019",
    fontSize: 32,
    lineHeight: 35,
    fontWeight: "300",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    color: "#f4f7f5",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  muted: { color: "#8c9bad", fontSize: 13, textAlign: "center" },
  scroll: { padding: 20, paddingBottom: 110 },
  sectionTitle: {
    color: "#f4f7f5",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },
  bigBalance: {
    backgroundColor: "#213143",
    borderRadius: 14,
    padding: 20,
    marginBottom: 26,
  },
  balanceLabel: { color: "#9aaabb", fontSize: 12 },
  balance: { color: "#f5d77b", fontSize: 30, fontWeight: "800", marginTop: 5 },
  balanceMeta: { color: "#8c9bad", marginTop: 8 },
  categoryBlock: { marginBottom: 24 },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallAdd: { padding: 8 },
  smallAddText: { color: "#8ee3b2", fontWeight: "700" },
  categoryRow: {
    backgroundColor: "#1a2736",
    borderRadius: 10,
    padding: 15,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryName: { color: "#f4f7f5", fontWeight: "700" },
  categoryTotal: { fontWeight: "800" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modal: {
    maxHeight: "92%",
    backgroundColor: "#182433",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: { color: "#f4f7f5", fontSize: 21, fontWeight: "800" },
  close: { color: "#9aaabb", fontSize: 30 },
  form: { paddingBottom: 20 },
  field: { marginBottom: 15 },
  fieldLabel: {
    color: "#c2ccd6",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    backgroundColor: "#213143",
    borderWidth: 1,
    borderColor: "#34475a",
    color: "#f4f7f5",
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
  },
  choiceRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  choice: {
    flex: 1,
    padding: 13,
    borderRadius: 9,
    backgroundColor: "#213143",
    alignItems: "center",
  },
  choiceActive: { backgroundColor: "#8ee3b2" },
  choiceText: { color: "#aebac6", fontWeight: "700" },
  choiceActiveText: { color: "#102019" },
  optionScroll: { marginBottom: 16 },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: "#213143",
    marginRight: 8,
  },
  optionActive: { backgroundColor: "#8ee3b2" },
  optionText: { color: "#dbe5eb", fontSize: 12, fontWeight: "700" },
  save: {
    backgroundColor: "#8ee3b2",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { color: "#102019", fontWeight: "800", fontSize: 15 },
});
