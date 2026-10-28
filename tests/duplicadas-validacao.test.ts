import { describe, expect, it } from "vitest";
import { removerDuplicadas } from "@/lib/finance/duplicadas";
import { validarExtratoForm } from "@/lib/finance/validacao";
import { mk } from "./fixtures";

describe("importação sem duplicar", () => {
  const novas = [
    mk("pagamento", "Padaria  Central", "alimentação", 12.5, "2026-10-01"),
    mk("pagamento", "Padaria Central", "alimentação", 12.5, "2026-10-01"),
    mk("pagamento", "Uber", "transporte", 20, "2026-10-02"),
  ];
  it("reimportar o mesmo arquivo não insere nada", () => {
    const r = removerDuplicadas(novas, novas);
    expect(r.unicas).toHaveLength(0);
    expect(r.ignoradas).toBe(3);
  });
  it("compras idênticas legítimas não são perdidas (comparação por contagem)", () => {
    const existentes = [novas[0]];
    const r = removerDuplicadas(novas, existentes);
    expect(r.ignoradas).toBe(1);
    expect(r.unicas.map((t) => t.descricao)).toEqual(["Padaria Central", "Uber"]);
  });
  it("sem registros existentes importa tudo", () => {
    expect(removerDuplicadas(novas, []).unicas).toHaveLength(3);
  });
  it("valor, data ou tipo diferentes não são duplicata", () => {
    const base = mk("pagamento", "X", "a", 10, "2026-01-01");
    expect(removerDuplicadas([base], [{ ...base, valor: 10.01 }]).unicas).toHaveLength(1);
    expect(removerDuplicadas([base], [{ ...base, data_transacao: "2026-01-02" }]).unicas).toHaveLength(1);
    expect(removerDuplicadas([base], [{ ...base, tipo: "recebimento" }]).unicas).toHaveLength(1);
  });
});

describe("validação do cadastro manual", () => {
  const ok = { tipo: "pagamento", descricao: "Mercado", valor: 10.5, data_transacao: "2026-10-01" } as const;
  it("aceita dados válidos", () => {
    expect(validarExtratoForm(ok)).toBeNull();
  });
  it("rejeita descrição vazia, valor inválido e data inválida", () => {
    expect(validarExtratoForm({ ...ok, descricao: "  " })).toMatch(/descrição/);
    expect(validarExtratoForm({ ...ok, valor: 0 })).toMatch(/maior que zero/);
    expect(validarExtratoForm({ ...ok, valor: -5 })).toMatch(/maior que zero/);
    expect(validarExtratoForm({ ...ok, valor: Number.NaN })).toMatch(/valor/i);
    expect(validarExtratoForm({ ...ok, valor: undefined })).toMatch(/valor/i);
    expect(validarExtratoForm({ ...ok, valor: 1.234 })).toMatch(/2 casas/);
    expect(validarExtratoForm({ ...ok, data_transacao: "2026-02-30" })).toMatch(/data/i);
    expect(validarExtratoForm({ ...ok, data_transacao: "" })).toMatch(/data/i);
  });
});
