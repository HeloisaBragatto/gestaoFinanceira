import { Pencil, Trash2, X, Check, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CATEGORIAS,
  Extrato,
  formatarData,
  formatarValor,
} from "@/lib/use-extract";

interface TabelaExtratosProps {
  extratos: Extrato[];
  ordenacao: "asc" | "desc";
  onOrdenacao: () => void;
  editandoId: string | null;
  editForm: Partial<Extrato>;
  onIniciarEdicao: (e: Extrato) => void;
  onCancelarEdicao: () => void;
  onSalvarEdicao: () => void;
  onEditFormChange: (form: Partial<Extrato>) => void;
  confirmDeleteId: string | null;
  onConfirmDelete: (id: string) => void;
  onDeletar: (id: string) => void;
  onCancelarDelete: () => void;
}

// ── Badge de categoria ────────────────────────────────────────
const categoriaCores: Record<string, string> = {
  salário: "bg-green-50 text-green-700 border-green-200",
  alimentação: "bg-orange-50 text-orange-700 border-orange-200",
  transporte: "bg-blue-50 text-blue-700 border-blue-200",
  saúde: "bg-red-50 text-red-700 border-red-200",
  lazer: "bg-purple-50 text-purple-700 border-purple-200",
  moradia: "bg-yellow-50 text-yellow-700 border-yellow-200",
  transferência: "bg-cyan-50 text-cyan-700 border-cyan-200",
  compras: "bg-pink-50 text-pink-700 border-pink-200",
  despesas: "bg-gray-100 text-gray-700 border-gray-200",
};

function CategoriaBadge({ categoria }: { categoria: string | null }) {
  const cat = categoria ?? "outro";
  const cor =
    categoriaCores[cat] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`text-xs font-medium border rounded-full px-2.5 py-0.5 ${cor}`}
    >
      {cat}
    </span>
  );
}

// ── Badge de tipo ─────────────────────────────────────────────
function TipoBadge({ tipo }: { tipo: "pagamento" | "recebimento" }) {
  return (
    <span
      className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${
        tipo === "recebimento"
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-600 border border-red-200"
      }`}
    >
      {tipo === "recebimento" ? "Receita" : "Despesa"}
    </span>
  );
}

// ── Ícone de categoria ────────────────────────────────────────
const categoriaIcones: Record<string, string> = {
  salário: "💼",
  alimentação: "🛒",
  transporte: "🚗",
  saúde: "💊",
  lazer: "🎬",
  moradia: "🏠",
  transferência: "↔️",
  compras: "🛍️",
  despesas: "📄",
};

export function TabelaExtratos({
  extratos,
  ordenacao,
  onOrdenacao,
  editandoId,
  editForm,
  onIniciarEdicao,
  onCancelarEdicao,
  onSalvarEdicao,
  onEditFormChange,
  confirmDeleteId,
  onConfirmDelete,
  onDeletar,
  onCancelarDelete,
}: TabelaExtratosProps) {
  const setEdit = (key: keyof Extrato, value: string | number) =>
    onEditFormChange({ ...editForm, [key]: value });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Cabeçalho da tabela */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Movimentações</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{extratos.length} registros</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Descrição
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Categoria
              </th>
              <th
                className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 transition-colors"
                onClick={onOrdenacao}
              >
                <span className="flex items-center gap-1">
                  Data
                  {ordenacao === "desc" ? (
                    <ChevronDown size={13} />
                  ) : (
                    <ChevronUp size={13} />
                  )}
                </span>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Tipo
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Valor
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {extratos.map((e) => (
              <tr
                key={e.id}
                className="hover:bg-gray-50/70 transition-colors group"
              >
                {editandoId === e.id ? (
                  // ── Linha em modo edição ──
                  <>
                    <td className="px-4 py-2">
                      <Input
                        value={editForm.descricao ?? ""}
                        onChange={(ev) => setEdit("descricao", ev.target.value)}
                        className="text-sm h-8 border-gray-200"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editForm.categoria ?? "outro"}
                        onChange={(ev) => setEdit("categoria", ev.target.value)}
                        className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-900 outline-none"
                      >
                        {CATEGORIAS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={editForm.data_transacao ?? ""}
                        onChange={(ev) =>
                          setEdit("data_transacao", ev.target.value)
                        }
                        className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-900 outline-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editForm.tipo}
                        onChange={(ev) => setEdit("tipo", ev.target.value)}
                        className="text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-900 outline-none"
                      >
                        <option value="pagamento">Despesa</option>
                        <option value="recebimento">Receita</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.valor ?? ""}
                        onChange={(ev) =>
                          setEdit("valor", parseFloat(ev.target.value))
                        }
                        className="text-sm h-8 w-24 text-right border-gray-200 ml-auto"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={onSalvarEdicao}
                          className="w-7 h-7 rounded-md bg-green-50 border border-green-200 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={onCancelarEdicao}
                          className="w-7 h-7 rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // ── Linha normal ──
                  <>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                          {categoriaIcones[e.categoria ?? ""] ?? "📄"}
                        </div>
                        <span
                          className="font-medium text-gray-900 truncate max-w-[200px]"
                          title={e.descricao}
                        >
                          {e.descricao}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <CategoriaBadge categoria={e.categoria} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-sm tabular-nums">
                      {formatarData(e.data_transacao)}
                    </td>
                    <td className="px-5 py-3.5">
                      <TipoBadge tipo={e.tipo} />
                    </td>
                    <td
                      className={`px-5 py-3.5 text-right font-semibold tabular-nums ${
                        e.tipo === "recebimento"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {e.tipo === "recebimento" ? "+ " : "- "}
                      {formatarValor(e.valor)}
                    </td>
                    <td className="px-5 py-3.5">
                      {confirmDeleteId === e.id ? (
                        <div className="flex items-center gap-1 justify-center text-xs text-red-500">
                          <button
                            onClick={() => onDeletar(e.id)}
                            className="font-semibold hover:underline"
                          >
                            Sim
                          </button>
                          <span>/</span>
                          <button
                            onClick={onCancelarDelete}
                            className="text-gray-400 hover:underline"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onIniciarEdicao(e)}
                            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#021A49] hover:border-[#021A49]/30 hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => onConfirmDelete(e.id)}
                            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
