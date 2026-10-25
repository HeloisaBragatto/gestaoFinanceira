// Lógica (sem React) da importação de vários extratos de uma vez.

export type Transacao = {
  tipo: "pagamento" | "recebimento";
  descricao: string;
  categoria: string;
  valor: number;
  data_transacao: string;
};

export type StatusArquivo = "pendente" | "processando" | "ok" | "erro";

export type ResultadoArquivo = {
  status: StatusArquivo;
  mensagem: string;
  novas: number;
  duplicadas: number;
};

type ArquivoLike = {
  name: string;
  type: string;
  size: number;
  lastModified: number;
};

export const MAX_ARQUIVOS = 10;
const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];

export const chaveArquivo = (f: ArquivoLike) =>
  `${f.name}|${f.size}|${f.lastModified}`;
export const ehImagem = (f: ArquivoLike) => TIPOS_IMAGEM.includes(f.type);
export const ehPdf = (f: ArquivoLike) =>
  f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
export const ehSuportado = (f: ArquivoLike) => ehImagem(f) || ehPdf(f);

const plural = (n: number, singular: string, pl: string) =>
  n === 1 ? singular : pl;

/** Junta os arquivos novos à lista atual sem repetir e respeitando o limite. */
export function adicionarNaLista<T extends ArquivoLike>(
  atuais: T[],
  novos: T[]
) {
  const vistas = new Set(atuais.map(chaveArquivo));
  const lista = [...atuais];
  let formatoInvalido = 0;
  let repetidos = 0;
  let excedeu = 0;
  for (const f of novos) {
    if (!ehSuportado(f)) formatoInvalido++;
    else if (vistas.has(chaveArquivo(f))) repetidos++;
    else if (lista.length >= MAX_ARQUIVOS) excedeu++;
    else {
      vistas.add(chaveArquivo(f));
      lista.push(f);
    }
  }
  const avisos: string[] = [];
  if (formatoInvalido)
    avisos.push(
      `${formatoInvalido} ${plural(formatoInvalido, "arquivo ignorado", "arquivos ignorados")} (use PDF, JPG, PNG ou WEBP)`
    );
  if (repetidos)
    avisos.push(
      `${repetidos} ${plural(repetidos, "arquivo já estava", "arquivos já estavam")} na lista`
    );
  if (excedeu)
    avisos.push(
      `limite de ${MAX_ARQUIVOS} arquivos por envio (${excedeu} não ${plural(excedeu, "foi adicionado", "foram adicionados")})`
    );
  return { lista, aviso: avisos.length ? avisos.join("; ") + "." : "" };
}

export type ProcessadorArquivo<T> = (
  arquivo: T,
  onProgresso: (msg: string) => void
) => Promise<{ transacoes: Transacao[]; duplicadas: number }>;

/**
 * Processa os arquivos UM POR VEZ, na ordem (o OCR é pesado e a detecção de
 * duplicadas precisa enxergar o que o arquivo anterior acabou de salvar).
 * Um erro num arquivo não interrompe os demais, e arquivos já importados
 */
export async function processarLote<T extends ArquivoLike>(opcoes: {
  arquivos: T[];
  anteriores: Record<string, ResultadoArquivo>;
  processar: ProcessadorArquivo<T>;
  onAtualizar: (
    resultados: Record<string, ResultadoArquivo>,
    progresso: string
  ) => void;
}) {
  const { arquivos, processar, onAtualizar } = opcoes;
  const resultados = { ...opcoes.anteriores };
  const fila = arquivos.filter(
    (f) => resultados[chaveArquivo(f)]?.status !== "ok"
  );
  for (const f of fila)
    resultados[chaveArquivo(f)] = {
      status: "pendente",
      mensagem: "Na fila",
      novas: 0,
      duplicadas: 0,
    };
  onAtualizar({ ...resultados }, "");

  const novasTransacoes: Transacao[] = [];
  for (let i = 0; i < fila.length; i++) {
    const f = fila[i];
    const k = chaveArquivo(f);
    const posicao = `Arquivo ${i + 1} de ${fila.length}`;
    resultados[k] = {
      status: "processando",
      mensagem: "Processando...",
      novas: 0,
      duplicadas: 0,
    };
    onAtualizar({ ...resultados }, `${posicao}: iniciando...`);
    try {
      const r = await processar(f, (msg) =>
        onAtualizar({ ...resultados }, `${posicao}: ${msg}`)
      );
      novasTransacoes.push(...r.transacoes);
      resultados[k] = {
        status: "ok",
        mensagem: mensagemDoArquivo(r.transacoes.length, r.duplicadas),
        novas: r.transacoes.length,
        duplicadas: r.duplicadas,
      };
    } catch (e) {
      resultados[k] = {
        status: "erro",
        mensagem: e instanceof Error ? e.message : "Erro inesperado.",
        novas: 0,
        duplicadas: 0,
      };
    }
    onAtualizar({ ...resultados }, "");
  }

  return { resultados, novasTransacoes, processados: fila.length };
}

export function mensagemDoArquivo(novas: number, duplicadas: number): string {
  if (novas === 0)
    return `Nenhuma transação nova (${duplicadas} já ${plural(duplicadas, "cadastrada", "cadastradas")})`;
  return (
    `${novas} ${plural(novas, "transação salva", "transações salvas")}` +
    (duplicadas
      ? `, ${duplicadas} já ${plural(duplicadas, "existia", "existiam")}`
      : "")
  );
}

/** Resumo de todos os arquivos da lista. */
export function resumirLote(resultados: Record<string, ResultadoArquivo>) {
  const todos = Object.values(resultados);
  const ok = todos.filter((r) => r.status === "ok");
  const erros = todos.filter((r) => r.status === "erro").length;
  const novas = ok.reduce((s, r) => s + r.novas, 0);
  const duplicadas = ok.reduce((s, r) => s + r.duplicadas, 0);
  const partes = [
    `${ok.length} de ${todos.length} ${plural(todos.length, "arquivo processado", "arquivos processados")}`,
    `${novas} ${plural(novas, "transação nova", "transações novas")}`,
  ];
  if (duplicadas)
    partes.push(
      `${duplicadas} ${plural(duplicadas, "ignorada por já existir", "ignoradas por já existirem")}`
    );
  if (erros)
    partes.push(
      `${erros} ${plural(erros, "arquivo com erro", "arquivos com erro")}`
    );
  return { texto: partes.join(" · "), ok: ok.length, erros, novas, duplicadas };
}
