"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { dataLocalIso } from "@/lib/metas/calculos";
import {
  validarContribuicaoForm,
  validarMetaForm,
  type ContribuicaoFormValores,
  type MetaFormValores,
} from "@/lib/metas/validacao";
import { CATEGORIAS_META, Contribuicao, Meta } from "@/lib/metas/types";
import { novoUuid } from "@/lib/uuid";

const campo =
  "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 outline-none focus:border-[#021A49] focus:ring-1 focus:ring-[#021A49]/20 transition-all";
const rotulo = "text-xs font-medium text-gray-500";

function Campo({
  id,
  label,
  children,
  dica,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  dica?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={rotulo}>
        {label}
      </label>
      {children}
      {dica && <span className="text-[11px] text-gray-400">{dica}</span>}
    </div>
  );
}

// ── Meta (criar / editar) ────────────────────────────────────

interface MetaFormProps {
  /** Presente = edição. */
  inicial?: Meta;
  /** `id` é estável durante a vida do formulário (evita criar a meta duas vezes). */
  onSalvar: (id: string, dados: MetaFormValores) => Promise<string | null>;
  onCancelar: () => void;
}

export function MetaForm({ inicial, onSalvar, onCancelar }: MetaFormProps) {
  const idRef = useRef(inicial?.id ?? novoUuid());
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [valorAlvo, setValorAlvo] = useState(
    inicial ? String(inicial.valor_alvo) : ""
  );
  const [valorInicial, setValorInicial] = useState(
    inicial && inicial.valor_inicial > 0 ? String(inicial.valor_inicial) : ""
  );
  const [dataCriacao, setDataCriacao] = useState(
    inicial?.data_criacao ?? dataLocalIso()
  );
  const [dataPrevista, setDataPrevista] = useState(
    inicial?.data_prevista ?? ""
  );
  const [categoria, setCategoria] = useState(inicial?.categoria ?? "");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const categorias =
    categoria && !CATEGORIAS_META.includes(categoria)
      ? [categoria, ...CATEGORIAS_META]
      : CATEGORIAS_META;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    const dados: MetaFormValores = {
      nome,
      valor_alvo: valorAlvo,
      valor_inicial: valorInicial,
      data_criacao: dataCriacao,
      data_prevista: dataPrevista || null,
      categoria: categoria || null,
      descricao,
    };
    const invalido = validarMetaForm(dados);
    if (invalido) {
      setErro(invalido);
      return;
    }
    setErro(null);
    setEnviando(true);
    const falha = await onSalvar(idRef.current, dados);
    if (falha) {
      setErro(falha);
      setEnviando(false);
    }
  };

  return (
    <form
      onSubmit={enviar}
      className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex flex-col gap-4"
      aria-label={inicial ? "Editar meta" : "Nova meta"}
    >
      <h3 className="font-bold text-gray-900">
        {inicial ? "Editar meta" : "Nova meta"}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Campo id="meta-nome" label="Nome da meta *">
          <input
            id="meta-nome"
            className={campo}
            maxLength={80}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Viagem, celular, reserva"
          />
        </Campo>
        <Campo id="meta-alvo" label="Valor desejado (R$) *">
          <input
            id="meta-alvo"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            className={campo}
            value={valorAlvo}
            onChange={(e) => setValorAlvo(e.target.value)}
            placeholder="0,00"
          />
        </Campo>
        <Campo
          id="meta-inicial"
          label="Valor já guardado (R$)"
          dica="Opcional. Vazio = R$ 0,00"
        >
          <input
            id="meta-inicial"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className={campo}
            value={valorInicial}
            onChange={(e) => setValorInicial(e.target.value)}
            placeholder="0,00"
          />
        </Campo>
        <Campo id="meta-criacao" label="Data de criação *">
          <input
            id="meta-criacao"
            type="date"
            className={campo}
            value={dataCriacao}
            onChange={(e) => setDataCriacao(e.target.value)}
          />
        </Campo>
        <Campo id="meta-prevista" label="Data prevista" dica="Opcional">
          <input
            id="meta-prevista"
            type="date"
            className={campo}
            value={dataPrevista}
            onChange={(e) => setDataPrevista(e.target.value)}
          />
        </Campo>
        <Campo id="meta-categoria" label="Categoria" dica="Opcional">
          <select
            id="meta-categoria"
            className={campo}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Sem categoria</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <Campo
        id="meta-descricao"
        label="Descrição / observações"
        dica="Opcional (até 500 caracteres)"
      >
        <textarea
          id="meta-descricao"
          className={`${campo} min-h-[72px]`}
          maxLength={500}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </Campo>

      {erro && (
        <p role="alert" className="text-sm text-red-500">
          {erro}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={enviando}
          className="bg-[#021A49] hover:bg-[#021A49]/90 text-white rounded-lg"
        >
          {enviando
            ? "Salvando..."
            : inicial
              ? "Salvar alterações"
              : "Criar meta"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancelar}
          disabled={enviando}
          className="rounded-lg border-gray-200 text-gray-600"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// ── Contribuição (adicionar / corrigir) ──────────────────────

interface ContribuicaoFormProps {
  inicial?: Contribuicao;
  onSalvar: (
    id: string,
    dados: ContribuicaoFormValores
  ) => Promise<string | null>;
  onCancelar: () => void;
}

export function ContribuicaoForm({
  inicial,
  onSalvar,
  onCancelar,
}: ContribuicaoFormProps) {
  const idRef = useRef(inicial?.id ?? novoUuid());
  const [valor, setValor] = useState(inicial ? String(inicial.valor) : "");
  const [data, setData] = useState(inicial?.data ?? dataLocalIso());
  const [observacao, setObservacao] = useState(inicial?.observacao ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    const dados: ContribuicaoFormValores = { valor, data, observacao };
    const invalido = validarContribuicaoForm(dados, dataLocalIso());
    if (invalido) {
      setErro(invalido);
      return;
    }
    setErro(null);
    setEnviando(true);
    const falha = await onSalvar(idRef.current, dados);
    if (falha) {
      setErro(falha);
      setEnviando(false);
    }
  };

  const prefixo = inicial ? `contrib-${inicial.id}` : "contrib-nova";

  return (
    <form
      onSubmit={enviar}
      className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3"
      aria-label={inicial ? "Corrigir contribuição" : "Adicionar valor à meta"}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Campo id={`${prefixo}-valor`} label="Valor (R$) *">
          <input
            id={`${prefixo}-valor`}
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            className={campo}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            autoFocus
          />
        </Campo>
        <Campo id={`${prefixo}-data`} label="Data">
          <input
            id={`${prefixo}-data`}
            type="date"
            className={campo}
            value={data}
            max={dataLocalIso()}
            onChange={(e) => setData(e.target.value)}
          />
        </Campo>
        <Campo id={`${prefixo}-obs`} label="Observação">
          <input
            id={`${prefixo}-obs`}
            className={campo}
            maxLength={300}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Opcional"
          />
        </Campo>
      </div>
      {erro && (
        <p role="alert" className="text-sm text-red-500">
          {erro}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={enviando}
          className="bg-[#021A49] hover:bg-[#021A49]/90 text-white rounded-lg"
        >
          {enviando
            ? "Salvando..."
            : inicial
              ? "Salvar correção"
              : "Adicionar valor"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCancelar}
          disabled={enviando}
          className="rounded-lg border-gray-200 text-gray-600"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
