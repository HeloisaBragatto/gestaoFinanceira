import { paraCentavos } from "../calculos";
import { formatarDataBr } from "../formato";
import { ROTULO_TIPO, rotuloOrigem, type Relatorio } from "../relatorio";

// CSV no padrão brasileiro para abrir direto no Excel:
//  - separador ";"  - decimal ","  - datas DD/MM/AAAA  - UTF-8 com BOM (acentos)
const SEPARADOR = ";";

function celula(valor: string): string {
  // Neutraliza "injeção de fórmula" (=, +, -, @) em planilhas.
  let v = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  if (/[";\r\n]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function formatarValorCsv(v: number): string {
  const c = paraCentavos(v);
  const abs = Math.abs(c);
  const inteiro = Math.floor(abs / 100);
  const cent = String(abs % 100).padStart(2, "0");
  return `${c < 0 ? "-" : ""}${inteiro},${cent}`;
}

export function gerarCsv(r: Relatorio): string {
  const linhas: string[] = [
    ["Data", "Tipo", "Descrição", "Categoria", "Valor (R$)", "Origem"].join(
      SEPARADOR
    ),
  ];
  for (const m of r.movimentacoes) {
    linhas.push(
      [
        formatarDataBr(m.data_transacao),
        ROTULO_TIPO[m.tipo],
        celula(m.descricao),
        celula(m.categoria ?? "outro"),
        formatarValorCsv(m.valor),
        rotuloOrigem(m.origem),
      ].join(SEPARADOR)
    );
  }
  return "\uFEFF" + linhas.join("\r\n") + "\r\n";
}
