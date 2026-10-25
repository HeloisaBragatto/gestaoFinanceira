import type { SupabaseClient } from "@supabase/supabase-js";
import { aplicarFiltrosQuery, type FiltrosState } from "./filtros";
import { Extrato } from "./types";

// O Supabase/PostgREST devolve no máximo 1000 linhas por requisição.
// Para que totais, gráficos e relatórios considerem TODOS os registros,
// a busca é feita em lotes.
const TAMANHO_LOTE = 1000;
export const LIMITE_REGISTROS = 50_000;

type Opcoes = {
  /** Colunas do select. Padrão: todas. */
  colunas?: string;
  /** Restringe explicitamente ao usuário (defesa em profundidade além do RLS). */
  userId?: string;
};

export async function buscarTodosExtratos(
  supabase: SupabaseClient,
  filtros: FiltrosState,
  opcoes: Opcoes = {}
): Promise<Extrato[]> {
  const colunas = opcoes.colunas ?? "*";
  const todos: Extrato[] = [];

  for (let inicio = 0; ; inicio += TAMANHO_LOTE) {
    let query = supabase.from("extratos").select(colunas);
    if (opcoes.userId) query = query.eq("user_id", opcoes.userId);
    query = aplicarFiltrosQuery(query, filtros);

    const { data, error } = await query
      .order("data_transacao", { ascending: false })
      .order("id", { ascending: true }) // desempate estável entre lotes
      .range(inicio, inicio + TAMANHO_LOTE - 1);

    if (error) throw new Error(error.message);

    const lote = (data ?? []) as unknown as Extrato[];
    for (const r of lote) todos.push({ ...r, valor: Number(r.valor) });

    if (lote.length < TAMANHO_LOTE) break;
    if (todos.length >= LIMITE_REGISTROS)
      throw new Error(
        `Mais de ${LIMITE_REGISTROS.toLocaleString("pt-BR")} registros encontrados. Refine os filtros.`
      );
  }

  return todos;
}
