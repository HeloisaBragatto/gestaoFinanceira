import { isDataValida } from "./filtros";
import { paraCentavos } from "./calculos";
import { Extrato } from "./types";

/** Valida o cadastro/edição manual de uma movimentação. Retorna a mensagem de erro ou null. */
export function validarExtratoForm(form: Partial<Extrato>): string | null {
  const descricao = (form.descricao ?? "").trim();
  if (!descricao) return "Informe a descrição da movimentação.";
  if (descricao.length > 200)
    return "A descrição pode ter no máximo 200 caracteres.";

  if (form.tipo !== "pagamento" && form.tipo !== "recebimento")
    return "Selecione o tipo da movimentação.";

  const valor = Number(form.valor);
  if (
    form.valor === undefined ||
    form.valor === null ||
    !Number.isFinite(valor)
  )
    return "Informe o valor da movimentação.";
  if (valor <= 0) return "O valor deve ser maior que zero.";
  if (valor > 999_999_999.99) return "Valor acima do limite permitido.";
  if (Math.abs(valor * 100 - paraCentavos(valor)) > 1e-6)
    return "Use no máximo 2 casas decimais no valor.";

  if (!form.data_transacao || !isDataValida(form.data_transacao))
    return "Informe uma data válida.";

  return null;
}
