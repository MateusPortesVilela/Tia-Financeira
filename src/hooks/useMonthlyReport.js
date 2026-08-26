import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase-config.js";

// Helper: normaliza qualquer valor do Firestore para Date.
const toDate = (value) => {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toIsoDate = (value) => {
  const date = toDate(value);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
};

const normalizeNumber = (value) => Number(value ?? 0);

// Mapeia o documento legado do projeto (appData/meuFinanceiro) para o mesmo formato usado pelo hook.
async function buscarDadosLegado() {
  const ref = doc(db, "appData", "meuFinanceiro");
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return { lancamentos: [], categorias: [], compromissos: [] };
  }

  const data = snapshot.data() || {};
  return {
    lancamentos: Array.isArray(data.lancamentos) ? data.lancamentos : [],
    categorias: Array.isArray(data.categorias) ? data.categorias : [],
    compromissos: Array.isArray(data.compromissos) ? data.compromissos : [],
  };
}

// Busca nas coleções do Firestore. Para o projeto atual, o fallback no documento legado mantém compatibilidade.
async function buscarDadosPorColecoes(inicio, fim) {
  const lancamentosRef = collection(db, "lancamentos");
  const compromissosRef = collection(db, "compromissos");
  const categoriasRef = collection(db, "categorias");

  const [lancamentosSnapshot, categoriasSnapshot, compromissosSnapshot] =
    await Promise.all([
      getDocs(
        query(
          lancamentosRef,
          where("data", ">=", inicio),
          where("data", "<=", fim),
        ),
      ),
      getDocs(categoriasRef),
      getDocs(
        query(
          compromissosRef,
          where("data", ">=", inicio),
          where("data", "<=", fim),
        ),
      ),
    ]);

  return {
    lancamentos: lancamentosSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })),
    categorias: categoriasSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })),
    compromissos: compromissosSnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })),
  };
}

// Organiza os dados do mês em um objeto fácil de consumir no PDF e no botão de exportação.
function organizarDadosMensais({
  mes,
  ano,
  lancamentos,
  categorias,
  compromissos,
}) {
  const categoriasMap = new Map(
    (categorias || []).map((categoria) => [String(categoria.id), categoria]),
  );

  const lancamentosDoMes = (lancamentos || [])
    .map((item) => {
      const data = toDate(item.data);
      const pertenceAoMes =
        data && data.getMonth() === mes && data.getFullYear() === ano;

      if (!pertenceAoMes) return null;

      const categoria = categoriasMap.get(String(item.categoriaId));

      return {
        id: item.id,
        tipo: item.tipo,
        categoriaId: item.categoriaId,
        categoriaNome: categoria?.nome || "Sem categoria",
        valor: normalizeNumber(item.valor),
        data: item.data,
        dataIso: toIsoDate(item.data),
        descricao: item.descricao || "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const dataA = toDate(a.data);
      const dataB = toDate(b.data);
      return (dataB?.getTime?.() || 0) - (dataA?.getTime?.() || 0);
    });

  const totalEntradas = lancamentosDoMes
    .filter((item) => item.tipo === "entrada")
    .reduce((soma, item) => soma + item.valor, 0);

  const totalSaidas = lancamentosDoMes
    .filter((item) => item.tipo === "saida")
    .reduce((soma, item) => soma + item.valor, 0);

  const breakdownPorCategoria = Object.values(
    lancamentosDoMes.reduce((acc, item) => {
      const chave = String(item.categoriaId || item.categoriaNome);

      if (!acc[chave]) {
        acc[chave] = {
          categoriaId: item.categoriaId,
          nome: item.categoriaNome,
          tipo: item.tipo,
          total: 0,
          entradas: 0,
          saidas: 0,
        };
      }

      acc[chave].total += item.valor;
      if (item.tipo === "entrada") acc[chave].entradas += item.valor;
      if (item.tipo === "saida") acc[chave].saidas += item.valor;

      return acc;
    }, {}),
  ).sort((a, b) => b.total - a.total);

  const compromissosDoMes = (compromissos || [])
    .map((item) => {
      const data = toDate(item.data);
      const pertenceAoMes =
        data && data.getMonth() === mes && data.getFullYear() === ano;

      if (!pertenceAoMes) return null;

      const pago = Boolean(
        item.pago ??
        item.recebido ??
        (item.status === "pago" || item.status === "recebido"),
      );

      return {
        id: item.id,
        tipo: item.tipo,
        titulo: item.titulo || "Sem título",
        valor: normalizeNumber(item.valor),
        data: item.data,
        dataIso: toIsoDate(item.data),
        nota: item.nota || "",
        status: pago ? "Pago / Recebido" : "Pendente",
        pago,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const dataA = toDate(a.data);
      const dataB = toDate(b.data);
      return (dataA?.getTime?.() || 0) - (dataB?.getTime?.() || 0);
    });

  const resumo = {
    mes,
    ano,
    totalEntradas,
    totalSaidas,
    saldo: totalEntradas - totalSaidas,
  };

  const dadosEstruturados = {
    resumo,
    categorias: breakdownPorCategoria.map((item) => ({
      nome: item.nome,
      tipo: item.tipo,
      entradas: item.entradas,
      saidas: item.saidas,
      total: item.total,
    })),
    lancamentos: lancamentosDoMes.map((item) => ({
      data: item.dataIso,
      tipo: item.tipo,
      categoria: item.categoriaNome,
      valor: item.valor,
      descricao: item.descricao,
    })),
  };

  return {
    mes,
    ano,
    resumo,
    breakdownPorCategoria,
    lancamentos: lancamentosDoMes,
    compromissos: compromissosDoMes,
    categorias: categorias || [],
    dadosEstruturados,
    textoEstruturado: JSON.stringify(dadosEstruturados, null, 2),
  };
}

export function useMonthlyReport(mes, ano) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function carregarRelatorio() {
      if (mes === undefined || ano === undefined) {
        setData(null);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const inicio = new Date(ano, mes, 1, 0, 0, 0, 0);
        const fim = new Date(ano, mes + 1, 0, 23, 59, 59, 999);

        let dados = null;

        try {
          dados = await buscarDadosPorColecoes(inicio, fim);
        } catch (errorColecao) {
          console.warn(
            "Não foi possível consultar as coleções; usando fallback do documento legado.",
            errorColecao,
          );
          dados = null;
        }

        if (
          !dados ||
          (!dados.lancamentos.length &&
            !dados.compromissos.length &&
            !dados.categorias.length)
        ) {
          dados = await buscarDadosLegado();
        }

        const organizado = organizarDadosMensais({
          mes,
          ano,
          lancamentos: dados?.lancamentos || [],
          categorias: dados?.categorias || [],
          compromissos: dados?.compromissos || [],
        });

        if (isMounted) {
          setData(organizado);
        }
      } catch (err) {
        console.error("Erro ao montar relatório do mês:", err);
        if (isMounted) {
          setError(
            "Não foi possível carregar os dados do mês. Verifique a conexão com o Firestore.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    carregarRelatorio();

    return () => {
      isMounted = false;
    };
  }, [mes, ano]);

  return { data, loading, error };
}
