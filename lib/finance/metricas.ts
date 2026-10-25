import {
  compararValores,
  deCentavos,
  paraCentavos,
  totaisPorCategoria,
  type Comparacao,
  type ResumoFinanceiro,
  type TotalCategoria,
  calcularResumo,
} from "./calculos";
import {
  mesDaData,
  normalizarMeses,
  mesesComparaveisAnteriores,
} from "./meses";
import { Extrato } from "./types";

export type PontoSerie = {
  mes: string; // "YYYY-MM"
  receitas: number;
  despesas: number;
  saldo: number;
  /** Percentual das receitas do mês comprometido com despesas (null se não houve receita). */
  comprometido: number | null;
  quantidade: number;
};

/** Filtra os registros pelos meses selecionados (cada registro entra no máximo uma vez). */
export function filtrarPorMeses(
  extratos: Extrato[],
  meses: string[]
): Extrato[] {
  const set = new Set(normalizarMeses(meses));
  const vistos = new Set<string>();
  const saida: Extrato[] = [];
  for (const e of extratos) {
    if (!set.has(mesDaData(e.data_transacao)) || vistos.has(e.id)) continue;
    vistos.add(e.id);
    saida.push(e);
  }
  return saida;
}

/**
 * Uma linha por mês SELECIONADO, mesmo sem movimentações (valores zerados),
 * para que meses vazios não desapareçam dos gráficos.
 */
export function serieMensal(
  extratos: Extrato[],
  meses: string[]
): PontoSerie[] {
  const lista = normalizarMeses(meses);
  const acc = new Map(lista.map((m) => [m, { rec: 0, pag: 0, qtd: 0 }]));
  for (const e of extratos) {
    const a = acc.get(mesDaData(e.data_transacao));
    if (!a) continue;
    const c = paraCentavos(e.valor);
    if (e.tipo === "recebimento") a.rec += c;
    else a.pag += c;
    a.qtd++;
  }
  return lista.map((mes) => {
    const a = acc.get(mes)!;
    return {
      mes,
      receitas: deCentavos(a.rec),
      despesas: deCentavos(a.pag),
      saldo: deCentavos(a.rec - a.pag),
      comprometido: a.rec > 0 ? Math.round((a.pag * 1000) / a.rec) / 10 : null,
      quantidade: a.qtd,
    };
  });
}

export type Destaque<T = number> = { mes: string; valor: T } | null;

export type MetricasPeriodo = {
  quantidadeMeses: number;
  resumo: ResumoFinanceiro;
  mediaMensalReceitas: number;
  mediaMensalDespesas: number;
  mediaMensalSaldo: number;
  /** null = comparação indisponível (seleção não contínua ou sem dados do período anterior). */
  variacaoReceitas: Comparacao | null;
  variacaoDespesas: Comparacao | null;
  variacaoSaldo: Comparacao | null;
  mesMaiorReceita: Destaque;
  mesMaiorDespesa: Destaque;
  categoriaMaiorDespesa: TotalCategoria | null;
  /** despesas / receitas (%), ou null quando não há receitas no período. */
  percentualComprometido: number | null;
  /** Meses selecionados com saldo negativo. */
  mesesNegativos: number;
  maiorDespesa: {
    descricao: string;
    valor: number;
    data: string;
    categoria: string;
  } | null;
  serie: PontoSerie[];
  despesasPorCategoria: TotalCategoria[];
};

/** Média mensal sobre TODOS os meses selecionados (inclui os sem movimentação). */
function mediaEmCentavos(totalCentavos: number, meses: number): number {
  return meses === 0 ? 0 : deCentavos(Math.round(totalCentavos / meses));
}

export function calcularMetricas(
  extratos: Extrato[],
  meses: string[],
  /** Registros dos `mesesComparaveisAnteriores(meses)`; undefined/null = sem comparação. */
  extratosAnteriores?: Extrato[] | null
): MetricasPeriodo {
  const lista = normalizarMeses(meses);
  const doPeriodo = filtrarPorMeses(extratos, lista);
  const resumo = calcularResumo(doPeriodo);
  const serie = serieMensal(doPeriodo, lista);
  const n = lista.length;

  const recC = paraCentavos(resumo.totalRecebimentos);
  const pagC = paraCentavos(resumo.totalPagamentos);

  // Comparação só quando a seleção é contínua e os dados anteriores foram fornecidos.
  let vRec: Comparacao | null = null;
  let vDesp: Comparacao | null = null;
  let vSaldo: Comparacao | null = null;
  const mesesAnt = mesesComparaveisAnteriores(lista);
  if (mesesAnt && extratosAnteriores) {
    const ant = calcularResumo(filtrarPorMeses(extratosAnteriores, mesesAnt));
    vRec = compararValores(
      resumo.totalRecebimentos,
      ant.totalRecebimentos,
      "receita"
    );
    vDesp = compararValores(
      resumo.totalPagamentos,
      ant.totalPagamentos,
      "despesa"
    );
    vSaldo = compararValores(resumo.saldo, ant.saldo, "saldo");
  }

  // Maior mês: em empate, vence o mais antigo (determinístico). Zero não é "maior".
  const maior = (campo: "receitas" | "despesas"): Destaque => {
    let melhor: PontoSerie | null = null;
    for (const p of serie) {
      if (
        paraCentavos(p[campo]) > 0 &&
        (!melhor || paraCentavos(p[campo]) > paraCentavos(melhor[campo]))
      )
        melhor = p;
    }
    return melhor ? { mes: melhor.mes, valor: melhor[campo] } : null;
  };

  const despesasPorCategoria = totaisPorCategoria(doPeriodo, "pagamento");

  let maiorDespesa: MetricasPeriodo["maiorDespesa"] = null;
  for (const e of doPeriodo) {
    if (e.tipo !== "pagamento") continue;
    if (
      !maiorDespesa ||
      paraCentavos(e.valor) > paraCentavos(maiorDespesa.valor)
    )
      maiorDespesa = {
        descricao: e.descricao,
        valor: e.valor,
        data: e.data_transacao,
        categoria: e.categoria ?? "outro",
      };
  }

  return {
    quantidadeMeses: n,
    resumo,
    mediaMensalReceitas: mediaEmCentavos(recC, n),
    mediaMensalDespesas: mediaEmCentavos(pagC, n),
    mediaMensalSaldo: mediaEmCentavos(recC - pagC, n),
    variacaoReceitas: vRec,
    variacaoDespesas: vDesp,
    variacaoSaldo: vSaldo,
    mesMaiorReceita: maior("receitas"),
    mesMaiorDespesa: maior("despesas"),
    categoriaMaiorDespesa: despesasPorCategoria[0] ?? null,
    percentualComprometido:
      recC > 0 ? Math.round((pagC * 1000) / recC) / 10 : null,
    mesesNegativos: serie.filter((p) => p.saldo < 0).length,
    maiorDespesa,
    serie,
    despesasPorCategoria,
  };
}
