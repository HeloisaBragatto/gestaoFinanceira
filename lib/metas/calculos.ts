import { deCentavos, paraCentavos } from "@/lib/finance/calculos";
import { Contribuicao, Meta } from "./types";

export type StatusMeta = "em_andamento" | "concluida" | "atrasada";

export const ROTULO_STATUS: Record<StatusMeta, string> = {
  em_andamento: "Em andamento",
  concluida: "Concluída",
  atrasada: "Prazo ultrapassado",
};

export type MetaCalculada = Meta & {
  contribuicoes: Contribuicao[];
  /** valor inicial + todas as contribuições (pode ultrapassar o valor desejado). */
  acumulado: number;
  /** quanto falta (nunca negativo). */
  restante: number;
  /** quanto passou do valor desejado (0 se não passou). */
  excedente: number;
  /** 0–100, truncado em 2 casas: só chega a 100 quando a meta é atingida. */
  percentual: number;
  status: StatusMeta;
  /** Dias até o prazo (negativo = atrasada); null sem prazo. */
  diasParaPrazo: number | null;
  /** Valor aproximado por mês para chegar no prazo; null se não se aplica. */
  valorMensalSugerido: number | null;
};

const MS_DIA = 86_400_000;
const paraUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Data local (do navegador) no formato YYYY-MM-DD. */
export function dataLocalIso(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function calcularMeta(
  meta: Meta,
  contribuicoes: Contribuicao[],
  hoje: string
): MetaCalculada {
  const alvoC = paraCentavos(meta.valor_alvo);
  const acumC =
    paraCentavos(meta.valor_inicial) +
    contribuicoes.reduce((s, c) => s + paraCentavos(c.valor), 0);

  const concluida = alvoC > 0 && acumC >= alvoC;
  const diasParaPrazo = meta.data_prevista
    ? Math.round((paraUtc(meta.data_prevista) - paraUtc(hoje)) / MS_DIA)
    : null;

  const status: StatusMeta = concluida
    ? "concluida"
    : diasParaPrazo !== null && diasParaPrazo < 0
      ? "atrasada"
      : "em_andamento";

  const percentual =
    alvoC <= 0 ? 0 : Math.min(100, Math.floor((acumC * 10000) / alvoC) / 100);

  const restC = Math.max(alvoC - acumC, 0);
  let sugerido: number | null = null;
  if (status === "em_andamento" && diasParaPrazo !== null && restC > 0) {
    const meses = Math.max(1, Math.ceil(diasParaPrazo / 30));
    sugerido = deCentavos(Math.ceil(restC / meses));
  }

  return {
    ...meta,
    contribuicoes: [...contribuicoes].sort(
      (a, b) => b.data.localeCompare(a.data) || b.id.localeCompare(a.id)
    ),
    acumulado: deCentavos(acumC),
    restante: deCentavos(restC),
    excedente: deCentavos(Math.max(acumC - alvoC, 0)),
    percentual,
    status,
    diasParaPrazo,
    valorMensalSugerido: sugerido,
  };
}

/** Junta metas e contribuições (contribuições de metas inexistentes são ignoradas). */
export function montarMetas(
  metas: Meta[],
  contribuicoes: Contribuicao[],
  hoje: string
): MetaCalculada[] {
  const porMeta = new Map<string, Contribuicao[]>();
  const vistos = new Set<string>();
  for (const c of contribuicoes) {
    if (vistos.has(c.id)) continue; // nunca conta a mesma contribuição duas vezes
    vistos.add(c.id);
    const lista = porMeta.get(c.meta_id) ?? [];
    lista.push(c);
    porMeta.set(c.meta_id, lista);
  }
  return metas.map((m) => calcularMeta(m, porMeta.get(m.id) ?? [], hoje));
}

export type ResumoMetas = {
  quantidade: number;
  concluidas: number;
  emAndamento: number; // inclui as com prazo ultrapassado
  atrasadas: number;
  /** Soma do acumulado de todas as metas (controle manual, não é saldo de conta). */
  totalAcumulado: number;
  /** Soma do que falta nas metas AINDA NÃO concluídas. */
  faltaEmAndamento: number;
  /**
   * Σ min(acumulado, alvo) ÷ Σ alvo, de todas as metas. O limite por meta evita
   * que excedentes de metas concluídas inflem o resultado. null sem metas.
   */
  percentualGeral: number | null;
};

export function resumirMetas(metas: MetaCalculada[]): ResumoMetas {
  let acum = 0;
  let falta = 0;
  let limitado = 0;
  let alvo = 0;
  for (const m of metas) {
    const a = paraCentavos(m.acumulado);
    const t = paraCentavos(m.valor_alvo);
    acum += a;
    if (m.status !== "concluida") falta += paraCentavos(m.restante);
    limitado += Math.min(a, t);
    alvo += t;
  }
  return {
    quantidade: metas.length,
    concluidas: metas.filter((m) => m.status === "concluida").length,
    emAndamento: metas.filter((m) => m.status !== "concluida").length,
    atrasadas: metas.filter((m) => m.status === "atrasada").length,
    totalAcumulado: deCentavos(acum),
    faltaEmAndamento: deCentavos(falta),
    percentualGeral:
      alvo > 0
        ? Math.min(100, Math.floor((limitado * 10000) / alvo) / 100)
        : null,
  };
}

export type FiltroMetas = "todas" | "ativas" | "concluidas";
export type OrdemMetas = "recentes" | "prazo" | "progresso" | "nome";

export function filtrarMetas(metas: MetaCalculada[], filtro: FiltroMetas) {
  if (filtro === "concluidas")
    return metas.filter((m) => m.status === "concluida");
  if (filtro === "ativas") return metas.filter((m) => m.status !== "concluida");
  return metas;
}

export function ordenarMetas(metas: MetaCalculada[], ordem: OrdemMetas) {
  const lista = [...metas];
  switch (ordem) {
    case "nome":
      return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    case "progresso":
      return lista.sort(
        (a, b) =>
          b.percentual - a.percentual || a.nome.localeCompare(b.nome, "pt-BR")
      );
    case "prazo":
      return lista.sort((a, b) => {
        if (a.data_prevista === b.data_prevista)
          return a.nome.localeCompare(b.nome, "pt-BR");
        if (!a.data_prevista) return 1; // sem prazo vai para o fim
        if (!b.data_prevista) return -1;
        return a.data_prevista.localeCompare(b.data_prevista);
      });
    default:
      return lista.sort(
        (a, b) =>
          b.data_criacao.localeCompare(a.data_criacao) ||
          a.nome.localeCompare(b.nome, "pt-BR")
      );
  }
}
