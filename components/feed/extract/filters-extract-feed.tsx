import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORIAS, FiltrosState } from "@/lib/use-extract";

interface FiltrosBarProps {
  filtros: FiltrosState;
  onChange: (filtros: FiltrosState) => void;
  onLimpar: () => void;
}

const temFiltroAtivo = (f: FiltrosState) =>
  f.tipo !== "todos" ||
  f.categoria !== "todas" ||
  !!f.dataInicio ||
  !!f.dataFim ||
  !!f.busca;

export function FiltrosBar({ filtros, onChange, onLimpar }: FiltrosBarProps) {
  const set = (key: keyof FiltrosState, value: string) =>
    onChange({ ...filtros, [key]: value });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Tipo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Tipo</label>
          <select
            value={filtros.tipo}
            onChange={(e) => set("tipo", e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 outline-none focus:border-[#021A49] focus:ring-1 focus:ring-[#021A49]/20 transition-all min-w-[130px]"
          >
            <option value="todos">Todos</option>
            <option value="recebimento">Recebimentos</option>
            <option value="pagamento">Pagamentos</option>
          </select>
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Categoria</label>
          <select
            value={filtros.categoria}
            onChange={(e) => set("categoria", e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 outline-none focus:border-[#021A49] focus:ring-1 focus:ring-[#021A49]/20 transition-all min-w-[140px]"
          >
            <option value="todas">Todas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Data início */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            Data inicial
          </label>
          <input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => set("dataInicio", e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 outline-none focus:border-[#021A49] focus:ring-1 focus:ring-[#021A49]/20 transition-all"
          />
        </div>

        {/* Data fim */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            Data final
          </label>
          <input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => set("dataFim", e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 outline-none focus:border-[#021A49] focus:ring-1 focus:ring-[#021A49]/20 transition-all"
          />
        </div>

        {/* Busca */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-gray-500">Buscar</label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar descrição..."
              value={filtros.busca}
              onChange={(e) => set("busca", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-2 bg-gray-50 text-gray-900 outline-none focus:border-[#021A49] focus:ring-1 focus:ring-[#021A49]/20 transition-all"
            />
          </div>
        </div>

        {/* Botão filtrar */}
        <Button className="bg-[#021A49] hover:bg-[#021A49]/90 text-white gap-2 rounded-lg">
          <SlidersHorizontal size={14} />
          Filtrar
        </Button>

        {/* Limpar filtros */}
        {temFiltroAtivo(filtros) && (
          <Button
            variant="outline"
            onClick={onLimpar}
            className="gap-1.5 text-gray-500 border-gray-200 rounded-lg"
          >
            <X size={13} />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
