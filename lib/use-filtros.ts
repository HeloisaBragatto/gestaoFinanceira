"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FILTROS_INICIAIS,
  periodoPreset,
  normalizarFiltros,
  removerFiltro,
  validarFiltros,
  type FiltrosState,
  type PresetPeriodo,
} from "@/lib/finance/filtros";

/**
 * Estado dos filtros com a separação "rascunho x aplicados":
 * o usuário edita o rascunho e só ao clicar em "Aplicar" a consulta,
 * os totais, os gráficos e as exportações passam a usá-lo.
 */
export function useFiltros(periodoInicial?: PresetPeriodo) {
  // Com período inicial, o preset (que depende da data do navegador) é aplicado
  // logo após a montagem; `pronto` evita uma consulta desnecessária antes disso.
  const [pronto, setPronto] = useState(!periodoInicial);
  const [rascunho, setRascunho] = useState<FiltrosState>(FILTROS_INICIAIS);
  const [aplicados, setAplicados] = useState<FiltrosState>(FILTROS_INICIAIS);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!periodoInicial) return;
    const inicial = { ...FILTROS_INICIAIS, ...periodoPreset(periodoInicial) };
    setRascunho(inicial);
    setAplicados(inicial);
    setPronto(true);
    // roda só na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicar = useCallback(
    (proximo?: FiltrosState) => {
      const alvo = normalizarFiltros(proximo ?? rascunho);
      const invalido = validarFiltros(alvo);
      if (invalido) {
        setErro(invalido);
        return false;
      }
      setErro(null);
      setRascunho(alvo);
      setAplicados(alvo);
      return true;
    },
    [rascunho]
  );

  const limpar = useCallback(() => {
    setErro(null);
    setRascunho(FILTROS_INICIAIS);
    setAplicados(FILTROS_INICIAIS);
  }, []);

  const remover = useCallback(
    (chave: keyof FiltrosState) => {
      const proximo = removerFiltro(aplicados, chave);
      setErro(null);
      setRascunho(proximo);
      setAplicados(proximo);
    },
    [aplicados]
  );

  const alterado =
    JSON.stringify(normalizarFiltros(rascunho)) !==
    JSON.stringify(normalizarFiltros(aplicados));

  return {
    pronto,
    rascunho,
    setRascunho,
    aplicados,
    aplicar,
    limpar,
    remover,
    erro,
    alterado,
  };
}
