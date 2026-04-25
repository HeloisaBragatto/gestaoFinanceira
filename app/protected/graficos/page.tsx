"use client";

import React from 'react';
import { 
  TrendingUp, Wallet, ArrowUpCircle, ArrowDownCircle, FileUp 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';

// Dados Fictícios (Mock)
const lineData = [
  { name: 'Out', receitas: 12000, despesas: 11000 },
  { name: 'Nov', receitas: 15000, despesas: 14000 },
  { name: 'Dez', receitas: 11500, despesas: 10500 },
  { name: 'Jan', receitas: 18500, despesas: 17500 },
  { name: 'Fev', receitas: 16000, despesas: 15000 },
  { name: 'Mar', receitas: 21000, despesas: 19000 },
  { name: 'Abr', receitas: 22000, despesas: 20500 },
];

const pieData = [
  { name: 'Moradia', value: 30, color: '#3b82f6' },
  { name: 'Alimentação', value: 21, color: '#ef4444' },
  { name: 'Saúde', value: 15, color: '#10b981' },
  { name: 'Educação', value: 12, color: '#06b6d4' },
  { name: 'Transporte', value: 12, color: '#f59e0b' },
  { name: 'Lazer', value: 10, color: '#8b5cf6' },
];

const transactions = [
  { id: 1, desc: 'Salário', cat: 'Renda', data: '10/04/2026', valor: 8500, tipo: 'entrada' },
  { id: 2, desc: 'Aluguel', cat: 'Moradia', data: '09/04/2026', valor: -2200, tipo: 'saida' },
  { id: 3, desc: 'Freelance', cat: 'Renda', data: '08/04/2026', valor: 3200, tipo: 'entrada' },
  { id: 4, desc: 'Supermercado', cat: 'Alimentação', data: '08/04/2026', valor: -520, tipo: 'saida' },
  { id: 5, desc: 'Consulta médica', cat: 'Saúde', data: '07/04/2026', valor: -380, tipo: 'saida' },
];

export default function DashboardFinanceiro() {
  return (
    <div className="min-h-screen bg-[#eef4ff] p-8 font-sans text-slate-800">
      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold">Gestão Financeira</h1>
          <p className="text-slate-500 text-sm">Visão geral das suas movimentações</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-all text-sm font-medium">
          <FileUp size={18} /> Importar Extrato PDF
        </button>
      </header>

      {/* Cards Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard 
          title="Saldo Total" 
          value="R$ 47.850" 
          trend="+12.5% este mês" 
          icon={<Wallet className="text-slate-600" />} 
        />
        <SummaryCard 
          title="Receitas" 
          value="R$ 21.200" 
          trend="Abril 2026" 
          icon={<TrendingUp className="text-green-500" />} 
          trendIcon={<ArrowUpCircle size={14} className="text-green-500" />}
          bgIcon="bg-green-50"
        />
        <SummaryCard 
          title="Despesas" 
          value="R$ 10.800" 
          trend="Abril 2026" 
          icon={<TrendingUp className="text-red-500 rotate-180" />} 
          trendIcon={<ArrowDownCircle size={14} className="text-red-500" />}
          bgIcon="bg-red-50"
        />
      </div>

      {/* Seção de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-1">Tendência Mensal</h3>
          <p className="text-xs text-slate-400 mb-6">Receitas vs Despesas</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-1">Despesas por Categoria</h3>
          <p className="text-xs text-slate-400 mb-6">Distribuição mensal</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-bold">Transações Recentes</h3>
          <p className="text-xs text-slate-400">Últimas movimentações</p>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">Descrição</th>
              <th className="px-6 py-4 font-medium">Categoria</th>
              <th className="px-6 py-4 font-medium">Data</th>
              <th className="px-6 py-4 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                <td className="px-6 py-4 font-medium">{t.desc}</td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 px-3 py-1 rounded-full text-[11px] text-slate-600">
                    {t.cat}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{t.data}</td>
                <td className={`px-6 py-4 text-right font-bold ${t.tipo === 'entrada' ? 'text-green-600' : 'text-red-500'}`}>
                  {t.tipo === 'entrada' ? '+' : ''} {t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Sub-componente para os cards de resumo
function SummaryCard({ title, value, trend, icon, trendIcon, bgIcon = "bg-slate-100" }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-sm mb-1">{title}</p>
        <h2 className="text-2xl font-black mb-1">{value}</h2>
        <div className="flex items-center gap-1">
          {trendIcon}
          <span className={`text-[11px] font-medium ${trend.includes('+') ? 'text-green-500' : 'text-slate-400'}`}>
            {trend}
          </span>
        </div>
      </div>
      <div className={`p-3 rounded-xl ${bgIcon}`}>
        {icon}
      </div>
    </div>
  );
}