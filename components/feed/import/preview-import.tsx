import { Transacao } from "@/lib/use-imports";

interface PreviewTransacoesProps {
  transacoes: Transacao[];
}

export function PreviewTransacoes({ transacoes }: PreviewTransacoesProps) {
  if (transacoes.length === 0) return null;

  const formatarValor = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatarData = (d: string) => {
    const [ano, mes, dia] = d.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">
          Transações encontradas
        </span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
          ✓ {transacoes.length} encontradas
        </span>
      </div>

      <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
        {transacoes.map((t, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-900">
                {t.descricao}
              </span>
              <span className="text-xs text-gray-500">
                {t.categoria} · {formatarData(t.data_transacao)}
              </span>
            </div>
            <span
              className={`text-sm font-semibold tabular-nums ${
                t.tipo === "recebimento" ? "text-green-600" : "text-red-500"
              }`}
            >
              {t.tipo === "recebimento" ? "+" : "-"} {formatarValor(t.valor)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
