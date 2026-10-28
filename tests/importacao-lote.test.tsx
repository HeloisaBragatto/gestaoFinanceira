import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ListaArquivos } from "@/components/feed/import/lista-arquivos-import";
import { UploadZona } from "@/components/feed/import/upload-import";
import {
  MAX_ARQUIVOS,
  adicionarNaLista,
  chaveArquivo,
  processarLote,
  resumirLote,
  type ProcessadorArquivo,
  type ResultadoArquivo,
  type Transacao,
} from "@/lib/importacao-lote";

const arq = (name: string, type = "application/pdf", size = 1000, lastModified = 1) =>
  ({ name, type, size, lastModified }) as unknown as File;
const t = (d: string): Transacao => ({ tipo: "pagamento", descricao: d, categoria: "outro", valor: 10, data_transacao: "2026-10-01" });

describe("adicionar arquivos à lista", () => {
  it("aceita vários PDFs e imagens de uma vez", () => {
    const { lista, aviso } = adicionarNaLista([], [arq("a.pdf"), arq("b.png", "image/png"), arq("c.jpg", "image/jpeg"), arq("d.webp", "image/webp")]);
    expect(lista).toHaveLength(4);
    expect(aviso).toBe("");
  });
  it("PDF sem tipo MIME é reconhecido pela extensão", () => {
    expect(adicionarNaLista([], [arq("extrato.PDF", "")]).lista).toHaveLength(1);
  });
  it("ignora formatos não suportados e avisa", () => {
    const { lista, aviso } = adicionarNaLista([], [arq("a.pdf"), arq("planilha.xlsx", "application/vnd.ms-excel")]);
    expect(lista).toHaveLength(1);
    expect(aviso).toMatch(/1 arquivo ignorado/);
  });
  it("não repete o mesmo arquivo (nome + tamanho + data)", () => {
    const a = arq("a.pdf");
    const { lista, aviso } = adicionarNaLista([a], [arq("a.pdf"), arq("a.pdf", "application/pdf", 2000)]);
    expect(lista).toHaveLength(2); // o de outro tamanho é um arquivo diferente
    expect(aviso).toMatch(/1 arquivo já estava/);
  });
  it("respeita o limite por envio", () => {
    const muitos = Array.from({ length: MAX_ARQUIVOS + 3 }, (_, i) => arq(`f${i}.pdf`));
    const { lista, aviso } = adicionarNaLista([], muitos);
    expect(lista).toHaveLength(MAX_ARQUIVOS);
    expect(aviso).toMatch(/limite de 10/);
  });
});

describe("processar o lote", () => {
  const rodar = async (
    arquivos: File[],
    processar: ProcessadorArquivo<File>,
    anteriores: Record<string, ResultadoArquivo> = {}
  ) => {
    const historico: string[] = [];
    const r = await processarLote({
      arquivos,
      anteriores,
      processar,
      onAtualizar: (res) => historico.push(Object.values(res).map((x) => x.status[0]).join("")),
    });
    return { ...r, historico };
  };

  it("processa um por vez, na ordem, e soma as transações", async () => {
    const ordem: string[] = [];
    let emAndamento = 0;
    let maxSimultaneos = 0;
    const r = await rodar([arq("a.pdf"), arq("b.pdf"), arq("c.pdf")], async (f) => {
      emAndamento++;
      maxSimultaneos = Math.max(maxSimultaneos, emAndamento);
      ordem.push(f.name);
      await new Promise((ok) => setTimeout(ok, 5));
      emAndamento--;
      return { transacoes: [t(f.name), t(f.name + "2")], duplicadas: 1 };
    });
    expect(ordem).toEqual(["a.pdf", "b.pdf", "c.pdf"]);
    expect(maxSimultaneos).toBe(1);
    expect(r.novasTransacoes).toHaveLength(6);
    expect(resumirLote(r.resultados)).toMatchObject({ ok: 3, erros: 0, novas: 6, duplicadas: 3 });
  });

  it("um arquivo com erro não interrompe os outros", async () => {
    const r = await rodar([arq("a.pdf"), arq("ruim.pdf"), arq("c.pdf")], async (f) => {
      if (f.name === "ruim.pdf") throw new Error("Nenhuma transação encontrada.");
      return { transacoes: [t(f.name)], duplicadas: 0 };
    });
    const res = r.resultados;
    expect(res[chaveArquivo(arq("a.pdf"))].status).toBe("ok");
    expect(res[chaveArquivo(arq("ruim.pdf"))]).toMatchObject({ status: "erro", mensagem: "Nenhuma transação encontrada." });
    expect(res[chaveArquivo(arq("c.pdf"))].status).toBe("ok");
    expect(resumirLote(res).texto).toBe("2 de 3 arquivos processados · 2 transações novas · 1 arquivo com erro");
  });

  it("nova tentativa reenvia só o que falhou (os já importados não vão de novo)", async () => {
    const chamadas: string[] = [];
    const proc: ProcessadorArquivo<File> = async (f) => {
      chamadas.push(f.name);
      if (f.name === "b.pdf" && chamadas.filter((c) => c === "b.pdf").length === 1) throw new Error("falha de rede");
      return { transacoes: [t(f.name)], duplicadas: 0 };
    };
    const arquivos = [arq("a.pdf"), arq("b.pdf")];
    const primeira = await rodar(arquivos, proc);
    expect(chamadas).toEqual(["a.pdf", "b.pdf"]);
    const segunda = await rodar(arquivos, proc, primeira.resultados);
    expect(chamadas).toEqual(["a.pdf", "b.pdf", "b.pdf"]); // a.pdf não foi reenviado
    expect(segunda.processados).toBe(1);
    expect(resumirLote(segunda.resultados)).toMatchObject({ ok: 2, erros: 0 });
  });

  it("arquivo só com duplicadas conta como processado, sem transações novas", async () => {
    const r = await rodar([arq("a.pdf")], async () => ({ transacoes: [], duplicadas: 5 }));
    const res = r.resultados[chaveArquivo(arq("a.pdf"))];
    expect(res).toMatchObject({ status: "ok", novas: 0, duplicadas: 5 });
    expect(res.mensagem).toBe("Nenhuma transação nova (5 já cadastradas)");
  });

  it("todos com erro: nenhum processado", async () => {
    const r = await rodar([arq("a.pdf")], async () => {
      throw new Error("x");
    });
    expect(resumirLote(r.resultados)).toMatchObject({ ok: 0, erros: 1 });
  });

  it("mostra o andamento: pendente -> processando -> ok", async () => {
    const historico: string[] = [];
    await processarLote({
      arquivos: [arq("a.pdf"), arq("b.pdf")],
      anteriores: {},
      processar: async () => ({ transacoes: [], duplicadas: 0 }),
      onAtualizar: (res) => historico.push(Object.values(res).map((x) => x.status).join(",")),
    });
    expect(historico[0]).toBe("pendente,pendente"); // os dois entram na fila
    expect(historico).toContain("processando,pendente"); // o primeiro está em andamento
    expect(historico).toContain("ok,processando"); // depois o segundo
    expect(historico[historico.length - 1]).toBe("ok,ok");
  });
});

describe("telas da importação", () => {
  it("área de upload aceita seleção múltipla", () => {
    const html = renderToStaticMarkup(<UploadZona total={0} onChange={() => {}} onArquivos={() => {}} />);
    expect(html).toContain("multiple");
    expect(html).toContain("vários arquivos");
  });
  it("mostra a quantidade selecionada", () => {
    const html = renderToStaticMarkup(<UploadZona total={3} onChange={() => {}} onArquivos={() => {}} />);
    expect(html).toContain("3 arquivos selecionados");
  });
  it("lista cada arquivo com seu estado (ok, erro, na fila)", () => {
    const files = [arq("a.pdf"), arq("b.pdf"), arq("c.pdf")];
    const resultados: Record<string, ResultadoArquivo> = {
      [chaveArquivo(files[0])]: { status: "ok", mensagem: "4 transações salvas", novas: 4, duplicadas: 0 },
      [chaveArquivo(files[1])]: { status: "erro", mensagem: "Nenhuma transação encontrada.", novas: 0, duplicadas: 0 },
    };
    const html = renderToStaticMarkup(
      <ListaArquivos files={files} resultados={resultados} onRemover={() => {}} onLimpar={() => {}} />
    );
    expect(html).toContain("Arquivos (3)");
    expect(html).toContain("4 transações salvas");
    expect(html).toContain("Nenhuma transação encontrada.");
    expect(html).toContain("1 KB"); // c.pdf ainda sem resultado
    expect(html).toContain('aria-label="Remover a.pdf"');
  });
  it("sem arquivos não renderiza a lista", () => {
    expect(renderToStaticMarkup(<ListaArquivos files={[]} resultados={{}} onRemover={() => {}} onLimpar={() => {}} />)).toBe("");
  });
});
