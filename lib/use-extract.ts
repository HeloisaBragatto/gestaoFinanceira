"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FILTROS_INICIAIS,
  filtrarExtratos,
  validarFiltros,
  type FiltrosState,
} from "@/lib/finance/filtros";
import {
  calcularResumo,
  periodoAnterior,
  type ResumoFinanceiro,
} from "@/lib/finance/calculos";
import { Extrato } from "./finance/types";
import { buscarTodosExtratos } from "./finance/consulta";
import { validarExtratoForm } from "./finance/validacao";

// Reexportados para manter compatível o import "@/lib/use-extract" usado
// pelos componentes existentes.
export type { FiltrosState } from "@/lib/finance/filtros";
export {
  formatarMoeda as formatarValor,
  formatarDataBr as formatarData,
} from "@/lib/finance/formato";

const supabase = createClient();

const mensagemDeErro = (e: unknown) =>
  e instanceof Error ? e.message : "Erro inesperado.";

/**
 * Carrega as movimentações do usuário aplicando `filtros` no banco.
 * Busca em lotes (o Supabase limita 1000 linhas por requisição).
 * As funções de escrita retornam a mensagem de erro (ou null em caso de sucesso).
 */
export function useExtratos(
  filtros: FiltrosState = FILTROS_INICIAIS,
  opcoes: { habilitado?: boolean } = {}
) {
  const habilitado = opcoes.habilitado ?? true;
  const [extratos, setExtratos] = useState<Extrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const ultimaRequisicao = useRef(0);

  // Chave estável: evita refetch quando só a identidade do objeto muda.
  const chave = JSON.stringify(filtros);

  const fetchExtratos = useCallback(async () => {
    const id = ++ultimaRequisicao.current;
    const f = JSON.parse(chave) as FiltrosState;
    setLoading(true);
    setErro(null);

    const invalido = validarFiltros(f);
    if (invalido) {
      setErro(invalido);
      setExtratos([]);
      setLoading(false);
      return;
    }

    try {
      const dados = await buscarTodosExtratos(supabase, f);
      if (id !== ultimaRequisicao.current) return; // resposta antiga
      setExtratos(dados);
    } catch (e) {
      if (id !== ultimaRequisicao.current) return;
      setExtratos([]);
      setErro(
        `Não foi possível carregar as movimentações. ${mensagemDeErro(e)}`
      );
    } finally {
      if (id === ultimaRequisicao.current) setLoading(false);
    }
  }, [chave]);

  useEffect(() => {
    if (habilitado) fetchExtratos();
  }, [fetchExtratos, habilitado]);

  const salvarEdicao = async (
    id: string,
    form: Partial<Extrato>
  ): Promise<string | null> => {
    const invalido = validarExtratoForm(form);
    if (invalido) return invalido;
    const { error } = await supabase
      .from("extratos")
      .update({
        tipo: form.tipo,
        descricao: form.descricao?.trim(),
        categoria: form.categoria,
        valor: form.valor,
        data_transacao: form.data_transacao,
      })
      .eq("id", id);
    if (error) return "Não foi possível salvar a alteração.";
    await fetchExtratos();
    return null;
  };

  const deletarExtrato = async (id: string): Promise<string | null> => {
    const { error } = await supabase.from("extratos").delete().eq("id", id);
    if (error) return "Não foi possível excluir a movimentação.";
    await fetchExtratos();
    return null;
  };

  const adicionarExtrato = async (
    form: Partial<Extrato>
  ): Promise<string | null> => {
    const invalido = validarExtratoForm(form);
    if (invalido) return invalido;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "Sessão expirada. Entre novamente.";
    const { error } = await supabase.from("extratos").insert({
      user_id: user.id,
      tipo: form.tipo,
      descricao: form.descricao?.trim(),
      categoria: form.categoria,
      valor: form.valor,
      data_transacao: form.data_transacao,
      origem: "manual",
    });
    if (error) return "Não foi possível salvar a movimentação.";
    await fetchExtratos();
    return null;
  };

  return {
    extratos,
    loading,
    erro,
    fetchExtratos,
    salvarEdicao,
    deletarExtrato,
    adicionarExtrato,
  };
}

export type EstadoComparacao = "sem_periodo" | "carregando" | "ok" | "erro";

/**
 * Resumo do período imediatamente anterior ao filtrado (mesmos demais filtros).
 * Só existe quando data inicial E final estão definidas.
 */
export function useResumoPeriodoAnterior(filtros: FiltrosState) {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [periodo, setPeriodo] = useState<{
    inicio: string;
    fim: string;
  } | null>(null);
  const [estado, setEstado] = useState<EstadoComparacao>("sem_periodo");
  const chave = JSON.stringify(filtros);

  useEffect(() => {
    const f = JSON.parse(chave) as FiltrosState;
    let cancelado = false;

    if (!f.dataInicio || !f.dataFim || validarFiltros(f)) {
      setResumo(null);
      setPeriodo(null);
      setEstado("sem_periodo");
      return;
    }
    const anterior = periodoAnterior(f.dataInicio, f.dataFim);
    setPeriodo(anterior);
    setResumo(null);
    setEstado("carregando");

    buscarTodosExtratos(
      supabase,
      { ...f, dataInicio: anterior.inicio, dataFim: anterior.fim },
      { colunas: "id,tipo,valor" }
    )
      .then((dados) => {
        if (cancelado) return;
        setResumo(calcularResumo(dados));
        setEstado("ok");
      })
      .catch(() => {
        if (cancelado) return;
        setResumo(null);
        setEstado("erro");
      });

    return () => {
      cancelado = true;
    };
  }, [chave]);

  return { resumo, periodo, estado };
}

/** Mensagem exibida nos cards quando não há comparação disponível. */
export function avisoDaComparacao(estado: EstadoComparacao): string | null {
  switch (estado) {
    case "sem_periodo":
      return "Defina data inicial e final para comparar com o período anterior.";
    case "carregando":
      return "Calculando comparação com o período anterior…";
    case "erro":
      return "Não foi possível calcular a comparação com o período anterior.";
    default:
      return null;
  }
}

/** Mantido por compatibilidade: filtra em memória com a mesma regra da consulta. */
export function useExtratosFiltrados(
  extratos: Extrato[],
  filtros: FiltrosState,
  ordenacao: "asc" | "desc"
) {
  return filtrarExtratos(extratos, filtros).sort((a, b) => {
    const diff = a.data_transacao.localeCompare(b.data_transacao);
    return ordenacao === "desc" ? -diff : diff;
  });
}
