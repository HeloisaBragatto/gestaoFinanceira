import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { chaveArquivo, type ResultadoArquivo } from "@/lib/importacao-lote";

interface ListaArquivosProps {
  files: File[];
  resultados: Record<string, ResultadoArquivo>;
  disabled?: boolean;
  onRemover: (file: File) => void;
  onLimpar: () => void;
}

const kb = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function ListaArquivos({
  files,
  resultados,
  disabled,
  onRemover,
  onLimpar,
}: ListaArquivosProps) {
  if (files.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">
          Arquivos ({files.length})
        </span>
        <button
          type="button"
          onClick={onLimpar}
          disabled={disabled}
          className="text-xs text-gray-500 hover:text-red-500 disabled:opacity-40 disabled:pointer-events-none"
        >
          Limpar lista
        </button>
      </div>
      <ul className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
        {files.map((f) => {
          const r = resultados[chaveArquivo(f)];
          const estado = r?.status;
          return (
            <li
              key={chaveArquivo(f)}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <FileText size={16} className="text-gray-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {f.name}
                </p>
                <p
                  className={`text-xs ${
                    estado === "erro"
                      ? "text-red-500"
                      : estado === "ok"
                        ? "text-green-600"
                        : "text-gray-500"
                  }`}
                >
                  {r ? r.mensagem : kb(f.size)}
                </p>
              </div>
              {estado === "processando" && (
                <Loader2
                  size={15}
                  className="animate-spin text-blue-600 shrink-0"
                />
              )}
              {estado === "pendente" && (
                <Clock size={15} className="text-gray-400 shrink-0" />
              )}
              {estado === "ok" && (
                <CheckCircle size={15} className="text-green-600 shrink-0" />
              )}
              {estado === "erro" && (
                <AlertCircle size={15} className="text-red-500 shrink-0" />
              )}
              <button
                type="button"
                aria-label={`Remover ${f.name}`}
                onClick={() => onRemover(f)}
                disabled={disabled}
                className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:pointer-events-none"
              >
                <X size={14} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
