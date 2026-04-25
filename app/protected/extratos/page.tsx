"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Pencil,
  Trash2,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Extrato = {
  id: string;
  tipo: "pagamento" | "recebimento";
  descricao: string;
  categoria: string | null;
  valor: number;
  data_transacao: string;
  origem: string;
};

const CATEGORIAS = [
  "alimentação",
  "salário",
  "transporte",
  "saúde",
  "lazer",
  "moradia",
  "transferência",
  "compras",
  "despesas",
  "outro",
];

export default function ExtratosPage() {
  const [extratos, setExtratos] = useState<Extrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Extrato>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<
    "todos" | "pagamento" | "recebimento"
  >("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  // Ordenação
  const [ordenacao, setOrdenacao] = useState<"asc" | "desc">("desc");

  const supabase = createClient();

  const fetchExtratos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("extratos")
      .select("*")
      .order("data_transacao", { ascending: false });
    setExtratos(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchExtratos();
  }, []);

  // Filtros e ordenação

  const extratosFiltrados = extratos
    .filter((e) => filtroTipo === "todos" || e.tipo === filtroTipo)
    .filter(
      (e) => filtroCategoria === "todas" || e.categoria === filtroCategoria
    )
    .filter((e) => !filtroDataInicio || e.data_transacao >= filtroDataInicio)
    .filter((e) => !filtroDataFim || e.data_transacao <= filtroDataFim)
    .sort((a, b) => {
      const diff = a.data_transacao.localeCompare(b.data_transacao);
      return ordenacao === "desc" ? -diff : diff;
    });

  const totalRecebimentos = extratosFiltrados
    .filter((e) => e.tipo === "recebimento")
    .reduce((acc, e) => acc + e.valor, 0);

  const totalPagamentos = extratosFiltrados
    .filter((e) => e.tipo === "pagamento")
    .reduce((acc, e) => acc + e.valor, 0);

  // Edição

  const iniciarEdicao = (e: Extrato) => {
    setEditandoId(e.id);
    setEditForm({ ...e });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditForm({});
  };

  const salvarEdicao = async () => {
    if (!editandoId) return;
    await supabase
      .from("extratos")
      .update({
        tipo: editForm.tipo,
        descricao: editForm.descricao,
        categoria: editForm.categoria,
        valor: editForm.valor,
        data_transacao: editForm.data_transacao,
      })
      .eq("id", editandoId);
    setEditandoId(null);
    setEditForm({});
    fetchExtratos();
  };

  //  Exclusão

  const deletarExtrato = async (id: string) => {
    await supabase.from("extratos").delete().eq("id", id);
    setConfirmDeleteId(null);
    fetchExtratos();
  };

  //  Formatação

  const formatarValor = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatarData = (d: string) => {
    const [ano, mes, dia] = d.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-green-50 px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">Recebimentos</p>
          <p className="text-lg font-semibold text-green-600">
            {formatarValor(totalRecebimentos)}
          </p>
        </div>
        <div className="rounded-lg border bg-red-50 px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">Pagamentos</p>
          <p className="text-lg font-semibold text-red-500">
            {formatarValor(totalPagamentos)}
          </p>
        </div>
        <div className="rounded-lg border bg-blue-50 px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">Saldo</p>
          <p
            className={`text-lg font-semibold ${totalRecebimentos - totalPagamentos >= 0 ? "text-green-600" : "text-red-500"}`}
          >
            {formatarValor(totalRecebimentos - totalPagamentos)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Tipo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)}
            className="text-sm border rounded-md px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-[#a2cef0]"
          >
            <option value="todos">Todos</option>
            <option value="recebimento">Recebimentos</option>
            <option value="pagamento">Pagamentos</option>
          </select>
        </div>

        {/* Categoria */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Categoria</label>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-[#a2cef0]"
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
          <label className="text-xs text-gray-500">De</label>
          <input
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-[#a2cef0]"
          />
        </div>

        {/* Data fim */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Até</label>
          <input
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-[#a2cef0]"
          />
        </div>

        {/* Limpar filtros */}
        {(filtroTipo !== "todos" ||
          filtroCategoria !== "todas" ||
          filtroDataInicio ||
          filtroDataFim) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFiltroTipo("todos");
              setFiltroCategoria("todas");
              setFiltroDataInicio("");
              setFiltroDataFim("");
            }}
          >
            <X size={14} className="mr-1" /> Limpar filtros
          </Button>
        )}

        {/* Adicionar manualmente */}
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => {
            setEditandoId("novo");
            setEditForm({
              tipo: "pagamento",
              descricao: "",
              categoria: "outro",
              valor: 0,
              data_transacao: new Date().toISOString().split("T")[0],
              origem: "manual",
            });
          }}
        >
          <Plus size={14} className="mr-1" /> Adicionar
        </Button>
      </div>

      {/* Formulário de novo extrato */}
      {editandoId === "novo" && (
        <div className="border rounded-lg p-4 bg-blue-50 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Tipo</label>
            <select
              value={editForm.tipo}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  tipo: e.target.value as "pagamento" | "recebimento",
                })
              }
              className="text-sm border rounded-md px-2 py-1.5 bg-white"
            >
              <option value="pagamento">Pagamento</option>
              <option value="recebimento">Recebimento</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <label className="text-xs text-gray-500">Descrição</label>
            <Input
              value={editForm.descricao ?? ""}
              onChange={(e) =>
                setEditForm({ ...editForm, descricao: e.target.value })
              }
              placeholder="Ex: Salário, Mercado..."
              className="text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Categoria</label>
            <select
              value={editForm.categoria ?? "outro"}
              onChange={(e) =>
                setEditForm({ ...editForm, categoria: e.target.value })
              }
              className="text-sm border rounded-md px-2 py-1.5 bg-white"
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Valor (R$)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editForm.valor ?? ""}
              onChange={(e) =>
                setEditForm({ ...editForm, valor: parseFloat(e.target.value) })
              }
              className="text-sm w-28"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Data</label>
            <input
              type="date"
              value={editForm.data_transacao ?? ""}
              onChange={(e) =>
                setEditForm({ ...editForm, data_transacao: e.target.value })
              }
              className="text-sm border rounded-md px-2 py-1.5 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={async () => {
                const {
                  data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;
                await supabase.from("extratos").insert({
                  user_id: user.id,
                  tipo: editForm.tipo,
                  descricao: editForm.descricao,
                  categoria: editForm.categoria,
                  valor: editForm.valor,
                  data_transacao: editForm.data_transacao,
                  origem: "manual",
                });
                setEditandoId(null);
                setEditForm({});
                fetchExtratos();
              }}
            >
              <Check size={14} className="mr-1" /> Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={cancelarEdicao}>
              <X size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <p className="text-sm text-gray-400">Carregando extratos...</p>
      ) : extratosFiltrados.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhum extrato encontrado.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th
                  className="px-4 py-3 text-left cursor-pointer select-none hover:text-gray-700"
                  onClick={() =>
                    setOrdenacao(ordenacao === "desc" ? "asc" : "desc")
                  }
                >
                  <span className="flex items-center gap-1">
                    Data
                    {ordenacao === "desc" ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronUp size={14} />
                    )}
                  </span>
                </th>
                <th className="px-4 py-3 text-left">Descrição</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {extratosFiltrados.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  {editandoId === e.id ? (
                    // Linha em modo edição
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={editForm.data_transacao ?? ""}
                          onChange={(ev) =>
                            setEditForm({
                              ...editForm,
                              data_transacao: ev.target.value,
                            })
                          }
                          className="text-sm border rounded px-2 py-1 w-full"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={editForm.descricao ?? ""}
                          onChange={(ev) =>
                            setEditForm({
                              ...editForm,
                              descricao: ev.target.value,
                            })
                          }
                          className="text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editForm.categoria ?? "outro"}
                          onChange={(ev) =>
                            setEditForm({
                              ...editForm,
                              categoria: ev.target.value,
                            })
                          }
                          className="text-sm border rounded px-2 py-1"
                        >
                          {CATEGORIAS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editForm.tipo}
                          onChange={(ev) =>
                            setEditForm({
                              ...editForm,
                              tipo: ev.target.value as
                                | "pagamento"
                                | "recebimento",
                            })
                          }
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="pagamento">Pagamento</option>
                          <option value="recebimento">Recebimento</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.valor ?? ""}
                          onChange={(ev) =>
                            setEditForm({
                              ...editForm,
                              valor: parseFloat(ev.target.value),
                            })
                          }
                          className="text-sm w-24 text-right"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={salvarEdicao}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelarEdicao}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // Linha normal
                    <>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatarData(e.data_transacao)}
                      </td>
                      <td
                        className="px-4 py-3 font-medium max-w-[200px] truncate"
                        title={e.descricao}
                      >
                        {e.descricao}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                          {e.categoria ?? "outro"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                            e.tipo === "recebimento"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {e.tipo}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                          e.tipo === "recebimento"
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {e.tipo === "recebimento" ? "+" : "-"}{" "}
                        {formatarValor(e.valor)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => iniciarEdicao(e)}
                            className="text-gray-400 hover:text-blue-500 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          {confirmDeleteId === e.id ? (
                            <span className="flex items-center gap-1 text-xs text-red-500">
                              Confirmar?
                              <button
                                onClick={() => deletarExtrato(e.id)}
                                className="font-semibold hover:underline"
                              >
                                Sim
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-gray-400 hover:underline"
                              >
                                Não
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(e.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
