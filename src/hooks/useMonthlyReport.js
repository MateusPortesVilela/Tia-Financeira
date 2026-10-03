// useEffect executa a busca quando mês/ano mudam; useState guarda resultado e estado da operação.
import { useEffect, useState } from "react";
// Importa as operações do Firestore usadas para consultar documentos e coleções.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
// Instância compartilhada do Firestore configurada pela aplicação.
import { db } from "../../firebase-config.js";

// Converte um valor do Firestore ou uma data compatível em Date; devolve null quando não consegue converter.
const toDate = (value) => {
  // Trata valores ausentes sem tentar construir uma data inválida.
  if (!value) return null;

  // Timestamps do Firestore fornecem toDate(), que preserva sua conversão nativa.
  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  // Para strings, números ou Date, delega a conversão ao construtor padrão.
  const parsed = new Date(value);
  // getTime() retorna NaN para datas inválidas; nesse caso sinaliza falha com null.
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// Converte uma data válida para AAAA-MM-DD em UTC; para valores inválidos devolve string vazia.
const toIsoDate = (value) => {
  // Reaproveita a conversão e validação centralizadas em toDate.
  const date = toDate(value);
  // String vazia facilita o consumo quando não há data válida.
  if (!date) return "";
  // O slice mantém apenas ano, mês e dia da representação ISO.
  return date.toISOString().slice(0, 10);
};

// Converte valores para número e usa zero quando o valor é null ou undefined.
const normalizeNumber = (value) => Number(value ?? 0);

// Lê o documento legado appData/meuFinanceiro e adapta seus campos ao formato esperado pelo hook.
async function buscarDadosLegado() {
  // Cria uma referência ao único documento usado pelo armazenamento antigo.
  const ref = doc(db, "appData", "meuFinanceiro");
  // Aguarda a leitura do documento no Firestore; falhas são propagadas ao chamador.
  const snapshot = await getDoc(ref);

  // Documento inexistente equivale a três listas vazias, não a um erro.
  if (!snapshot.exists()) {
    return { lancamentos: [], categorias: [], compromissos: [] };
  }

  // Obtém os campos do documento e protege contra conteúdo ausente.
  const data = snapshot.data() || {};
  // Garante que cada campo consumido adiante seja uma lista.
  return {
    lancamentos: Array.isArray(data.lancamentos) ? data.lancamentos : [],
    categorias: Array.isArray(data.categorias) ? data.categorias : [],
    compromissos: Array.isArray(data.compromissos) ? data.compromissos : [],
  };
}

// Consulta as coleções normalizadas dentro do período informado e devolve listas de documentos com seus ids.
// Promise.all executa as três leituras ao mesmo tempo; se uma falhar, rejeita a operação inteira para permitir fallback.
async function buscarDadosPorColecoes(inicio, fim) {
  // Cria referências para as coleções atuais do modelo de dados.
  const lancamentosRef = collection(db, "lancamentos");
  const compromissosRef = collection(db, "compromissos");
  const categoriasRef = collection(db, "categorias");

  // Filtra lançamentos e compromissos pelas datas, mas carrega todas as categorias para resolver seus nomes.
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

  // Converte cada snapshot em objetos comuns e inclui o id do documento junto aos seus campos.
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

// Recebe mês/ano e as três listas brutas; retorna totais, listas filtradas e dados estruturados para exportação.
function organizarDadosMensais({
  mes,
  ano,
  lancamentos,
  categorias,
  compromissos,
}) {
  // Indexa categorias pelo id para encontrar o nome de cada lançamento sem percorrer a lista repetidamente.
  const categoriasMap = new Map(
    (categorias || []).map((categoria) => [String(categoria.id), categoria]),
  );

  // Descarta lançamentos de outros meses ou com data inválida, enriquece os válidos e ordena do mais recente.
  const lancamentosDoMes = (lancamentos || [])
    .map((item) => {
      // Normaliza a data para conseguir comparar mês e ano com segurança.
      const data = toDate(item.data);
      const pertenceAoMes =
        data && data.getMonth() === mes && data.getFullYear() === ano;

      // Itens fora do período são retirados mais adiante pelo filter(Boolean).
      if (!pertenceAoMes) return null;

      // Busca a categoria pelo id; usa um rótulo padrão se ela não existir.
      const categoria = categoriasMap.get(String(item.categoriaId));

      // Mantém somente os campos necessários ao relatório e normaliza valor/data/texto.
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
    // Remove os nulls produzidos para registros inválidos ou fora do mês.
    .filter(Boolean)
    // Ordena em ordem decrescente de data; datas não conversíveis ficam no início como timestamp zero.
    .sort((a, b) => {
      const dataA = toDate(a.data);
      const dataB = toDate(b.data);
      return (dataB?.getTime?.() || 0) - (dataA?.getTime?.() || 0);
    });

  // Soma somente os valores classificados explicitamente como entrada.
  const totalEntradas = lancamentosDoMes
    .filter((item) => item.tipo === "entrada")
    .reduce((soma, item) => soma + item.valor, 0);

  // Soma somente os valores classificados explicitamente como saída.
  const totalSaidas = lancamentosDoMes
    .filter((item) => item.tipo === "saida")
    .reduce((soma, item) => soma + item.valor, 0);

  // Agrupa os lançamentos por categoria, separa entradas/saídas e ordena pelo total decrescente.
  const breakdownPorCategoria = Object.values(
    lancamentosDoMes.reduce((acc, item) => {
      // Usa o id quando disponível; sem id, o nome funciona como chave de agrupamento.
      const chave = String(item.categoriaId || item.categoriaNome);

      // Inicializa uma única linha de resumo para cada categoria.
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

      // Atualiza o total e o subtotal correspondente ao tipo de lançamento.
      acc[chave].total += item.valor;
      if (item.tipo === "entrada") acc[chave].entradas += item.valor;
      if (item.tipo === "saida") acc[chave].saidas += item.valor;

      return acc;
    }, {}),
  ).sort((a, b) => b.total - a.total);

  // Filtra compromissos do período, calcula seu status e ordena do mais próximo ao mais distante.
  const compromissosDoMes = (compromissos || [])
    .map((item) => {
      // Converte a data antes de verificar se o compromisso pertence ao mês solicitado.
      const data = toDate(item.data);
      const pertenceAoMes =
        data && data.getMonth() === mes && data.getFullYear() === ano;

      if (!pertenceAoMes) return null;

      // Compatibiliza campos antigos e novos de pagamento/recebimento para gerar um único booleano.
      const pago = Boolean(
        item.pago ??
        item.recebido ??
        (item.status === "pago" || item.status === "recebido"),
      );

      // Normaliza os campos que o relatório exibe e conserva o estado booleano para outros consumidores.
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
    // Remove compromissos inválidos ou pertencentes a outro mês.
    .filter(Boolean)
    // Mantém primeiro as datas mais próximas; datas inválidas recebem timestamp zero.
    .sort((a, b) => {
      const dataA = toDate(a.data);
      const dataB = toDate(b.data);
      return (dataA?.getTime?.() || 0) - (dataB?.getTime?.() || 0);
    });

  // Calcula os indicadores principais; saídas são subtraídas das entradas para obter o saldo.
  const resumo = {
    mes,
    ano,
    totalEntradas,
    totalSaidas,
    saldo: totalEntradas - totalSaidas,
  };

  // Cria uma representação enxuta e serializável, independente das estruturas internas do Firestore.
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

  // Devolve o modelo completo usado pelo PDF, pela exportação e por outras partes da interface.
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

// Hook que recebe o mês (0 a 11) e o ano; retorna { data, loading, error } para a interface.
export function useMonthlyReport(mes, ano) {
  // data recebe o relatório pronto ou null enquanto não há resultado.
  const [data, setData] = useState(null);
  // loading indica se a consulta e a organização estão em andamento.
  const [loading, setLoading] = useState(false);
  // error contém uma mensagem legível quando não é possível carregar o relatório.
  const [error, setError] = useState("");

  // Recarrega o relatório sempre que mês ou ano mudam.
  useEffect(() => {
    // Evita atualizar estado depois que este efeito foi limpo/desmontado.
    let isMounted = true;

    // Executa a busca assíncrona, aplica fallback e atualiza os estados do hook.
    async function carregarRelatorio() {
      // Sem período definido, limpa o relatório e encerra; não inicia uma consulta.
      if (mes === undefined || ano === undefined) {
        setData(null);
        return;
      }

      // Marca o início da operação e remove uma mensagem de erro anterior.
      setLoading(true);
      setError("");

      try {
        // Monta os limites inclusivos do mês local: primeiro dia e último milissegundo do último dia.
        const inicio = new Date(ano, mes, 1, 0, 0, 0, 0);
        const fim = new Date(ano, mes + 1, 0, 23, 59, 59, 999);

        // Será preenchido pela consulta atual ou pelo fallback legado.
        let dados = null;

        // Tenta primeiro o modelo atual dividido em coleções.
        try {
          dados = await buscarDadosPorColecoes(inicio, fim);
        } catch (errorColecao) {
          // Registra a falha da consulta atual e tenta manter compatibilidade com o documento antigo.
          console.warn(
            "Não foi possível consultar as coleções; usando fallback do documento legado.",
            errorColecao,
          );
          dados = null;
        }

        // Usa o documento antigo se a consulta falhou ou se todas as coleções retornaram vazias.
        // Se o fallback também falhar, o catch externo define o estado de erro do hook.
        if (
          !dados ||
          (!dados.lancamentos.length &&
            !dados.compromissos.length &&
            !dados.categorias.length)
        ) {
          dados = await buscarDadosLegado();
        }

        // Monta um relatório válido mesmo quando alguma lista não veio preenchida.
        const organizado = organizarDadosMensais({
          mes,
          ano,
          lancamentos: dados?.lancamentos || [],
          categorias: dados?.categorias || [],
          compromissos: dados?.compromissos || [],
        });

        // Só altera estado se o efeito ainda estiver ativo.
        if (isMounted) {
          setData(organizado);
        }
      } catch (err) {
        // Captura erros do fallback ou da transformação e registra detalhes para diagnóstico.
        console.error("Erro ao montar relatório do mês:", err);
        // A interface recebe uma mensagem genérica, sem expor detalhes internos do Firestore.
        if (isMounted) {
          setError(
            "Não foi possível carregar os dados do mês. Verifique a conexão com o Firestore.",
          );
        }
      } finally {
        // Encerra o estado de carregamento mesmo após sucesso ou erro.
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Dispara a função assíncrona sem bloquear a execução do efeito.
    carregarRelatorio();

    // A limpeza invalida atualizações de estado caso o hook seja desmontado ou o período mude.
    return () => {
      isMounted = false;
    };
  }, [mes, ano]);

  // Expõe os três estados consumidos pela tela que chama o hook.
  return { data, loading, error };
}
