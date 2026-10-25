"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFiltros } from "@/lib/use-filtros";
import { calcularResumo, compararResumos } from "@/lib/finance/calculos";
import { ResumoCards } from "@/components/card/resume-extract-card";
import { TabelaExtratos } from "@/components/feed/extract/table-extract-feed";
import { ExtratoForm } from "@/components/forms/extract-form";
import {
  FiltrosBar,
  FiltrosAtivosChips,
} from "@/components/feed/extract/filters-extract-feed";
import { ExportarRelatorio } from "@/components/feed/extract/export-extract";
import { CATEGORIAS, Extrato } from "@/lib/finance/types";
import {
  avisoDaComparacao,
  useExtratos,
  useResumoPeriodoAnterior,
} from "@/lib/use-extract";
import { Paginacao } from "@/components/feed/extract/pagination-extract";

const TAMANHO_PAGINA = 25;

const novoExtratoInicial = (): Partial<Extrato> => ({
  tipo: "pagamento",
  descricao: "",
  categoria: "outro",
  valor: undefined,
  data_transacao: new Date().toISOString().split("T")[0],
});

export default function ExtratosPage() {
  const {
    rascunho,
    setRascunho,
    aplicados,
    aplicar,
    limpar,
    remover,
    erro: erroFiltros,
    alterado,
  } = useFiltros();

  const {
    extratos,
    loading,
    erro: erroCarga,
    salvarEdicao,
    deletarExtrato,
    adicionarExtrato,
  } = useExtratos(aplicados);

  const {
    resumo: resumoAnterior,
    periodo: periodoAnterior,
    estado: estadoComparacao,
  } = useResumoPeriodoAnterior(aplicados);

  const [ordenacao, setOrdenacao] = useState<"asc" | "desc">("desc");
  const [pagina, setPagina] = useState(1);
  const [feedback, setFeedback] = useState<{
    tipo: "ok" | "erro";
    texto: string;
  } | null>(null);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Extrato>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [mostrandoForm, setMostrandoForm] = useState(false);
  const [novoForm, setNovoForm] =
    useState<Partial<Extrato>>(novoExtratoInicial);

  // Volta para a primeira página quando muda o resultado ou a ordenação
  useEffect(() => {
    setPagina(1);
  }, [aplicados, ordenacao]);

  const categorias = useMemo(() => {
    const set = new Set<string>(CATEGORIAS);
    for (const e of extratos) if (e.categoria) set.add(e.categoria);
    if (aplicados.categoria !== "todas") set.add(aplicados.categoria);
    return Array.from(set);
  }, [extratos, aplicados.categoria]);

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

  const extratosOrdenados = useMemo(
    () => (ordenacao === "desc" ? extratos : [...extratos].reverse()),
    [extratos, ordenacao]
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(extratosOrdenados.length / TAMANHO_PAGINA)
  );
  const paginaAtual = Math.min(pagina, totalPaginas);
  const extratosDaPagina = extratosOrdenados.slice(
    (paginaAtual - 1) * TAMANHO_PAGINA,
    paginaAtual * TAMANHO_PAGINA
  );

  const iniciarEdicao = (e: Extrato) => {
    setEditandoId(e.id);
    setEditForm({ ...e });
    setFeedback(null);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditForm({});
  };

  const handleSalvarEdicao = async () => {
    if (!editandoId) return;
    const erro = await salvarEdicao(editandoId, editForm);
    if (erro) {
      setFeedback({ tipo: "erro", texto: erro });
      return;
    }
    setEditandoId(null);
    setEditForm({});
    setFeedback({ tipo: "ok", texto: "Movimentação atualizada." });
  };

  const handleDeletar = async (id: string) => {
    const erro = await deletarExtrato(id);
    setConfirmDeleteId(null);
    setFeedback(
      erro
        ? { tipo: "erro", texto: erro }
        : { tipo: "ok", texto: "Movimentação excluída." }
    );
  };

  const handleAdicionar = async () => {
    const erro = await adicionarExtrato(novoForm);
    if (erro) {
      setFeedback({ tipo: "erro", texto: erro });
      return;
    }
    setMostrandoForm(false);
    setNovoForm(novoExtratoInicial());
    setFeedback({ tipo: "ok", texto: "Movimentação adicionada." });
  };

  return (
    <section className="mt-5 md:mt-16 lg:mt-5">
      <div className="row">
        <div className="container">
          <div className="flex flex-col gap-5 mt-14 md:mt-0">
            <div className="flex flex-col gap-y-5 md:flex-row items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Extratos</h1>
                <p className="text-sm text-balance text-gray-500 mt-0.5">
                  Visualize e gerencie suas movimentações
                </p>
              </div>
              <div className="flex flex-col gap-3 items-start md:items-end">
                <Button
                  onClick={() => {
                    setMostrandoForm((v) => !v);
                    setFeedback(null);
                  }}
                  className="bg-[#021A49] hover:bg-[#021A49]/90 text-white gap-2 rounded-lg shadow-sm"
                >
                  <Plus size={15} />
                  Nova transação
                </Button>
                <ExportarRelatorio
                  filtros={aplicados}
                  totalRegistros={extratos.length}
                  desabilitado={loading || extratos.length === 0}
                />
              </div>
            </div>

            {/* Card */}
            <ResumoCards
              totalRecebimentos={resumo.totalRecebimentos}
              totalPagamentos={resumo.totalPagamentos}
              comparacao={comparacao}
              avisoComparacao={avisoDaComparacao(estadoComparacao)}
            />
            <p className="text-xs text-pretty text-gray-400 -mt-2">
              Totais de movimentações registradas (realizadas) que atendem aos
              filtros: {resumo.quantidade.toLocaleString("pt-BR")}{" "}
              {resumo.quantidade === 1 ? "registro" : "registros"}.
            </p>

            {/* Filtro */}
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

            {/* Mensagens */}
            {feedback && (
              <div
                role={feedback.tipo === "erro" ? "alert" : "status"}
                className={`px-4 py-3 rounded-lg text-sm font-medium border ${
                  feedback.tipo === "erro"
                    ? "bg-red-50 text-red-600 border-red-100"
                    : "bg-green-50 text-green-700 border-green-100"
                }`}
              >
                {feedback.texto}
              </div>
            )}

            {/* Form de novo extrato */}
            {mostrandoForm && (
              <ExtratoForm
                form={novoForm}
                onChange={setNovoForm}
                onSalvar={handleAdicionar}
                onCancelar={() => setMostrandoForm(false)}
                isNovo
              />
            )}

            {/* Tabela */}
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-12 text-center">
                <p className="text-sm text-gray-400">Carregando extratos...</p>
              </div>
            ) : erroCarga ? (
              <div
                role="alert"
                className="bg-red-50 rounded-xl border border-red-100 px-5 py-8 text-center"
              >
                <p className="text-sm text-red-600">{erroCarga}</p>
              </div>
            ) : extratos.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-12 text-center">
                <p className="text-sm text-gray-400">
                  Nenhum extrato encontrado.
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Tente ajustar os filtros ou adicionar uma nova transação.
                </p>
              </div>
            ) : (
              <>
                <TabelaExtratos
                  extratos={extratosDaPagina}
                  totalRegistros={extratosOrdenados.length}
                  ordenacao={ordenacao}
                  onOrdenacao={() =>
                    setOrdenacao((o) => (o === "desc" ? "asc" : "desc"))
                  }
                  editandoId={editandoId}
                  editForm={editForm}
                  onIniciarEdicao={iniciarEdicao}
                  onCancelarEdicao={cancelarEdicao}
                  onSalvarEdicao={handleSalvarEdicao}
                  onEditFormChange={setEditForm}
                  confirmDeleteId={confirmDeleteId}
                  onConfirmDelete={setConfirmDeleteId}
                  onDeletar={handleDeletar}
                  onCancelarDelete={() => setConfirmDeleteId(null)}
                />
                <Paginacao
                  pagina={paginaAtual}
                  tamanho={TAMANHO_PAGINA}
                  total={extratosOrdenados.length}
                  onPagina={setPagina}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
