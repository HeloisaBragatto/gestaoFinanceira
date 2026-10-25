import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Comparacao } from "@/lib/finance/calculos";
import {
  formatarMoedaComSinal,
  formatarPercentual,
} from "@/lib/finance/formato";

const COR = {
  favoravel: "text-green-600",
  desfavoravel: "text-red-500",
  neutra: "text-gray-500",
} as const;

const ROTULO_DIRECAO = {
  aumento: "Aumento",
  reducao: "Redução",
  estavel: "Estável",
} as const;

const ROTULO_AVALIACAO = {
  favoravel: "favorável",
  desfavoravel: "desfavorável",
  neutra: "",
} as const;

/** Texto do indicador (também usado nos testes). */
export function textoComparacao(c: Comparacao): {
  titulo: string;
  detalhe: string;
} {
  const titulo = [ROTULO_DIRECAO[c.direcao], ROTULO_AVALIACAO[c.avaliacao]]
    .filter(Boolean)
    .join(" ");

  if (c.direcao === "estavel") {
    return {
      titulo,
      detalhe:
        c.motivoSemPercentual === "ambos_zero"
          ? "sem movimentação nos dois períodos"
          : "sem variação (0%)",
    };
  }

  const dif = formatarMoedaComSinal(c.diferenca);
  if (c.percentual !== null) {
    return {
      titulo,
      detalhe: `${formatarPercentual(c.percentual, true)} (${dif})`,
    };
  }
  if (c.motivoSemPercentual === "mudanca_de_sinal") {
    return {
      titulo,
      detalhe: `${c.anterior > 0 ? "de positivo para negativo" : "de negativo para positivo"} (${dif})`,
    };
  }
  return {
    titulo,
    detalhe: `percentual indisponível: o período anterior não teve valores (${dif})`,
  };
}

export function IndicadorComparacao({
  comparacao,
  // periodo,
}: {
  comparacao: Comparacao;
  periodo: { inicio: string; fim: string };
}) {
  const Icone =
    comparacao.direcao === "aumento"
      ? ArrowUpRight
      : comparacao.direcao === "reducao"
        ? ArrowDownRight
        : Minus;
  const { titulo, detalhe } = textoComparacao(comparacao);

  return (
    <div className="mt-1 text-xs">
      <p
        className={`flex items-start gap-1 font-semibold ${COR[comparacao.avaliacao]}`}
      >
        <Icone size={14} className="shrink-0 mt-px" aria-hidden />
        <span>
          {titulo} · {detalhe}
        </span>
      </p>
      {/* <p className="text-gray-400 mt-0.5">
        vs. {formatarDataBr(periodo.inicio)} a {formatarDataBr(periodo.fim)}
      </p> */}
    </div>
  );
}
