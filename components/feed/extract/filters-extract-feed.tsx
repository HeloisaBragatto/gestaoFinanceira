import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiltrosState } from "@/lib/use-extract";
import {
  FILTROS_INICIAIS,
  PRESETS_PERIODO,
  filtrosAtivos,
  periodoPreset,
  type PresetPeriodo,
} from "@/lib/finance/filtros";
import { CATEGORIAS } from "@/lib/finance/types";

interface FiltrosBarProps {
  filtros: FiltrosState;
  onChange: (filtros: FiltrosState) => void;
  onAplicar: (proximo?: FiltrosState) => void;
  onLimpar: () => void;
  categorias?: string[];
  erro?: string | null;
  alterado?: boolean;
}

const temFiltroAtivo = (f: FiltrosState) => filtrosAtivos(f).length > 0;

const campo =
  "text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 outline-none focus:border-[#021A49] focus:ring-1 focus:ring-[#021A49]/20 transition-all";

export function FiltrosBar({
  filtros,
  onChange,
  onAplicar,
  onLimpar,
  categorias = CATEGORIAS,
  erro,
  alterado,
}: FiltrosBarProps) {
  const set = (key: keyof FiltrosState, value: string) =>
    onChange({ ...filtros, [key]: value });

  const aplicarPreset = (preset: PresetPeriodo) => {
    const proximo = { ...filtros, ...periodoPreset(preset) };
    onChange(proximo);
    onAplicar(proximo);
  };

  return (
    <form
      className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onAplicar();
      }}
    >
      <div className="flex flex-wrap gap-3 items-end">
        {/* Tipo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Tipo</label>
          <select
            value={filtros.tipo}
            onChange={(e) => set("tipo", e.target.value)}
            className={`${campo} min-w-[130px]`}
          >
            <option value="todos">Todos</option>
            <option value="recebimento">Receitas</option>
            <option value="pagamento">Despesas</option>
          </select>
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Categoria</label>
          <select
            value={filtros.categoria}
            onChange={(e) => set("categoria", e.target.value)}
            className={`${campo} min-w-[140px]`}
          >
            <option value="todas">Todas</option>
            {categorias.map((c) => (
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
            className={campo}
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
            className={campo}
          />
        </div>

        {/* Valor mínimo / máximo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            Valor mínimo (R$)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0,00"
            value={filtros.valorMin}
            onChange={(e) => set("valorMin", e.target.value)}
            className={`${campo} w-32`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">
            Valor máximo (R$)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="sem limite"
            value={filtros.valorMax}
            onChange={(e) => set("valorMax", e.target.value)}
            className={`${campo} w-32`}
          />
        </div>

        {/* Origem */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Origem</label>
          <select
            value={filtros.origem}
            onChange={(e) => set("origem", e.target.value)}
            className={`${campo} min-w-[130px]`}
          >
            <option value="todas">Todas</option>
            <option value="manual">Manual</option>
            <option value="pdf">Importado</option>
          </select>
        </div>

        {/* Busca */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-xs font-medium text-gray-500">
            Palavra-chave
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar descrição ou categoria..."
              value={filtros.busca}
              onChange={(e) => set("busca", e.target.value)}
              className={`${campo} w-full pl-8 pr-3`}
            />
          </div>
        </div>

        {/* Aplicar */}
        <Button type="submit" className="btn-darkBlue">
          <SlidersHorizontal size={14} />
          Aplicar filtros
        </Button>

        {/* Limpar */}
        {(temFiltroAtivo(filtros) || alterado) && (
          <Button
            type="button"
            variant="outline"
            onClick={onLimpar}
            className="gap-1.5 text-gray-500 border-gray-200 rounded-lg"
          >
            <X size={13} />
            Limpar
          </Button>
        )}
      </div>

      {/* Atalhos de período */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">
          Período rápido:
        </span>
        {PRESETS_PERIODO.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => aplicarPreset(p.id)}
            className="text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:border-[#021A49]/40 hover:text-[#021A49] transition-colors"
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      {erro && (
        <p role="alert" className="text-sm text-red-500">
          {erro}
        </p>
      )}
      {!erro && alterado && (
        <p className="text-xs text-amber-600">
          Os filtros foram alterados. Clique em “Aplicar filtros” para atualizar
          os resultados.
        </p>
      )}
    </form>
  );
}

/** Chips com os filtros atualmente aplicados */
export function FiltrosAtivosChips({
  filtros,
  onRemover,
}: {
  filtros: FiltrosState;
  onRemover: (chave: keyof FiltrosState) => void;
}) {
  const ativos = filtrosAtivos(filtros);
  if (
    ativos.length === 0 ||
    JSON.stringify(filtros) === JSON.stringify(FILTROS_INICIAIS)
  )
    return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Filtros ativos:</span>
      {ativos.map((f) => (
        <span
          key={f.chave}
          className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-[#021A49] border border-blue-100 rounded-full pl-2.5 pr-1.5 py-1"
        >
          {f.rotulo}
          <button
            type="button"
            onClick={() => onRemover(f.chave)}
            aria-label={`Remover filtro ${f.rotulo}`}
            className="rounded-full hover:bg-blue-100 p-0.5"
          >
            <X size={11} />
          </button>
        </span>
      ))}
    </div>
  );
}
