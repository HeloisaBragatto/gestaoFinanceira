export type Meta = {
  id: string;
  nome: string;
  valor_alvo: number;
  valor_inicial: number;
  data_criacao: string; // YYYY-MM-DD
  data_prevista: string | null;
  categoria: string | null;
  descricao: string | null;
};

export type Contribuicao = {
  id: string;
  meta_id: string;
  valor: number;
  data: string; // YYYY-MM-DD
  observacao: string | null;
};

export const CATEGORIAS_META = [
  "viagem",
  "reserva de emergência",
  "eletrônicos",
  "estudos",
  "lazer",
  "casa",
  "veículo",
  "outro",
];
