import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  ErroMetas,
  adicionarContribuicao,
  carregarMetas,
  criarMeta,
} from "@/lib/metas/servico";

type Resposta = { data: unknown; error: { code?: string; message?: string } | null };

/** Cliente falso: toda cadeia from().select()...range() / insert() resolve para `resposta`. */
function fake(resposta: Resposta) {
  const chamadas: string[] = [];
  const cadeia: Record<string, unknown> = {};
  const thenable = {
    then: (res: (r: Resposta) => unknown) => Promise.resolve(resposta).then(res),
  };
  for (const m of ["select", "order", "range", "insert", "update", "delete", "eq"]) {
    cadeia[m] = vi.fn(() => {
      chamadas.push(m);
      return Object.assign(cadeia, thenable);
    });
  }
  const client = { from: vi.fn((t: string) => (chamadas.push(`from:${t}`), cadeia)) };
  return { client: client as unknown as SupabaseClient, chamadas };
}

const dadosMeta = { nome: "Viagem", valor_alvo: 1000, data_criacao: "2026-10-01" };

describe("serviço de metas (tratamento de erros)", () => {
  it("tabela inexistente é identificada e orienta a rodar a migração", async () => {
    const { client } = fake({ data: null, error: { code: "PGRST205", message: "Could not find the table 'public.metas' in the schema cache" } });
    const erro = await carregarMetas(client).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroMetas);
    expect(erro.tabelasAusentes).toBe(true);
    expect(erro.message).toContain("supabase/migrations/20261024000000_metas.sql");
  });

  it("outros erros viram mensagem genérica (sem vazar detalhes do banco)", async () => {
    const { client } = fake({ data: null, error: { code: "XX000", message: "relation secret_internal exploded" } });
    const msg = await criarMeta(client, "u", "id1", dadosMeta);
    expect(msg).toBe("Não foi possível concluir a operação. Tente novamente.");
  });

  it("id repetido (23505) é tratado como já gravado, não como erro", async () => {
    const { client } = fake({ data: null, error: { code: "23505", message: "duplicate key" } });
    expect(await criarMeta(client, "u", "id1", dadosMeta)).toBeNull();
    expect(await adicionarContribuicao(client, "u", "c1", "m1", { valor: 10, data: "2026-10-01" }, "2026-10-24")).toBeNull();
  });

  it("dados inválidos são barrados antes de chegar ao banco", async () => {
    const { client, chamadas } = fake({ data: null, error: null });
    expect(await criarMeta(client, "u", "id1", { ...dadosMeta, valor_alvo: 0 })).toMatch(/maior que zero/);
    expect(await adicionarContribuicao(client, "u", "c1", "m1", { valor: -1, data: "2026-10-01" }, "2026-10-24")).toMatch(/maior que zero/);
    expect(chamadas).toEqual([]); // nenhuma chamada ao banco
  });

  it("só usa as tabelas de metas (nunca a tabela de extratos)", async () => {
    const { client, chamadas } = fake({ data: [], error: null });
    await carregarMetas(client);
    await criarMeta(client, "u", "id1", dadosMeta);
    await adicionarContribuicao(client, "u", "c1", "m1", { valor: 10, data: "2026-10-01" }, "2026-10-24");
    const tabelas = chamadas.filter((c) => c.startsWith("from:"));
    expect(new Set(tabelas)).toEqual(new Set(["from:metas", "from:metas_contribuicoes"]));
  });
});
