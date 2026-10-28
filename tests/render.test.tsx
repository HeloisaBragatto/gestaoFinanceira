import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResumoCards } from "@/components/card/resume-extract-card";
import { textoComparacao } from "@/components/card/comparacao-indicador";
import { compararResumos, compararValores } from "@/lib/finance/calculos";
import { calcularResumo } from "@/lib/finance/calculos";
import { mk } from "./fixtures";

// Intl usa espaço não separável após "R$"; normaliza para facilitar a leitura dos testes.
const nb = (t: string) => t.replace(/\u00a0/g, " ");
const norm = (t: { titulo: string; detalhe: string }) => ({ titulo: t.titulo, detalhe: nb(t.detalhe) });

const periodo = { inicio: "2026-09-01", fim: "2026-09-30" };

describe("textos do indicador de comparação", () => {
  it("aumento de despesa é descrito como desfavorável, com % e R$", () => {
    expect(norm(textoComparacao(compararValores(120, 100, "despesa")))).toEqual({
      titulo: "Aumento desfavorável",
      detalhe: "+20% (+R$ 20,00)",
    });
  });
  it("redução de despesa é favorável", () => {
    expect(norm(textoComparacao(compararValores(80.5, 100, "despesa")))).toEqual({
      titulo: "Redução favorável",
      detalhe: "-19,5% (-R$ 19,50)",
    });
  });
  it("estável", () => {
    expect(textoComparacao(compararValores(10, 10, "receita"))).toEqual({
      titulo: "Estável",
      detalhe: "sem variação (0%)",
    });
  });
  it("sem base de comparação não mostra percentual", () => {
    const t = textoComparacao(compararValores(10, 0, "receita"));
    expect(t.detalhe).toMatch(/percentual indisponível/);
    expect(t.detalhe).not.toMatch(/%\s*\(/);
  });
  it("mudança de sinal do saldo é explicada em texto", () => {
    expect(nb(textoComparacao(compararValores(-50, 100, "saldo")).detalhe)).toBe(
      "de positivo para negativo (-R$ 150,00)"
    );
    expect(nb(textoComparacao(compararValores(50, -100, "saldo")).detalhe)).toBe(
      "de negativo para positivo (+R$ 150,00)"
    );
  });
  it("variação minúscula não vira '0%'", () => {
    expect(textoComparacao(compararValores(100000.01, 100000, "receita")).detalhe).toMatch(/menos de 0,1%/);
  });
});

describe("ResumoCards (renderização)", () => {
  const atual = calcularResumo([
    mk("recebimento", "a", "x", 3000, "2026-10-01"),
    mk("pagamento", "b", "x", 1200, "2026-10-02"),
  ]);
  const anterior = calcularResumo([
    mk("recebimento", "a", "x", 2000, "2026-09-01"),
    mk("pagamento", "b", "x", 1000, "2026-09-02"),
  ]);

  it("mostra os três indicadores com período de referência", () => {
    const html = nb(renderToStaticMarkup(
      <ResumoCards
        totalRecebimentos={atual.totalRecebimentos}
        totalPagamentos={atual.totalPagamentos}
        comparacao={{ ...compararResumos(atual, anterior), periodo }}
      />
    ));
    expect(html).toContain("Aumento favorável");
    expect(html).toContain("Aumento desfavorável");
    expect(html).toContain("+50% (+R$ 1.000,00)"); // receitas
    expect(html).toContain("+20% (+R$ 200,00)"); // despesas
    expect(html).toContain("+80% (+R$ 800,00)"); // saldo 1000 -> 1800
    expect(html).toContain("vs. 01/09/2026 a 30/09/2026");
    expect(html).not.toContain("+0% em relação"); // valor fictício antigo
  });

  it("sem comparação mostra o aviso informado (ou nada)", () => {
    const comAviso = renderToStaticMarkup(
      <ResumoCards totalRecebimentos={1} totalPagamentos={1} avisoComparacao="Defina um período." />
    );
    expect(comAviso.match(/Defina um período\./g)).toHaveLength(3);
    const semAviso = renderToStaticMarkup(<ResumoCards totalRecebimentos={1} totalPagamentos={1} />);
    expect(semAviso).not.toContain("período anterior");
  });
});
