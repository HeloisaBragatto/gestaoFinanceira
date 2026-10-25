"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { evolucaoMensal, totaisPorCategoria } from "@/lib/finance/calculos";

import type { Extrato } from "@/lib/finance/types";

import { CORES_CATEGORIA } from "@/lib/graficos";
import { formatarValor, useExtratos } from "@/lib/use-extract";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ── Meses ─────────────────────────────────────────────────────

const meses = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

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

// ── Formatação de data ────────────────────────────────────────

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");

  if (!ano || !mes || !dia) {
    return data;
  }

  return `${dia}/${mes}/${ano}`;
}

// ── Badge de tipo ─────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: "pagamento" | "recebimento" }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${
        tipo === "recebimento"
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-600"
      }`}
    >
      {tipo === "recebimento" ? "Receita" : "Despesa"}
    </span>
  );
}

// ── Dados do gráfico de linhas ────────────────────────────────

function useLineData(extratos: Extrato[]) {
  return useMemo(
    () =>
      evolucaoMensal(extratos)
        .slice(-12)
        .map((p) => {
          const [ano, mes] = p.mes.split("-");

          return {
            name: `${meses[Number(mes) - 1] ?? mes}/${ano.slice(2)}`,
            receitas: p.receitas,
            despesas: p.despesas,
          };
        }),
    [extratos]
  );
}

// ── Dados do gráfico de pizza ─────────────────────────────────

function usePieData(extratos: Extrato[]) {
  return useMemo(
    () =>
      totaisPorCategoria(extratos, "pagamento").map((c, index) => ({
        name: c.categoria,
        value: c.total,
        percentual: c.percentual,
        quantidade: c.quantidade,
        color: CORES_CATEGORIA[index % CORES_CATEGORIA.length],
      })),
    [extratos]
  );
}

// ── Componente principal ──────────────────────────────────────

export default function DashboardGraphic() {
  const { extratos } = useExtratos();

  const lineData = useLineData(extratos);
  const pieData = usePieData(extratos);

  const [transacaoAbertaId, setTransacaoAbertaId] = useState<string | null>(
    null
  );

  const transacoesRecentes = extratos.slice(0, 5);

  return (
    <div className="flex w-full max-w-full min-w-0 flex-col gap-4 overflow-x-hidden sm:gap-6">
      {/* ======================================================
          GRÁFICOS
      ====================================================== */}

      <div className="grid w-full max-w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2 lg:gap-6">
        {/* ── Evolução mensal ── */}
        <section className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-5 lg:p-6">
          <h3 className="break-words font-bold text-gray-900">
            Tendência Mensal
          </h3>

          <p className="mb-4 mt-1 text-xs text-slate-400 sm:mb-5">
            Receitas vs. Despesas
          </p>

          {/* Área do gráfico: nunca excede a largura do card */}
          <div className="relative h-[220px] w-full max-w-full min-w-0 overflow-hidden sm:h-[280px] lg:h-[300px]">
            <ResponsiveContainer width="100%" height="100%" debounce={100}>
              <LineChart
                data={lineData}
                margin={{
                  top: 8,
                  right: 8,
                  bottom: 4,
                  left: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 9,
                    fill: "#94a3b8",
                  }}
                  interval="preserveStartEnd"
                  minTickGap={12}
                  tickMargin={6}
                  padding={{
                    left: 2,
                    right: 2,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 9,
                    fill: "#94a3b8",
                  }}
                  width={39}
                  tickMargin={4}
                  tickFormatter={(value) =>
                    Number(value).toLocaleString("pt-BR", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    })
                  }
                />

                <Tooltip
                  formatter={(value) => formatarValor(Number(value ?? 0))}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    maxWidth: "85vw",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="receitas"
                  name="Receitas"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />

                <Line
                  type="monotone"
                  dataKey="despesas"
                  name="Despesas"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda fora do gráfico para não forçar sua largura */}
          <div className="mt-3 flex w-full min-w-0 flex-wrap justify-center gap-x-4 gap-y-2">
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
              <span>Receitas</span>
            </div>

            <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
              <span>Despesas</span>
            </div>
          </div>
        </section>

        {/* ── Despesas por categoria ── */}
        <section className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-5 lg:p-6">
          <h3 className="break-words font-bold text-gray-900">
            Despesas por Categoria
          </h3>

          <p className="mb-4 mt-1 text-xs text-slate-400 sm:mb-5">
            Distribuição das despesas
          </p>

          {pieData.length === 0 ? (
            <div className="flex h-[220px] w-full max-w-full min-w-0 items-center justify-center sm:h-[280px] lg:h-[300px]">
              <p className="px-2 text-center text-sm text-slate-400">
                Nenhuma despesa registrada ainda.
              </p>
            </div>
          ) : (
            <>
              {/* Gráfico de pizza */}
              <div className="relative h-[210px] w-full max-w-full min-w-0 overflow-hidden sm:h-[260px] lg:h-[270px]">
                <ResponsiveContainer width="100%" height="100%" debounce={100}>
                  <PieChart
                    margin={{
                      top: 4,
                      right: 4,
                      bottom: 4,
                      left: 4,
                    }}
                  >
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius="38%"
                      outerRadius="62%"
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, _nome, item) => {
                        const percentual =
                          (item?.payload as { percentual?: number } | undefined)
                            ?.percentual ?? 0;

                        return `${formatarValor(
                          Number(value ?? 0)
                        )} (${String(percentual).replace(".", ",")}%)`;
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                        maxWidth: "85vw",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda adaptável: as categorias quebram de linha */}
              <div className="mt-3 flex w-full max-w-full min-w-0 flex-wrap justify-center gap-x-3 gap-y-2">
                {pieData.map((item) => (
                  <div
                    key={item.name}
                    className="flex min-w-0 max-w-full items-start gap-1.5 text-xs text-slate-500"
                  >
                    <span
                      className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: item.color,
                      }}
                    />

                    <span className="break-words">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ======================================================
          CATEGORIAS COM MAIORES GASTOS
      ====================================================== */}

      {pieData.length > 0 && (
        <section className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="break-words font-bold text-gray-900">
            Categorias com maiores gastos
          </h3>

          <p className="mb-4 mt-1 text-xs text-slate-400">
            Percentual sobre o total de despesas filtradas
          </p>

          <ul className="flex min-w-0 flex-col gap-4">
            {pieData.slice(0, 5).map((c) => (
              <li key={c.name} className="w-full min-w-0">
                {/* Nome e valores */}
                <div className="flex min-w-0 items-start justify-between gap-2 text-sm sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium text-gray-900">
                      {c.name}
                    </p>

                    <p className="mt-0.5 break-words text-xs text-slate-400">
                      {c.quantidade}{" "}
                      {c.quantidade === 1 ? "movimentação" : "movimentações"}
                    </p>
                  </div>

                  <div className="max-w-[45%] shrink-0 text-right">
                    <p className="break-words text-xs font-medium text-gray-700 sm:text-sm">
                      {formatarValor(c.value)}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {String(c.percentual).replace(".", ",")}%
                    </p>
                  </div>
                </div>

                {/* Barra de percentual */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, Number(c.percentual) || 0)
                      )}%`,
                      backgroundColor: c.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ======================================================
          CELULAR: TRANSAÇÕES RECENTES EM CARDS EXPANSÍVEIS
      ====================================================== */}

      <section className="block w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm md:hidden">
        <div className="border-b border-slate-50 p-4 sm:p-5">
          <h3 className="font-bold text-gray-900">Transações Recentes</h3>

          <p className="mt-1 text-xs text-slate-400">Últimas movimentações</p>
        </div>

        <div className="w-full min-w-0 space-y-2 p-3">
          {transacoesRecentes.map((t) => {
            const aberta = transacaoAbertaId === t.id;

            return (
              <div
                key={t.id}
                className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-100"
              >
                {/* Linha compacta */}
                <button
                  type="button"
                  aria-expanded={aberta}
                  aria-label={`Ver detalhes de ${t.descricao}`}
                  onClick={() =>
                    setTransacaoAbertaId((atual) =>
                      atual === t.id ? null : t.id
                    )
                  }
                  className="flex w-full min-w-0 items-center gap-2 px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#021A49]/30 sm:gap-3"
                >
                  {/* Ícone */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm">
                    {categoriaIcones[t.categoria ?? ""] ?? "📄"}
                  </span>

                  {/* Data */}
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                    {formatarData(t.data_transacao)}
                  </span>

                  {/* Valor */}
                  <span
                    className={`max-w-[45%] shrink-0 break-words text-right text-xs font-semibold tabular-nums sm:text-sm ${
                      t.tipo === "recebimento"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {t.tipo === "recebimento" ? "+ " : "- "}
                    {formatarValor(t.valor)}
                  </span>

                  {/* Seta */}
                  <span className="shrink-0 text-slate-400">
                    {aberta ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </span>
                </button>

                {/* Detalhes expandidos */}
                {aberta && (
                  <div className="w-full min-w-0 overflow-hidden border-t border-slate-100 bg-slate-50/70 p-3 sm:p-4">
                    <p className="mb-4 break-words text-sm font-semibold text-gray-900">
                      {t.descricao}
                    </p>

                    <div className="grid w-full min-w-0 grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-4">
                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-slate-400">Categoria</p>

                        <span className="inline-flex max-w-full rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          <span className="break-words">
                            {t.categoria ?? "outro"}
                          </span>
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-slate-400">Tipo</p>

                        <TipoBadge tipo={t.tipo} />
                      </div>

                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-slate-400">Data</p>

                        <p className="text-sm text-gray-900">
                          {formatarData(t.data_transacao)}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="mb-1 text-xs text-slate-400">Valor</p>

                        <p
                          className={`break-words text-sm font-semibold ${
                            t.tipo === "recebimento"
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {t.tipo === "recebimento" ? "+ " : "- "}
                          {formatarValor(t.valor)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {transacoesRecentes.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-slate-400">
              Nenhuma transação registrada ainda.
            </p>
          )}
        </div>
      </section>

      {/* ======================================================
          TABLET E COMPUTADOR: TABELA A PARTIR DE MD
      ====================================================== */}

      <section className="hidden w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm md:block">
        <div className="border-b border-slate-50 p-4 sm:p-5">
          <h3 className="font-bold text-gray-900">Transações Recentes</h3>

          <p className="mt-1 text-xs text-slate-400">Últimas movimentações</p>
        </div>

        <table className="w-full max-w-full table-fixed border-collapse text-xs lg:text-sm">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-400 lg:text-xs">
              <th className="w-[34%] px-2 py-3 text-left font-medium sm:px-3 lg:px-5 lg:py-4">
                Descrição
              </th>

              <th className="w-[23%] px-2 py-3 text-left font-medium sm:px-3 lg:px-5 lg:py-4">
                Categoria
              </th>

              <th className="w-[19%] px-2 py-3 text-left font-medium sm:px-3 lg:px-5 lg:py-4">
                Data
              </th>

              <th className="w-[24%] px-2 py-3 text-right font-medium sm:px-3 lg:px-5 lg:py-4">
                Valor
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {transacoesRecentes.map((t) => (
              <tr
                key={t.id}
                className="text-xs transition-colors hover:bg-slate-50/50 lg:text-sm"
              >
                {/* Descrição */}
                <td
                  className="min-w-0 px-2 py-3 font-medium text-gray-900 sm:px-3 lg:px-5 lg:py-4"
                  title={t.descricao}
                >
                  <span className="block truncate">{t.descricao}</span>
                </td>

                {/* Categoria */}
                <td className="min-w-0 px-2 py-3 sm:px-3 lg:px-5 lg:py-4">
                  <span className="inline-block max-w-full rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600 lg:px-3 lg:text-xs">
                    <span className="block truncate">
                      {t.categoria ?? "outro"}
                    </span>
                  </span>
                </td>

                {/* Data */}
                <td className="min-w-0 whitespace-nowrap px-2 py-3 text-slate-500 sm:px-3 lg:px-5 lg:py-4">
                  {formatarData(t.data_transacao)}
                </td>

                {/* Valor */}
                <td
                  className={`min-w-0 whitespace-nowrap px-2 py-3 text-right font-bold tabular-nums sm:px-3 lg:px-5 lg:py-4 ${
                    t.tipo === "recebimento" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {t.tipo === "recebimento" ? "+ " : "- "}
                  {formatarValor(t.valor)}
                </td>
              </tr>
            ))}

            {transacoesRecentes.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-10 text-center text-sm text-slate-400"
                >
                  Nenhuma transação registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
