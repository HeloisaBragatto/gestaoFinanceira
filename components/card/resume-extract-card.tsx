import { formatarValor } from "@/lib/use-extract";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface ResumoCardProps {
  totalRecebimentos: number;
  totalPagamentos: number;
}

export function ResumoCards({
  totalRecebimentos,
  totalPagamentos,
}: ResumoCardProps) {
  const saldo = totalRecebimentos - totalPagamentos;

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Receitas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Receitas</p>
          <p className="text-2xl font-bold text-[#021A49]">
            {formatarValor(totalRecebimentos)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            + 0% em relação ao período anterior
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={22} className="text-[#021A49]" />
        </div>
      </div>

      {/* Despesas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Despesas</p>
          <p className="text-2xl font-bold text-[#021A49]">
            {formatarValor(totalPagamentos)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            + 0% em relação ao período anterior
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
          <TrendingDown size={22} className="text-red-400" />
        </div>
      </div>

      {/* Saldo */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">Saldo</p>
          <p
            className={`text-2xl font-bold ${saldo >= 0 ? "text-[#021A49]" : "text-red-500"}`}
          >
            {formatarValor(saldo)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            + 0% em relação ao período anterior
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Wallet size={22} className="text-[#021A49]" />
        </div>
      </div>
    </div>
  );
}
