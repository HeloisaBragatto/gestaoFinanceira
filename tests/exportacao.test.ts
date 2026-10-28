import { createRequire } from "node:module";
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { FILTROS_INICIAIS, filtrarExtratos } from "@/lib/finance/filtros";
import {
  montarRelatorio,
  nomeArquivoRelatorio,
} from "@/lib/finance/relatorio";
import { gerarCsv, formatarValorCsv } from "@/lib/finance/exportacao/csv";
import { gerarXlsx } from "@/lib/finance/exportacao/xlsx";
import { gerarPdf, textoSeguroPdf } from "@/lib/finance/exportacao/pdf";
import { DADOS, mk } from "./fixtures";

const require = createRequire(import.meta.url);
// import direto do módulo evita o modo debug do index.js do pdf-parse
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const AGORA = new Date("2026-10-24T15:30:00Z");
const filtros = {
  ...FILTROS_INICIAIS,
  tipo: "pagamento" as const,
  dataInicio: "2026-10-01",
  dataFim: "2026-10-31",
};
const filtrados = filtrarExtratos(DADOS, filtros); // 5 despesas de outubro
const rel = montarRelatorio(filtrados, filtros, AGORA);

describe("relatório (dados)", () => {
  it("contém só os registros filtrados e resumo coerente", () => {
    expect(rel.movimentacoes).toHaveLength(5);
    expect(rel.resumo.totalPagamentos).toBe(1981.95);
    expect(rel.resumo.totalRecebimentos).toBe(0);
    expect(rel.resumo.saldo).toBe(-1981.95);
    expect(rel.periodo).toBe("01/10/2026 a 31/10/2026");
    expect(rel.filtros).toEqual([
      "Tipo: Despesas",
      "A partir de: 01/10/2026",
      "Até: 31/10/2026",
    ]);
  });
  it("nome do arquivo inclui o período", () => {
    expect(nomeArquivoRelatorio(filtros, "pdf", AGORA)).toBe(
      "relatorio_financeiro_2026-10-01_a_2026-10-31.pdf"
    );
    expect(nomeArquivoRelatorio(FILTROS_INICIAIS, "csv", AGORA)).toBe(
      "relatorio_financeiro_geral_20261024.csv"
    );
  });
});

describe("CSV", () => {
  it("UTF-8 com BOM, separador ';', decimal ',' e datas dd/mm/aaaa", () => {
    const csv = gerarCsv(rel);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    // (String.trim() remove o BOM, por isso cortamos só o último \r\n)
    const linhas = csv.replace(/\r\n$/, "").split("\r\n");
    expect(linhas[0]).toBe("\uFEFFData;Tipo;Descrição;Categoria;Valor (R$);Origem");
    expect(linhas).toHaveLength(1 + 5);
    expect(linhas).toContain("06/10/2026;Despesa;Supermercado Dia;alimentação;350,45;Manual");
    expect(linhas).toContain("10/10/2026;Despesa;Aluguel;moradia;1500,00;Manual");
  });
  it("preserva acentos e escapa aspas, ponto e vírgula e quebras de linha", () => {
    const r = montarRelatorio(
      [mk("pagamento", 'Café "Ção"; açaí\nbar', "alimentação", 5, "2026-01-02")],
      FILTROS_INICIAIS,
      AGORA
    );
    const csv = gerarCsv(r);
    expect(csv).toContain('"Café ""Ção""; açaí\nbar"');
  });
  it("neutraliza injeção de fórmula", () => {
    const r = montarRelatorio(
      [mk("pagamento", "=HYPERLINK(\"http://x\")", "+cmd", 5, "2026-01-02")],
      FILTROS_INICIAIS,
      AGORA
    );
    const linha = gerarCsv(r).trim().split("\r\n")[1];
    expect(linha).toContain("'=HYPERLINK");
    expect(linha).toContain(";'+cmd;");
  });
  it("formata valores sem erro de arredondamento", () => {
    expect(formatarValorCsv(0.1 + 0.2)).toBe("0,30");
    expect(formatarValorCsv(1234567.8)).toBe("1234567,80");
  });
  it("sem movimentações gera apenas o cabeçalho", () => {
    const vazio = montarRelatorio([], FILTROS_INICIAIS, AGORA);
    expect(gerarCsv(vazio).trim().split("\r\n")).toHaveLength(1);
  });
});

describe("Excel (.xlsx)", () => {
  it("gera abas, tipos numéricos, datas e resumo corretos", async () => {
    const buf = await gerarXlsx(rel);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Movimentações", "Resumo"]);

    const mov = wb.getWorksheet("Movimentações")!;
    expect(mov.rowCount).toBe(1 + 5);
    expect(mov.getRow(1).values).toEqual([undefined, "Data", "Tipo", "Descrição", "Categoria", "Valor", "Origem"]);

    // Primeira linha de dados = mais recente (31/10 Farmácia)
    const r2 = mov.getRow(2);
    expect(r2.getCell(3).value).toBe("Farmácia");
    expect(typeof r2.getCell(5).value).toBe("number");
    expect(r2.getCell(5).value).toBe(45.5);
    expect(r2.getCell(5).numFmt).toContain("R$");
    const data = r2.getCell(1).value as Date;
    expect(data instanceof Date).toBe(true);
    expect(data.toISOString().slice(0, 10)).toBe("2026-10-31");
    expect(r2.getCell(1).numFmt).toBe("dd/mm/yyyy");

    const resumo = wb.getWorksheet("Resumo")!;
    const texto: Record<string, unknown> = {};
    resumo.eachRow((row) => {
      texto[String(row.getCell(1).value)] = row.getCell(2).value;
    });
    expect(texto["Período"]).toBe("01/10/2026 a 31/10/2026");
    expect(texto["Filtros aplicados"]).toBe("Tipo: Despesas | A partir de: 01/10/2026 | Até: 31/10/2026");
    expect(texto["Total de despesas"]).toBe(1981.95);
    expect(texto["Total de receitas"]).toBe(0);
    expect(texto["Saldo do período"]).toBe(-1981.95);
    expect(texto["Quantidade de movimentações"]).toBe(5);
    expect(texto["moradia"]).toBe(1500);
  });
  it("texto que parece fórmula é gravado como texto", async () => {
    const r = montarRelatorio(
      [mk("pagamento", "=1+1", "x", 5, "2026-01-02")],
      FILTROS_INICIAIS,
      AGORA
    );
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load((await gerarXlsx(r)) as unknown as ArrayBuffer);
    const cel = wb.getWorksheet("Movimentações")!.getRow(2).getCell(3);
    expect(cel.value).toBe("=1+1");
    expect(cel.formula).toBeUndefined();
  });
  it("sem movimentações ainda gera arquivo válido", async () => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load((await gerarXlsx(montarRelatorio([], FILTROS_INICIAIS, AGORA))) as unknown as ArrayBuffer);
    expect(wb.getWorksheet("Movimentações")!.rowCount).toBe(1);
  });
});

describe("PDF", () => {
  async function ler(bytes: Uint8Array) {
    return pdfParse(Buffer.from(bytes)) as Promise<{ numpages: number; text: string }>;
  }

  it("gera PDF válido com título, período, filtros, indicadores e tabela", async () => {
    const bytes = gerarPdf(rel);
    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe("%PDF-");
    const { text, numpages } = await ler(bytes);
    expect(numpages).toBe(1);
    expect(text).toContain("Relatório de Receitas e Despesas");
    expect(text).toContain("Período: 01/10/2026 a 31/10/2026");
    expect(text).toContain("Tipo: Despesas");
    expect(text).toContain("Saldo do período");
    expect(text).toContain("Farmácia");
    expect(text).toContain("Supermercado Dia");
    expect(text).toContain("1.500,00");
    expect(text).toContain("Página 1 de 1");
    // registros fora do filtro NÃO aparecem
    expect(text).not.toContain("Salário outubro");
    expect(text).not.toContain("Netflix");
  });

  it("pagina muitos registros repetindo cabeçalho e numerando páginas", async () => {
    const muitos = Array.from({ length: 300 }, (_, i) =>
      mk("pagamento", `Compra número ${i + 1}`, "compras", 10 + i, "2026-10-15")
    );
    const { numpages, text } = await ler(gerarPdf(montarRelatorio(muitos, FILTROS_INICIAIS, AGORA)));
    expect(numpages).toBeGreaterThan(5);
    expect(text).toContain(`Página ${numpages} de ${numpages}`);
    expect(text).toContain("Compra número 300");
  });

  it("sem resultados informa a ausência de movimentações", async () => {
    const { text } = await ler(gerarPdf(montarRelatorio([], FILTROS_INICIAIS, AGORA)));
    expect(text).toContain("Nenhuma movimentação encontrada");
  });

  it("caracteres fora do Latin-1 não corrompem o documento", () => {
    expect(textoSeguroPdf("Café ‘x’ — ação ✓ 😀")).toBe("Café 'x' - ação ? ??");
  });
});
