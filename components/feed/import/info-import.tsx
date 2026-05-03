import { Info } from "lucide-react";

const PASSOS = [
  {
    num: 1,
    titulo: "Selecione o arquivo",
    desc: "PDF do banco ou foto do extrato (JPG, PNG)",
  },
  {
    num: 2,
    titulo: "Processamento automático",
    desc: "O sistema extrai as transações usando OCR ou leitura de PDF",
  },
  {
    num: 3,
    titulo: "Revise os dados",
    desc: "Veja as transações encontradas antes de salvar",
  },
  {
    num: 4,
    titulo: "Pronto!",
    desc: "As transações são adicionadas automaticamente aos extratos",
  },
];

const BANCOS = [
  "Nubank",
  "Inter",
  "Itaú",
  "Bradesco",
  "C6 Bank",
  "Santander",
  "Caixa",
  "BB",
];

export function InfoImportar() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Info size={15} className="text-darkBlue mt-0.5 shrink-0" />
        <p className="text-xs text-gray-700 leading-relaxed">
          Para melhores resultados, use o{" "}
          <strong>PDF gerado pelo seu banco</strong>. Imagens são processadas
          com OCR automaticamente.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
        <p className="text-sm font-semibold text-gray-900 mb-4">
          Como funciona
        </p>
        <div className="flex flex-col gap-3">
          {PASSOS.map((p) => (
            <div key={p.num} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-darkBlue text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {p.num}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{p.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Bancos suportados
        </p>
        <div className="flex flex-wrap gap-2">
          {BANCOS.map((b) => (
            <span
              key={b}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-600"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
