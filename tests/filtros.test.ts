import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  FILTROS_INICIAIS,
  aplicarFiltrosQuery,
  filtrarExtratos,
  filtrosAtivos,
  filtrosParaParams,
  paramsParaFiltros,
  periodoPreset,
  periodoTexto,
  removerFiltro,
  sanitizarBusca,
  validarFiltros,
  type FiltrosState,
} from "@/lib/finance/filtros";
import { DADOS } from "./fixtures";

const f = (p: Partial<FiltrosState>): FiltrosState => ({
  ...FILTROS_INICIAIS,
  ...p,
});
const descs = (p: Partial<FiltrosState>) =>
  filtrarExtratos(DADOS, f(p)).map((e) => e.descricao);

describe("filtros individuais (em memória)", () => {
  it("sem filtros retorna tudo", () => {
    expect(filtrarExtratos(DADOS, FILTROS_INICIAIS)).toHaveLength(DADOS.length);
  });
  it("tipo", () => {
    expect(filtrarExtratos(DADOS, f({ tipo: "recebimento" }))).toHaveLength(3);
    expect(filtrarExtratos(DADOS, f({ tipo: "pagamento" }))).toHaveLength(9);
  });
  it("categoria (incluindo 'outro' = sem categoria)", () => {
    expect(descs({ categoria: "alimentação" })).toHaveLength(3);
    expect(descs({ categoria: "outro" })).toEqual(["Sem categoria"]);
  });
  it("período é inclusivo nas duas pontas", () => {
    expect(
      descs({ dataInicio: "2026-10-05", dataFim: "2026-10-12" })
    ).toHaveLength(5);
    expect(descs({ dataInicio: "2026-10-31" })).toEqual(
      expect.arrayContaining(["Farmácia", "Pix recebido João"])
    );
    expect(descs({ dataFim: "2026-08-31" })).toEqual(["Escola 50% off"]);
  });
  it("valor mínimo e máximo (inclusivos)", () => {
    expect(descs({ valorMin: "1500" })).toEqual(
      expect.arrayContaining(["Aluguel", "Salário outubro"])
    );
    expect(descs({ valorMin: "62,90", valorMax: "62.90" })).toEqual(["iFood pizza"]);
  });
  it("palavra-chave ignora maiúsculas e busca também na categoria", () => {
    expect(descs({ busca: "SUPERMERCADO" })).toHaveLength(2);
    expect(descs({ busca: "transporte" })).toEqual(["Uber viagem"]);
  });
  it("origem", () => {
    expect(descs({ origem: "pdf" })).toHaveLength(3);
    expect(descs({ origem: "manual" })).toHaveLength(9);
  });
});

describe("filtros combinados", () => {
  it("despesas de uma categoria, de uma origem, num intervalo de datas e valores", () => {
    const r = filtrarExtratos(
      DADOS,
      f({
        tipo: "pagamento",
        categoria: "alimentação",
        origem: "pdf",
        dataInicio: "2026-10-01",
        dataFim: "2026-10-31",
        valorMin: "50",
        valorMax: "100",
      })
    );
    expect(r.map((e) => e.descricao)).toEqual(["iFood pizza"]);
  });
  it("combinação sem resultado retorna lista vazia", () => {
    expect(descs({ tipo: "recebimento", categoria: "lazer" })).toEqual([]);
  });
  it("limpar (FILTROS_INICIAIS) restaura a consulta completa", () => {
    const filtrado = filtrarExtratos(DADOS, f({ tipo: "recebimento" }));
    expect(filtrado.length).toBeLessThan(DADOS.length);
    expect(filtrarExtratos(DADOS, FILTROS_INICIAIS)).toHaveLength(DADOS.length);
  });
});

describe("validação e utilitários", () => {
  it("rejeita período invertido, datas e valores inválidos", () => {
    expect(validarFiltros(f({ dataInicio: "2026-02-01", dataFim: "2026-01-01" }))).toMatch(/posterior/);
    expect(validarFiltros(f({ dataInicio: "2026-02-31" }))).toMatch(/inválida/);
    expect(validarFiltros(f({ valorMin: "abc" }))).toMatch(/mínimo inválido/);
    expect(validarFiltros(f({ valorMin: "10", valorMax: "5" }))).toMatch(/maior/);
    expect(validarFiltros(f({ valorMin: "-1" }))).toMatch(/inválido/);
  });
  it("aceita filtros válidos", () => {
    expect(validarFiltros(FILTROS_INICIAIS)).toBeNull();
    expect(validarFiltros(f({ dataInicio: "2026-01-01", dataFim: "2026-01-01" }))).toBeNull();
  });
  it("ida e volta por parâmetros de URL (usado na exportação)", () => {
    const original = f({
      tipo: "pagamento",
      categoria: "saúde",
      dataInicio: "2026-10-01",
      dataFim: "2026-10-31",
      busca: "farm áçã",
      valorMin: "10",
      valorMax: "99,5",
      origem: "pdf",
    });
    const params = filtrosParaParams(original);
    expect(paramsParaFiltros(new URLSearchParams(params.toString()))).toEqual(original);
    expect(filtrosParaParams(FILTROS_INICIAIS).toString()).toBe("");
  });
  it("parâmetros hostis caem nos valores padrão", () => {
    const r = paramsParaFiltros(new URLSearchParams("tipo=xyz&origem=drop&categoria=&busca=%25%22%5C"));
    expect(r.tipo).toBe("todos");
    expect(r.origem).toBe("todas");
    expect(r.categoria).toBe("todas");
    expect(r.busca).toBe("");
  });
  it("sanitizarBusca remove % * \\ \" e limita o tamanho", () => {
    expect(sanitizarBusca('a%b\\c"d*e ')).toBe("abcde");
    expect(sanitizarBusca("x".repeat(500))).toHaveLength(100);
  });
  it("lista filtros ativos e permite remover um", () => {
    const filtros = f({ tipo: "pagamento", valorMin: "10", busca: "pix" });
    const ativos = filtrosAtivos(filtros).map((a) => a.chave);
    expect(ativos).toEqual(["tipo", "valorMin", "busca"]);
    expect(filtrosAtivos(removerFiltro(filtros, "busca")).map((a) => a.chave)).toEqual(["tipo", "valorMin"]);
    expect(filtrosAtivos(FILTROS_INICIAIS)).toEqual([]);
  });
  it("texto do período", () => {
    expect(periodoTexto(f({ dataInicio: "2026-01-01", dataFim: "2026-03-31" }))).toBe("01/01/2026 a 31/03/2026");
    expect(periodoTexto(FILTROS_INICIAIS)).toBe("Todo o período");
  });
  it("atalhos de período", () => {
    const hoje = new Date(2026, 0, 15); // 15/01/2026
    expect(periodoPreset("mesAtual", hoje)).toEqual({ dataInicio: "2026-01-01", dataFim: "2026-01-31" });
    expect(periodoPreset("mesAnterior", hoje)).toEqual({ dataInicio: "2025-12-01", dataFim: "2025-12-31" });
    expect(periodoPreset("ultimos3Meses", hoje)).toEqual({ dataInicio: "2025-11-01", dataFim: "2026-01-31" });
    expect(periodoPreset("anoAtual", hoje)).toEqual({ dataInicio: "2026-01-01", dataFim: "2026-12-31" });
  });
});

describe("consulta ao banco (query string gerada pelo supabase-js)", () => {
  async function capturar(filtros: FiltrosState) {
    const urls: URL[] = [];
    const client = createClient("http://localhost:54321", "anon-key", {
      global: {
        fetch: async (input) => {
          urls.push(new URL(String(input)));
          return new Response("[]", {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      },
    });
    await aplicarFiltrosQuery(client.from("extratos").select("*"), filtros);
    return urls[0].searchParams;
  }

  it("sem filtros não adiciona condições", async () => {
    const p = await capturar(FILTROS_INICIAIS);
    expect([...p.keys()]).toEqual(["select"]);
  });

  it("traduz todos os filtros combinados", async () => {
    const p = await capturar(
      f({
        tipo: "pagamento",
        categoria: "alimentação",
        origem: "pdf",
        dataInicio: "2026-10-01",
        dataFim: "2026-10-31",
        valorMin: "50",
        valorMax: "100,5",
        busca: "pizza",
      })
    );
    expect(p.get("tipo")).toBe("eq.pagamento");
    expect(p.get("categoria")).toBe("eq.alimentação");
    expect(p.get("origem")).toBe("eq.pdf");
    expect(p.getAll("data_transacao")).toEqual(["gte.2026-10-01", "lte.2026-10-31"]);
    expect(p.getAll("valor")).toEqual(["gte.50", "lte.100.5"]);
    expect(p.get("or")).toBe('(descricao.ilike."%pizza%",categoria.ilike."%pizza%")');
  });

  it("'outro' inclui registros sem categoria e coexiste com a busca (dois or = AND)", async () => {
    const p = await capturar(f({ categoria: "outro", busca: "x" }));
    expect(p.getAll("or")).toEqual([
      "(categoria.eq.outro,categoria.is.null)",
      '(descricao.ilike."%x%",categoria.ilike."%x%")',
    ]);
  });

  it("sublinhado é buscado literalmente (escapado, não é curinga)", async () => {
    const p = await capturar(f({ busca: "conta_luz" }));
    expect(p.get("or")).toBe(
      '(descricao.ilike."%conta\\\\_luz%",categoria.ilike."%conta\\\\_luz%")'
    );
  });

  it("vírgulas e parênteses na busca ficam entre aspas e não quebram a sintaxe", async () => {
    const p = await capturar(f({ busca: "a,b) or (id.eq.1" }));
    expect(p.get("or")).toBe(
      '(descricao.ilike."%a,b) or (id.eq.1%",categoria.ilike."%a,b) or (id.eq.1%")'
    );
  });
});
