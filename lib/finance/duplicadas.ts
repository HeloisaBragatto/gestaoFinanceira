import { paraCentavos } from "./calculos";
import { Extrato } from "./types";

type Chaveavel = Pick<
  Extrato,
  "tipo" | "descricao" | "valor" | "data_transacao"
>;

export function chaveTransacao(t: Chaveavel): string {
  const desc = t.descricao.trim().toLowerCase().replace(/\s+/g, " ");
  return [t.data_transacao, t.tipo, paraCentavos(t.valor), desc].join("|");
}

/**
 * Remove das transações importadas as que já existem no banco.
 * Usa contagem (multiconjunto): se o extrato traz 2 compras idênticas no mesmo
 * dia e só 1 existe no banco, apenas 1 é ignorada e a outra é importada.
 * Assim, reimportar o mesmo arquivo não duplica nada, mas compras legítimas
 * repetidas não são perdidas.
 */
export function removerDuplicadas<T extends Chaveavel>(
  novas: T[],
  existentes: Chaveavel[]
): { unicas: T[]; ignoradas: number } {
  const restantes = new Map<string, number>();
  for (const e of existentes) {
    const k = chaveTransacao(e);
    restantes.set(k, (restantes.get(k) ?? 0) + 1);
  }

  const unicas: T[] = [];
  let ignoradas = 0;
  for (const t of novas) {
    const k = chaveTransacao(t);
    const disponiveis = restantes.get(k) ?? 0;
    if (disponiveis > 0) {
      restantes.set(k, disponiveis - 1);
      ignoradas++;
    } else {
      unicas.push(t);
    }
  }
  return { unicas, ignoradas };
}
