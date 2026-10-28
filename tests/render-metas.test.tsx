import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MetaCard } from "@/components/feed/metas/meta-card";
import { ResumoMetasCards } from "@/components/feed/metas/resumo-metas";
import { SeletorMeses, descreverSelecao } from "@/components/feed/graphic/seletor-meses";
import { montarMetas, resumirMetas } from "@/lib/metas/calculos";
import type { Contribuicao, Meta } from "@/lib/metas/types";

const nb = (t: string) => t.replace(/\u00a0/g, " ");
const HOJE = "2026-10-24";

const meta: Meta = {
  id: "m1", nome: "Celular novo", valor_alvo: 3000, valor_inicial: 300,
  data_criacao: "2026-09-01", data_prevista: "2026-10-01", categoria: "eletrônicos", descricao: "iPhone",
};
const contribs: Contribuicao[] = [
  { id: "c1", meta_id: "m1", valor: 100, data: "2026-10-01", observacao: "freela" },
  { id: "c2", meta_id: "m1", valor: 150, data: "2026-10-10", observacao: null },
];
const [calc] = montarMetas([meta], contribs, HOJE);

const props = {
  onEditar: vi.fn(), onExcluir: vi.fn(), onAdicionar: vi.fn(),
  onEditarContribuicao: vi.fn(), onExcluirContribuicao: vi.fn(), onFeedback: vi.fn(),
};

describe("MetaCard", () => {
  it("mostra desejado, acumulado, falta, percentual, prazo e situação", () => {
    const html = nb(renderToStaticMarkup(<MetaCard meta={calc} {...props} />));
    expect(html).toContain("Celular novo");
    expect(html).toContain("iPhone");
    expect(html).toContain("R$ 3.000,00");
    expect(html).toContain("R$ 550,00");
    expect(html).toContain("R$ 2.450,00");
    expect(html).toContain("18,33%");
    expect(html).toContain("Prazo ultrapassado");
    expect(html).toContain("ultrapassado há 23 dias");
    expect(html).toContain('aria-valuenow="18.33"');
    expect(html).toContain("width:18.33%");
    expect(html).toContain("Histórico (2)");
  });

  it("meta concluída: 100%, excedente, sem 'prazo ultrapassado'", () => {
    const [c] = montarMetas([{ ...meta, valor_alvo: 400 }], contribs, HOJE);
    const html = nb(renderToStaticMarkup(<MetaCard meta={c} {...props} />));
    expect(html).toContain("Concluída");
    expect(html).not.toContain("Prazo ultrapassado");
    expect(html).toContain("100%");
    expect(html).toContain("Excedente");
    expect(html).toContain("R$ 150,00");
    expect(html).toContain("width:100%");
  });

  it("histórico lista as contribuições com data, valor e observação", () => {
    const html = nb(renderToStaticMarkup(<MetaCard meta={calc} {...props} painelInicial="historico" />));
    expect(html).toContain("10/10/2026");
    expect(html).toContain("R$ 150,00");
    expect(html).toContain("freela");
    expect(html).toContain("Valor inicial");
    expect(html).toContain('aria-label="Corrigir contribuição"');
    expect(html).toContain('aria-label="Excluir contribuição"');
  });

  it("histórico vazio informa que nada foi adicionado", () => {
    const [vazia] = montarMetas([meta], [], HOJE);
    const html = renderToStaticMarkup(<MetaCard meta={vazia} {...props} painelInicial="historico" />);
    expect(html).toContain("Nenhum valor adicionado ainda.");
  });

  it("exclusão pede confirmação e avisa sobre as contribuições", () => {
    const html = nb(renderToStaticMarkup(<MetaCard meta={calc} {...props} painelInicial="excluir" />));
    expect(html).toContain("Excluir a meta");
    expect(html).toContain("As 2 contribuições do histórico também serão apagadas");
    expect(html).toContain("Sim, excluir meta");
    expect(html).toContain("não afeta suas receitas e despesas");
    expect(props.onExcluir).not.toHaveBeenCalled();
  });

  it("formulário de adicionar valor traz valor, data (hoje) e observação", () => {
    const html = renderToStaticMarkup(<MetaCard meta={calc} {...props} painelInicial="adicionar" />);
    expect(html).toContain("Valor (R$)");
    expect(html).toContain("Observação");
    expect(html).toContain('type="date"');
    expect(html).toContain("Adicionar valor");
  });

  it("formulário de edição vem preenchido com os dados da meta", () => {
    const html = renderToStaticMarkup(<MetaCard meta={calc} {...props} painelInicial="editar" />);
    expect(html).toContain('value="Celular novo"');
    expect(html).toContain('value="3000"');
    expect(html).toContain('value="2026-10-01"');
    expect(html).toContain("Salvar alterações");
  });
});

describe("ResumoMetasCards", () => {
  it("mostra indicadores gerais e deixa claro que é controle manual", () => {
    const html = nb(renderToStaticMarkup(<ResumoMetasCards resumo={resumirMetas([calc])} />));
    expect(html).toContain("Metas cadastradas");
    expect(html).toContain("R$ 550,00");
    expect(html).toContain("R$ 2.450,00");
    expect(html).toContain("18,33%");
    expect(html).toContain("não é o saldo das suas contas");
  });
  it("sem metas: progresso geral indisponível ('—')", () => {
    const html = renderToStaticMarkup(<ResumoMetasCards resumo={resumirMetas([])} />);
    expect(html).toContain("—");
  });
});

describe("SeletorMeses", () => {
  const hoje = new Date(2026, 9, 24);
  const render = (sel: string[]) =>
    renderToStaticMarkup(
      <SeletorMeses selecionados={sel} onChange={() => {}} anos={[2025, 2026, 2027]} hoje={hoje} padrao={[]} />
    );

  it("destaca os meses selecionados do ano exibido e descreve a seleção", () => {
    const html = render(["2026-08", "2026-09", "2026-10"]);
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(3);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(9);
    expect(html).toContain("Ago/2026 a Out/2026 (3 meses)");
  });
  it("seleção vazia", () => {
    const html = render([]);
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).toContain("Nenhum mês selecionado");
  });
  it("descrição de seleções: um mês, contínua e não consecutiva", () => {
    expect(descreverSelecao(["2026-03"])).toBe("Mar/2026 (1 mês)");
    expect(descreverSelecao(["2025-12", "2026-01"])).toBe("Dez/2025 a Jan/2026 (2 meses)");
    expect(descreverSelecao(["2026-01", "2026-03", "2026-03"])).toBe("Jan/2026, Mar/2026 (2 meses, não consecutivos)");
  });
});
