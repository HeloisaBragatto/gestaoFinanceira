import type { Extrato } from "@/lib/finance/types";

let n = 0;
export const mk = (
  tipo: Extrato["tipo"],
  descricao: string,
  categoria: string | null,
  valor: number,
  data: string,
  origem = "manual"
): Extrato => ({
  id: `id-${++n}`,
  tipo,
  descricao,
  categoria,
  valor,
  data_transacao: data,
  origem,
});

export const DADOS: Extrato[] = [
  mk("recebimento", "Salário outubro", "salário", 5000, "2026-10-05"),
  mk("pagamento", "Supermercado Dia", "alimentação", 350.45, "2026-10-06"),
  mk("pagamento", "iFood pizza", "alimentação", 62.9, "2026-10-12", "pdf"),
  mk("pagamento", "Uber viagem", "transporte", 23.1, "2026-10-12", "pdf"),
  mk("pagamento", "Aluguel", "moradia", 1500, "2026-10-10"),
  mk("recebimento", "Freelance site", "salário", 800.1, "2026-09-20", "pdf"),
  mk("pagamento", "Supermercado Dia", "alimentação", 0.1, "2026-09-21"),
  mk("pagamento", "Netflix", "lazer", 0.2, "2026-09-22"),
  mk("pagamento", "Sem categoria", null, 10, "2026-09-25"),
  mk("pagamento", "Escola 50% off", "educação", 99.99, "2026-08-31"),
  mk("recebimento", "Pix recebido João", "transferência", 120, "2026-11-01"),
  mk("pagamento", "Farmácia", "saúde", 45.5, "2026-10-31"),
];
