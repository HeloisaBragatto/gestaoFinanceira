"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, CheckCircle, AlertCircle, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Status = "idle" | "loading" | "success" | "error";

type Transacao = {
  tipo: "pagamento" | "recebimento";
  descricao: string;
  categoria: string;
  valor: number;
  data_transacao: string;
};

// OCR da imagem no navegador com Tesseract.js
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

export default function ImportarPage() {
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
        // Extrai o texto da imagem no navegador com Tesseract
        setMensagem("Iniciando leitura da imagem...");
        const texto = await extrairTextoImagem(file, setMensagem);

        if (!texto || texto.trim().length < 20) {
          throw new Error(
            "Não foi possível ler o texto da imagem. Tente uma foto com melhor iluminação e foco."
          );
        }

        // Envia o texto extraído para a API em vez do arquivo
        formData.append("texto", texto);
        formData.append("nomeArquivo", file.name);
      } else {
        // PDF vai direto para a API
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

  return (
    <div className="max-w-xl w-full h-full mx-auto flex flex-col items-center mt-[7%] gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar extrato</CardTitle>
          <CardDescription>
            Envie o PDF ou uma imagem do seu extrato bancário. As transações
            serão extraídas automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Aviso */}
          <div className="flex items-start gap-2 text-xs text-black bg-blue-50/20 rounded-md px-3 py-2">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>
              Aceitamos PDF e imagens (JPG, PNG). Para melhores resultados, use
              o PDF gerado diretamente pelo seu banco. Para imagens,
              certifique-se de que o texto está nítido e bem iluminado.
            </span>
          </div>

          {/* Área de upload */}
          <label
            htmlFor="file-input"
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-10 cursor-pointer transition-colors ${
              file
                ? "border-[#a2cef0] bg-[#a2cef0]/10"
                : "border-gray-300 hover:border-[#a2cef0] hover:bg-[#a2cef0]/5"
            }`}
          >
            <FileUp size={36} className="text-gray-400" />
            {file ? (
              <span className="text-sm font-medium text-gray-700">
                {file.name}
              </span>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-700">
                  Clique para selecionar o arquivo
                </span>
                <span className="text-xs text-gray-400">PDF, JPG ou PNG</span>
              </>
            )}
            <input
              id="file-input"
              type="file"
              accept=".pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Preview da imagem */}
          {preview && (
            <div className="rounded-md overflow-hidden border max-h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Preview do extrato"
                className="w-full object-contain max-h-48"
              />
            </div>
          )}

          {/* Feedback */}
          {status === "loading" && mensagem && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Loader2 size={16} className="animate-spin" />
              {mensagem}
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle size={16} />
              {mensagem}
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle size={16} />
              {mensagem}
            </div>
          )}

          {/* Preview das transações */}
          {transacoes.length > 0 && (
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {transacoes.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{t.descricao}</span>
                    <span className="text-xs text-gray-400">
                      {t.categoria} · {t.data_transacao}
                    </span>
                  </div>
                  <span
                    className={
                      t.tipo === "recebimento"
                        ? "text-green-600 font-medium"
                        : "text-red-500 font-medium"
                    }
                  >
                    {t.tipo === "recebimento" ? "+" : "-"} R${" "}
                    {t.valor.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!file || status === "loading"}
            className="w-full"
          >
            {status === "loading" ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Processando...
              </span>
            ) : (
              "Enviar extrato"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
