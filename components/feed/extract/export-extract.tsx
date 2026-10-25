"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { FormatoRelatorio } from "@/lib/finance/relatorio";
import { FiltrosState } from "@/lib/finance/filtros";
import { baixarRelatorio } from "@/lib/finance/download";

const formatos: {
  id: FormatoRelatorio;
  rotulo: string;
  icone: typeof FileText;
}[] = [
  { id: "pdf", rotulo: "PDF", icone: FileText },
  { id: "xlsx", rotulo: "Excel", icone: FileSpreadsheet },
  { id: "csv", rotulo: "CSV", icone: FileDown },
];

interface ExportarProps {
  filtros: FiltrosState;
  totalRegistros: number;
  desabilitado?: boolean;
}

export function ExportarRelatorio({
  filtros,
  totalRegistros,
  desabilitado,
}: ExportarProps) {
  const [gerando, setGerando] = useState<FormatoRelatorio | null>(null);
  const [mensagem, setMensagem] = useState<{
    tipo: "ok" | "erro";
    texto: string;
  } | null>(null);

  const exportar = async (formato: FormatoRelatorio) => {
    setGerando(formato);
    setMensagem(null);
    try {
      await baixarRelatorio(formato, filtros);
      setMensagem({
        tipo: "ok",
        texto: `Relatório ${formato.toUpperCase()} gerado com ${totalRegistros.toLocaleString("pt-BR")} movimentações.`,
      });
    } catch (e) {
      setMensagem({
        tipo: "erro",
        texto: e instanceof Error ? e.message : "Erro ao gerar o relatório.",
      });
    } finally {
      setGerando(null);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 items-start md:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Exportar:</span>
        <div className="flex gap-2">
          {formatos.map(({ id, rotulo, icone: Icone }) => (
            <button
              key={id}
              type="button"
              onClick={() => exportar(id)}
              disabled={desabilitado || gerando !== null}
              title={
                desabilitado
                  ? "Não há movimentações para exportar"
                  : `Exportar ${totalRegistros} movimentações em ${rotulo}`
              }
              className="btn-darkBlue"
            >
              {gerando === id ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Icone size={15} />
              )}
              {rotulo}
            </button>
          ))}
        </div>
      </div>
      {mensagem && (
        <p
          role={mensagem.tipo === "erro" ? "alert" : "status"}
          className={`text-xs ${mensagem.tipo === "erro" ? "text-red-500" : "text-green-600"}`}
        >
          {mensagem.texto}
        </p>
      )}
    </div>
  );
}
