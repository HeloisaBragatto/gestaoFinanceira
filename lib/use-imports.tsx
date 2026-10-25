"use client";

import { useState } from "react";
import {
  adicionarNaLista,
  chaveArquivo,
  ehImagem,
  ProcessadorArquivo,
  processarLote,
  ResultadoArquivo,
  resumirLote,
  Transacao,
} from "./importacao-lote";

export type Status = "idle" | "loading" | "success" | "error";

async function extrairTextoImagem(
  file: File,
  onProgress: (msg: string) => void
): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("por", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        const pct = Math.round((m.progress ?? 0) * 100);
        onProgress(`Lendo imagem... ${pct}%`);
      }
    },
  });
  const url = URL.createObjectURL(file);
  const { data } = await worker.recognize(url);
  URL.revokeObjectURL(url);
  await worker.terminate();
  return data.text ?? "";
}

/** Envia UM arquivo para a API (mesma lógica de antes: imagem passa por OCR no navegador). */
const processarArquivo: ProcessadorArquivo<File> = async (
  file,
  onProgresso
) => {
  const formData = new FormData();

  if (ehImagem(file)) {
    onProgresso("Iniciando leitura da imagem...");
    const texto = await extrairTextoImagem(file, onProgresso);

    if (!texto || texto.trim().length < 20) {
      throw new Error(
        "Não foi possível ler o texto da imagem. Tente uma foto com melhor iluminação e foco."
      );
    }
    formData.append("texto", texto);
    formData.append("nomeArquivo", file.name);
  } else {
    formData.append("file", file);
  }

  onProgresso("Processando extrato...");
  const res = await fetch("/api/importar-extrato", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro ao processar o arquivo.");

  return {
    transacoes: data.transacoes as Transacao[],
    duplicadas: data.duplicadas ?? 0,
  };
};

export function useImportar() {
  const [files, setFiles] = useState<File[]>([]);
  const [resultados, setResultados] = useState<
    Record<string, ResultadoArquivo>
  >({});
  const [status, setStatus] = useState<Status>("idle");
  const [mensagem, setMensagem] = useState("");
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);

  const carregando = status === "loading";

  /** Aceita vários arquivos (seleção múltipla ou arrastar e soltar). */
  const adicionarArquivos = (novos: File[]) => {
    if (novos.length === 0 || carregando) return;
    const { lista, aviso } = adicionarNaLista(files, novos);
    setFiles(lista);
    setStatus(aviso ? "error" : "idle");
    setMensagem(aviso);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    adicionarArquivos(Array.from(e.target.files ?? []));
    e.target.value = ""; // permite escolher o mesmo arquivo de novo
  };

  const removerArquivo = (arquivo: File) => {
    if (carregando) return;
    const k = chaveArquivo(arquivo);
    setFiles((l) => l.filter((f) => chaveArquivo(f) !== k));
    setResultados((r) => {
      const { [k]: _removido, ...resto } = r;
      void _removido;
      return resto;
    });
  };

  const limparLista = () => {
    if (carregando) return;
    setFiles([]);
    setResultados({});
    setTransacoes([]);
    setStatus("idle");
    setMensagem("");
  };

  // Arquivos ainda não importados (os já importados não são reenviados).
  const pendentes = files.filter(
    (f) => resultados[chaveArquivo(f)]?.status !== "ok"
  );

  const handleSubmit = async () => {
    if (pendentes.length === 0 || carregando) return;

    setStatus("loading");
    setMensagem("");

    const { resultados: finais, novasTransacoes } = await processarLote({
      arquivos: files,
      anteriores: resultados,
      processar: processarArquivo,
      onAtualizar: (r, progresso) => {
        setResultados(r);
        if (progresso) setMensagem(progresso);
      },
    });

    setTransacoes((anteriores) => [...anteriores, ...novasTransacoes]);
    const resumo = resumirLote(finais);
    setStatus(resumo.ok === 0 ? "error" : "success");
    setMensagem(resumo.texto);
  };

  return {
    files,
    resultados,
    pendentes: pendentes.length,
    status,
    mensagem,
    transacoes,
    adicionarArquivos,
    handleFileChange,
    removerArquivo,
    limparLista,
    handleSubmit,
  };
}
