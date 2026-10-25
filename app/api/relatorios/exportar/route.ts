import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buscarTodosExtratos } from "@/lib/finance/consulta";
import { paramsParaFiltros, validarFiltros } from "@/lib/finance/filtros";
import {
  montarRelatorio,
  nomeArquivoRelatorio,
  type FormatoRelatorio,
} from "@/lib/finance/relatorio";
import { gerarCsv } from "@/lib/finance/exportacao/csv";
import { gerarXlsx } from "@/lib/finance/exportacao/xlsx";
import { gerarPdf, MAX_LINHAS_PDF } from "@/lib/finance/exportacao/pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS: Record<FormatoRelatorio, string> = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv; charset=utf-8",
};

function erro(mensagem: string, status: number) {
  return NextResponse.json({ error: mensagem }, { status });
}

// GET /api/relatorios/exportar?formato=pdf|xlsx|csv&<filtros>
// Usa a MESMA definição de filtros da tela (lib/finance/filtros.ts).
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return erro("Não autorizado.", 401);

    const params = req.nextUrl.searchParams;
    const formato = params.get("formato") as FormatoRelatorio | null;
    if (!formato || !(formato in TIPOS))
      return erro("Formato inválido. Use pdf, xlsx ou csv.", 400);

    const filtros = paramsParaFiltros(params);
    const invalido = validarFiltros(filtros);
    if (invalido) return erro(invalido, 400);

    const extratos = await buscarTodosExtratos(supabase, filtros, {
      userId: user.id,
    });

    if (formato === "pdf" && extratos.length > MAX_LINHAS_PDF)
      return erro(
        `O PDF comporta até ${MAX_LINHAS_PDF.toLocaleString("pt-BR")} movimentações (${extratos.length.toLocaleString("pt-BR")} encontradas). Refine os filtros ou exporte em Excel/CSV.`,
        422
      );

    const agora = new Date();
    const relatorio = montarRelatorio(extratos, filtros, agora);

    let corpo: Uint8Array | string;
    if (formato === "pdf") corpo = gerarPdf(relatorio);
    else if (formato === "xlsx")
      corpo = new Uint8Array(await gerarXlsx(relatorio));
    else corpo = gerarCsv(relatorio);

    const nome = nomeArquivoRelatorio(filtros, formato, agora);
    return new Response(corpo as BodyInit, {
      headers: {
        "Content-Type": TIPOS[formato],
        "Content-Disposition": `attachment; filename="${nome}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Erro ao exportar relatório:", err);
    return erro("Erro interno ao gerar o relatório.", 500);
  }
}
