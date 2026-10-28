import { describe, expect, it } from "vitest";
import {
  calcularResumo,
  compararResumos,
  evolucaoMensal,
  paraCentavos,
  periodoAnterior,
  totaisPorCategoria,
  compararValores,
} from "@/lib/finance/calculos";
import { DADOS, mk } from "./fixtures";

describe("precisão monetária", () => {
  it("0,1 + 0,2 soma exatamente 0,30 (sem erro de ponto flutuante)", () => {
    const r = calcularResumo([
      mk("pagamento", "a", "x", 0.1, "2026-01-01"),
      mk("pagamento", "b", "x", 0.2, "2026-01-01"),
    ]);
    expect(r.totalPagamentos).toBe(0.3);
  });
  it("paraCentavos arredonda corretamente", () => {
    expect(paraCentavos(1.15)).toBe(115); // 1.15*100 = 114.99999999999999 em ponto flutuante
    expect(paraCentavos(0.07)).toBe(7); // 0.07*100 = 7.000000000000001
    expect(paraCentavos(350.45)).toBe(35045);
  });
});

describe("resumo financeiro", () => {
  it("totais, saldo e quantidades", () => {
    const r = calcularResumo(DADOS);
    expect(r.totalRecebimentos).toBe(5920.1);
    expect(r.totalPagamentos).toBe(2092.24);
    expect(r.saldo).toBe(3827.86);
    expect(r.quantidade).toBe(12);
    expect(r.quantidadeRecebimentos).toBe(3);
    expect(r.quantidadePagamentos).toBe(9);
  });
  it("lista vazia", () => {
    expect(calcularResumo([])).toEqual({
      totalRecebimentos: 0,
      totalPagamentos: 0,
      saldo: 0,
      quantidade: 0,
      quantidadeRecebimentos: 0,
      quantidadePagamentos: 0,
    });
  });
});

describe("totais por categoria", () => {
  it("agrupa despesas, ordena do maior para o menor e calcula percentuais", () => {
    const t = totaisPorCategoria(DADOS, "pagamento");
    expect(t[0]).toMatchObject({ categoria: "moradia", total: 1500 });
    expect(t.map((c) => c.categoria)).toContain("outro"); // null vira "outro"
    const alim = t.find((c) => c.categoria === "alimentação")!;
    expect(alim.total).toBe(413.45);
    expect(alim.quantidade).toBe(3);
    expect(alim.percentual).toBe(19.8);
    const soma = t.reduce((a, c) => a + c.percentual, 0);
    expect(Math.abs(soma - 100)).toBeLessThan(0.5);
  });
  it("sem despesas retorna lista vazia", () => {
    expect(totaisPorCategoria([mk("recebimento", "x", "y", 1, "2026-01-01")], "pagamento")).toEqual([]);
  });
});

describe("evolução mensal", () => {
  it("agrupa por mês em ordem cronológica", () => {
    const e = evolucaoMensal(DADOS);
    expect(e.map((p) => p.mes)).toEqual(["2026-08", "2026-09", "2026-10", "2026-11"]);
    expect(e[2]).toMatchObject({ receitas: 5000, despesas: 1981.95, saldo: 3018.05 });
  });
});

describe("comparação com período anterior", () => {
  it("meses civis inteiros comparam com os meses civis anteriores", () => {
    expect(periodoAnterior("2026-10-01", "2026-10-31")).toEqual({ inicio: "2026-09-01", fim: "2026-09-30" });
    expect(periodoAnterior("2026-03-01", "2026-03-31")).toEqual({ inicio: "2026-02-01", fim: "2026-02-28" });
    expect(periodoAnterior("2026-01-01", "2026-03-31")).toEqual({ inicio: "2025-10-01", fim: "2025-12-31" });
    expect(periodoAnterior("2026-01-01", "2026-01-31")).toEqual({ inicio: "2025-12-01", fim: "2025-12-31" });
  });
  it("intervalos quaisquer comparam com os mesmos N dias anteriores", () => {
    expect(periodoAnterior("2026-10-10", "2026-10-19")).toEqual({ inicio: "2026-09-30", fim: "2026-10-09" });
  });
});

describe("indicadores dos cards: comparação com o período anterior", () => {
  it("receita: aumento é favorável, redução é desfavorável", () => {
    const up = compararValores(150, 100, "receita");
    expect(up).toMatchObject({ direcao: "aumento", avaliacao: "favoravel", percentual: 50, diferenca: 50 });
    const down = compararValores(50, 100, "receita");
    expect(down).toMatchObject({ direcao: "reducao", avaliacao: "desfavoravel", percentual: -50, diferenca: -50 });
  });

  it("despesa: aumento é desfavorável, redução é favorável", () => {
    expect(compararValores(120, 100, "despesa")).toMatchObject({ direcao: "aumento", avaliacao: "desfavoravel", percentual: 20 });
    expect(compararValores(80, 100, "despesa")).toMatchObject({ direcao: "reducao", avaliacao: "favoravel", percentual: -20 });
  });

  it("valores iguais são estáveis (neutros) com 0%", () => {
    expect(compararValores(100, 100, "despesa")).toMatchObject({ direcao: "estavel", avaliacao: "neutra", percentual: 0, diferenca: 0 });
    expect(Object.is(compararValores(100, 100, "receita").percentual, -0)).toBe(false);
  });

  it("período anterior sem movimentação: não inventa percentual nem divide por zero", () => {
    const c = compararValores(500, 0, "receita");
    expect(c.percentual).toBeNull();
    expect(c.motivoSemPercentual).toBe("sem_base");
    expect(c).toMatchObject({ direcao: "aumento", avaliacao: "favoravel", diferenca: 500 });
    const d = compararValores(500, 0, "despesa");
    expect(d).toMatchObject({ percentual: null, avaliacao: "desfavoravel" });
  });

  it("os dois períodos sem movimentação: estável, sem percentual", () => {
    const c = compararValores(0, 0, "despesa");
    expect(c).toMatchObject({ direcao: "estavel", avaliacao: "neutra", percentual: null, motivoSemPercentual: "ambos_zero" });
  });

  it("zerou no período atual: -100% (valor anterior existente)", () => {
    expect(compararValores(0, 100, "receita")).toMatchObject({ percentual: -100, direcao: "reducao", avaliacao: "desfavoravel" });
  });

  it("saldo negativo: melhorar o déficit é favorável (base em |anterior|)", () => {
    // -200 -> -100: déficit caiu pela metade
    expect(compararValores(-100, -200, "saldo")).toMatchObject({ direcao: "aumento", avaliacao: "favoravel", percentual: 50, diferenca: 100 });
    // -100 -> -200: déficit dobrou
    expect(compararValores(-200, -100, "saldo")).toMatchObject({ direcao: "reducao", avaliacao: "desfavoravel", percentual: -100 });
  });

  it("saldo que muda de sinal não gera percentual enganoso", () => {
    const pos2neg = compararValores(-50, 100, "saldo");
    expect(pos2neg).toMatchObject({ percentual: null, motivoSemPercentual: "mudanca_de_sinal", direcao: "reducao", avaliacao: "desfavoravel", diferenca: -150 });
    const neg2pos = compararValores(50, -100, "saldo");
    expect(neg2pos).toMatchObject({ percentual: null, motivoSemPercentual: "mudanca_de_sinal", direcao: "aumento", avaliacao: "favoravel", diferenca: 150 });
  });

  it("saldo anterior zerado e atual positivo/negativo", () => {
    expect(compararValores(10, 0, "saldo")).toMatchObject({ percentual: null, avaliacao: "favoravel" });
    expect(compararValores(-10, 0, "saldo")).toMatchObject({ percentual: null, avaliacao: "desfavoravel" });
    // saldo foi de 100 para exatamente 0: -100%
    expect(compararValores(0, 100, "saldo")).toMatchObject({ percentual: -100 });
  });

  it("diferença calculada em centavos (sem erro de ponto flutuante)", () => {
    expect(compararValores(0.3, 0.1, "receita").diferenca).toBe(0.2);
    expect(compararValores(0.3, 0.1, "receita").percentual).toBe(200);
  });

  it("compara resumos completos (receitas, despesas e saldo)", () => {
    const atual = calcularResumo([
      mk("recebimento", "a", "x", 3000, "2026-10-01"),
      mk("pagamento", "b", "x", 1000, "2026-10-02"),
    ]);
    const anterior = calcularResumo([
      mk("recebimento", "a", "x", 2000, "2026-09-01"),
      mk("pagamento", "b", "x", 2000, "2026-09-02"),
    ]);
    const r = compararResumos(atual, anterior);
    expect(r.receitas).toMatchObject({ percentual: 50, avaliacao: "favoravel" });
    expect(r.despesas).toMatchObject({ percentual: -50, avaliacao: "favoravel" });
    // saldo foi de 0 para 2000: sem base de comparação
    expect(r.saldo).toMatchObject({ percentual: null, motivoSemPercentual: "sem_base", avaliacao: "favoravel" });
  });
});
