import { paraCentavos } from "./calculos";
import { formatarDataBr, formatarMoeda } from "./formato";
import { Extrato } from "./types";

// Módulo ÚNICO de filtros: a mesma definição é usada
//  1) na consulta ao banco (aplicarFiltrosQuery) -> tela e exportações;
//  2) em memória (filtrarExtratos) -> referência e testes.

export type FiltrosState = {
  tipo: "todos" | "pagamento" | "recebimento";
  categoria: string; // "todas" ou o nome da categoria
  dataInicio: string; // "YYYY-MM-DD" ou ""
  dataFim: string;
  busca: string;
  valorMin: string; // texto do input ("" = sem limite)
  valorMax: string;
  origem: "todas" | "manual" | "pdf";
};

export const FILTROS_INICIAIS: FiltrosState = {
  tipo: "todos",
  categoria: "todas",
  dataInicio: "",
  dataFim: "",
  busca: "",
  valorMin: "",
  valorMax: "",
  origem: "todas",
};

// ── Validação / normalização ─────────────────────────────────

export function isDataValida(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Converte o texto do filtro de valor em número (>= 0). null = vazio; NaN = inválido. */
export function parseValorFiltro(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : Number.NaN;
}

/**
 * Remove caracteres que alterariam a sintaxe/curingas da consulta (% * \ ")
 * e limita o tamanho. O "_" é mantido e escapado em aplicarFiltrosQuery.
 */
export function sanitizarBusca(s: string): string {
  return s
    .replace(/[%*\\"]/g, "")
    .trim()
    .slice(0, 100);
}

export function validarFiltros(f: FiltrosState): string | null {
  if (f.dataInicio && !isDataValida(f.dataInicio))
    return "Data inicial inválida.";
  if (f.dataFim && !isDataValida(f.dataFim)) return "Data final inválida.";
  if (f.dataInicio && f.dataFim && f.dataInicio > f.dataFim)
    return "A data inicial não pode ser posterior à data final.";

  const min = parseValorFiltro(f.valorMin);
  const max = parseValorFiltro(f.valorMax);
  if (Number.isNaN(min)) return "Valor mínimo inválido.";
  if (Number.isNaN(max)) return "Valor máximo inválido.";
  if (min !== null && max !== null && min > max)
    return "O valor mínimo não pode ser maior que o valor máximo.";
  return null;
}

export function normalizarFiltros(f: Partial<FiltrosState>): FiltrosState {
  const base = { ...FILTROS_INICIAIS, ...f };
  return {
    ...base,
    categoria: base.categoria?.trim() ? base.categoria.trim() : "todas",
    busca: sanitizarBusca(base.busca ?? ""),
    valorMin: (base.valorMin ?? "").trim(),
    valorMax: (base.valorMax ?? "").trim(),
  };
}

// ── Aplicação no banco (Supabase/PostgREST) ──────────────────

type QueryLike = {
  eq: (coluna: string, valor: string) => QueryLike;
  gte: (coluna: string, valor: string | number) => QueryLike;
  lte: (coluna: string, valor: string | number) => QueryLike;
  or: (filtros: string) => QueryLike;
};

/**
 * Aplica os filtros a uma query do Supabase (`from("extratos").select(...)`).
 * Todos os filtros são combinados com AND.
 */
export function aplicarFiltrosQuery<T>(query: T, filtros: FiltrosState): T {
  const f = normalizarFiltros(filtros);
  let q = query as unknown as QueryLike;

  if (f.tipo !== "todos") q = q.eq("tipo", f.tipo);
  if (f.origem !== "todas") q = q.eq("origem", f.origem);

  if (f.categoria !== "todas") {
    // Registros sem categoria são exibidos como "outro" na interface.
    q =
      f.categoria === "outro"
        ? q.or("categoria.eq.outro,categoria.is.null")
        : q.eq("categoria", f.categoria);
  }

  if (f.dataInicio) q = q.gte("data_transacao", f.dataInicio);
  if (f.dataFim) q = q.lte("data_transacao", f.dataFim);

  const min = parseValorFiltro(f.valorMin);
  const max = parseValorFiltro(f.valorMax);
  if (min !== null && !Number.isNaN(min)) q = q.gte("valor", min);
  if (max !== null && !Number.isNaN(max)) q = q.lte("valor", max);

  if (f.busca) {
    // Já sem % * \ ". O "_" é curinga de um caractere no LIKE: escapa com "\"
    // (dentro do valor entre aspas do PostgREST a barra precisa ser dobrada).
    const termo = f.busca.replace(/_/g, "\\\\_");
    q = q.or(`descricao.ilike."%${termo}%",categoria.ilike."%${termo}%"`);
  }

  return q as unknown as T;
}

// ── Aplicação em memória (mesma semântica da consulta ao banco) ──

export function filtrarExtratos(
  extratos: Extrato[],
  filtros: FiltrosState
): Extrato[] {
  const f = normalizarFiltros(filtros);
  const min = parseValorFiltro(f.valorMin);
  const max = parseValorFiltro(f.valorMax);
  const termo = f.busca.toLowerCase();

  return extratos.filter((e) => {
    if (f.tipo !== "todos" && e.tipo !== f.tipo) return false;
    if (f.origem !== "todas" && e.origem !== f.origem) return false;
    if (f.categoria !== "todas" && (e.categoria ?? "outro") !== f.categoria)
      return false;
    if (f.dataInicio && e.data_transacao < f.dataInicio) return false;
    if (f.dataFim && e.data_transacao > f.dataFim) return false;
    if (
      min !== null &&
      !Number.isNaN(min) &&
      paraCentavos(e.valor) < paraCentavos(min)
    )
      return false;
    if (
      max !== null &&
      !Number.isNaN(max) &&
      paraCentavos(e.valor) > paraCentavos(max)
    )
      return false;
    if (termo) {
      const ok =
        e.descricao.toLowerCase().includes(termo) ||
        (e.categoria ?? "").toLowerCase().includes(termo);
      if (!ok) return false;
    }
    return true;
  });
}

// ── Parâmetros de URL (usados pela exportação) ───────────────

const CHAVES: (keyof FiltrosState)[] = [
  "tipo",
  "categoria",
  "dataInicio",
  "dataFim",
  "busca",
  "valorMin",
  "valorMax",
  "origem",
];

export function filtrosParaParams(f: FiltrosState): URLSearchParams {
  const n = normalizarFiltros(f);
  const p = new URLSearchParams();
  for (const k of CHAVES) {
    if (n[k] !== FILTROS_INICIAIS[k]) p.set(k, n[k]);
  }
  return p;
}

export function paramsParaFiltros(p: {
  get: (k: string) => string | null;
}): FiltrosState {
  const tipo = p.get("tipo");
  const origem = p.get("origem");
  return normalizarFiltros({
    tipo: tipo === "pagamento" || tipo === "recebimento" ? tipo : "todos",
    origem: origem === "manual" || origem === "pdf" ? origem : "todas",
    categoria: (p.get("categoria") ?? "todas").slice(0, 60),
    dataInicio: p.get("dataInicio") ?? "",
    dataFim: p.get("dataFim") ?? "",
    busca: p.get("busca") ?? "",
    valorMin: (p.get("valorMin") ?? "").slice(0, 20),
    valorMax: (p.get("valorMax") ?? "").slice(0, 20),
  });
}

// ── Descrição dos filtros ativos (chips e relatórios) ────────

export type FiltroAtivo = { chave: keyof FiltrosState; rotulo: string };

export function filtrosAtivos(filtros: FiltrosState): FiltroAtivo[] {
  const f = normalizarFiltros(filtros);
  const ativos: FiltroAtivo[] = [];
  if (f.tipo !== "todos")
    ativos.push({
      chave: "tipo",
      rotulo: `Tipo: ${f.tipo === "recebimento" ? "Receitas" : "Despesas"}`,
    });
  if (f.categoria !== "todas")
    ativos.push({ chave: "categoria", rotulo: `Categoria: ${f.categoria}` });
  if (f.dataInicio)
    ativos.push({
      chave: "dataInicio",
      rotulo: `A partir de: ${formatarDataBr(f.dataInicio)}`,
    });
  if (f.dataFim)
    ativos.push({
      chave: "dataFim",
      rotulo: `Até: ${formatarDataBr(f.dataFim)}`,
    });
  const min = parseValorFiltro(f.valorMin);
  const max = parseValorFiltro(f.valorMax);
  if (min !== null && !Number.isNaN(min))
    ativos.push({
      chave: "valorMin",
      rotulo: `Valor mínimo: ${formatarMoeda(min)}`,
    });
  if (max !== null && !Number.isNaN(max))
    ativos.push({
      chave: "valorMax",
      rotulo: `Valor máximo: ${formatarMoeda(max)}`,
    });
  if (f.busca) ativos.push({ chave: "busca", rotulo: `Busca: "${f.busca}"` });
  if (f.origem !== "todas")
    ativos.push({
      chave: "origem",
      rotulo: `Origem: ${f.origem === "manual" ? "Manual" : "Importado"}`,
    });
  return ativos;
}

export function removerFiltro(
  f: FiltrosState,
  chave: keyof FiltrosState
): FiltrosState {
  return { ...f, [chave]: FILTROS_INICIAIS[chave] };
}

export function periodoTexto(f: FiltrosState): string {
  if (f.dataInicio && f.dataFim)
    return `${formatarDataBr(f.dataInicio)} a ${formatarDataBr(f.dataFim)}`;
  if (f.dataInicio) return `A partir de ${formatarDataBr(f.dataInicio)}`;
  if (f.dataFim) return `Até ${formatarDataBr(f.dataFim)}`;
  return "Todo o período";
}

// ── Atalhos de período ───────────────────────────────────────

export type PresetPeriodo =
  | "mesAtual"
  | "mesAnterior"
  | "ultimos3Meses"
  | "anoAtual";

export const PRESETS_PERIODO: { id: PresetPeriodo; rotulo: string }[] = [
  { id: "mesAtual", rotulo: "Este mês" },
  { id: "mesAnterior", rotulo: "Mês passado" },
  { id: "ultimos3Meses", rotulo: "Últimos 3 meses" },
  { id: "anoAtual", rotulo: "Este ano" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const ultimoDia = (y: number, m: number) => new Date(y, m, 0).getDate();

/** `hoje` usa o calendário local do navegador. */
export function periodoPreset(
  preset: PresetPeriodo,
  hoje: Date = new Date()
): { dataInicio: string; dataFim: string } {
  const y = hoje.getFullYear();
  const m = hoje.getMonth() + 1;

  switch (preset) {
    case "mesAtual":
      return { dataInicio: iso(y, m, 1), dataFim: iso(y, m, ultimoDia(y, m)) };
    case "mesAnterior": {
      const dt = new Date(y, m - 2, 1);
      const yy = dt.getFullYear();
      const mm = dt.getMonth() + 1;
      return {
        dataInicio: iso(yy, mm, 1),
        dataFim: iso(yy, mm, ultimoDia(yy, mm)),
      };
    }
    case "ultimos3Meses": {
      const dt = new Date(y, m - 3, 1);
      return {
        dataInicio: iso(dt.getFullYear(), dt.getMonth() + 1, 1),
        dataFim: iso(y, m, ultimoDia(y, m)),
      };
    }
    case "anoAtual":
      return { dataInicio: iso(y, 1, 1), dataFim: iso(y, 12, 31) };
  }
}
