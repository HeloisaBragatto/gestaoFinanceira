"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Status = "idle" | "loading" | "success" | "error";

export type Transacao = {
  tipo: "pagamento" | "recebimento";
  descricao: string;
  categoria: string;
  valor: number;
  data_transacao: string;
};

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

export function useImportar() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [mensagem, setMensagem] = useState("");
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const router = useRouter();

  const isImagem = file
    ? ["image/jpeg", "image/png", "image/webp"].includes(file.type)
    : false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setStatus("idle");
    setMensagem("");
    setTransacoes([]);

    if (["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setPreview(URL.createObjectURL(selected));
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setStatus("loading");
    setMensagem("");

    try {
      const formData = new FormData();

      if (isImagem) {
        setMensagem("Iniciando leitura da imagem...");
        const texto = await extrairTextoImagem(file, setMensagem);

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

      setMensagem("Processando extrato...");

      const res = await fetch("/api/importar-extrato", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.error ?? "Erro ao processar o arquivo.");

      setTransacoes(data.transacoes);
      setStatus("success");
      setMensagem(
        `${data.transacoes.length} transações encontradas e salvas com sucesso!`
      );

      setTimeout(() => router.push("/protected/extratos"), 2500);
    } catch (err: unknown) {
      setStatus("error");
      setMensagem(err instanceof Error ? err.message : "Erro inesperado.");
    }
  };

  return {
    file,
    preview,
    status,
    mensagem,
    transacoes,
    isImagem,
    handleFileChange,
    handleSubmit,
  };
}
