"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { buscarTodosExtratos } from "@/lib/finance/consulta";
import { FILTROS_INICIAIS } from "@/lib/finance/filtros";
import {
  mesesComparaveisAnteriores,
  normalizarMeses,
  primeiroDiaDoMes,
  ultimoDiaDoMes,
} from "@/lib/finance/meses";
import { Extrato } from "./finance/types";

const supabase = createClient();

/** Anos para o seletor: do ano da movimentação mais antiga até o próximo ano. */
export function useAnosDisponiveis(anoAtual: number): number[] {
  const [anoMinimo, setAnoMinimo] = useState(anoAtual - 1);

  useEffect(() => {
    let cancelado = false;
    supabase
      .from("extratos")
      .select("data_transacao")
      .order("data_transacao", { ascending: true })
      .limit(1)
      .then(({ data }) => {
        const primeira = data?.[0]?.data_transacao as string | undefined;
        if (!cancelado && primeira)
          setAnoMinimo(Math.min(Number(primeira.slice(0, 4)), anoAtual - 1));
      });
    return () => {
      cancelado = true;
    };
  }, [anoAtual]);

  const anos: number[] = [];
  for (let a = anoMinimo; a <= anoAtual + 1; a++) anos.push(a);
  return anos;
}

/**
 * Carrega, numa única consulta, as movimentações do intervalo dos meses
 * selecionados (a filtragem mês a mês é feita depois, em memória, o que evita
 * duplicar registros) e, quando a seleção é contínua, as do período anterior.
 */
export function useMetricasMensais(
  mesesSelecionados: string[],
  categoria: string,
  habilitado: boolean
) {
  const [extratos, setExtratos] = useState<Extrato[]>([]);
  const [anteriores, setAnteriores] = useState<Extrato[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const chave = JSON.stringify({
    meses: normalizarMeses(mesesSelecionados),
    categoria,
  });

  useEffect(() => {
    if (!habilitado) return;
    const { meses, categoria: cat } = JSON.parse(chave) as {
      meses: string[];
      categoria: string;
    };
    let cancelado = false;

    if (meses.length === 0) {
      setExtratos([]);
      setAnteriores(null);
      setErro(null);
      setLoading(false);
      return;
    }

    const consultar = (lista: string[]) =>
      buscarTodosExtratos(supabase, {
        ...FILTROS_INICIAIS,
        categoria: cat,
        dataInicio: primeiroDiaDoMes(lista[0]),
        dataFim: ultimoDiaDoMes(lista[lista.length - 1]),
      });

    const mesesAnt = mesesComparaveisAnteriores(meses);
    setLoading(true);
    setErro(null);

    Promise.all([consultar(meses), mesesAnt ? consultar(mesesAnt) : null])
      .then(([atual, anterior]) => {
        if (cancelado) return;
        setExtratos(atual);
        setAnteriores(anterior);
      })
      .catch((e) => {
        if (cancelado) return;
        setExtratos([]);
        setAnteriores(null);
        setErro(
          `Não foi possível carregar as métricas. ${e instanceof Error ? e.message : ""}`
        );
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [chave, habilitado]);

  return { extratos, anteriores, loading, erro };
}
