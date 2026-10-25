// Todos os somatórios são feitos em CENTAVOS (inteiros) para evitar erros de
// ponto flutuante (ex.: 0.1 + 0.2 !== 0.3).

import { Extrato } from "./types";

export function paraCentavos(v: number): number {
  return Math.round(v * 100);
}

export function deCentavos(c: number): number {
  return c / 100;
}

export type ResumoFinanceiro = {
  totalRecebimentos: number;
  totalPagamentos: number;
  saldo: number;
  quantidade: number;
  quantidadeRecebimentos: number;
  quantidadePagamentos: number;
};

export function calcularResumo(
  extratos: Pick<Extrato, "tipo" | "valor">[]
): ResumoFinanceiro {
  let rec = 0;
  let pag = 0;
  let qRec = 0;
  let qPag = 0;
  for (const e of extratos) {
    const c = paraCentavos(e.valor);
    if (e.tipo === "recebimento") {
      rec += c;
      qRec++;
    } else {
      pag += c;
      qPag++;
    }
  }
  return {
    totalRecebimentos: deCentavos(rec),
    totalPagamentos: deCentavos(pag),
    saldo: deCentavos(rec - pag),
    quantidade: extratos.length,
    quantidadeRecebimentos: qRec,
    quantidadePagamentos: qPag,
  };
}

export type TotalCategoria = {
  categoria: string;
  total: number;
  quantidade: number;
  /** Percentual (0-100, 1 casa) sobre o total do mesmo tipo. */
  percentual: number;
};

export function totaisPorCategoria(
  extratos: Pick<Extrato, "tipo" | "valor" | "categoria">[],
  tipo: "pagamento" | "recebimento"
): TotalCategoria[] {
  const mapa = new Map<string, { centavos: number; qtd: number }>();
  let totalTipo = 0;
  for (const e of extratos) {
    if (e.tipo !== tipo) continue;
    const cat = e.categoria ?? "outro";
    const c = paraCentavos(e.valor);
    const atual = mapa.get(cat) ?? { centavos: 0, qtd: 0 };
    atual.centavos += c;
    atual.qtd += 1;
    mapa.set(cat, atual);
    totalTipo += c;
  }
  return Array.from(mapa.entries())
    .map(([categoria, v]) => ({
      categoria,
      total: deCentavos(v.centavos),
      quantidade: v.qtd,
      percentual:
        totalTipo === 0 ? 0 : Math.round((v.centavos / totalTipo) * 1000) / 10,
      _c: v.centavos,
    }))
    .sort((a, b) => b._c - a._c || a.categoria.localeCompare(b.categoria))
    .map(({ _c, ...resto }) => {
      void _c;
      return resto;
    });
}

export type PontoMensal = {
  mes: string; // "YYYY-MM"
  receitas: number;
  despesas: number;
  saldo: number;
};

export function evolucaoMensal(
  extratos: Pick<Extrato, "tipo" | "valor" | "data_transacao">[]
): PontoMensal[] {
  const mapa = new Map<string, { rec: number; pag: number }>();
  for (const e of extratos) {
    const mes = e.data_transacao.slice(0, 7);
    const atual = mapa.get(mes) ?? { rec: 0, pag: 0 };
    const c = paraCentavos(e.valor);
    if (e.tipo === "recebimento") atual.rec += c;
    else atual.pag += c;
    mapa.set(mes, atual);
  }
  return Array.from(mapa.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({
      mes,
      receitas: deCentavos(v.rec),
      despesas: deCentavos(v.pag),
      saldo: deCentavos(v.rec - v.pag),
    }));
}

// ── Período anterior (comparação) ────────────────────────────

function parseIso(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Período imediatamente anterior ao informado.
 * - Se o intervalo cobre meses civis inteiros (dia 1 ao último dia do mês),
 *   o anterior são os mesmos N meses civis imediatamente antes.
 * - Caso contrário, são os mesmos N dias imediatamente antes.
 */
export function periodoAnterior(
  inicio: string,
  fim: string
): { inicio: string; fim: string } {
  const di = parseIso(inicio);
  const df = parseIso(fim);
  const fimAnterior = new Date(di.getTime() - 86400000);

  const ultimoDiaDoMes = new Date(
    Date.UTC(df.getUTCFullYear(), df.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const mesesInteiros =
    di.getUTCDate() === 1 && df.getUTCDate() === ultimoDiaDoMes;

  if (mesesInteiros) {
    const n =
      (df.getUTCFullYear() - di.getUTCFullYear()) * 12 +
      (df.getUTCMonth() - di.getUTCMonth()) +
      1;
    const ini = new Date(
      Date.UTC(di.getUTCFullYear(), di.getUTCMonth() - n, 1)
    );
    return { inicio: toIso(ini), fim: toIso(fimAnterior) };
  }

  const dias = Math.round((df.getTime() - di.getTime()) / 86400000) + 1;
  const ini = new Date(fimAnterior.getTime() - (dias - 1) * 86400000);
  return { inicio: toIso(ini), fim: toIso(fimAnterior) };
}

// ── Comparação entre períodos ────────────────────────────────

export type NaturezaIndicador = "receita" | "despesa" | "saldo";
export type DirecaoVariacao = "aumento" | "reducao" | "estavel";
export type AvaliacaoVariacao = "favoravel" | "desfavoravel" | "neutra";
export type MotivoSemPercentual =
  | "sem_base"
  | "ambos_zero"
  | "mudanca_de_sinal";

export type Comparacao = {
  atual: number;
  anterior: number;
  /** atual - anterior (em reais, calculada em centavos). */
  diferenca: number;
  direcao: DirecaoVariacao;
  /** Aumento de receita/saldo é favorável; aumento de despesa é desfavorável. */
  avaliacao: AvaliacaoVariacao;
  /** Variação sobre |anterior|, sem arredondar (a tela arredonda). `null` quando não é confiável. */
  percentual: number | null;
  motivoSemPercentual: MotivoSemPercentual | null;
};

/**
 * Compara dois valores de períodos equivalentes.
 * - Nunca divide por zero: sem base de comparação não há percentual.
 * - Se o sinal muda (ex.: saldo +100 -> -50) o percentual seria enganoso
 *   (-150%): o percentual é omitido e a diferença em R$ é a informação válida.
 * - A base do percentual é |anterior|, então melhorar um saldo negativo
 *   (-200 -> -100) resulta em +50% (favorável), e não em um sinal invertido.
 */
export function compararValores(
  atual: number,
  anterior: number,
  natureza: NaturezaIndicador
): Comparacao {
  const a = paraCentavos(atual);
  const b = paraCentavos(anterior);
  const dif = a - b;

  const direcao: DirecaoVariacao =
    dif > 0 ? "aumento" : dif < 0 ? "reducao" : "estavel";

  let avaliacao: AvaliacaoVariacao = "neutra";
  if (direcao !== "estavel") {
    const aumentoEhBom = natureza !== "despesa";
    avaliacao =
      (direcao === "aumento") === aumentoEhBom ? "favoravel" : "desfavoravel";
  }

  let percentual: number | null = null;
  let motivo: MotivoSemPercentual | null = null;
  if (b === 0) {
    motivo = a === 0 ? "ambos_zero" : "sem_base";
  } else if (a !== 0 && a < 0 !== b < 0) {
    motivo = "mudanca_de_sinal";
  } else {
    // multiplica antes de dividir (inteiros): 2000*100/10000 = 20 exato
    percentual = (dif * 100) / Math.abs(b);
    if (percentual === 0) percentual = 0; // evita -0
  }

  return {
    atual,
    anterior,
    diferenca: deCentavos(dif),
    direcao,
    avaliacao,
    percentual,
    motivoSemPercentual: motivo,
  };
}

export type ComparacaoResumos = {
  receitas: Comparacao;
  despesas: Comparacao;
  saldo: Comparacao;
};

export function compararResumos(
  atual: ResumoFinanceiro,
  anterior: ResumoFinanceiro
): ComparacaoResumos {
  return {
    receitas: compararValores(
      atual.totalRecebimentos,
      anterior.totalRecebimentos,
      "receita"
    ),
    despesas: compararValores(
      atual.totalPagamentos,
      anterior.totalPagamentos,
      "despesa"
    ),
    saldo: compararValores(atual.saldo, anterior.saldo, "saldo"),
  };
}
