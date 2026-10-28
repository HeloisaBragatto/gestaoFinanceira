import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { mk } from "./fixtures";

// O componente não deve buscar dados por conta própria: usa só o que recebe.
const useExtratosEspiao = vi.hoisted(() => vi.fn());
vi.mock("@/lib/use-extract", () => ({
  formatarValor: (v: number) => `R$ ${v.toFixed(2)}`,
  useExtratos: useExtratosEspiao,
}));

import DashboardGraphic from "@/components/feed/graphic/dashboard-graphic";

describe("DashboardGraphic respeita os dados filtrados recebidos", () => {
  it("mostra apenas as transações recebidas por parâmetro (nada de busca própria)", () => {
    const recebidos = [
      mk("pagamento", "Somente esta despesa filtrada", "lazer", 10, "2026-10-12"),
      mk("recebimento", "Somente esta receita filtrada", "salário", 20, "2026-10-13"),
    ];
    const html = renderToStaticMarkup(<DashboardGraphic extratos={recebidos} />);
    expect(html).toContain("Transações Recentes");
    expect(html).toContain("Somente esta despesa filtrada");
    expect(html).toContain("Somente esta receita filtrada");
    expect(useExtratosEspiao).not.toHaveBeenCalled();
  });
  it("lista vazia não quebra", () => {
    expect(() => renderToStaticMarkup(<DashboardGraphic extratos={[]} />)).not.toThrow();
  });
});
