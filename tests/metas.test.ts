import { describe, expect, it } from "vitest";
import {
  calcularMeta,
  filtrarMetas,
  montarMetas,
  ordenarMetas,
  resumirMetas,
} from "@/lib/metas/calculos";
import type { Contribuicao, Meta } from "@/lib/metas/types";
import { validarContribuicaoForm, validarMetaForm } from "@/lib/metas/validacao";
import { novoUuid } from "@/lib/uuid";

const HOJE = "2026-10-24";
let seq = 0;
const meta = (p: Partial<Meta> = {}): Meta => ({
  id: `m${++seq}`,
  nome: "Celular",
  valor_alvo: 3000,
  valor_inicial: 300,
  data_criacao: "2026-09-01",
  data_prevista: null,
  categoria: null,
  descricao: null,
  ...p,
});
const contrib = (metaId: string, valor: number, data = "2026-10-01", id?: string): Contribuicao => ({
  id: id ?? `c${++seq}`,
  meta_id: metaId,
  valor,
  data,
  observacao: null,
});

describe("progresso da meta", () => {
  it("exemplo do enunciado: 300 + 100 + 150 = 550 de 3.000 (18,33%)", () => {
    const m = meta();
    const r = calcularMeta(m, [contrib(m.id, 100), contrib(m.id, 150)], HOJE);
    expect(r.acumulado).toBe(550);
    expect(r.restante).toBe(2450);
    expect(r.percentual).toBe(18.33);
    expect(r.status).toBe("em_andamento");
    expect(r.excedente).toBe(0);
  });
  it("sem contribuições usa só o valor inicial; sem inicial = 0%", () => {
    expect(calcularMeta(meta(), [], HOJE).acumulado).toBe(300);
    expect(calcularMeta(meta({ valor_inicial: 0 }), [], HOJE).percentual).toBe(0);
  });
  it("não arredonda para 100% antes de atingir a meta (trunca)", () => {
    const m = meta({ valor_alvo: 1000, valor_inicial: 0 });
    const r = calcularMeta(m, [contrib(m.id, 999.99)], HOJE);
    expect(r.percentual).toBe(99.99);
    expect(r.status).toBe("em_andamento");
  });
  it("atingir exatamente o valor conclui a meta", () => {
    const m = meta({ valor_alvo: 1000, valor_inicial: 0 });
    const r = calcularMeta(m, [contrib(m.id, 400), contrib(m.id, 600)], HOJE);
    expect(r).toMatchObject({ status: "concluida", percentual: 100, restante: 0, excedente: 0 });
  });
  it("ultrapassar o valor: percentual limitado a 100%, mas o acumulado real é mantido", () => {
    const m = meta({ valor_alvo: 1000, valor_inicial: 0 });
    const r = calcularMeta(m, [contrib(m.id, 1300.5)], HOJE);
    expect(r).toMatchObject({ status: "concluida", percentual: 100, acumulado: 1300.5, restante: 0, excedente: 300.5 });
  });
  it("soma em centavos, sem erro de ponto flutuante", () => {
    const m = meta({ valor_alvo: 10, valor_inicial: 0 });
    const r = calcularMeta(m, [contrib(m.id, 0.1), contrib(m.id, 0.2)], HOJE);
    expect(r.acumulado).toBe(0.3);
  });
});

describe("situação e prazo", () => {
  it("prazo ultrapassado quando não concluída", () => {
    const r = calcularMeta(meta({ data_prevista: "2026-10-23" }), [], HOJE);
    expect(r.status).toBe("atrasada");
    expect(r.diasParaPrazo).toBe(-1);
    expect(r.valorMensalSugerido).toBeNull();
  });
  it("prazo hoje ainda está em andamento", () => {
    const r = calcularMeta(meta({ data_prevista: HOJE }), [], HOJE);
    expect(r.status).toBe("em_andamento");
    expect(r.diasParaPrazo).toBe(0);
  });
  it("concluída com prazo vencido continua concluída", () => {
    const m = meta({ data_prevista: "2026-01-01", valor_alvo: 100, valor_inicial: 100 });
    expect(calcularMeta(m, [], HOJE).status).toBe("concluida");
  });
  it("sem prazo: nunca atrasada e sem sugestão", () => {
    const r = calcularMeta(meta(), [], "2030-01-01");
    expect(r.status).toBe("em_andamento");
    expect(r.diasParaPrazo).toBeNull();
    expect(r.valorMensalSugerido).toBeNull();
  });
  it("sugestão mensal aproximada para chegar no prazo", () => {
    // faltam 2.700; 90 dias => 3 meses => 900/mês
    const r = calcularMeta(meta({ data_prevista: "2027-01-22" }), [], HOJE);
    expect(r.diasParaPrazo).toBe(90);
    expect(r.valorMensalSugerido).toBe(900);
  });
});

describe("editar e corrigir sem perder histórico", () => {
  it("editar valor desejado/inicial recalcula e mantém as contribuições", () => {
    const m = meta();
    const cs = [contrib(m.id, 100), contrib(m.id, 150)];
    const antes = calcularMeta(m, cs, HOJE);
    const depois = calcularMeta({ ...m, valor_alvo: 1100, valor_inicial: 0 }, cs, HOJE);
    expect(depois.contribuicoes).toHaveLength(2);
    expect(antes.acumulado).toBe(550);
    expect(depois.acumulado).toBe(250);
    expect(depois.percentual).toBe(22.72);
  });
  it("reduzir o valor desejado abaixo do acumulado conclui a meta", () => {
    const m = meta();
    expect(calcularMeta({ ...m, valor_alvo: 300 }, [], HOJE).status).toBe("concluida");
  });
  it("corrigir ou excluir uma contribuição recalcula o acumulado", () => {
    const m = meta();
    const a = contrib(m.id, 100);
    const b = contrib(m.id, 150);
    expect(calcularMeta(m, [a, b], HOJE).acumulado).toBe(550);
    expect(calcularMeta(m, [a, { ...b, valor: 50 }], HOJE).acumulado).toBe(450);
    expect(calcularMeta(m, [a], HOJE).acumulado).toBe(400);
  });
  it("histórico ordenado da contribuição mais recente para a mais antiga", () => {
    const m = meta();
    const r = calcularMeta(m, [contrib(m.id, 1, "2026-09-01"), contrib(m.id, 2, "2026-10-01")], HOJE);
    expect(r.contribuicoes.map((c) => c.data)).toEqual(["2026-10-01", "2026-09-01"]);
  });
});

describe("montar metas a partir do banco", () => {
  it("agrupa por meta, ignora contribuições órfãs e nunca conta a mesma contribuição duas vezes", () => {
    const a = meta({ valor_inicial: 0 });
    const b = meta({ valor_inicial: 0, nome: "Viagem" });
    const c1 = contrib(a.id, 100, "2026-10-01", "x1");
    const lista = montarMetas(
      [a, b],
      [c1, { ...c1 }, contrib(b.id, 50), contrib("inexistente", 999)],
      HOJE
    );
    expect(lista[0].acumulado).toBe(100);
    expect(lista[1].acumulado).toBe(50);
  });
});

describe("resumo geral das metas", () => {
  const a = meta({ nome: "A", valor_alvo: 1000, valor_inicial: 0 });
  const b = meta({ nome: "B", valor_alvo: 2000, valor_inicial: 0, data_prevista: "2026-01-01" });
  const c = meta({ nome: "C", valor_alvo: 500, valor_inicial: 0 });
  const lista = montarMetas(
    [a, b, c],
    [contrib(a.id, 1200), contrib(b.id, 500), contrib(c.id, 100)],
    HOJE
  );
  it("quantidades, total acumulado e falta só das em andamento", () => {
    const r = resumirMetas(lista);
    expect(r).toMatchObject({
      quantidade: 3,
      concluidas: 1,
      emAndamento: 2,
      atrasadas: 1,
      totalAcumulado: 1800, // inclui o excedente da meta concluída
      faltaEmAndamento: 1900, // (2000-500) + (500-100); A concluída não entra
    });
  });
  it("progresso geral limita cada meta ao seu valor (excedente não distorce)", () => {
    // min(1200,1000)+500+100 = 1600 de 3500 = 45,71%
    expect(resumirMetas(lista).percentualGeral).toBe(45.71);
  });
  it("sem metas: progresso geral indisponível, sem divisão por zero", () => {
    expect(resumirMetas([])).toMatchObject({ quantidade: 0, totalAcumulado: 0, faltaEmAndamento: 0, percentualGeral: null });
  });
  it("filtros e ordenações", () => {
    expect(filtrarMetas(lista, "concluidas").map((m) => m.nome)).toEqual(["A"]);
    expect(filtrarMetas(lista, "ativas").map((m) => m.nome)).toEqual(["B", "C"]);
    expect(filtrarMetas(lista, "todas")).toHaveLength(3);
    expect(ordenarMetas(lista, "nome").map((m) => m.nome)).toEqual(["A", "B", "C"]);
    expect(ordenarMetas(lista, "progresso").map((m) => m.nome)).toEqual(["A", "B", "C"]); // A=100%, B=25%, C=20%
  });
  it("ordenar por prazo coloca metas sem prazo no fim", () => {
    expect(ordenarMetas(lista, "prazo").map((m) => m.nome)).toEqual(["B", "A", "C"]);
  });
});

describe("validação", () => {
  const ok = { nome: "Viagem", valor_alvo: 5000, data_criacao: "2026-10-01" };
  it("meta válida (campos opcionais podem ficar vazios)", () => {
    expect(validarMetaForm(ok)).toBeNull();
    expect(validarMetaForm({ ...ok, valor_inicial: "", data_prevista: "", categoria: "", descricao: "" })).toBeNull();
    expect(validarMetaForm({ ...ok, valor_inicial: 0, data_prevista: "2026-12-31" })).toBeNull();
  });
  it("rejeita nome vazio/longo, valores inválidos e datas incoerentes", () => {
    expect(validarMetaForm({ ...ok, nome: "   " })).toMatch(/nome/i);
    expect(validarMetaForm({ ...ok, nome: "x".repeat(81) })).toMatch(/80/);
    expect(validarMetaForm({ ...ok, valor_alvo: 0 })).toMatch(/maior que zero/);
    expect(validarMetaForm({ ...ok, valor_alvo: -1 })).toMatch(/maior que zero/);
    expect(validarMetaForm({ ...ok, valor_alvo: "" })).toMatch(/Informe/);
    expect(validarMetaForm({ ...ok, valor_alvo: "abc" })).toMatch(/inválido/);
    expect(validarMetaForm({ ...ok, valor_alvo: 10.123 })).toMatch(/2 casas/);
    expect(validarMetaForm({ ...ok, valor_inicial: -5 })).toMatch(/negativo/);
    expect(validarMetaForm({ ...ok, data_criacao: "2026-02-30" })).toMatch(/data/i);
    expect(validarMetaForm({ ...ok, data_prevista: "2026-09-30" })).toMatch(/anterior/);
    expect(validarMetaForm({ ...ok, valor_alvo: 1e12 })).toMatch(/limite/);
  });
  it("contribuição: valor positivo, data válida e não futura", () => {
    const c = { valor: 100, data: HOJE };
    expect(validarContribuicaoForm(c, HOJE)).toBeNull();
    expect(validarContribuicaoForm({ ...c, valor: 0 }, HOJE)).toMatch(/maior que zero/);
    expect(validarContribuicaoForm({ ...c, valor: -10 }, HOJE)).toMatch(/maior que zero/);
    expect(validarContribuicaoForm({ ...c, valor: "" }, HOJE)).toMatch(/Informe/);
    expect(validarContribuicaoForm({ ...c, valor: 1.234 }, HOJE)).toMatch(/2 casas/);
    expect(validarContribuicaoForm({ ...c, data: "" }, HOJE)).toMatch(/data/i);
    expect(validarContribuicaoForm({ ...c, data: "2026-10-25" }, HOJE)).toMatch(/futura/);
    expect(validarContribuicaoForm({ ...c, observacao: "x".repeat(301) }, HOJE)).toMatch(/300/);
  });
});

describe("uuid", () => {
  it("gera ids v4 distintos", () => {
    const a = novoUuid();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(novoUuid()).not.toBe(a);
  });
});
