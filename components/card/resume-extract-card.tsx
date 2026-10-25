import { formatarMoeda as formatarValor } from "@/lib/finance/formato";
import type { ComparacaoResumos } from "@/lib/finance/calculos";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { IndicadorComparacao } from "./comparacao-indicador";

export type ComparacaoCards = ComparacaoResumos & {
  periodo: { inicio: string; fim: string };
};

interface ResumoCardProps {
  totalRecebimentos: number;
  totalPagamentos: number;
  comparacao?: ComparacaoCards | null;
  avisoComparacao?: string | null;
}

// Rodapé com comparação ou aviso
function Rodape({
  comparacao,
  aviso,
  item,
}: {
  comparacao?: ComparacaoCards | null;
  aviso?: string | null;
  item: keyof ComparacaoResumos;
}) {
  if (comparacao) {
    return (
      <div className="mt-2 min-w-0 max-w-full">
        <IndicadorComparacao
          comparacao={comparacao[item]}
          periodo={comparacao.periodo}
        />
      </div>
    );
  }

  if (aviso) {
    return <p className="mt-2 break-words text-xs text-gray-400">{aviso}</p>;
  }

  return null;
}

// Card
function ResumoCard({
  titulo,
  valor,
  icone,
  corIcone,
  corValor = "text-[#021A49]",
  comparacao,
  aviso,
  item,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
  corIcone: string;
  corValor?: string;
  comparacao?: ComparacaoCards | null;
  aviso?: string | null;
  item: keyof ComparacaoResumos;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      {/* Ícone e título */}
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${corIcone}`}
        >
          {icone}
        </div>

        <p className="min-w-0 break-words text-xs font-medium text-gray-500 sm:text-sm">
          {titulo}
        </p>
      </div>

      {/* Valor */}
      <div className="mt-4 min-w-0">
        <p
          className={`break-words text-xl font-bold tabular-nums sm:text-2xl ${corValor}`}
        >
          {formatarValor(valor)}
        </p>

        {/* Comparação ou aviso */}
        <Rodape comparacao={comparacao} aviso={aviso} item={item} />
      </div>
    </div>
  );
}

// Componente principal
export function ResumoCards({
  totalRecebimentos,
  totalPagamentos,
  comparacao,
  avisoComparacao,
}: ResumoCardProps) {
  const saldo =
    (Math.round(totalRecebimentos * 100) - Math.round(totalPagamentos * 100)) /
    100;

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {/* Receitas */}
      <ResumoCard
        titulo="Receitas"
        valor={totalRecebimentos}
        icone={<TrendingUp size={22} className="text-[#021A49]" />}
        corIcone="bg-blue-50"
        comparacao={comparacao}
        aviso={avisoComparacao}
        item="receitas"
      />

      {/* Despesas */}
      <ResumoCard
        titulo="Despesas"
        valor={totalPagamentos}
        icone={<TrendingDown size={22} className="text-red-500" />}
        corIcone="bg-red-50"
        comparacao={comparacao}
        aviso={avisoComparacao}
        item="despesas"
      />

      {/* Saldo */}
      <ResumoCard
        titulo="Saldo do período"
        valor={saldo}
        icone={<Wallet size={22} className="text-[#021A49]" />}
        corIcone="bg-blue-50"
        corValor={saldo >= 0 ? "text-[#021A49]" : "text-red-500"}
        comparacao={comparacao}
        aviso={avisoComparacao}
        item="saldo"
      />
    </div>
  );
}
