import {
  calcularResumo,
  totaisPorCategoria,
  type ResumoFinanceiro,
  type TotalCategoria,
} from "./calculos";
import { filtrosAtivos, periodoTexto, type FiltrosState } from "./filtros";
import { dataCompacta, formatarDataHora } from "./formato";
import { Extrato } from "./types";

export type FormatoRelatorio = "pdf" | "xlsx" | "csv";

export type Relatorio = {
  titulo: string;
  geradoEm: string;
  periodo: string;
  /** Um item por filtro ativo. Vazio = nenhum filtro. */
  filtros: string[];
  resumo: ResumoFinanceiro;
  despesasPorCategoria: TotalCategoria[];
  receitasPorCategoria: TotalCategoria[];
  movimentacoes: Extrato[];
};

export function montarRelatorio(
  extratos: Extrato[],
  filtros: FiltrosState,
  agora: Date = new Date()
): Relatorio {
  const movimentacoes = [...extratos].sort(
    (a, b) =>
      b.data_transacao.localeCompare(a.data_transacao) ||
      a.descricao.localeCompare(b.descricao)
  );
  return {
    titulo: "Relatório de Receitas e Despesas",
    geradoEm: formatarDataHora(agora),
    periodo: periodoTexto(filtros),
    filtros: filtrosAtivos(filtros).map((f) => f.rotulo),
    resumo: calcularResumo(movimentacoes),
    despesasPorCategoria: totaisPorCategoria(movimentacoes, "pagamento"),
    receitasPorCategoria: totaisPorCategoria(movimentacoes, "recebimento"),
    movimentacoes,
  };
}

export function nomeArquivoRelatorio(
  filtros: FiltrosState,
  formato: FormatoRelatorio,
  agora: Date = new Date()
): string {
  const periodo =
    filtros.dataInicio && filtros.dataFim
      ? `${filtros.dataInicio}_a_${filtros.dataFim}`
      : `geral_${dataCompacta(agora)}`;
  return `relatorio_financeiro_${periodo}.${formato}`;
}

export const ROTULO_TIPO = {
  recebimento: "Receita",
  pagamento: "Despesa",
} as const;

export function rotuloOrigem(origem: string): string {
  return origem === "manual" ? "Manual" : "Importado";
}
