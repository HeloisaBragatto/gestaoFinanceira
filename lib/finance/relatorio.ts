import { ResumoFinanceiro, TotalCategoria } from "./calculos";
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
