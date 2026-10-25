import type { SupabaseClient } from "@supabase/supabase-js";
import { dataLocalIso } from "./calculos";
import { Contribuicao, Meta } from "./types";
import {
  ContribuicaoFormValores,
  MetaFormValores,
  validarContribuicaoForm,
  validarMetaForm,
} from "./validacao";

// Persistência das metas no Supabase. NÃO toca na tabela `extratos`:
// metas e contribuições são um controle manual, separado das movimentações.

const LOTE = 1000;

export class ErroMetas extends Error {
  constructor(
    mensagem: string,
    public tabelasAusentes = false
  ) {
    super(mensagem);
  }
}

type ErroDb = { code?: string; message?: string } | null;

function traduzir(error: NonNullable<ErroDb>): ErroMetas {
  const code = error.code ?? "";
  if (
    code === "PGRST205" ||
    code === "42P01" ||
    /schema cache/i.test(error.message ?? "")
  )
    return new ErroMetas(
      "As tabelas de metas ainda não foram criadas no banco. Execute o arquivo supabase/migrations/20261024000000_metas.sql no SQL Editor do Supabase.",
      true
    );
  if (code === "42501")
    return new ErroMetas("Você não tem permissão para esta operação.");
  if (code === "23514")
    return new ErroMetas("Os dados informados não são válidos.");
  if (code === "23503")
    return new ErroMetas("A meta não existe mais. Atualize a página.");
  return new ErroMetas(
    "Não foi possível concluir a operação. Tente novamente."
  );
}

async function buscarEmLotes<T>(
  consulta: (
    de: number,
    ate: number
  ) => PromiseLike<{ data: unknown; error: ErroDb }>
): Promise<T[]> {
  const todos: T[] = [];
  for (let de = 0; ; de += LOTE) {
    const { data, error } = await consulta(de, de + LOTE - 1);
    if (error) throw traduzir(error);
    const lote = (data ?? []) as T[];
    todos.push(...lote);
    if (lote.length < LOTE) break;
  }
  return todos;
}

export async function carregarMetas(
  supabase: SupabaseClient
): Promise<{ metas: Meta[]; contribuicoes: Contribuicao[] }> {
  const metas = await buscarEmLotes<Meta>((de, ate) =>
    supabase
      .from("metas")
      .select("*")
      .order("data_criacao", { ascending: false })
      .order("id", { ascending: true })
      .range(de, ate)
  );
  const contribuicoes = await buscarEmLotes<Contribuicao>((de, ate) =>
    supabase
      .from("metas_contribuicoes")
      .select("*")
      .order("data", { ascending: false })
      .order("id", { ascending: true })
      .range(de, ate)
  );
  return {
    metas: metas.map((m) => ({
      ...m,
      valor_alvo: Number(m.valor_alvo),
      valor_inicial: Number(m.valor_inicial),
    })),
    contribuicoes: contribuicoes.map((c) => ({ ...c, valor: Number(c.valor) })),
  };
}

const vazioParaNull = (s?: string | null) => {
  const t = (s ?? "").trim();
  return t === "" ? null : t;
};

const UNICO = "23505"; // violação de unicidade = a mesma operação já foi gravada

export type DadosMeta = MetaFormValores;

function camposMeta(d: DadosMeta) {
  return {
    nome: d.nome.trim(),
    valor_alvo: Number(d.valor_alvo),
    valor_inicial:
      d.valor_inicial === undefined || d.valor_inicial === ""
        ? 0
        : Number(d.valor_inicial),
    data_criacao: d.data_criacao,
    data_prevista: vazioParaNull(d.data_prevista),
    categoria: vazioParaNull(d.categoria),
    descricao: vazioParaNull(d.descricao),
  };
}

/**
 * `id` é gerado pelo formulário: se o envio for repetido (duplo clique, rede
 * lenta), o banco rejeita o id duplicado e nada é criado em dobro.
 */
export async function criarMeta(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  dados: DadosMeta
): Promise<string | null> {
  const invalido = validarMetaForm(dados);
  if (invalido) return invalido;
  const { error } = await supabase
    .from("metas")
    .insert({ id, user_id: userId, ...camposMeta(dados) });
  if (error && error.code !== UNICO) return traduzir(error).message;
  return null;
}

export async function atualizarMeta(
  supabase: SupabaseClient,
  id: string,
  dados: DadosMeta
): Promise<string | null> {
  const invalido = validarMetaForm(dados);
  if (invalido) return invalido;
  const { error } = await supabase
    .from("metas")
    .update(camposMeta(dados))
    .eq("id", id);
  return error ? traduzir(error).message : null;
}

/** As contribuições da meta são removidas junto (ON DELETE CASCADE). */
export async function excluirMeta(
  supabase: SupabaseClient,
  id: string
): Promise<string | null> {
  const { error } = await supabase.from("metas").delete().eq("id", id);
  return error ? traduzir(error).message : null;
}

export async function adicionarContribuicao(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  metaId: string,
  dados: ContribuicaoFormValores,
  hoje: string = dataLocalIso()
): Promise<string | null> {
  const invalido = validarContribuicaoForm(dados, hoje);
  if (invalido) return invalido;
  const { error } = await supabase.from("metas_contribuicoes").insert({
    id,
    meta_id: metaId,
    user_id: userId,
    valor: Number(dados.valor),
    data: dados.data,
    observacao: vazioParaNull(dados.observacao),
  });
  if (error && error.code !== UNICO) return traduzir(error).message;
  return null;
}

export async function atualizarContribuicao(
  supabase: SupabaseClient,
  id: string,
  dados: ContribuicaoFormValores,
  hoje: string = dataLocalIso()
): Promise<string | null> {
  const invalido = validarContribuicaoForm(dados, hoje);
  if (invalido) return invalido;
  const { error } = await supabase
    .from("metas_contribuicoes")
    .update({
      valor: Number(dados.valor),
      data: dados.data,
      observacao: vazioParaNull(dados.observacao),
    })
    .eq("id", id);
  return error ? traduzir(error).message : null;
}

export async function excluirContribuicao(
  supabase: SupabaseClient,
  id: string
): Promise<string | null> {
  const { error } = await supabase
    .from("metas_contribuicoes")
    .delete()
    .eq("id", id);
  return error ? traduzir(error).message : null;
}
