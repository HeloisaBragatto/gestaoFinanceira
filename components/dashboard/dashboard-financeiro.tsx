"use client";

import { calcularResumo, compararResumos } from "@/lib/finance/calculos";
import { CATEGORIAS } from "@/lib/finance/types";
import {
  avisoDaComparacao,
  useExtratos,
  useResumoPeriodoAnterior,
} from "@/lib/use-extract";
import { useFiltros } from "@/lib/use-filtros";
import { FileUp } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { ExportarRelatorio } from "../feed/extract/export-extract";
import {
  FiltrosAtivosChips,
  FiltrosBar,
} from "../feed/extract/filters-extract-feed";
import { ResumoCards } from "../card/resume-extract-card";

import DashboardGraphic from "../feed/graphic/dashboard-graphic";

export default function DashboardFinanceiro() {
  const {
    pronto,
    rascunho,
    setRascunho,
    aplicados,
    aplicar,
    limpar,
    remover,
    erro: erroFiltros,
    alterado,
  } = useFiltros("mesAtual");
  const {
    extratos,
    loading,
    erro: erroCarga,
  } = useExtratos(aplicados, {
    habilitado: pronto,
  });
  const {
    resumo: resumoAnterior,
    periodo: periodoAnterior,
    estado: estadoComparacao,
  } = useResumoPeriodoAnterior(aplicados);

  // Os indicadores são calculados sobre os registros filtrados
  const resumo = useMemo(() => calcularResumo(extratos), [extratos]);
  const comparacao = useMemo(
    () =>
      resumoAnterior && periodoAnterior
        ? {
            ...compararResumos(resumo, resumoAnterior),
            periodo: periodoAnterior,
          }
        : null,
    [resumo, resumoAnterior, periodoAnterior]
  );

  const categorias = useMemo(() => {
    const set = new Set<string>(CATEGORIAS);
    for (const e of extratos) if (e.categoria) set.add(e.categoria);
    if (aplicados.categoria !== "todas") set.add(aplicados.categoria);
    return Array.from(set);
  }, [extratos, aplicados.categoria]);

  return (
    <>
      <section className="mt-5 md:mt-16 lg:mt-5">
        <div className="row">
          <div className="container">
            <div className="flex flex-col gap-5 mt-14 md:mt-0">
              {/* Header */}
              <div className="flex flex-col gap-y-5 md:flex-row items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Gestão Financeira
                  </h1>
                  <p className="text-sm text-balance text-gray-500 mt-0.5">
                    Visão geral das suas movimentações
                  </p>
                </div>
                <div className="flex flex-col gap-3 items-start md:items-end">
                  <Link href="/protected/importar" className="btn-darkBlue">
                    <FileUp size={18} /> Importar Extrato
                  </Link>
                  <ExportarRelatorio
                    filtros={aplicados}
                    totalRegistros={extratos.length}
                    desabilitado={loading || extratos.length === 0}
                  />
                </div>
              </div>

              {/* Filtros */}
              <FiltrosBar
                filtros={rascunho}
                onChange={setRascunho}
                onAplicar={aplicar}
                onLimpar={limpar}
                categorias={categorias}
                erro={erroFiltros}
                alterado={alterado}
              />
              <FiltrosAtivosChips filtros={aplicados} onRemover={remover} />

              {/* Cards */}
              <ResumoCards
                totalRecebimentos={resumo.totalRecebimentos}
                totalPagamentos={resumo.totalPagamentos}
                comparacao={comparacao}
                avisoComparacao={avisoDaComparacao(estadoComparacao)}
              />
              <p className="text-xs text-gray-400 -mt-2">
                Indicadores sobre {resumo.quantidade.toLocaleString("pt-BR")}{" "}
                {resumo.quantidade === 1 ? "movimentação" : "movimentações"}{" "}
                realizadas que atendem aos filtros.
              </p>

              {erroCarga ? (
                <div
                  role="alert"
                  className="bg-red-50 rounded-xl border border-red-100 px-5 py-8 text-center"
                >
                  <p className="text-sm text-red-600">{erroCarga}</p>
                </div>
              ) : loading ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-12 text-center">
                  <p className="text-sm text-gray-400">
                    Carregando gráficos...
                  </p>
                </div>
              ) : extratos.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-12 text-center">
                  <p className="text-sm text-gray-400">
                    Nenhuma movimentação encontrada ainda.
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Ajuste os filtros, adicione uma transação ou importe um
                    extrato para ver os gráficos.
                  </p>
                </div>
              ) : (
                <>
                  <DashboardGraphic extratos={extratos} />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
