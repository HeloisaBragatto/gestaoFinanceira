"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type Extrato = {
  id: string;
  tipo: "pagamento" | "recebimento";
  descricao: string;
  categoria: string | null;
  valor: number;
  data_transacao: string;
  origem: string;
};

export type FiltrosState = {
  tipo: "todos" | "pagamento" | "recebimento";
  categoria: string;
  dataInicio: string;
  dataFim: string;
  busca: string;
};

export const CATEGORIAS = [
  "alimentação",
  "salário",
  "transporte",
  "saúde",
  "lazer",
  "moradia",
  "transferência",
  "compras",
  "despesas",
  "outro",
];

export function useExtratos() {
  const [extratos, setExtratos] = useState<Extrato[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchExtratos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("extratos")
      .select("*")
      .order("data_transacao", { ascending: false });
    setExtratos(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExtratos();
  }, [fetchExtratos]);

  const salvarEdicao = async (id: string, form: Partial<Extrato>) => {
    await supabase
      .from("extratos")
      .update({
        tipo: form.tipo,
        descricao: form.descricao,
        categoria: form.categoria,
        valor: form.valor,
        data_transacao: form.data_transacao,
      })
      .eq("id", id);
    fetchExtratos();
  };

  const deletarExtrato = async (id: string) => {
    await supabase.from("extratos").delete().eq("id", id);
    fetchExtratos();
  };

  const adicionarExtrato = async (form: Partial<Extrato>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("extratos").insert({
      user_id: user.id,
      tipo: form.tipo,
      descricao: form.descricao,
      categoria: form.categoria,
      valor: form.valor,
      data_transacao: form.data_transacao,
      origem: "manual",
    });
    fetchExtratos();
  };

  return {
    extratos,
    loading,
    fetchExtratos,
    salvarEdicao,
    deletarExtrato,
    adicionarExtrato,
  };
}

export function useExtratosFiltrados(
  extratos: Extrato[],
  filtros: FiltrosState,
  ordenacao: "asc" | "desc"
) {
  return extratos
    .filter((e) => filtros.tipo === "todos" || e.tipo === filtros.tipo)
    .filter(
      (e) => filtros.categoria === "todas" || e.categoria === filtros.categoria
    )
    .filter(
      (e) => !filtros.dataInicio || e.data_transacao >= filtros.dataInicio
    )
    .filter((e) => !filtros.dataFim || e.data_transacao <= filtros.dataFim)
    .filter(
      (e) =>
        !filtros.busca ||
        e.descricao.toLowerCase().includes(filtros.busca.toLowerCase()) ||
        (e.categoria ?? "").toLowerCase().includes(filtros.busca.toLowerCase())
    )
    .sort((a, b) => {
      const diff = a.data_transacao.localeCompare(b.data_transacao);
      return ordenacao === "desc" ? -diff : diff;
    });
}

export function formatarValor(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(d: string) {
  const [ano, mes, dia] = d.split("-");
  return `${dia}/${mes}/${ano}`;
}
