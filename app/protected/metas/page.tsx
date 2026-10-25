"use client";

import { useMemo, useState } from "react";
import { Info, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  filtrarMetas,
  FiltroMetas,
  OrdemMetas,
  ordenarMetas,
  resumirMetas,
} from "@/lib/metas/calculos";
import { useMetas } from "@/lib/use-metas";
import { ResumoMetasCards } from "@/components/feed/metas/resumo-metas";
import { MetaForm } from "@/components/feed/metas/meta-form";
import { MetaCard } from "@/components/feed/metas/meta-card";

const FILTROS: { id: FiltroMetas; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "ativas", rotulo: "Em andamento" },
  { id: "concluidas", rotulo: "Concluídas" },
];

const campo =
  "text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 outline-none focus:border-[#021A49] focus:ring-1 focus:ring-[#021A49]/20 transition-all";

export default function MetasPage() {
  const {
    metas,
    loading,
    erro,
    tabelasAusentes,
    criar,
    editar,
    excluir,
    adicionarContribuicao,
    editarContribuicao,
    excluirContribuicao,
  } = useMetas();

  const [filtro, setFiltro] = useState<FiltroMetas>("todas");
  const [ordem, setOrdem] = useState<OrdemMetas>("recentes");
  const [criando, setCriando] = useState(false);
  const [feedback, setFeedback] = useState<{
    tipo: "ok" | "erro";
    texto: string;
  } | null>(null);

  const resumo = useMemo(() => resumirMetas(metas), [metas]);
  const visiveis = useMemo(
    () => ordenarMetas(filtrarMetas(metas, filtro), ordem),
    [metas, filtro, ordem]
  );

  return (
    <section className="mt-5 md:mt-16 lg:mt-5">
      <div className="row">
        <div className="container">
          <div className="flex flex-col gap-5 mt-14 md:mt-0">
            <div className="flex flex-col gap-y-4 md:flex-row items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Crie objetivos e acompanhe o quanto já guardou
                </p>
              </div>
              <Button
                onClick={() => {
                  setCriando((v) => !v);
                  setFeedback(null);
                }}
                disabled={tabelasAusentes}
                className="bg-[#021A49] hover:bg-[#021A49]/90 text-white gap-2 rounded-lg shadow-sm"
              >
                <Plus size={15} /> Nova meta
              </Button>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-[#021A49]">
              <Info size={16} className="shrink-0 mt-0.5" aria-hidden />
              <p className="text-pretty">
                As metas são um <strong>controle manual</strong>: adicionar
                valores aqui não movimenta dinheiro real e não cria receitas,
                despesas ou transferências nas suas movimentações. O total
                acumulado não representa o saldo das suas contas.
              </p>
            </div>

            {tabelasAusentes && (
              <div
                role="alert"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              >
                {erro}
              </div>
            )}

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

            {!tabelasAusentes && <ResumoMetasCards resumo={resumo} />}

            {criando && (
              <MetaForm
                onCancelar={() => setCriando(false)}
                onSalvar={async (id, dados) => {
                  const falha = await criar(id, dados);
                  if (!falha) {
                    setCriando(false);
                    setFeedback({
                      tipo: "ok",
                      texto: `Meta “${dados.nome.trim()}” criada.`,
                    });
                  }
                  return falha;
                }}
              />
            )}

            {/* Filtro e ordenação */}
            {!tabelasAusentes && metas.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  role="tablist"
                  className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50"
                >
                  {FILTROS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="tab"
                      aria-selected={filtro === f.id}
                      onClick={() => setFiltro(f.id)}
                      className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                        filtro === f.id
                          ? "bg-[#021A49] text-white"
                          : "text-gray-600 hover:text-[#021A49]"
                      }`}
                    >
                      {f.rotulo}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="ordem-metas"
                    className="text-xs font-medium text-gray-500"
                  >
                    Ordenar por
                  </label>
                  <select
                    id="ordem-metas"
                    value={ordem}
                    onChange={(e) => setOrdem(e.target.value as OrdemMetas)}
                    className={campo}
                  >
                    <option value="recentes">Mais recentes</option>
                    <option value="prazo">Prazo</option>
                    <option value="progresso">Progresso</option>
                    <option value="nome">Nome</option>
                  </select>
                </div>
              </div>
            )}

            {/* Lista */}
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-12 text-center">
                <p className="text-sm text-gray-400">Carregando metas...</p>
              </div>
            ) : erro && !tabelasAusentes ? (
              <div
                role="alert"
                className="bg-red-50 rounded-xl border border-red-100 px-5 py-8 text-center"
              >
                <p className="text-sm text-red-600">{erro}</p>
              </div>
            ) : tabelasAusentes ? null : metas.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-12 text-center">
                <p className="text-sm text-gray-500">
                  Você ainda não tem metas.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Clique em “Nova meta” para criar a primeira (viagem, celular,
                  reserva de emergência...).
                </p>
              </div>
            ) : visiveis.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-10 text-center">
                <p className="text-sm text-gray-500">
                  Nenhuma meta{" "}
                  {filtro === "concluidas" ? "concluída" : "em andamento"}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {visiveis.map((m) => (
                  <MetaCard
                    key={m.id}
                    meta={m}
                    onEditar={editar}
                    onExcluir={excluir}
                    onAdicionar={adicionarContribuicao}
                    onEditarContribuicao={editarContribuicao}
                    onExcluirContribuicao={excluirContribuicao}
                    onFeedback={setFeedback}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
