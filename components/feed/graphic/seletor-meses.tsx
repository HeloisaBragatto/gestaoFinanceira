"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  MESES_NOMES,
  anoDoMes,
  criarMes,
  ehSequenciaContinua,
  intervaloMeses,
  mesAtual,
  normalizarMeses,
  numeroDoMes,
  rotuloMes,
  somarMeses,
} from "@/lib/finance/meses";

interface SeletorMesesProps {
  selecionados: string[];
  onChange: (meses: string[]) => void;
  anos: number[];
  hoje?: Date;
  padrao: string[];
}

const campo =
  "w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-900 outline-none transition-all focus:border-[#021A49] focus:ring-1 focus:ring-[#021A49]/20";

const botaoAtalho =
  "inline-flex min-h-8 items-center justify-center whitespace-nowrap rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:border-[#021A49]/40 hover:text-[#021A49] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#021A49]/30";

// Descrição da seleção
export function descreverSelecao(meses: string[]): string {
  const m = normalizarMeses(meses);

  if (m.length === 0) return "Nenhum mês selecionado";

  if (m.length === 1) return `${rotuloMes(m[0])} (1 mês)`;

  if (ehSequenciaContinua(m)) {
    return `${rotuloMes(m[0])} a ${rotuloMes(
      m[m.length - 1]
    )} (${m.length} meses)`;
  }

  return `${m.map(rotuloMes).join(", ")} (${m.length} meses, não consecutivos)`;
}

export function SeletorMeses({
  selecionados,
  onChange,
  anos,
  hoje = new Date(),
  padrao,
}: SeletorMesesProps) {
  const sel = normalizarMeses(selecionados);

  const [modo, setModo] = useState<"meses" | "intervalo">("meses");

  const [anoVisivel, setAnoVisivel] = useState(hoje.getFullYear());

  const atual = mesAtual(hoje);

  const selSet = new Set(sel);

  // Alterna a seleção de um mês
  const alternar = (mes: string) => {
    onChange(
      selSet.has(mes)
        ? sel.filter((m) => m !== mes)
        : normalizarMeses([...sel, mes])
    );
  };

  // Seleciona todos os meses do ano visível
  const selecionarAno = () => {
    onChange(
      normalizarMeses([
        ...sel,
        ...intervaloMeses(criarMes(anoVisivel, 1), criarMes(anoVisivel, 12)),
      ])
    );
  };

  // Intervalo de meses
  const inicio = sel[0] ?? atual;
  const fim = sel[sel.length - 1] ?? atual;

  const trocarIntervalo = (novoInicio: string, novoFim: string) => {
    onChange(intervaloMeses(novoInicio, novoFim));
  };

  // Seletor responsivo de mês e ano
  const seletorMesAno = ({
    valor,
    aoMudar,
    rotulo,
  }: {
    valor: string;
    aoMudar: (m: string) => void;
    rotulo: string;
  }) => (
    <div key={rotulo} className="w-full sm:flex-1">
      <div className="flex min-w-0 flex-col gap-1.5">
        <label className="text-xs font-medium text-gray-500">{rotulo}</label>

        <div className="grid min-w-0 grid-cols-2 gap-2">
          <select
            aria-label={`${rotulo}: mês`}
            value={numeroDoMes(valor)}
            onChange={(e) =>
              aoMudar(criarMes(anoDoMes(valor), Number(e.target.value)))
            }
            className={campo}
          >
            {MESES_NOMES.map((nome, i) => (
              <option key={nome} value={i + 1}>
                {nome}
              </option>
            ))}
          </select>

          <select
            aria-label={`${rotulo}: ano`}
            value={anoDoMes(valor)}
            onChange={(e) =>
              aoMudar(criarMes(Number(e.target.value), numeroDoMes(valor)))
            }
            className={campo}
          >
            {anos.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:gap-5 sm:p-5">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Alternância de modo */}
        <div
          role="tablist"
          aria-label="Modo de seleção de meses"
          className="flex w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5 sm:w-fit"
        >
          {(
            [
              ["meses", "Escolher meses"],
              ["intervalo", "Intervalo"],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={modo === id}
              onClick={() => setModo(id)}
              className={`min-w-0 flex-1 rounded-md px-2 py-2 text-xs transition-colors sm:flex-none sm:px-3 sm:text-sm ${
                modo === id
                  ? "bg-[#021A49] text-white"
                  : "text-gray-600 hover:text-[#021A49]"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {/* Atalhos */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="mr-0.5 text-xs font-medium text-gray-500">
            Atalhos:
          </span>

          <button
            type="button"
            className={botaoAtalho}
            onClick={() => onChange([atual])}
          >
            Mês atual
          </button>

          <button
            type="button"
            className={botaoAtalho}
            onClick={() =>
              onChange(intervaloMeses(somarMeses(atual, -2), atual))
            }
          >
            Últimos 3 meses
          </button>

          <button
            type="button"
            className={botaoAtalho}
            onClick={() =>
              onChange(intervaloMeses(somarMeses(atual, -5), atual))
            }
          >
            Últimos 6 meses
          </button>

          <button
            type="button"
            className={botaoAtalho}
            onClick={() =>
              onChange(intervaloMeses(criarMes(hoje.getFullYear(), 1), atual))
            }
          >
            Ano atual
          </button>
        </div>
      </div>

      {modo === "meses" ? (
        <div className="flex w-full min-w-0 flex-col gap-3">
          {/* Navegação entre anos */}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Ano anterior"
              disabled={anos.length === 0 || anoVisivel <= anos[0]}
              onClick={() => setAnoVisivel((ano) => ano - 1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            <select
              aria-label="Ano analisado"
              value={anoVisivel}
              onChange={(e) => setAnoVisivel(Number(e.target.value))}
              className={`${campo} min-w-0 flex-1 sm:w-28 sm:flex-none`}
            >
              {anos.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>

            <button
              type="button"
              aria-label="Próximo ano"
              disabled={
                anos.length === 0 || anoVisivel >= anos[anos.length - 1]
              }
              onClick={() => setAnoVisivel((ano) => ano + 1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              className={`${botaoAtalho} w-full sm:ml-1 sm:w-auto`}
              onClick={selecionarAno}
            >
              Selecionar o ano todo
            </button>
          </div>

          {/* Grade de meses */}
          <div className="grid w-full min-w-0 grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {MESES_NOMES.map((nome, i) => {
              const mes = criarMes(anoVisivel, i + 1);
              const ativo = selSet.has(mes);
              const mesAtualNaoSelecionado = mes === atual && !ativo;

              return (
                <button
                  key={mes}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => alternar(mes)}
                  className={`min-w-0 rounded-lg border py-2.5 text-sm transition-colors ${
                    ativo
                      ? "border-[#021A49] bg-[#021A49] text-white"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#021A49]/40"
                  } ${
                    mesAtualNaoSelecionado ? "ring-1 ring-[#021A49]/30" : ""
                  }`}
                >
                  {nome.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {seletorMesAno({
            rotulo: "Mês inicial",
            valor: inicio,
            aoMudar: (mes) => trocarIntervalo(mes, fim),
          })}

          {seletorMesAno({
            rotulo: "Mês final",
            valor: fim,
            aoMudar: (mes) => trocarIntervalo(inicio, mes),
          })}
        </div>
      )}

      <div className="flex w-full min-w-0 flex-col gap-3 border-t border-gray-100 pt-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
        {/* Descrição da seleção */}
        <p
          className="min-w-0 break-words text-sm leading-relaxed text-gray-600 md:flex-1"
          aria-live="polite"
        >
          <span className="font-medium text-gray-900">Selecionado:</span>{" "}
          {descreverSelecao(sel)}
        </p>

        {/* Botões */}
        <div className="grid w-full min-w-0 grid-cols-2 gap-2 md:w-auto md:shrink-0">
          <button
            type="button"
            className={botaoAtalho}
            onClick={() => onChange(padrao)}
          >
            Redefinir
          </button>

          <button
            type="button"
            className={botaoAtalho}
            onClick={() => onChange([])}
          >
            Limpar seleção
          </button>
        </div>
      </div>
    </div>
  );
}
