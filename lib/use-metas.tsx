"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { dataLocalIso, montarMetas } from "@/lib/metas/calculos";
import { Contribuicao, Meta } from "./metas/types";
import {
  adicionarContribuicao,
  atualizarContribuicao,
  atualizarMeta,
  carregarMetas,
  criarMeta,
  DadosMeta,
  ErroMetas,
  excluirContribuicao,
  excluirMeta,
} from "./metas/servico";
import { ContribuicaoFormValores } from "./metas/validacao";
const supabase = createClient();

/**
 * Metas e contribuições do usuário (persistidas no Supabase).
 * As funções de escrita retornam a mensagem de erro (ou null em caso de sucesso)
 * e recarregam os dados, de modo que a tela sempre reflete o que está no banco.
 */
export function useMetas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [contribuicoes, setContribuicoes] = useState<Contribuicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [tabelasAusentes, setTabelasAusentes] = useState(false);

  const recarregar = useCallback(async () => {
    try {
      const dados = await carregarMetas(supabase);
      setMetas(dados.metas);
      setContribuicoes(dados.contribuicoes);
      setErro(null);
      setTabelasAusentes(false);
    } catch (e) {
      setMetas([]);
      setContribuicoes([]);
      setErro(e instanceof Error ? e.message : "Erro ao carregar as metas.");
      setTabelasAusentes(e instanceof ErroMetas && e.tabelasAusentes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const usuario = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  const executar = async (acao: () => Promise<string | null>) => {
    const msg = await acao();
    if (!msg) await recarregar();
    return msg;
  };

  const calculadas = useMemo(
    () => montarMetas(metas, contribuicoes, dataLocalIso()),
    [metas, contribuicoes]
  );

  return {
    metas: calculadas,
    loading,
    erro,
    tabelasAusentes,
    criar: (id: string, dados: DadosMeta) =>
      executar(async () => {
        const uid = await usuario();
        return uid
          ? criarMeta(supabase, uid, id, dados)
          : "Sessão expirada. Entre novamente.";
      }),
    editar: (id: string, dados: DadosMeta) =>
      executar(() => atualizarMeta(supabase, id, dados)),
    excluir: (id: string) => executar(() => excluirMeta(supabase, id)),
    adicionarContribuicao: (
      id: string,
      metaId: string,
      dados: ContribuicaoFormValores
    ) =>
      executar(async () => {
        const uid = await usuario();
        return uid
          ? adicionarContribuicao(supabase, uid, id, metaId, dados)
          : "Sessão expirada. Entre novamente.";
      }),
    editarContribuicao: (id: string, dados: ContribuicaoFormValores) =>
      executar(() => atualizarContribuicao(supabase, id, dados)),
    excluirContribuicao: (id: string) =>
      executar(() => excluirContribuicao(supabase, id)),
  };
}
