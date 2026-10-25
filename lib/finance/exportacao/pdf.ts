import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatarDataBr, formatarMoeda } from "../formato";
import { ROTULO_TIPO, type Relatorio } from "../relatorio";
import type { TotalCategoria } from "../calculos";

/** Acima disso o PDF fica pesado/ilegível: o usuário é orientado a usar Excel/CSV. */
export const MAX_LINHAS_PDF = 5000;

const AZUL: [number, number, number] = [2, 26, 73];
const VERDE: [number, number, number] = [22, 163, 74];
const VERMELHO: [number, number, number] = [220, 38, 38];
const MARGEM = 14;

/**
 * As fontes padrão do PDF só suportam Latin-1 (acentos do português incluídos).
 * Caracteres fora disso (emoji, aspas curvas etc.) são substituídos para não
 * aparecerem corrompidos.
 */
export function textoSeguroPdf(s: string): string {
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\xA1-\xFF]/g, "?");
}

const moeda = (v: number) => textoSeguroPdf(formatarMoeda(v));

function ultimoY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;
}

function tabelaCategorias(
  doc: jsPDF,
  y: number,
  titulo: string,
  dados: TotalCategoria[]
): number {
  if (dados.length === 0) return y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...AZUL);
  doc.text(titulo, MARGEM, y);
  autoTable(doc, {
    startY: y + 2,
    margin: { left: MARGEM, right: MARGEM },
    head: [["Categoria", "Qtd.", "Total", "% do total"]],
    body: dados.map((c) => [
      textoSeguroPdf(c.categoria),
      String(c.quantidade),
      moeda(c.total),
      `${c.percentual.toFixed(1).replace(".", ",")}%`,
    ]),
    styles: { fontSize: 9, cellPadding: 1.8 },
    headStyles: { fillColor: AZUL },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });
  return ultimoY(doc) + 8;
}

export function gerarPdf(r: Relatorio): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const larguraUtil = doc.internal.pageSize.getWidth() - MARGEM * 2;

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...AZUL);
  doc.text(textoSeguroPdf(r.titulo), MARGEM, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Período: ${textoSeguroPdf(r.periodo)}`, MARGEM, 25);
  doc.text(`Gerado em: ${textoSeguroPdf(r.geradoEm)}`, MARGEM, 30);

  const textoFiltros = r.filtros.length
    ? `Filtros: ${r.filtros.join(" | ")}`
    : "Filtros: nenhum (todos os registros)";
  const linhasFiltros: string[] = doc.splitTextToSize(
    textoSeguroPdf(textoFiltros),
    larguraUtil
  );
  doc.text(linhasFiltros, MARGEM, 35);
  let y = 35 + linhasFiltros.length * 4.5 + 4;

  // Indicadores
  const cartoes: {
    rotulo: string;
    valor: string;
    cor: [number, number, number];
  }[] = [
    {
      rotulo: "Receitas",
      valor: moeda(r.resumo.totalRecebimentos),
      cor: VERDE,
    },
    {
      rotulo: "Despesas",
      valor: moeda(r.resumo.totalPagamentos),
      cor: VERMELHO,
    },
    {
      rotulo: "Saldo do período",
      valor: moeda(r.resumo.saldo),
      cor: r.resumo.saldo >= 0 ? AZUL : VERMELHO,
    },
    {
      rotulo: "Movimentações",
      valor: String(r.resumo.quantidade),
      cor: AZUL,
    },
  ];
  const gap = 3;
  const larguraCartao = (larguraUtil - gap * 3) / 4;
  cartoes.forEach((c, i) => {
    const x = MARGEM + i * (larguraCartao + gap);
    doc.setDrawColor(210, 214, 220);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, larguraCartao, 16, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(c.rotulo, x + 3, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...c.cor);
    doc.text(c.valor, x + 3, y + 12);
  });
  y += 24;

  y = tabelaCategorias(
    doc,
    y,
    "Despesas por categoria",
    r.despesasPorCategoria
  );
  y = tabelaCategorias(
    doc,
    y,
    "Receitas por categoria",
    r.receitasPorCategoria
  );

  // Movimentações (paginação automática, cabeçalho repetido em cada página)
  if (y > 250) {
    doc.addPage();
    y = 18;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...AZUL);
  doc.text("Movimentações", MARGEM, y);

  if (r.movimentacoes.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Nenhuma movimentação encontrada para os filtros informados.",
      MARGEM,
      y + 7
    );
  } else {
    autoTable(doc, {
      startY: y + 2,
      margin: { left: MARGEM, right: MARGEM, bottom: 16 },
      head: [["Data", "Descrição", "Categoria", "Tipo", "Valor"]],
      body: r.movimentacoes.map((m) => [
        formatarDataBr(m.data_transacao),
        textoSeguroPdf(m.descricao),
        textoSeguroPdf(m.categoria ?? "outro"),
        ROTULO_TIPO[m.tipo],
        `${m.tipo === "recebimento" ? "+" : "-"} ${moeda(m.valor)}`,
      ]),
      styles: { fontSize: 8.5, cellPadding: 1.8, overflow: "linebreak" },
      headStyles: { fillColor: AZUL },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 28 },
        3: { cellWidth: 18 },
        4: { cellWidth: 32, halign: "right" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 4) {
          const tipo = r.movimentacoes[data.row.index]?.tipo;
          data.cell.styles.textColor =
            tipo === "recebimento" ? VERDE : VERMELHO;
        }
      },
    });
  }

  // Rodapé com paginação
  const total = doc.getNumberOfPages();
  const altura = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Gerado em ${textoSeguroPdf(r.geradoEm)}`, MARGEM, altura - 8);
    doc.text(
      `Página ${i} de ${total}`,
      doc.internal.pageSize.getWidth() - MARGEM,
      altura - 8,
      { align: "right" }
    );
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
