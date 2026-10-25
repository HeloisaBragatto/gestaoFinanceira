import { isDataValida } from "@/lib/finance/filtros";
import { paraCentavos } from "@/lib/finance/calculos";

const LIMITE = 999_999_999.99;

/** Valida um valor monetário. Retorna mensagem de erro ou null. */
function validarValor(
  valor: unknown,
  rotulo: string,
  { permitirZero }: { permitirZero: boolean }
): string | null {
  if (valor === undefined || valor === null || valor === "")
    return `Informe ${rotulo}.`;
  const n = Number(valor);
  if (!Number.isFinite(n)) return `${capitalizar(rotulo)} inválido.`;
  if (permitirZero ? n < 0 : n <= 0)
    return permitirZero
      ? `${capitalizar(rotulo)} não pode ser negativo.`
      : `${capitalizar(rotulo)} deve ser maior que zero.`;
  if (n > LIMITE) return `${capitalizar(rotulo)} acima do limite permitido.`;
  if (Math.abs(n * 100 - paraCentavos(n)) > 1e-6)
    return `Use no máximo 2 casas decimais em ${rotulo}.`;
  return null;
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type MetaFormValores = {
  nome: string;
  valor_alvo: number | string | undefined;
  valor_inicial?: number | string | undefined;
  data_criacao: string;
  data_prevista?: string | null;
  categoria?: string | null;
  descricao?: string | null;
};

export function validarMetaForm(f: MetaFormValores): string | null {
  const nome = (f.nome ?? "").trim();
  if (!nome) return "Informe o nome da meta.";
  if (nome.length > 80) return "O nome pode ter no máximo 80 caracteres.";

  const alvo = validarValor(f.valor_alvo, "o valor desejado", {
    permitirZero: false,
  });
  if (alvo) return alvo;

  const vazioInicial =
    f.valor_inicial === undefined ||
    f.valor_inicial === "" ||
    f.valor_inicial === null;
  if (!vazioInicial) {
    const ini = validarValor(f.valor_inicial, "o valor inicial", {
      permitirZero: true,
    });
    if (ini) return ini;
  }

  if (!f.data_criacao || !isDataValida(f.data_criacao))
    return "Informe uma data de criação válida.";
  if (f.data_prevista) {
    if (!isDataValida(f.data_prevista)) return "Data prevista inválida.";
    if (f.data_prevista < f.data_criacao)
      return "A data prevista não pode ser anterior à data de criação.";
  }
  if ((f.categoria ?? "").length > 40)
    return "A categoria pode ter no máximo 40 caracteres.";
  if ((f.descricao ?? "").length > 500)
    return "A descrição pode ter no máximo 500 caracteres.";
  return null;
}

export type ContribuicaoFormValores = {
  valor: number | string | undefined;
  data: string;
  observacao?: string | null;
};

/** `hoje` = YYYY-MM-DD local. Contribuições não podem ter data futura. */
export function validarContribuicaoForm(
  f: ContribuicaoFormValores,
  hoje: string
): string | null {
  const v = validarValor(f.valor, "o valor", { permitirZero: false });
  if (v) return v;
  if (!f.data || !isDataValida(f.data)) return "Informe uma data válida.";
  if (f.data > hoje) return "A data da contribuição não pode ser futura.";
  if ((f.observacao ?? "").length > 300)
    return "A observação pode ter no máximo 300 caracteres.";
  return null;
}
