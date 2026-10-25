import type { ReactNode } from "react";

interface MetricCardProps {
  titulo: string;
  valor: ReactNode;
  /** Linha de apoio (contexto do número). */
  detalhe?: ReactNode;
  /** Rodapé extra (ex.: indicador de comparação). */
  rodape?: ReactNode;
  destaque?: "positivo" | "negativo" | "neutro";
}

const COR = {
  positivo: "text-[#021A49]",
  negativo: "text-red-500",
  neutro: "text-[#021A49]",
} as const;

/** Card compacto de métrica, no mesmo estilo dos cards de resumo. */
export function MetricCard({
  titulo,
  valor,
  detalhe,
  rodape,
  destaque = "neutro",
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 min-w-0">
      <p className="text-xs text-gray-500 mb-1">{titulo}</p>
      <p className={`text-xl font-bold break-words ${COR[destaque]}`}>
        {valor}
      </p>
      {detalhe && (
        <p className="text-xs text-gray-400 mt-1 text-pretty">{detalhe}</p>
      )}
      {rodape}
    </div>
  );
}
