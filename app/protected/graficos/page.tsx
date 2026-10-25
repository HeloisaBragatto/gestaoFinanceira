"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChevronDown, ChevronRight } from "lucide-react";

import { MetricCard } from "@/components/card/metric-card";
import { IndicadorComparacao } from "@/components/card/comparacao-indicador";

import {
  formatarDataBr,
  formatarMoeda,
  formatarPercentual,
} from "@/lib/finance/formato";

import {
  CORES_CATEGORIA,
  COR_DESPESA,
  COR_RECEITA,
  COR_SALDO,
} from "@/lib/graficos";

import {
  ehSequenciaContinua,
  intervaloMeses,
  mesAtual,
  mesesComparaveisAnteriores,
  normalizarMeses,
  primeiroDiaDoMes,
  rotuloMes,
  rotuloMesCurto,
  somarMeses,
  ultimoDiaDoMes,
} from "@/lib/finance/meses";

import { useAnosDisponiveis, useMetricasMensais } from "@/lib/use-metricas";

import { calcularMetricas } from "@/lib/finance/metricas";
import { CATEGORIAS } from "@/lib/finance/types";

import {
  descreverSelecao,
  SeletorMeses,
} from "@/components/feed/graphic/seletor-meses";

// Formatação
const moeda = (v: unknown) => formatarMoeda(Number(v ?? 0));

const campo =
  "w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition-all focus:border-[#021A49] focus:ring-1 focus:ring-[#021A49]/20";

const cartaoGrafico =
  "w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-5 lg:p-6";

const eixo = {
  fontSize: 10,
  fill: "#94a3b8",
};

function formatarEixo(valor: number) {
  return Number(valor).toLocaleString("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

function LegendaGrafico({ itens }: { itens: { nome: string; cor: string }[] }) {
  return (
    <div className="mt-3 flex w-full min-w-0 max-w-full flex-wrap justify-center gap-x-3 gap-y-2">
      {itens.map((item) => (
        <div
          key={item.nome}
          className="flex min-w-0 max-w-full items-start gap-1.5 text-xs text-slate-500"
        >
          <span
            className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: item.cor }}
          />
          <span className="break-words">{item.nome}</span>
        </div>
      ))}
    </div>
  );
}

// Página de gráficos

export default function GraficosPage() {
  const [hoje, setHoje] = useState<Date | null>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [categoria, setCategoria] = useState("todas");
  const [mesComparacaoAberto, setMesComparacaoAberto] = useState<string | null>(
    null
  );

  useEffect(() => {
    const agora = new Date();

    setHoje(agora);

    const atual = mesAtual(agora);

    setSelecionados(intervaloMeses(somarMeses(atual, -2), atual));
  }, []);

  const anoAtual = (hoje ?? new Date()).getFullYear();

  const anos = useAnosDisponiveis(anoAtual);

  const padrao = hoje
    ? intervaloMeses(somarMeses(mesAtual(hoje), -2), mesAtual(hoje))
    : [];

  const meses = useMemo(() => normalizarMeses(selecionados), [selecionados]);

  const { extratos, anteriores, loading, erro } = useMetricasMensais(
    meses,
    categoria,
    hoje !== null
  );

  const m = useMemo(
    () => calcularMetricas(extratos, meses, anteriores),
    [extratos, meses, anteriores]
  );

  const categorias = useMemo(() => {
    const conjunto = new Set<string>(CATEGORIAS);

    for (const extrato of extratos) {
      if (extrato.categoria) {
        conjunto.add(extrato.categoria);
      }
    }

    return Array.from(conjunto);
  }, [extratos]);

  const mesesAnt = mesesComparaveisAnteriores(meses);

  const periodoAnterior = mesesAnt
    ? {
        inicio: primeiroDiaDoMes(mesesAnt[0]),
        fim: ultimoDiaDoMes(mesesAnt[mesesAnt.length - 1]),
      }
    : null;

  const semComparacao =
    meses.length === 0
      ? null
      : !ehSequenciaContinua(meses)
        ? "Meses não consecutivos: sem comparação com período anterior."
        : loading
          ? "Calculando comparação…"
          : null;

  const dadosSerie = m.serie.map((p) => ({
    name: rotuloMesCurto(p.mes),
    receitas: p.receitas,
    despesas: p.despesas,
    saldo: p.saldo,
  }));

  const dadosPizza = m.despesasPorCategoria.map((c, i) => ({
    name: c.categoria,
    value: c.total,
    percentual: c.percentual,
    quantidade: c.quantidade,
    color: CORES_CATEGORIA[i % CORES_CATEGORIA.length],
  }));

  const semMovimentos =
    !loading && !erro && meses.length > 0 && m.resumo.quantidade === 0;

  return (
    <section className="mt-5 w-full min-w-0 max-w-full overflow-x-clip md:mt-16 lg:mt-5">
      <div className="row w-full min-w-0 max-w-full">
        <div className="container w-full min-w-0 max-w-full px-3 sm:px-4 lg:px-6">
          <div className="mt-8 flex w-full min-w-0 max-w-full flex-col gap-5 overflow-x-clip md:mt-0">
            {/* Cabeçalho */}
            <div className="w-full min-w-0">
              <h1 className="break-words text-2xl font-bold text-gray-900">
                Gráficos
              </h1>

              <p className="mt-0.5 break-words text-sm text-gray-500">
                Métricas e gráficos das movimentações.
              </p>
            </div>

            {/* Seletor de meses */}
            {hoje && (
              <div className="w-full min-w-0">
                <SeletorMeses
                  selecionados={selecionados}
                  onChange={setSelecionados}
                  anos={anos}
                  hoje={hoje}
                  padrao={padrao}
                />
              </div>
            )}

            {/* Filtro de categoria */}
            <div className="flex w-full min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="flex w-full min-w-0 flex-col gap-1 sm:w-auto sm:min-w-[160px]">
                <label className="text-xs font-medium text-gray-500">
                  Categoria
                </label>

                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className={campo}
                >
                  <option value="todas">Todas</option>

                  {categorias.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <p className="w-full min-w-0 text-balance pb-0 text-xs leading-relaxed text-gray-400 sm:flex-1 sm:pb-2">
                O sistema registra apenas movimentações já realizadas; contas
                futuras ou pendentes não entram nestes cálculos.
              </p>
            </div>

            {/* Estados de carregamento e erro */}
            {meses.length === 0 ? (
              <div className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-10 text-center shadow-sm sm:px-5 sm:py-12">
                <p className="text-sm text-gray-500">Nenhum mês selecionado.</p>

                <p className="mt-1 break-words text-xs text-gray-400">
                  Escolha ao menos um mês ou utilize um atalho para ver as
                  métricas.
                </p>
              </div>
            ) : erro ? (
              <div
                role="alert"
                className="w-full min-w-0 break-words rounded-xl border border-red-100 bg-red-50 px-4 py-8 text-center sm:px-5"
              >
                <p className="text-sm text-red-600">{erro}</p>
              </div>
            ) : loading ? (
              <div className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-10 text-center shadow-sm sm:px-5 sm:py-12">
                <p className="text-sm text-gray-400">Calculando métricas...</p>
              </div>
            ) : (
              <>
                {/* Período selecionado */}
                <p className="w-full min-w-0 break-words text-sm leading-relaxed text-gray-600">
                  Período:{" "}
                  <span className="font-medium text-gray-900">
                    {descreverSelecao(meses)}
                  </span>
                  {categoria !== "todas" && (
                    <>
                      {" "}
                      · categoria{" "}
                      <span className="font-medium text-gray-900">
                        {categoria}
                      </span>
                    </>
                  )}
                </p>

                {/* 1. Resumo */}

                <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                  <div className="min-w-0">
                    <MetricCard
                      titulo="Receitas no período"
                      valor={formatarMoeda(m.resumo.totalRecebimentos)}
                      detalhe={semComparacao}
                      rodape={
                        m.variacaoReceitas && periodoAnterior ? (
                          <IndicadorComparacao
                            comparacao={m.variacaoReceitas}
                            periodo={periodoAnterior}
                          />
                        ) : null
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <MetricCard
                      titulo="Despesas no período"
                      valor={formatarMoeda(m.resumo.totalPagamentos)}
                      detalhe={semComparacao}
                      rodape={
                        m.variacaoDespesas && periodoAnterior ? (
                          <IndicadorComparacao
                            comparacao={m.variacaoDespesas}
                            periodo={periodoAnterior}
                          />
                        ) : null
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <MetricCard
                      titulo="Saldo do período"
                      valor={formatarMoeda(m.resumo.saldo)}
                      destaque={m.resumo.saldo < 0 ? "negativo" : "positivo"}
                      detalhe="Receitas menos despesas"
                      rodape={
                        m.variacaoSaldo && periodoAnterior ? (
                          <IndicadorComparacao
                            comparacao={m.variacaoSaldo}
                            periodo={periodoAnterior}
                          />
                        ) : null
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <MetricCard
                      titulo="Movimentações"
                      valor={m.resumo.quantidade.toLocaleString("pt-BR")}
                      detalhe={`${m.resumo.quantidadeRecebimentos} entradas · ${m.resumo.quantidadePagamentos} saídas`}
                    />
                  </div>
                </div>

                {/* 2. Médias e proporção */}

                <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                  <div className="min-w-0">
                    <MetricCard
                      titulo="Média mensal de receitas"
                      valor={formatarMoeda(m.mediaMensalReceitas)}
                      detalhe={`Sobre ${m.quantidadeMeses} ${
                        m.quantidadeMeses === 1 ? "mês" : "meses"
                      } (inclui meses sem movimentação)`}
                    />
                  </div>

                  <div className="min-w-0">
                    <MetricCard
                      titulo="Média mensal de despesas"
                      valor={formatarMoeda(m.mediaMensalDespesas)}
                      detalhe={`Sobre ${m.quantidadeMeses} ${
                        m.quantidadeMeses === 1 ? "mês" : "meses"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <MetricCard
                      titulo="Saldo médio mensal"
                      valor={formatarMoeda(m.mediaMensalSaldo)}
                      destaque={
                        m.mediaMensalSaldo < 0 ? "negativo" : "positivo"
                      }
                      detalhe={
                        m.mesesNegativos > 0
                          ? `${m.mesesNegativos} de ${m.quantidadeMeses} ${
                              m.quantidadeMeses === 1 ? "mês" : "meses"
                            } com saldo negativo`
                          : "Nenhum mês com saldo negativo"
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <MetricCard
                      titulo="Receitas comprometidas com despesas"
                      valor={
                        m.percentualComprometido === null
                          ? "—"
                          : formatarPercentual(m.percentualComprometido)
                      }
                      destaque={
                        m.percentualComprometido !== null &&
                        m.percentualComprometido > 100
                          ? "negativo"
                          : "neutro"
                      }
                      detalhe={
                        m.percentualComprometido === null
                          ? "Sem receitas no período: cálculo indisponível"
                          : m.percentualComprometido > 100
                            ? "Despesas superiores às receitas"
                            : "Despesas ÷ receitas do período"
                      }
                    />
                  </div>
                </div>

                {/* 3. Destaques */}

                <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                  <div className="min-w-0">
                    <MetricCard
                      titulo="Mês com maior receita"
                      valor={
                        m.mesMaiorReceita
                          ? rotuloMes(m.mesMaiorReceita.mes)
                          : "—"
                      }
                      detalhe={
                        m.mesMaiorReceita
                          ? formatarMoeda(m.mesMaiorReceita.valor)
                          : "Sem receitas no período"
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <MetricCard
                      titulo="Mês com maior despesa"
                      valor={
                        m.mesMaiorDespesa
                          ? rotuloMes(m.mesMaiorDespesa.mes)
                          : "—"
                      }
                      detalhe={
                        m.mesMaiorDespesa
                          ? formatarMoeda(m.mesMaiorDespesa.valor)
                          : "Sem despesas no período"
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <MetricCard
                      titulo="Maior categoria de despesa"
                      valor={m.categoriaMaiorDespesa?.categoria ?? "—"}
                      detalhe={
                        m.categoriaMaiorDespesa
                          ? `${formatarMoeda(
                              m.categoriaMaiorDespesa.total
                            )} · ${formatarPercentual(
                              m.categoriaMaiorDespesa.percentual
                            )} das despesas`
                          : "Sem despesas no período"
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <MetricCard
                      titulo="Maior despesa individual"
                      valor={
                        m.maiorDespesa
                          ? formatarMoeda(m.maiorDespesa.valor)
                          : "—"
                      }
                      detalhe={
                        m.maiorDespesa
                          ? `${m.maiorDespesa.descricao} · ${formatarDataBr(
                              m.maiorDespesa.data
                            )}`
                          : "Sem despesas no período"
                      }
                    />
                  </div>
                </div>

                {/* Sem movimentações */}
                {semMovimentos ? (
                  <div className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-10 text-center shadow-sm sm:px-5 sm:py-12">
                    <p className="text-sm text-gray-500">
                      Nenhuma movimentação registrada nos meses selecionados.
                    </p>

                    <p className="mt-1 break-words text-xs text-gray-400">
                      Tente outros meses, outra categoria ou importe um extrato.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Gráficos */}

                    <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                      {/* Evolução mensal */}
                      <section className={cartaoGrafico}>
                        <h3 className="break-words font-bold text-gray-900">
                          Evolução mensal
                        </h3>

                        <p className="mb-4 mt-1 text-xs text-slate-400 sm:mb-5">
                          Receitas e despesas por mês
                        </p>

                        <div className="relative h-[230px] w-full min-w-0 max-w-full overflow-hidden sm:h-[280px] lg:h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={dadosSerie}
                              margin={{
                                top: 8,
                                right: 4,
                                bottom: 4,
                                left: -8,
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
                                tick={eixo}
                                minTickGap={10}
                                tickMargin={6}
                              />

                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={eixo}
                                width={44}
                                tickFormatter={formatarEixo}
                              />

                              <Tooltip
                                formatter={moeda}
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
                                stroke={COR_RECEITA}
                                strokeWidth={2}
                                dot={{ r: 2 }}
                                activeDot={{ r: 4 }}
                              />

                              <Line
                                type="monotone"
                                dataKey="despesas"
                                name="Despesas"
                                stroke={COR_DESPESA}
                                strokeWidth={2}
                                dot={{ r: 2 }}
                                activeDot={{ r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <LegendaGrafico
                          itens={[
                            { nome: "Receitas", cor: COR_RECEITA },
                            { nome: "Despesas", cor: COR_DESPESA },
                          ]}
                        />
                      </section>

                      {/* Receitas x despesas */}
                      <section className={cartaoGrafico}>
                        <h3 className="break-words font-bold text-gray-900">
                          Receitas × despesas
                        </h3>

                        <p className="mb-4 mt-1 text-xs text-slate-400 sm:mb-5">
                          Comparação entre os meses selecionados
                        </p>

                        <div className="relative h-[230px] w-full min-w-0 max-w-full overflow-hidden sm:h-[280px] lg:h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={dadosSerie}
                              margin={{
                                top: 8,
                                right: 4,
                                bottom: 4,
                                left: -8,
                              }}
                              barGap={2}
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
                                tick={eixo}
                                minTickGap={10}
                                tickMargin={6}
                              />

                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={eixo}
                                width={44}
                                tickFormatter={formatarEixo}
                              />

                              <Tooltip
                                formatter={moeda}
                                contentStyle={{
                                  borderRadius: 12,
                                  border: "1px solid #e2e8f0",
                                  fontSize: 12,
                                  maxWidth: "85vw",
                                }}
                              />

                              <Bar
                                dataKey="receitas"
                                name="Receitas"
                                fill={COR_RECEITA}
                                radius={[4, 4, 0, 0]}
                              />

                              <Bar
                                dataKey="despesas"
                                name="Despesas"
                                fill={COR_DESPESA}
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <LegendaGrafico
                          itens={[
                            { nome: "Receitas", cor: COR_RECEITA },
                            { nome: "Despesas", cor: COR_DESPESA },
                          ]}
                        />
                      </section>

                      {/* Saldo mensal */}
                      <section className={cartaoGrafico}>
                        <h3 className="break-words font-bold text-gray-900">
                          Saldo mensal
                        </h3>

                        <p className="mb-4 mt-1 text-xs text-slate-400 sm:mb-5">
                          Receitas menos despesas em cada mês
                        </p>

                        <div className="relative h-[230px] w-full min-w-0 max-w-full overflow-hidden sm:h-[280px] lg:h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={dadosSerie}
                              margin={{
                                top: 8,
                                right: 4,
                                bottom: 4,
                                left: -8,
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
                                tick={eixo}
                                minTickGap={10}
                                tickMargin={6}
                              />

                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={eixo}
                                width={44}
                                tickFormatter={formatarEixo}
                              />

                              <Tooltip
                                formatter={moeda}
                                contentStyle={{
                                  borderRadius: 12,
                                  border: "1px solid #e2e8f0",
                                  fontSize: 12,
                                  maxWidth: "85vw",
                                }}
                              />

                              <ReferenceLine y={0} stroke="#94a3b8" />

                              <Bar
                                dataKey="saldo"
                                name="Saldo"
                                radius={[4, 4, 0, 0]}
                              >
                                {dadosSerie.map((p) => (
                                  <Cell
                                    key={p.name}
                                    fill={p.saldo < 0 ? COR_DESPESA : COR_SALDO}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <LegendaGrafico
                          itens={[{ nome: "Saldo", cor: COR_SALDO }]}
                        />
                      </section>

                      {/* Despesas por categoria */}
                      <section className={cartaoGrafico}>
                        <h3 className="break-words font-bold text-gray-900">
                          Despesas por categoria
                        </h3>

                        <p className="mb-4 mt-1 text-xs text-slate-400 sm:mb-5">
                          Distribuição das despesas do período
                        </p>

                        {dadosPizza.length === 0 ? (
                          <div className="flex h-[230px] w-full min-w-0 items-center justify-center sm:h-[280px] lg:h-[300px]">
                            <p className="px-2 text-center text-sm text-slate-400">
                              Nenhuma despesa nos meses selecionados.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="relative h-[210px] w-full min-w-0 max-w-full overflow-hidden sm:h-[250px] lg:h-[270px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart
                                  margin={{
                                    top: 4,
                                    right: 4,
                                    bottom: 4,
                                    left: 4,
                                  }}
                                >
                                  <Pie
                                    data={dadosPizza}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="38%"
                                    outerRadius="62%"
                                    paddingAngle={2}
                                    dataKey="value"
                                    nameKey="name"
                                  >
                                    {dadosPizza.map((item) => (
                                      <Cell key={item.name} fill={item.color} />
                                    ))}
                                  </Pie>

                                  <Tooltip
                                    formatter={(value, _nome, item) =>
                                      `${moeda(value)} (${formatarPercentual(
                                        (
                                          item?.payload as {
                                            percentual?: number;
                                          }
                                        )?.percentual ?? 0
                                      )})`
                                    }
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

                            <LegendaGrafico
                              itens={dadosPizza.map((item) => ({
                                nome: item.name,
                                cor: item.color,
                              }))}
                            />
                          </>
                        )}
                      </section>
                    </div>

                    {/* Comparação mensal - Mobile */}

                    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm md:hidden">
                      <div className="border-b border-slate-50 p-4">
                        <h3 className="break-words font-bold text-gray-900">
                          Comparação entre os meses
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Meses sem movimentação aparecem zerados
                        </p>
                      </div>

                      <div className="w-full min-w-0 space-y-2 p-3">
                        {m.serie.map((p) => {
                          const aberta = mesComparacaoAberto === p.mes;

                          return (
                            <div
                              key={p.mes}
                              className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-100"
                            >
                              <button
                                type="button"
                                aria-expanded={aberta}
                                onClick={() =>
                                  setMesComparacaoAberto((atual) =>
                                    atual === p.mes ? null : p.mes
                                  )
                                }
                                className="flex w-full min-w-0 items-center gap-2 px-3 py-3 text-left hover:bg-slate-50"
                              >
                                <span className="min-w-0 flex-1 break-words text-sm font-medium text-gray-900">
                                  {rotuloMes(p.mes)}
                                </span>

                                <span
                                  className={`max-w-[55%] shrink-0 break-words text-right text-xs font-semibold ${
                                    p.saldo < 0
                                      ? "text-red-500"
                                      : "text-[#021A49]"
                                  }`}
                                >
                                  {formatarMoeda(p.saldo)}
                                </span>

                                <span className="shrink-0 text-slate-400">
                                  {aberta ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                </span>
                              </button>

                              {aberta && (
                                <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-4 border-t border-slate-100 bg-slate-50/70 p-3">
                                  <div className="min-w-0">
                                    <p className="mb-1 text-xs text-slate-400">
                                      Receitas
                                    </p>

                                    <p className="break-words text-sm font-medium text-green-600">
                                      {formatarMoeda(p.receitas)}
                                    </p>
                                  </div>

                                  <div className="min-w-0">
                                    <p className="mb-1 text-xs text-slate-400">
                                      Despesas
                                    </p>

                                    <p className="break-words text-sm font-medium text-red-500">
                                      {formatarMoeda(p.despesas)}
                                    </p>
                                  </div>

                                  <div className="min-w-0">
                                    <p className="mb-1 text-xs text-slate-400">
                                      Saldo
                                    </p>

                                    <p
                                      className={`break-words text-sm font-semibold ${
                                        p.saldo < 0
                                          ? "text-red-500"
                                          : "text-[#021A49]"
                                      }`}
                                    >
                                      {formatarMoeda(p.saldo)}
                                    </p>
                                  </div>

                                  <div className="min-w-0">
                                    <p className="mb-1 text-xs text-slate-400">
                                      Comprometido
                                    </p>

                                    <p className="break-words text-sm text-slate-600">
                                      {p.comprometido === null
                                        ? "—"
                                        : formatarPercentual(p.comprometido)}
                                    </p>
                                  </div>

                                  <div className="col-span-2 min-w-0">
                                    <p className="mb-1 text-xs text-slate-400">
                                      Movimentações
                                    </p>

                                    <p className="text-sm text-slate-600">
                                      {p.quantidade}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {m.serie.length > 1 && (
                          <div className="mt-3 rounded-lg bg-slate-50 p-3">
                            <p className="mb-3 text-sm font-semibold text-gray-900">
                              Total do período
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="min-w-0">
                                <p className="text-xs text-slate-400">
                                  Receitas
                                </p>
                                <p className="break-words text-sm font-medium text-green-600">
                                  {formatarMoeda(m.resumo.totalRecebimentos)}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs text-slate-400">
                                  Despesas
                                </p>
                                <p className="break-words text-sm font-medium text-red-500">
                                  {formatarMoeda(m.resumo.totalPagamentos)}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs text-slate-400">Saldo</p>
                                <p className="break-words text-sm font-semibold text-gray-900">
                                  {formatarMoeda(m.resumo.saldo)}
                                </p>
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs text-slate-400">
                                  Comprometido
                                </p>
                                <p className="break-words text-sm text-slate-600">
                                  {m.percentualComprometido === null
                                    ? "—"
                                    : formatarPercentual(
                                        m.percentualComprometido
                                      )}
                                </p>
                              </div>

                              <div className="col-span-2 min-w-0">
                                <p className="text-xs text-slate-400">
                                  Movimentações
                                </p>
                                <p className="text-sm text-slate-600">
                                  {m.resumo.quantidade}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Comparação mensal - Tablet e computador */}

                    <section className="hidden w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm md:block">
                      <div className="border-b border-slate-50 p-4 sm:p-6">
                        <h3 className="break-words font-bold text-gray-900">
                          Comparação entre os meses
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Meses sem movimentação aparecem zerados
                        </p>
                      </div>

                      <table className="w-full max-w-full table-fixed border-collapse text-[10px] sm:text-xs">
                        <thead>
                          <tr className="bg-slate-50/50 text-slate-400">
                            <th className="w-[16%] break-words px-1.5 py-3 text-left font-medium uppercase sm:px-2">
                              Mês
                            </th>

                            <th className="w-[18%] break-words px-1 py-3 text-right font-medium uppercase sm:px-2">
                              Receitas
                            </th>

                            <th className="w-[18%] break-words px-1 py-3 text-right font-medium uppercase sm:px-2">
                              Despesas
                            </th>

                            <th className="w-[18%] break-words px-1 py-3 text-right font-medium uppercase sm:px-2">
                              Saldo
                            </th>

                            <th className="w-[17%] break-words px-1 py-3 text-right font-medium uppercase sm:px-2">
                              Comprometido
                            </th>

                            <th className="w-[13%] break-words px-1 py-3 text-right font-medium uppercase sm:px-2">
                              Mov.
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-50">
                          {m.serie.map((p) => (
                            <tr key={p.mes} className="hover:bg-slate-50/50">
                              <td
                                className="break-words px-1.5 py-3 font-medium text-gray-900 sm:px-2"
                                title={rotuloMes(p.mes)}
                              >
                                {rotuloMes(p.mes)}
                              </td>

                              <td className="px-1 py-3 text-right text-green-600 sm:px-2">
                                <span
                                  className="block truncate"
                                  title={formatarMoeda(p.receitas)}
                                >
                                  {formatarMoeda(p.receitas)}
                                </span>
                              </td>

                              <td className="px-1 py-3 text-right text-red-500 sm:px-2">
                                <span
                                  className="block truncate"
                                  title={formatarMoeda(p.despesas)}
                                >
                                  {formatarMoeda(p.despesas)}
                                </span>
                              </td>

                              <td
                                className={`px-1 py-3 text-right font-semibold sm:px-2 ${
                                  p.saldo < 0
                                    ? "text-red-500"
                                    : "text-[#021A49]"
                                }`}
                              >
                                <span
                                  className="block truncate"
                                  title={formatarMoeda(p.saldo)}
                                >
                                  {formatarMoeda(p.saldo)}
                                </span>
                              </td>

                              <td className="px-1 py-3 text-right text-slate-500 sm:px-2">
                                <span
                                  className="block truncate"
                                  title={
                                    p.comprometido === null
                                      ? "Indisponível"
                                      : formatarPercentual(p.comprometido)
                                  }
                                >
                                  {p.comprometido === null
                                    ? "—"
                                    : formatarPercentual(p.comprometido)}
                                </span>
                              </td>

                              <td className="px-1 py-3 text-right text-slate-500 sm:px-2">
                                {p.quantidade}
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        {m.serie.length > 1 && (
                          <tfoot>
                            <tr className="bg-slate-50/70 font-bold text-gray-900">
                              <td className="break-words px-1.5 py-3 sm:px-2">
                                Total
                              </td>

                              <td className="px-1 py-3 text-right sm:px-2">
                                <span
                                  className="block truncate"
                                  title={formatarMoeda(
                                    m.resumo.totalRecebimentos
                                  )}
                                >
                                  {formatarMoeda(m.resumo.totalRecebimentos)}
                                </span>
                              </td>

                              <td className="px-1 py-3 text-right sm:px-2">
                                <span
                                  className="block truncate"
                                  title={formatarMoeda(
                                    m.resumo.totalPagamentos
                                  )}
                                >
                                  {formatarMoeda(m.resumo.totalPagamentos)}
                                </span>
                              </td>

                              <td className="px-1 py-3 text-right sm:px-2">
                                <span
                                  className="block truncate"
                                  title={formatarMoeda(m.resumo.saldo)}
                                >
                                  {formatarMoeda(m.resumo.saldo)}
                                </span>
                              </td>

                              <td className="px-1 py-3 text-right sm:px-2">
                                <span
                                  className="block truncate"
                                  title={
                                    m.percentualComprometido === null
                                      ? "Indisponível"
                                      : formatarPercentual(
                                          m.percentualComprometido
                                        )
                                  }
                                >
                                  {m.percentualComprometido === null
                                    ? "—"
                                    : formatarPercentual(
                                        m.percentualComprometido
                                      )}
                                </span>
                              </td>

                              <td className="px-1 py-3 text-right sm:px-2">
                                {m.resumo.quantidade}
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </section>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
