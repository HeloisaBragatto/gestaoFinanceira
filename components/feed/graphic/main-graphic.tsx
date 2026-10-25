import { Extrato } from "@/lib/finance/types";
import { formatarValor, useExtratos } from "@/lib/use-extract";
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const CORES_CATEGORIA = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#06b6d4",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#84cc16",
];

const MESES_ABREV = [
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

function useLineData(extratos: Extrato[]) {
  return useMemo(() => {
    const porMes = new Map<string, { receitas: number; despesas: number }>();

    for (const e of extratos) {
      const chave = e.data_transacao.slice(0, 7);
      const atual = porMes.get(chave) ?? {
        receitas: 0,
        despesas: 0,
      };

      if (e.tipo === "recebimento") {
        atual.receitas += e.valor;
      } else {
        atual.despesas += e.valor;
      }

      porMes.set(chave, atual);
    }

    return Array.from(porMes.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([chave, valores]) => {
        const mesIndex = Number(chave.slice(5, 7)) - 1;

        return {
          name: MESES_ABREV[mesIndex] ?? chave,
          ...valores,
        };
      });
  }, [extratos]);
}

function usePieData(extratos: Extrato[]) {
  return useMemo(() => {
    const porCategoria = new Map<string, number>();

    for (const e of extratos) {
      if (e.tipo !== "pagamento") continue;

      const categoria = e.categoria ?? "outro";

      porCategoria.set(categoria, (porCategoria.get(categoria) ?? 0) + e.valor);
    }

    return Array.from(porCategoria.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, value], index) => ({
        name,
        value,
        color: CORES_CATEGORIA[index % CORES_CATEGORIA.length],
      }));
  }, [extratos]);
}

export default function MainGraphic() {
  const { extratos, loading } = useExtratos();

  const lineData = useLineData(extratos);
  const pieData = usePieData(extratos);

  const transacoesRecentes = extratos.slice(0, 5);

  return (
    <div className="w-full min-w-0 space-y-6">
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-12 text-center">
          <p className="text-sm text-gray-400">Carregando gráficos...</p>
        </div>
      ) : extratos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-12 text-center">
          <p className="text-sm text-gray-400">
            Nenhuma movimentação encontrada ainda.
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Adicione uma transação ou importe um extrato para ver os gráficos.
          </p>
        </div>
      ) : (
        <>
          {/* Gráficos */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Gráfico de linhas */}
            <section className="w-full min-w-0 bg-white p-3 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-sm sm:text-base mb-1">
                Tendência Mensal
              </h3>

              <p className="text-xs text-slate-400 mb-4 sm:mb-6">
                Receitas vs Despesas
              </p>

              <div className="w-full min-w-0 h-64 sm:h-72 lg:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lineData}
                    margin={{
                      top: 8,
                      right: 8,
                      left: -12,
                      bottom: 4,
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
                        fontSize: 11,
                        fill: "#94a3b8",
                      }}
                      tickMargin={8}
                      padding={{ left: 4, right: 4 }}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 10,
                        fill: "#94a3b8",
                      }}
                      width={45}
                      tickFormatter={(value) => {
                        const numero = Number(value);

                        if (Math.abs(numero) >= 1000) {
                          return `${(numero / 1000).toLocaleString("pt-BR", {
                            maximumFractionDigits: 1,
                          })} mil`;
                        }

                        return numero.toLocaleString("pt-BR");
                      }}
                    />

                    <Tooltip
                      formatter={(value) => formatarValor(Number(value ?? 0))}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                        maxWidth: "220px",
                      }}
                    />

                    <Legend
                      iconType="circle"
                      verticalAlign="bottom"
                      wrapperStyle={{
                        fontSize: "12px",
                        paddingTop: "12px",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="receitas"
                      name="Receitas"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="despesas"
                      name="Despesas"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Gráfico de pizza */}
            <section className="w-full min-w-0 bg-white p-3 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-sm sm:text-base mb-1">
                Despesas por Categoria
              </h3>

              <p className="text-xs text-slate-400 mb-4 sm:mb-6">
                Distribuição das despesas
              </p>

              {pieData.length === 0 ? (
                <div className="h-64 sm:h-72 lg:h-80 w-full flex items-center justify-center text-center">
                  <p className="text-sm text-slate-400">
                    Nenhuma despesa registrada ainda.
                  </p>
                </div>
              ) : (
                <div className="w-full min-w-0 h-64 sm:h-72 lg:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart
                      margin={{
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                      }}
                    >
                      <Pie
                        data={pieData}
                        innerRadius="45%"
                        outerRadius="65%"
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                            stroke="none"
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(value) => formatarValor(Number(value ?? 0))}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                          maxWidth: "220px",
                        }}
                      />

                      <Legend
                        layout="horizontal"
                        align="center"
                        verticalAlign="bottom"
                        wrapperStyle={{
                          fontSize: "11px",
                          paddingTop: "8px",
                          lineHeight: "22px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          {/* Tabela de transações */}
          <section className="w-full min-w-0 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-50">
              <h3 className="font-bold text-sm sm:text-base">
                Transações Recentes
              </h3>

              <p className="text-xs text-slate-400">Últimas movimentações</p>
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[520px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-4 sm:px-6 py-4 font-medium">Descrição</th>

                    <th className="px-4 sm:px-6 py-4 font-medium">Categoria</th>

                    <th className="px-4 sm:px-6 py-4 font-medium">Data</th>

                    <th className="px-4 sm:px-6 py-4 font-medium text-right">
                      Valor
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {transacoesRecentes.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/50 transition-colors text-sm"
                    >
                      <td className="px-4 sm:px-6 py-4 font-medium max-w-[200px] truncate">
                        {t.descricao}
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="bg-slate-100 px-3 py-1 rounded-full text-[11px] text-slate-600">
                          {t.categoria ?? "outro"}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-slate-500 whitespace-nowrap">
                        {t.data_transacao.split("-").reverse().join("/")}
                      </td>

                      <td
                        className={`px-4 sm:px-6 py-4 text-right font-bold whitespace-nowrap ${
                          t.tipo === "recebimento"
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {t.tipo === "recebimento" ? "+ " : "- "}
                        {formatarValor(t.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
