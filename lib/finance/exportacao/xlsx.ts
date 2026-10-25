import ExcelJS from "exceljs";
import { ROTULO_TIPO, rotuloOrigem, type Relatorio } from "../relatorio";
import type { TotalCategoria } from "../calculos";

const AZUL = "FF021A49";
const FORMATO_MOEDA = '"R$" #,##0.00';

function dataUtc(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function estilizarCabecalho(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: AZUL },
  };
  row.alignment = { vertical: "middle" };
}

function tabelaCategorias(
  ws: ExcelJS.Worksheet,
  titulo: string,
  dados: TotalCategoria[]
) {
  if (dados.length === 0) return;
  ws.addRow([]);
  ws.addRow([titulo]).font = { bold: true, size: 12 };
  estilizarCabecalho(
    ws.addRow(["Categoria", "Total", "Quantidade", "% do total"])
  );
  for (const c of dados) {
    const row = ws.addRow([
      c.categoria,
      c.total,
      c.quantidade,
      c.percentual / 100,
    ]);
    row.getCell(2).numFmt = FORMATO_MOEDA;
    row.getCell(4).numFmt = "0.0%";
  }
}

export async function gerarXlsx(r: Relatorio): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Gestão Financeira";
  wb.created = new Date();

  // ── Aba 1: movimentações ──────────────────────────────────
  const ws = wb.addWorksheet("Movimentações", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = [
    { header: "Data", key: "data", width: 13 },
    { header: "Tipo", key: "tipo", width: 11 },
    { header: "Descrição", key: "descricao", width: 52 },
    { header: "Categoria", key: "categoria", width: 18 },
    { header: "Valor", key: "valor", width: 16 },
    { header: "Origem", key: "origem", width: 12 },
  ];
  estilizarCabecalho(ws.getRow(1));

  for (const m of r.movimentacoes) {
    const row = ws.addRow({
      data: dataUtc(m.data_transacao),
      tipo: ROTULO_TIPO[m.tipo],
      descricao: m.descricao, // texto puro: nunca interpretado como fórmula
      categoria: m.categoria ?? "outro",
      valor: m.valor,
      origem: rotuloOrigem(m.origem),
    });
    row.getCell("data").numFmt = "dd/mm/yyyy";
    row.getCell("valor").numFmt = FORMATO_MOEDA;
  }
  if (r.movimentacoes.length > 0) {
    ws.autoFilter = { from: "A1", to: `F${r.movimentacoes.length + 1}` };
  }

  // ── Aba 2: resumo ────────────────────────────────────────
  const rs = wb.addWorksheet("Resumo");
  rs.columns = [{ width: 34 }, { width: 20 }, { width: 14 }, { width: 14 }];
  rs.addRow([r.titulo]).font = { bold: true, size: 14, color: { argb: AZUL } };
  rs.addRow(["Gerado em", r.geradoEm]);
  rs.addRow(["Período", r.periodo]);
  rs.addRow([
    "Filtros aplicados",
    r.filtros.length ? r.filtros.join(" | ") : "Nenhum (todos os registros)",
  ]);
  rs.addRow([]);

  rs.addRow(["Indicadores"]).font = { bold: true, size: 12 };
  estilizarCabecalho(rs.addRow(["Indicador", "Valor"]));
  const ind: [string, number, string?][] = [
    ["Total de receitas", r.resumo.totalRecebimentos, FORMATO_MOEDA],
    ["Total de despesas", r.resumo.totalPagamentos, FORMATO_MOEDA],
    ["Saldo do período", r.resumo.saldo, FORMATO_MOEDA],
    ["Quantidade de movimentações", r.resumo.quantidade],
    ["Quantidade de receitas", r.resumo.quantidadeRecebimentos],
    ["Quantidade de despesas", r.resumo.quantidadePagamentos],
  ];
  for (const [nome, valor, fmt] of ind) {
    const row = rs.addRow([nome, valor]);
    if (fmt) row.getCell(2).numFmt = fmt;
  }

  tabelaCategorias(rs, "Despesas por categoria", r.despesasPorCategoria);
  tabelaCategorias(rs, "Receitas por categoria", r.receitasPorCategoria);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
