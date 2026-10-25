import { filtrosParaParams, type FiltrosState } from "./filtros";
import type { FormatoRelatorio } from "./relatorio";

/** Solicita o relatório ao servidor (mesmos filtros da tela) e dispara o download. */
export async function baixarRelatorio(
  formato: FormatoRelatorio,
  filtros: FiltrosState
): Promise<void> {
  const params = filtrosParaParams(filtros);
  params.set("formato", formato);

  const res = await fetch(`/api/relatorios/exportar?${params.toString()}`);
  const tipo = res.headers.get("content-type") ?? "";

  if (!res.ok || res.redirected || tipo.includes("text/html")) {
    if (res.redirected || res.status === 401)
      throw new Error("Sua sessão expirou. Entre novamente.");
    let msg = "Não foi possível gerar o relatório.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* mantém a mensagem padrão */
    }
    throw new Error(msg);
  }

  const disposicao = res.headers.get("content-disposition") ?? "";
  const nome =
    /filename="([^"]+)"/.exec(disposicao)?.[1] ??
    `relatorio_financeiro.${formato}`;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
