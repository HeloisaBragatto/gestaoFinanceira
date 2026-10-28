import { describe, expect, it } from "vitest";
import {
  ehSequenciaContinua,
  intervaloMeses,
  mesesComparaveisAnteriores,
  normalizarMeses,
  somarMeses,
  ultimoDiaDoMes,
} from "@/lib/finance/meses";
import { calcularMetricas, filtrarPorMeses, serieMensal } from "@/lib/finance/metricas";
import { mk } from "./fixtures";

describe("meses", () => {
  it("soma meses atravessando anos", () => {
    expect(somarMeses("2026-11", 3)).toBe("2027-02");
    expect(somarMeses("2026-01", -1)).toBe("2025-12");
    expect(somarMeses("2026-03", -15)).toBe("2024-12");
  });
  it("último dia do mês (inclui fevereiro bissexto)", () => {
    expect(ultimoDiaDoMes("2026-02")).toBe("2026-02-28");
    expect(ultimoDiaDoMes("2028-02")).toBe("2028-02-29");
    expect(ultimoDiaDoMes("2026-10")).toBe("2026-10-31");
  });
  it("intervalo entre meses, inclusive e entre anos; troca se invertido", () => {
    expect(intervaloMeses("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(intervaloMeses("2026-03", "2026-01")).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(intervaloMeses("2026-05", "2026-05")).toEqual(["2026-05"]);
  });
  it("normaliza removendo duplicados e inválidos", () => {
    expect(normalizarMeses(["2026-03", "2026-01", "2026-03", "2026-13", "abc", "2026-1"])).toEqual(["2026-01", "2026-03"]);
  });
  it("continuidade e período comparável anterior", () => {
    expect(ehSequenciaContinua(["2026-01", "2026-02", "2026-03"])).toBe(true);
    expect(ehSequenciaContinua(["2026-01", "2026-03"])).toBe(false);
    expect(ehSequenciaContinua([])).toBe(false);
    expect(mesesComparaveisAnteriores(["2026-03"])).toEqual(["2026-02"]);
    expect(mesesComparaveisAnteriores(["2026-02", "2026-03"])).toEqual(["2025-12", "2026-01"]);
    expect(mesesComparaveisAnteriores(["2026-01", "2026-03"])).toBeNull();
  });
});

// Dados: out/26 e set/26 e ago/26 (ago tem só 1 despesa; jul/26 sem movimentações)
const D = [
  mk("recebimento", "Salário", "salário", 5000, "2026-10-05"),
  mk("pagamento", "Aluguel", "moradia", 1500, "2026-10-10"),
  mk("pagamento", "Mercado", "alimentação", 500.5, "2026-10-12"),
  mk("pagamento", "Cinema", "lazer", 100, "2026-10-20"),
  mk("recebimento", "Salário", "salário", 4000, "2026-09-05"),
  mk("pagamento", "Aluguel", "moradia", 1500, "2026-09-10"),
  mk("pagamento", "Mercado", "alimentação", 400, "2026-09-12"),
  mk("pagamento", "Viagem", null, 6000, "2026-08-15"),
  mk("recebimento", "Salário", "salário", 3000, "2025-12-05"),
];

describe("série mensal", () => {
  it("mantém meses sem movimentação (zerados) entre os selecionados", () => {
    const s = serieMensal(D, ["2026-07", "2026-08", "2026-09"]);
    expect(s.map((p) => p.mes)).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(s[0]).toMatchObject({ receitas: 0, despesas: 0, saldo: 0, quantidade: 0, comprometido: null });
    expect(s[1]).toMatchObject({ receitas: 0, despesas: 6000, saldo: -6000, comprometido: null });
    expect(s[2]).toMatchObject({ receitas: 4000, despesas: 1900, saldo: 2100, comprometido: 47.5 });
  });
  it("ignora registros de meses não selecionados", () => {
    const s = serieMensal(D, ["2026-10"]);
    expect(s).toHaveLength(1);
    expect(s[0].despesas).toBe(2100.5);
  });
  it("filtrarPorMeses não duplica registros mesmo com meses repetidos ou ids repetidos", () => {
    const r = filtrarPorMeses([...D, D[0]], ["2026-10", "2026-10", "2026-09"]);
    expect(r).toHaveLength(7);
    expect(new Set(r.map((x) => x.id)).size).toBe(7);
  });
});

describe("métricas do período", () => {
  it("um mês: totais, saldo, quantidades, destaques e % comprometido", () => {
    const m = calcularMetricas(D, ["2026-10"], D);
    expect(m.resumo).toMatchObject({ totalRecebimentos: 5000, totalPagamentos: 2100.5, saldo: 2899.5, quantidadeRecebimentos: 1, quantidadePagamentos: 3 });
    expect(m.quantidadeMeses).toBe(1);
    expect(m.mediaMensalReceitas).toBe(5000);
    expect(m.mediaMensalDespesas).toBe(2100.5);
    expect(m.percentualComprometido).toBe(42);
    expect(m.mesMaiorReceita).toEqual({ mes: "2026-10", valor: 5000 });
    expect(m.mesMaiorDespesa).toEqual({ mes: "2026-10", valor: 2100.5 });
    expect(m.categoriaMaiorDespesa).toMatchObject({ categoria: "moradia", total: 1500, percentual: 71.4 });
    expect(m.maiorDespesa).toMatchObject({ descricao: "Aluguel", valor: 1500 });
    expect(m.mesesNegativos).toBe(0);
  });

  it("compara com o mês anterior (set/26): receitas +25%, despesas +10,5% desfavorável", () => {
    const m = calcularMetricas(D, ["2026-10"], D);
    expect(m.variacaoReceitas).toMatchObject({ percentual: 25, avaliacao: "favoravel" });
    expect(m.variacaoDespesas?.avaliacao).toBe("desfavoravel");
    expect(m.variacaoDespesas?.percentual).toBeCloseTo(10.5526, 3); // (2100,5 - 1900) / 1900
    expect(m.variacaoSaldo).toMatchObject({ avaliacao: "favoravel" }); // 2899,5 vs 2100
  });

  it("vários meses: média mensal considera também os meses vazios", () => {
    // jul (vazio), ago, set, out => 4 meses
    const m = calcularMetricas(D, ["2026-07", "2026-08", "2026-09", "2026-10"], D);
    expect(m.quantidadeMeses).toBe(4);
    expect(m.resumo.totalRecebimentos).toBe(9000);
    expect(m.mediaMensalReceitas).toBe(2250);
    expect(m.resumo.totalPagamentos).toBe(10000.5);
    expect(m.mediaMensalDespesas).toBe(2500.13); // 10000,50/4 = 2500,125 -> arredonda ao centavo
    expect(m.mesMaiorDespesa).toEqual({ mes: "2026-08", valor: 6000 });
    expect(m.mesMaiorReceita).toEqual({ mes: "2026-10", valor: 5000 });
    expect(m.mesesNegativos).toBe(1); // só ago (-6000); jul tem saldo zero, não negativo
    expect(m.categoriaMaiorDespesa).toMatchObject({ categoria: "outro", total: 6000 }); // null -> "outro"
    expect(m.percentualComprometido).toBe(111.1);
  });

  it("seleção não contínua: totais corretos, mas sem comparação com período anterior", () => {
    const m = calcularMetricas(D, ["2026-08", "2026-10"], D);
    expect(m.resumo.totalPagamentos).toBe(8100.5);
    expect(m.variacaoReceitas).toBeNull();
    expect(m.variacaoDespesas).toBeNull();
    expect(m.serie.map((p) => p.mes)).toEqual(["2026-08", "2026-10"]);
  });

  it("mudança de ano: dezembro/25 + janeiro/26 (jan sem movimentações)", () => {
    const m = calcularMetricas(D, ["2025-12", "2026-01"], D);
    expect(m.resumo.totalRecebimentos).toBe(3000);
    expect(m.mediaMensalReceitas).toBe(1500);
    expect(m.serie.map((p) => p.mes)).toEqual(["2025-12", "2026-01"]);
    expect(m.mesMaiorReceita).toEqual({ mes: "2025-12", valor: 3000 });
  });

  it("período sem movimentações: zeros, destaques e percentuais nulos (sem NaN/Infinity)", () => {
    const m = calcularMetricas(D, ["2026-01"], D);
    expect(m.resumo.quantidade).toBe(0);
    expect(m.mediaMensalReceitas).toBe(0);
    expect(m.mediaMensalDespesas).toBe(0);
    expect(m.mesMaiorReceita).toBeNull();
    expect(m.mesMaiorDespesa).toBeNull();
    expect(m.categoriaMaiorDespesa).toBeNull();
    expect(m.percentualComprometido).toBeNull();
    expect(m.maiorDespesa).toBeNull();
    // anterior (dez/25) tem receita 3000; atual 0 => -100% receita, despesas ambos zero
    expect(m.variacaoReceitas).toMatchObject({ percentual: -100, avaliacao: "desfavoravel" });
    expect(m.variacaoDespesas).toMatchObject({ direcao: "estavel", motivoSemPercentual: "ambos_zero" });
  });

  it("sem dados do período anterior fornecidos: comparação omitida", () => {
    const m = calcularMetricas(D, ["2026-10"], null);
    expect(m.variacaoReceitas).toBeNull();
  });

  it("nenhum mês selecionado: métricas zeradas sem erro", () => {
    const m = calcularMetricas(D, [], null);
    expect(m.quantidadeMeses).toBe(0);
    expect(m.resumo.quantidade).toBe(0);
    expect(m.mediaMensalReceitas).toBe(0);
  });
});
