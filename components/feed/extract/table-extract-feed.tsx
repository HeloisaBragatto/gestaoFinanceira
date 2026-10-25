"use client";

import { useState } from "react";
import {
  Pencil,
  Trash2,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Input } from "@/components/ui/input";

import { formatarData, formatarValor } from "@/lib/use-extract";

import { CATEGORIAS, Extrato } from "@/lib/finance/types";

// ── Propriedades do componente ────────────────────────────────

interface TabelaExtratosProps {
  extratos: Extrato[];

  /** Total de registros do resultado, quando extratos contém somente a página atual. */
  totalRegistros?: number;

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

// ── Cores das categorias ──────────────────────────────────────

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

// ── Ícones das categorias ─────────────────────────────────────

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

// ── Badge de categoria ────────────────────────────────────────

function CategoriaBadge({ categoria }: { categoria: string | null }) {
  const cat = categoria ?? "outro";

  const cor =
    categoriaCores[cat] ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <span
      title={cat}
      className={`inline-flex min-w-0 max-w-full items-center rounded-full border px-2 py-1 text-[10px] font-medium sm:px-2.5 sm:text-xs ${cor}`}
    >
      <span className="truncate">{cat}</span>
    </span>
  );
}

// ── Badge de tipo ─────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: "pagamento" | "recebimento" }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold sm:px-2.5 sm:text-xs ${
        tipo === "recebimento"
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-600"
      }`}
    >
      {tipo === "recebimento" ? "Receita" : "Despesa"}
    </span>
  );
}

// ── Classes dos campos de edição ──────────────────────────────

const campoClass =
  "h-9 w-full min-w-0 max-w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-[#021A49] focus:ring-1 focus:ring-[#021A49]/20";

const labelClass = "text-xs font-medium text-gray-500";

// ── Componente principal ──────────────────────────────────────

export function TabelaExtratos({
  extratos,
  totalRegistros,
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
  const [movimentacaoAbertaId, setMovimentacaoAbertaId] = useState<
    string | null
  >(null);

  const setEdit = (key: keyof Extrato, value: string | number) => {
    onEditFormChange({
      ...editForm,
      [key]: value,
    });
  };

  const alternarMovimentacao = (id: string) => {
    setMovimentacaoAbertaId((atual) => (atual === id ? null : id));
  };

  const iniciarEdicao = (extrato: Extrato) => {
    setMovimentacaoAbertaId(extrato.id);
    onIniciarEdicao(extrato);
  };

  const valorFormatado = (extrato: Extrato) =>
    `${extrato.tipo === "recebimento" ? "+ " : "- "}${formatarValor(
      extrato.valor
    )}`;

  const total = totalRegistros ?? extratos.length;

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* ======================================================
          CABEÇALHO
      ====================================================== */}

      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-4 sm:px-5">
        <h3 className="text-sm font-semibold text-gray-900">Movimentações</h3>

        <div className="flex items-center gap-2">
          {/* Ordenação no celular */}
          <button
            type="button"
            onClick={onOrdenacao}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 md:hidden"
            aria-label="Ordenar movimentações por data"
            title="Ordenar por data"
          >
            Data
            {ordenacao === "desc" ? (
              <ChevronDown size={13} />
            ) : (
              <ChevronUp size={13} />
            )}
          </button>

          <span className="whitespace-nowrap text-xs text-gray-500">
            {total.toLocaleString("pt-BR")}{" "}
            {total === 1 ? "registro" : "registros"}
          </span>
        </div>
      </div>

      {/* ======================================================
          CELULAR: CARDS EXPANSÍVEIS
          Visível abaixo de md (768px no Tailwind padrão)
      ====================================================== */}

      <div className="w-full min-w-0 space-y-2 p-2.5 md:hidden sm:p-4">
        {extratos.map((e) => {
          const aberta = movimentacaoAbertaId === e.id || editandoId === e.id;

          const editando = editandoId === e.id;
          const excluindo = confirmDeleteId === e.id;

          return (
            <div
              key={e.id}
              className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              {/* Linha compacta: ícone, data, valor e seta */}
              <button
                type="button"
                onClick={() => alternarMovimentacao(e.id)}
                aria-expanded={aberta}
                aria-label={`Ver detalhes de ${e.descricao}`}
                className="flex w-full min-w-0 items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#021A49]/30 sm:gap-3 sm:px-4"
              >
                {/* Ícone da categoria */}
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm"
                  title={e.descricao}
                >
                  {categoriaIcones[e.categoria ?? ""] ?? "📄"}
                </span>

                {/* Data */}
                <span
                  className="min-w-0 flex-1 truncate text-xs text-gray-500 sm:text-sm"
                  title={formatarData(e.data_transacao)}
                >
                  {formatarData(e.data_transacao)}
                </span>

                {/* Valor */}
                <span
                  className={`max-w-[50%] shrink-0 break-words text-right text-xs font-semibold tabular-nums sm:text-sm ${
                    e.tipo === "recebimento" ? "text-green-600" : "text-red-500"
                  }`}
                  title={valorFormatado(e)}
                >
                  {valorFormatado(e)}
                </span>

                {/* Indicador de expansão */}
                <span className="shrink-0 text-gray-400">
                  {aberta ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </span>
              </button>

              {/* ==================================================
                  CARD EXPANDIDO
              ================================================== */}

              {aberta && (
                <div className="w-full min-w-0 overflow-hidden border-t border-gray-100 bg-gray-50/70 p-3 sm:p-4">
                  {editando ? (
                    <>
                      <p className="mb-4 text-sm font-semibold text-gray-900">
                        Editar movimentação
                      </p>

                      <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* Descrição */}
                        <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
                          <label className={labelClass}>Descrição</label>

                          <Input
                            value={editForm.descricao ?? ""}
                            onChange={(ev) =>
                              setEdit("descricao", ev.target.value)
                            }
                            className="h-10 w-full min-w-0 text-sm"
                            aria-label="Descrição"
                          />
                        </div>

                        {/* Categoria */}
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <label className={labelClass}>Categoria</label>

                          <select
                            value={editForm.categoria ?? "outro"}
                            onChange={(ev) =>
                              setEdit("categoria", ev.target.value)
                            }
                            className={campoClass}
                            aria-label="Categoria"
                          >
                            {CATEGORIAS.map((categoria) => (
                              <option key={categoria} value={categoria}>
                                {categoria}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Data */}
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <label className={labelClass}>Data</label>

                          <input
                            type="date"
                            value={editForm.data_transacao ?? ""}
                            onChange={(ev) =>
                              setEdit("data_transacao", ev.target.value)
                            }
                            className={campoClass}
                            aria-label="Data da transação"
                          />
                        </div>

                        {/* Tipo */}
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <label className={labelClass}>Tipo</label>

                          <select
                            value={editForm.tipo ?? "pagamento"}
                            onChange={(ev) => setEdit("tipo", ev.target.value)}
                            className={campoClass}
                            aria-label="Tipo de transação"
                          >
                            <option value="pagamento">Despesa</option>
                            <option value="recebimento">Receita</option>
                          </select>
                        </div>

                        {/* Valor */}
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <label className={labelClass}>Valor (R$)</label>

                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.valor ?? ""}
                            onChange={(ev) =>
                              setEdit(
                                "valor",
                                ev.target.value === ""
                                  ? 0
                                  : parseFloat(ev.target.value)
                              )
                            }
                            className="h-10 w-full min-w-0 text-sm"
                            aria-label="Valor da transação"
                          />
                        </div>

                        {/* Botões de edição dentro do card */}
                        <div className="flex min-w-0 gap-2 pt-1 sm:col-span-2">
                          <button
                            type="button"
                            onClick={onSalvarEdicao}
                            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#021A49] px-3 text-sm font-medium text-white transition-colors hover:bg-[#021A49]/90"
                          >
                            <Check size={15} />
                            Salvar
                          </button>

                          <button
                            type="button"
                            onClick={onCancelarEdicao}
                            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                          >
                            <X size={15} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mb-4 text-sm font-semibold text-gray-900">
                        Detalhes da movimentação
                      </p>

                      {/* Informações completas */}
                      <div className="grid w-full min-w-0 grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4">
                        {/* Descrição */}
                        <div className="col-span-2 min-w-0">
                          <p className="mb-1 text-xs text-gray-500">
                            Descrição
                          </p>

                          <p className="break-words text-sm font-medium text-gray-900">
                            {e.descricao}
                          </p>
                        </div>

                        {/* Categoria */}
                        <div className="flex min-w-0 flex-col items-start gap-1">
                          <p className="text-xs text-gray-500">Categoria</p>

                          <CategoriaBadge categoria={e.categoria} />
                        </div>

                        {/* Tipo */}
                        <div className="flex min-w-0 flex-col items-start gap-1">
                          <p className="text-xs text-gray-500">Tipo</p>

                          <TipoBadge tipo={e.tipo} />
                        </div>

                        {/* Data */}
                        <div className="min-w-0">
                          <p className="mb-1 text-xs text-gray-500">Data</p>

                          <p className="text-sm text-gray-900">
                            {formatarData(e.data_transacao)}
                          </p>
                        </div>

                        {/* Valor */}
                        <div className="min-w-0">
                          <p className="mb-1 text-xs text-gray-500">Valor</p>

                          <p
                            className={`break-words text-sm font-semibold ${
                              e.tipo === "recebimento"
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {valorFormatado(e)}
                          </p>
                        </div>
                      </div>

                      {/* Ações dentro do card */}
                      <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
                        {excluindo ? (
                          <>
                            <span className="mr-auto text-xs text-gray-600">
                              Confirmar exclusão?
                            </span>

                            <button
                              type="button"
                              onClick={() => onDeletar(e.id)}
                              className="flex h-9 items-center justify-center gap-1 rounded-lg bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700"
                            >
                              <Check size={14} />
                              Sim, excluir
                            </button>

                            <button
                              type="button"
                              onClick={onCancelarDelete}
                              className="flex h-9 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-100"
                            >
                              <X size={14} />
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => iniciarEdicao(e)}
                              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#021A49] px-3 text-sm font-medium text-white transition-colors hover:bg-[#021A49]/90"
                            >
                              <Pencil size={14} />
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => onConfirmDelete(e.id)}
                              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                              Excluir
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Nenhuma movimentação */}
        {extratos.length === 0 && (
          <div className="px-3 py-10 text-center text-sm text-gray-500">
            Nenhuma movimentação encontrada.
          </div>
        )}
      </div>

      {/* ======================================================
          TABLET E COMPUTADOR: TABELA COMPLETA
          Visível a partir de md (768px no Tailwind padrão)
      ====================================================== */}

      <div className="hidden w-full max-w-full min-w-0 md:block">
        <table className="w-full max-w-full table-fixed border-collapse text-xs lg:text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-[10px] uppercase tracking-wide text-gray-500 lg:text-xs">
              <th className="w-[23%] px-1 py-3 text-left font-semibold sm:px-2 lg:px-3">
                Descrição
              </th>

              <th className="w-[17%] px-1 py-3 text-left font-semibold sm:px-2 lg:px-3">
                Categoria
              </th>

              <th
                className="w-[15%] cursor-pointer select-none px-1 py-3 text-left font-semibold transition-colors hover:text-gray-800 sm:px-2 lg:px-3"
                onClick={onOrdenacao}
                title="Ordenar por data"
              >
                <span className="inline-flex items-center gap-0.5 lg:gap-1">
                  Data
                  {ordenacao === "desc" ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronUp size={12} />
                  )}
                </span>
              </th>

              <th className="w-[13%] px-1 py-3 text-left font-semibold sm:px-2 lg:px-3">
                Tipo
              </th>

              <th className="w-[19%] px-1 py-3 text-right font-semibold sm:px-2 lg:px-3">
                Valor
              </th>

              <th className="w-[13%] px-1 py-3 text-center font-semibold sm:px-2 lg:px-3">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {extratos.map((e) => {
              const editando = editandoId === e.id;
              const excluindo = confirmDeleteId === e.id;

              return (
                <tr
                  key={e.id}
                  className="transition-colors hover:bg-gray-50/70"
                >
                  {editando ? (
                    <>
                      {/* Descrição */}
                      <td className="min-w-0 px-1 py-2 sm:px-2 lg:px-3">
                        <Input
                          value={editForm.descricao ?? ""}
                          onChange={(ev) =>
                            setEdit("descricao", ev.target.value)
                          }
                          className="h-9 w-full min-w-0 px-1 text-[10px] sm:px-2 sm:text-xs"
                          aria-label="Descrição"
                        />
                      </td>

                      {/* Categoria */}
                      <td className="min-w-0 px-1 py-2 sm:px-2 lg:px-3">
                        <select
                          value={editForm.categoria ?? "outro"}
                          onChange={(ev) =>
                            setEdit("categoria", ev.target.value)
                          }
                          className={campoClass}
                          aria-label="Categoria"
                        >
                          {CATEGORIAS.map((categoria) => (
                            <option key={categoria} value={categoria}>
                              {categoria}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Data */}
                      <td className="min-w-0 px-1 py-2 sm:px-2 lg:px-3">
                        <input
                          type="date"
                          value={editForm.data_transacao ?? ""}
                          onChange={(ev) =>
                            setEdit("data_transacao", ev.target.value)
                          }
                          className={campoClass}
                          aria-label="Data da transação"
                        />
                      </td>

                      {/* Tipo */}
                      <td className="min-w-0 px-1 py-2 sm:px-2 lg:px-3">
                        <select
                          value={editForm.tipo ?? "pagamento"}
                          onChange={(ev) => setEdit("tipo", ev.target.value)}
                          className={campoClass}
                          aria-label="Tipo de transação"
                        >
                          <option value="pagamento">Despesa</option>
                          <option value="recebimento">Receita</option>
                        </select>
                      </td>

                      {/* Valor */}
                      <td className="min-w-0 px-1 py-2 sm:px-2 lg:px-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.valor ?? ""}
                          onChange={(ev) =>
                            setEdit(
                              "valor",
                              ev.target.value === ""
                                ? 0
                                : parseFloat(ev.target.value)
                            )
                          }
                          className="h-9 w-full min-w-0 px-1 text-right text-[10px] sm:px-2 sm:text-xs"
                          aria-label="Valor da transação"
                        />
                      </td>

                      {/* Ações da edição */}
                      <td className="px-1 py-2 sm:px-2 lg:px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={onSalvarEdicao}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-green-200 bg-green-50 text-green-700 transition-colors hover:bg-green-100 lg:h-8 lg:w-8"
                            title="Salvar alterações"
                            aria-label="Salvar alterações"
                          >
                            <Check size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={onCancelarEdicao}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-600 transition-colors hover:bg-gray-100 lg:h-8 lg:w-8"
                            title="Cancelar edição"
                            aria-label="Cancelar edição"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      {/* Descrição */}
                      <td className="min-w-0 px-1 py-3 sm:px-2 lg:px-3">
                        <div className="flex min-w-0 items-center gap-1.5 lg:gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm lg:h-8 lg:w-8">
                            {categoriaIcones[e.categoria ?? ""] ?? "📄"}
                          </span>

                          <span
                            className="min-w-0 truncate text-[11px] font-medium text-gray-900 lg:text-sm"
                            title={e.descricao}
                          >
                            {e.descricao}
                          </span>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="min-w-0 px-1 py-3 sm:px-2 lg:px-3">
                        <CategoriaBadge categoria={e.categoria} />
                      </td>

                      {/* Data */}
                      <td className="min-w-0 whitespace-nowrap px-1 py-3 text-[10px] text-gray-500 tabular-nums sm:px-2 sm:text-xs lg:px-3 lg:text-sm">
                        {formatarData(e.data_transacao)}
                      </td>

                      {/* Tipo */}
                      <td className="min-w-0 px-1 py-3 sm:px-2 lg:px-3">
                        <TipoBadge tipo={e.tipo} />
                      </td>

                      {/* Valor */}
                      <td
                        className={`min-w-0 whitespace-nowrap px-1 py-3 text-right text-[10px] font-semibold tabular-nums sm:px-2 sm:text-xs lg:px-3 lg:text-sm ${
                          e.tipo === "recebimento"
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {valorFormatado(e)}
                      </td>

                      {/* Ações sempre visíveis */}
                      <td className="px-1 py-3 sm:px-2 lg:px-3">
                        {excluindo ? (
                          <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] lg:gap-2 lg:text-xs">
                            <button
                              type="button"
                              onClick={() => onDeletar(e.id)}
                              className="font-semibold text-red-600 hover:underline"
                            >
                              Sim
                            </button>

                            <button
                              type="button"
                              onClick={onCancelarDelete}
                              className="text-gray-500 hover:underline"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => iniciarEdicao(e)}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:border-[#021A49]/30 hover:bg-blue-50 hover:text-[#021A49] lg:h-8 lg:w-8"
                              title="Editar"
                              aria-label={`Editar ${e.descricao}`}
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => onConfirmDelete(e.id)}
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 lg:h-8 lg:w-8"
                              title="Excluir"
                              aria-label={`Excluir ${e.descricao}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}

            {/* Nenhuma movimentação */}
            {extratos.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-2 py-10 text-center text-sm text-gray-500"
                >
                  Nenhuma movimentação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
