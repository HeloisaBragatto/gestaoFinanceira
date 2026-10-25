import { MetricCard } from "@/components/card/metric-card";
import { formatarMoeda } from "@/lib/finance/formato";
import type { ResumoMetas } from "@/lib/metas/calculos";

export function ResumoMetasCards({ resumo }: { resumo: ResumoMetas }) {
  const pct =
    resumo.percentualGeral === null
      ? "—"
      : `${resumo.percentualGeral.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <MetricCard
        titulo="Metas cadastradas"
        valor={resumo.quantidade}
        detalhe={`${resumo.emAndamento} em andamento`}
      />
      <MetricCard
        titulo="Metas concluídas"
        valor={resumo.concluidas}
        detalhe={
          resumo.atrasadas > 0
            ? `${resumo.atrasadas} com prazo ultrapassado`
            : undefined
        }
      />
      <MetricCard
        titulo="Total acumulado nas metas"
        valor={formatarMoeda(resumo.totalAcumulado)}
        detalhe="Controle manual, não é o saldo das suas contas"
      />
      <MetricCard
        titulo="Falta nas metas em andamento"
        valor={formatarMoeda(resumo.faltaEmAndamento)}
        detalhe="Não inclui metas já concluídas"
      />
      <MetricCard
        titulo="Progresso geral"
        valor={pct}
        detalhe="Soma guardada (limitada ao valor de cada meta) ÷ soma dos valores desejados"
      />
    </div>
  );
}
