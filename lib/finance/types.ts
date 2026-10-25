export type TipoMovimentacao = "pagamento" | "recebimento";

export type Extrato = {
  id: string;
  tipo: TipoMovimentacao;
  descricao: string;
  categoria: string | null;
  valor: number;
  data_transacao: string; // "YYYY-MM-DD"
  origem: string; // "manual" | "pdf"
};

export const CATEGORIAS = [
  "alimentação",
  "salário",
  "transporte",
  "saúde",
  "lazer",
  "moradia",
  "transferência",
  "compras",
  "despesas",
  // Categorias que o parser de importação (inferirCategoria) também gera:
  "educação",
  "financeiro",
  "tecnologia",
  "telecom",
  "outro",
];
