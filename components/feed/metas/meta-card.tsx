"use client";

import { useState } from "react";
import { History, Pencil, PiggyBank, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatarDataBr, formatarMoeda } from "@/lib/finance/formato";
import { ROTULO_STATUS, type MetaCalculada } from "@/lib/metas/calculos";
import type {
  ContribuicaoFormValores,
  MetaFormValores,
} from "@/lib/metas/validacao";
import { ContribuicaoForm, MetaForm } from "./meta-form";

export type PainelMeta =
  | "adicionar"
  | "historico"
  | "editar"
  | "excluir"
  | null;

interface MetaCardProps {
  meta: MetaCalculada;
  onEditar: (id: string, dados: MetaFormValores) => Promise<string | null>;
  onExcluir: (id: string) => Promise<string | null>;
  onAdicionar: (
    id: string,
    metaId: string,
    dados: ContribuicaoFormValores
  ) => Promise<string | null>;
  onEditarContribuicao: (
    id: string,
    dados: ContribuicaoFormValores
  ) => Promise<string | null>;
  onExcluirContribuicao: (id: string) => Promise<string | null>;
  onFeedback: (f: { tipo: "ok" | "erro"; texto: string }) => void;
  /** Painel aberto ao montar (padrão: nenhum). */
  painelInicial?: PainelMeta;
}

const ESTILO_STATUS = {
  em_andamento: "bg-blue-50 text-[#021A49] border-blue-100",
  concluida: "bg-green-50 text-green-700 border-green-100",
  atrasada: "bg-amber-50 text-amber-700 border-amber-200",
} as const;

const COR_BARRA = {
  em_andamento: "bg-[#021A49]",
  concluida: "bg-green-500",
  atrasada: "bg-amber-500",
} as const;

const fmtPct = (p: number) =>
  `${p.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

function textoPrazo(m: MetaCalculada): string | null {
  if (!m.data_prevista) return null;
  const data = formatarDataBr(m.data_prevista);
  if (m.status === "concluida") return `Prazo previsto: ${data}`;
  const d = m.diasParaPrazo ?? 0;
  if (d < 0)
    return `Prazo previsto: ${data} (ultrapassado há ${-d} ${-d === 1 ? "dia" : "dias"})`;
  if (d === 0) return `Prazo previsto: ${data} (hoje)`;
  return `Prazo previsto: ${data} (faltam ${d} ${d === 1 ? "dia" : "dias"})`;
}

export function MetaCard({
  meta,
  onEditar,
  onExcluir,
  onAdicionar,
  onEditarContribuicao,
  onExcluirContribuicao,
  onFeedback,
  painelInicial = null,
}: MetaCardProps) {
  const [painel, setPainel] = useState<PainelMeta>(painelInicial);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [apagando, setApagando] = useState(false);

  const alternar = (p: Exclude<PainelMeta, null>) => {
    setPainel((atual) => (atual === p ? null : p));
    setEditandoId(null);
    setExcluindoId(null);
  };

  const prazo = textoPrazo(meta);
  const n = meta.contribuicoes.length;

  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex flex-col gap-4 min-w-0">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 break-words">{meta.nome}</h3>
          {meta.categoria && (
            <span className="inline-block mt-1 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px] text-slate-600">
              {meta.categoria}
            </span>
          )}
        </div>
        <span
          className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${ESTILO_STATUS[meta.status]}`}
        >
          {ROTULO_STATUS[meta.status]}
        </span>
      </div>

      {meta.descricao && (
        <p className="text-sm text-gray-500 text-pretty break-words">
          {meta.descricao}
        </p>
      )}

      {/* Números */}
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-xs text-gray-500">Desejado</dt>
          <dd className="font-semibold text-gray-900">
            {formatarMoeda(meta.valor_alvo)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Acumulado</dt>
          <dd className="font-semibold text-gray-900">
            {formatarMoeda(meta.acumulado)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">
            {meta.status === "concluida" ? "Excedente" : "Falta"}
          </dt>
          <dd className="font-semibold text-gray-900">
            {formatarMoeda(
              meta.status === "concluida" ? meta.excedente : meta.restante
            )}
          </dd>
        </div>
      </dl>

      {/* Progresso */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progresso</span>
          <span className="font-semibold text-gray-900">
            {fmtPct(meta.percentual)}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`Progresso da meta ${meta.nome}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={meta.percentual}
          className="h-2.5 rounded-full bg-slate-100 overflow-hidden"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${COR_BARRA[meta.status]}`}
            style={{ width: `${meta.percentual}%` }}
          />
        </div>
        {prazo && <p className="text-xs text-gray-400 mt-2">{prazo}</p>}
        {meta.valorMensalSugerido !== null && (
          <p className="text-xs text-gray-400 mt-0.5">
            Para chegar no prazo: cerca de{" "}
            {formatarMoeda(meta.valorMensalSugerido)} por mês.
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => alternar("adicionar")}
          className="bg-[#021A49] hover:bg-[#021A49]/90 text-white rounded-lg gap-1.5"
        >
          <PiggyBank size={14} /> Adicionar valor
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => alternar("historico")}
          className="rounded-lg border-gray-200 text-gray-600 gap-1.5"
        >
          <History size={14} /> Histórico ({n})
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => alternar("editar")}
          className="rounded-lg border-gray-200 text-gray-600 gap-1.5"
        >
          <Pencil size={14} /> Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => alternar("excluir")}
          className="rounded-lg border-gray-200 text-red-500 gap-1.5"
        >
          <Trash2 size={14} /> Excluir
        </Button>
      </div>

      {/* Painéis */}
      {painel === "adicionar" && (
        <ContribuicaoForm
          onCancelar={() => setPainel(null)}
          onSalvar={async (id, dados) => {
            const falha = await onAdicionar(id, meta.id, dados);
            if (!falha) {
              setPainel(null);
              onFeedback({
                tipo: "ok",
                texto: `${formatarMoeda(Number(dados.valor))} adicionado à meta “${meta.nome}”.`,
              });
            }
            return falha;
          }}
        />
      )}

      {painel === "editar" && (
        <MetaForm
          inicial={meta}
          onCancelar={() => setPainel(null)}
          onSalvar={async (id, dados) => {
            const falha = await onEditar(id, dados);
            if (!falha) {
              setPainel(null);
              onFeedback({
                tipo: "ok",
                texto: `Meta “${dados.nome.trim()}” atualizada.`,
              });
            }
            return falha;
          }}
        />
      )}

      {painel === "excluir" && (
        <div
          role="alertdialog"
          className="rounded-lg border border-red-100 bg-red-50 p-3 flex flex-col gap-3"
        >
          <p className="text-sm text-red-700">
            Excluir a meta “{meta.nome}”?{" "}
            {n > 0
              ? `As ${n} ${n === 1 ? "contribuição" : "contribuições"} do histórico também serão apagadas.`
              : "Ela não tem contribuições."}{" "}
            Esta ação não pode ser desfeita e não afeta suas receitas e
            despesas.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={apagando}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
              onClick={async () => {
                setApagando(true);
                const falha = await onExcluir(meta.id);
                setApagando(false);
                onFeedback(
                  falha
                    ? { tipo: "erro", texto: falha }
                    : { tipo: "ok", texto: `Meta “${meta.nome}” excluída.` }
                );
              }}
            >
              {apagando ? "Excluindo..." : "Sim, excluir meta"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPainel(null)}
              disabled={apagando}
              className="rounded-lg border-gray-200 text-gray-600"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {painel === "historico" && (
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500">
            Valor inicial:{" "}
            <span className="font-medium text-gray-700">
              {formatarMoeda(meta.valor_inicial)}
            </span>
            {" · "}Criada em {formatarDataBr(meta.data_criacao)}
          </div>
          {n === 0 ? (
            <p className="px-3 py-4 text-sm text-gray-400 text-center">
              Nenhum valor adicionado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {meta.contribuicoes.map((c) => (
                <li key={c.id} className="px-3 py-2">
                  {editandoId === c.id ? (
                    <ContribuicaoForm
                      inicial={c}
                      onCancelar={() => setEditandoId(null)}
                      onSalvar={async (id, dados) => {
                        const falha = await onEditarContribuicao(id, dados);
                        if (!falha) {
                          setEditandoId(null);
                          onFeedback({
                            tipo: "ok",
                            texto: "Contribuição corrigida.",
                          });
                        }
                        return falha;
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {formatarMoeda(c.valor)}{" "}
                          <span className="text-xs text-gray-400 font-normal">
                            {formatarDataBr(c.data)}
                          </span>
                        </p>
                        {c.observacao && (
                          <p className="text-xs text-gray-500 break-words">
                            {c.observacao}
                          </p>
                        )}
                      </div>
                      {excluindoId === c.id ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-red-600">Excluir?</span>
                          <button
                            type="button"
                            className="text-xs font-medium text-red-600 hover:underline"
                            onClick={async () => {
                              const falha = await onExcluirContribuicao(c.id);
                              setExcluindoId(null);
                              onFeedback(
                                falha
                                  ? { tipo: "erro", texto: falha }
                                  : {
                                      tipo: "ok",
                                      texto: "Contribuição excluída.",
                                    }
                              );
                            }}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            className="text-xs text-gray-500 hover:underline"
                            onClick={() => setExcluindoId(null)}
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            aria-label="Corrigir contribuição"
                            className="p-1.5 rounded-md text-gray-400 hover:text-[#021A49] hover:bg-gray-50"
                            onClick={() => {
                              setEditandoId(c.id);
                              setExcluindoId(null);
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            aria-label="Excluir contribuição"
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => {
                              setExcluindoId(c.id);
                              setEditandoId(null);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
