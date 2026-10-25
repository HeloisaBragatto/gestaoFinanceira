// Funções de formatação (puras) usadas na interface e nos relatórios.

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatarMoeda(v: number): string {
  return moeda.format(v);
}

/** "2026-03-05" -> "05/03/2026" */
export function formatarDataBr(d: string): string {
  const [ano, mes, dia] = d.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** Data/hora de geração no fuso de São Paulo, independente do fuso do servidor. */
export function formatarDataHora(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

/** "20261024" no fuso de São Paulo (para nome de arquivo). */
export function dataCompacta(d: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(d); // "2026-10-24"
  return partes.replace(/-/g, "");
}

/** 12,5 -> "12,5%"; sinal explícito opcional; variações minúsculas não viram "0%". */
export function formatarPercentual(p: number, comSinal = false): string {
  if (p !== 0 && Math.abs(p) < 0.1) return "menos de 0,1%";
  const txt = Math.abs(p).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  const sinal = p > 0 ? (comSinal ? "+" : "") : p < 0 ? "-" : "";
  return `${sinal}${txt}%`;
}

/** 120 -> "+R$ 120,00"; -50 -> "-R$ 50,00" */
export function formatarMoedaComSinal(v: number): string {
  const txt = formatarMoeda(Math.abs(v));
  return v > 0 ? `+${txt}` : v < 0 ? `-${txt}` : txt;
}
