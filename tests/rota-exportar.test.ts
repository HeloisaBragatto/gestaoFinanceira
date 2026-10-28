import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
import { DADOS } from "./fixtures";

// Cliente Supabase falso: registra os filtros chamados e devolve as linhas do cenário.
const estado = vi.hoisted(() => ({
  usuario: { id: "user-1" } as { id: string } | null,
  linhas: [] as unknown[],
  chamadas: [] as string[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: estado.usuario } }) },
    from: () => {
      const b: Record<string, unknown> = {};
      for (const m of ["select", "eq", "gte", "lte", "or", "order"])
        b[m] = (...a: unknown[]) => (estado.chamadas.push(`${m}:${a.join(",")}`), b);
      b.range = (de: number, ate: number) =>
        Promise.resolve({ data: estado.linhas.slice(de, ate + 1), error: null });
      return b;
    },
  }),
}));

import { GET } from "@/app/api/relatorios/exportar/route";

const req = (qs: string) => new NextRequest(`http://localhost/api/relatorios/exportar?${qs}`);

beforeEach(() => {
  estado.usuario = { id: "user-1" };
  estado.linhas = DADOS;
  estado.chamadas = [];
});

describe("rota /api/relatorios/exportar", () => {
  it("sem sessão: 401", async () => {
    estado.usuario = null;
    const r = await GET(req("formato=csv"));
    expect(r.status).toBe(401);
  });

  it("formato inválido ou ausente: 400", async () => {
    expect((await GET(req("formato=exe"))).status).toBe(400);
    expect((await GET(req(""))).status).toBe(400);
  });

  it("filtros inválidos: 400 com mensagem", async () => {
    const r = await GET(req("formato=csv&dataInicio=2026-02-01&dataFim=2026-01-01"));
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(/posterior/);
    expect((await GET(req("formato=csv&valorMin=10&valorMax=5"))).status).toBe(400);
  });

  it("CSV: cabeçalhos de download, nome com o período e filtros repassados ao banco (incluindo o usuário)", async () => {
    const r = await GET(req("formato=csv&tipo=pagamento&dataInicio=2026-10-01&dataFim=2026-10-31&busca=mercado"));
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("text/csv");
    expect(r.headers.get("content-disposition")).toBe(
      'attachment; filename="relatorio_financeiro_2026-10-01_a_2026-10-31.csv"'
    );
    expect(r.headers.get("cache-control")).toBe("no-store");
    expect(estado.chamadas).toEqual(
      expect.arrayContaining([
        "eq:user_id,user-1",
        "eq:tipo,pagamento",
        "gte:data_transacao,2026-10-01",
        "lte:data_transacao,2026-10-31",
      ])
    );
    expect(estado.chamadas.some((c) => c.startsWith("or:") && c.includes("%mercado%"))).toBe(true);
    const bytes = new Uint8Array(await r.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // BOM UTF-8 (acentos no Excel)
    const texto = new TextDecoder("utf-8").decode(bytes);
    expect(texto.startsWith("Data;Tipo;Descrição;")).toBe(true);
    expect(texto.trim().split("\r\n")).toHaveLength(1 + DADOS.length);
  });

  it("XLSX: arquivo válido com as duas abas", async () => {
    const r = await GET(req("formato=xlsx"));
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("spreadsheetml");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(Buffer.from(await r.arrayBuffer()) as unknown as ArrayBuffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Movimentações", "Resumo"]);
    expect(wb.getWorksheet("Movimentações")!.rowCount).toBe(1 + DADOS.length);
  });

  it("PDF: documento válido", async () => {
    const r = await GET(req("formato=pdf"));
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("application/pdf");
    const bytes = new Uint8Array(await r.arrayBuffer());
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
  });

  it("PDF com mais registros que o limite: 422 orientando a usar Excel/CSV (e CSV segue funcionando)", async () => {
    estado.linhas = Array.from({ length: 5001 }, (_, i) => ({ ...DADOS[0], id: `x${i}` }));
    const r = await GET(req("formato=pdf"));
    expect(r.status).toBe(422);
    expect((await r.json()).error).toMatch(/Excel\/CSV/);
    expect((await GET(req("formato=csv"))).status).toBe(200);
  });

  it("parâmetros hostis não quebram a consulta", async () => {
    const r = await GET(req("formato=csv&tipo=xyz&origem=drop&busca=%25%22%5C%2C()"));
    expect(r.status).toBe(200);
  });
});
