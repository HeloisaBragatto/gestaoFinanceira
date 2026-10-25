import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginacaoProps {
  pagina: number; // 1-based
  tamanho: number;
  total: number;
  onPagina: (pagina: number) => void;
}

export function Paginacao({
  pagina,
  tamanho,
  total,
  onPagina,
}: PaginacaoProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / tamanho));
  if (total <= tamanho) return null;

  const inicio = (pagina - 1) * tamanho + 1;
  const fim = Math.min(pagina * tamanho, total);

  const botao =
    "w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors";

  return (
    <div className="flex items-center justify-between text-xs text-gray-500 px-1">
      <span>
        Mostrando {inicio}–{fim} de {total.toLocaleString("pt-BR")}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={botao}
          disabled={pagina <= 1}
          onClick={() => onPagina(pagina - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} />
        </button>
        <span>
          Página {pagina} de {totalPaginas}
        </span>
        <button
          type="button"
          className={botao}
          disabled={pagina >= totalPaginas}
          onClick={() => onPagina(pagina + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
