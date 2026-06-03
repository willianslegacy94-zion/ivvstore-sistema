import { useState, useEffect } from 'react';
import api from '../services/api';

interface Kpi {
  total_entradas:  number;
  total_saidas:    number;
  saldo_caixa:     number;
  total_a_receber: number;
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── Card KPI ─────────────────────────────────────────────────────
function KpiCard({
  label, value, sublabel, icon, variant,
}: {
  label: string; value: number; sublabel: string; icon: string;
  variant: 'green' | 'gold' | 'red' | 'pink';
}) {
  const s = {
    green: { wrap: 'bg-ivs-green-50 border-ivs-green-200', lbl: 'text-ivs-green-600', val: 'text-ivs-green-700', sub: 'text-ivs-green-500' },
    gold:  {
      wrap: 'bg-ivs-gold-50 border-ivs-gold-200',
      lbl: 'text-ivs-gold-600',
      val: value >= 0 ? 'text-ivs-gold-700' : 'text-red-600',
      sub: 'text-ivs-gold-500',
    },
    red:   { wrap: 'bg-red-50 border-red-200',             lbl: 'text-red-500',        val: 'text-red-600',        sub: 'text-red-400' },
    pink:  { wrap: 'bg-ivs-pink-100 border-ivs-pink-200',  lbl: 'text-ivs-pink-600',   val: 'text-ivs-pink-600',   sub: 'text-ivs-pink-500' },
  }[variant];

  return (
    <div className={`rounded-2xl border px-5 py-4 ${s.wrap}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className={`text-xs font-semibold uppercase tracking-wider leading-tight ${s.lbl}`}>{label}</p>
      </div>
      <p className={`text-2xl font-bold tabular-nums leading-tight ${s.val}`}>{formatBRL(value)}</p>
      <p className={`text-[11px] mt-1 ${s.sub}`}>{sublabel}</p>
    </div>
  );
}

// ── Página Dashboard ─────────────────────────────────────────────
export default function Dashboard() {
  const [kpi, setKpi]           = useState<Kpi | null>(null);
  const [loadingKpi, setLoading] = useState(true);

  useEffect(() => {
    api.get<Kpi>('/dashboard/kpi')
      .then(r => setKpi(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ivs-gold-600 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Visão geral da IVSSTORE</p>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      {loadingKpi ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : kpi && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Faturamento Total"
            value={kpi.total_entradas}
            sublabel="Soma de todas as entradas"
            icon="📈"
            variant="green"
          />
          <KpiCard
            label="Despesas Totais"
            value={kpi.total_saidas}
            sublabel="Saídas lançadas no caixa"
            icon="📉"
            variant="red"
          />
          <KpiCard
            label="Saldo em Caixa"
            value={kpi.saldo_caixa}
            sublabel="Faturamento menos despesas"
            icon="💰"
            variant="gold"
          />
          <KpiCard
            label="A Receber (Caderninho)"
            value={kpi.total_a_receber}
            sublabel="Saldo devedor em aberto"
            icon="📋"
            variant="pink"
          />
        </div>
      )}

      {/* ── Alertas ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Alertas de Validade */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-4 flex items-start gap-4 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <span className="text-lg">⏰</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 leading-tight">Alertas de Validade</h2>
              <p className="text-xs text-gray-400 mt-0.5">Lotes que vencem nos próximos 30 dias</p>
            </div>
            <span className="ml-auto text-xs font-semibold bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full">
              Em breve
            </span>
          </div>
          <div className="p-6 flex items-center justify-center h-36">
            <p className="text-sm text-gray-300">Nenhum alerta no momento</p>
          </div>
        </div>

        {/* Alertas de Encalhe */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-4 flex items-start gap-4 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-ivs-pink-100 flex items-center justify-center shrink-0">
              <span className="text-lg">📦</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 leading-tight">Alertas de Encalhe</h2>
              <p className="text-xs text-gray-400 mt-0.5">Produtos parados há mais de 40 dias</p>
            </div>
            <span className="ml-auto text-xs font-semibold bg-ivs-pink-100 text-ivs-pink-600 px-2.5 py-1 rounded-full">
              Em breve
            </span>
          </div>
          <div className="p-6 flex items-center justify-center h-36">
            <p className="text-sm text-gray-300">Nenhum produto em encalhe</p>
          </div>
        </div>

      </div>
    </div>
  );
}
