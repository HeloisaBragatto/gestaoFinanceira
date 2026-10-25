"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useImportar } from "@/lib/use-imports";

import { UploadZona } from "@/components/feed/import/upload-import";
import { FeedbackStatus } from "@/components/feed/import/feedback-import";
import { PreviewTransacoes } from "@/components/feed/import/preview-import";
import { InfoImportar } from "@/components/feed/import/info-import";
import { ListaArquivos } from "@/components/feed/import/lista-arquivos-import";

export default function ImportarPage() {
  const {
    files,
    resultados,
    pendentes,
    status,
    mensagem,
    transacoes,
    adicionarArquivos,
    handleFileChange,
    removerArquivo,
    limparLista,
    handleSubmit,
  } = useImportar();

  const carregando = status === "loading";

  return (
    <section className="mt-16 lg:mt-5">
      {/* Conteúdo principal */}
      <div className="row">
        <div className="container">
          {/* Cabeçalho */}
          <div className="mb-5">
            <h1 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">
              Importar extrato
            </h1>

            <p className="mt-1 max-w-3xl break-words text-sm text-pretty text-gray-500">
              Envie um ou mais PDFs ou imagens dos seus extratos bancários para
              extrair as transações automaticamente.
            </p>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* Coluna principal */}
            <div className="flex w-full min-w-0 flex-col gap-4">
              {/* Painel de importação */}
              <div className="flex w-full min-w-0 flex-col gap-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                {/* Área de envio */}
                <div className="w-full min-w-0">
                  <UploadZona
                    total={files.length}
                    disabled={carregando}
                    onChange={handleFileChange}
                    onArquivos={adicionarArquivos}
                  />
                </div>

                {/* Arquivos selecionados */}
                <div className="w-full min-w-0">
                  <ListaArquivos
                    files={files}
                    resultados={resultados}
                    disabled={carregando}
                    onRemover={removerArquivo}
                    onLimpar={limparLista}
                  />
                </div>

                {/* Mensagem de status */}
                <div className="w-full min-w-0">
                  <FeedbackStatus status={status} mensagem={mensagem} />
                </div>

                {/* Botão de envio */}
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={pendentes === 0 || carregando}
                  className="h-10 w-full min-w-0 rounded-lg bg-darkBlue! text-brand-darkBlue! hover:bg-darkBlue/90!"
                >
                  {carregando ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={15} className="animate-spin" />
                      Processando...
                    </span>
                  ) : pendentes > 1 ? (
                    `Enviar ${pendentes} extratos`
                  ) : (
                    "Enviar extrato"
                  )}
                </Button>
              </div>

              {/* Prévia das transações */}
              <div className="w-full min-w-0">
                <PreviewTransacoes transacoes={transacoes} />
              </div>
            </div>

            {/* Informações auxiliares */}
            <aside className="w-full min-w-0">
              <InfoImportar />
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
