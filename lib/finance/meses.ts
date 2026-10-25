// Utilitários de meses no formato "YYYY-MM" (puros, sem fuso horário).

const MESES_ABREV = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
export const MESES_NOMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const MES_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export const isMesValido = (m: string) => MES_REGEX.test(m);

export function criarMes(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

export function anoDoMes(m: string): number {
  return Number(m.slice(0, 4));
}

export function numeroDoMes(m: string): number {
  return Number(m.slice(5, 7));
}

/** "2026-03" + 2 -> "2026-05"; aceita deslocamentos negativos. */
export function somarMeses(m: string, n: number): string {
  const total = anoDoMes(m) * 12 + (numeroDoMes(m) - 1) + n;
  return criarMes(Math.floor(total / 12), (total % 12) + 1);
}

export function primeiroDiaDoMes(m: string): string {
  return `${m}-01`;
}

export function ultimoDiaDoMes(m: string): string {
  const dia = new Date(Date.UTC(anoDoMes(m), numeroDoMes(m), 0)).getUTCDate();
  return `${m}-${String(dia).padStart(2, "0")}`;
}

/** "2026-03" -> "Mar/2026" */
export function rotuloMes(m: string): string {
  return `${MESES_ABREV[numeroDoMes(m) - 1]}/${anoDoMes(m)}`;
}

/** "2026-03" -> "Mar/26" (gráficos) */
export function rotuloMesCurto(m: string): string {
  return `${MESES_ABREV[numeroDoMes(m) - 1]}/${String(anoDoMes(m)).slice(2)}`;
}

export function mesDaData(dataIso: string): string {
  return dataIso.slice(0, 7);
}

/** Todos os meses de `inicio` a `fim`, inclusive (ordem cronológica). Se invertidos, troca. */
export function intervaloMeses(inicio: string, fim: string): string[] {
  const [a, b] = inicio <= fim ? [inicio, fim] : [fim, inicio];
  const lista: string[] = [];
  for (let m = a; m <= b; m = somarMeses(m, 1)) lista.push(m);
  return lista;
}

/** Remove inválidos e duplicados e ordena. Garante que um mês nunca conta duas vezes. */
export function normalizarMeses(meses: string[]): string[] {
  return Array.from(new Set(meses.filter(isMesValido))).sort();
}

/** true quando os meses são consecutivos, sem lacunas (e há pelo menos um). */
export function ehSequenciaContinua(meses: string[]): boolean {
  const m = normalizarMeses(meses);
  if (m.length === 0) return false;
  return m.every((x, i) => i === 0 || x === somarMeses(m[i - 1], 1));
}

/**
 * Período comparável anterior: os N meses imediatamente anteriores ao primeiro
 * mês selecionado (N = quantidade de meses selecionados). Só existe quando a
 * seleção é contínua; senão retorna null (não há "período anterior" único).
 */
export function mesesComparaveisAnteriores(meses: string[]): string[] | null {
  const m = normalizarMeses(meses);
  if (!ehSequenciaContinua(m)) return null;
  return intervaloMeses(somarMeses(m[0], -m.length), somarMeses(m[0], -1));
}

export function mesAtual(hoje: Date = new Date()): string {
  return criarMes(hoje.getFullYear(), hoje.getMonth() + 1);
}
