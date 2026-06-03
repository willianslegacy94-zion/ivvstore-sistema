import { useState, useEffect } from 'react';
import api from '../services/api';

// ── Types ────────────────────────────────────────────────────────
interface Movimentacao {
  id: number;
  tipo: 'entrada' | 'saida';
  valor: string;
  descricao: string | null;
  data_movimento: string;
}

interface Resumo {
  total_entradas: number;
  total_saidas: number;
  saldo: number;
}

interface FluxoResponse {
  resumo: Resumo;
  movimentacoes: Movimentacao[];
}

// ── Helpers ──────────────────────────────────────────────────────
function formatBRL(value: number | string) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  // dateStr chega como "2026-06-02T..." ou "2026-06-02"
  const [year, month, day] = dateStr.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

// ── Card de Resumo ───────────────────────────────────────────────
interface ResumoCardProps {
  label: string;
  value: number;
  variant: 'green' | 'red' | 'gold';
  icon: string;
}

function ResumoCard({ label, value, variant, icon }: ResumoCardProps) {
  const styles = {
    green: {
      wrapper: 'bg-ivs-green-50 border-ivs-green-200',
      label:   'text-ivs-green-600',
      value:   'text-ivs-green-700',
    },
    red: {
      wrapper: 'bg-red-50 border-red-200',
      label:   'text-red-500',
      value:   'text-red-600',
    },
    gold: {
      wrapper: 'bg-ivs-gold-50 border-ivs-gold-200',
      label:   'text-ivs-gold-600',
      value:   value >= 0 ? 'text-ivs-gold-700' : 'text-red-600',
    },
  }[variant];

  return (
    <div className={`rounded-2xl border px-5 py-4 ${styles.wrapper}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{icon}</span>
        <p className={`text-xs font-semibold uppercase tracking-wider ${styles.label}`}>{label}</p>
      </div>
      <p className={`text-2xl font-bold ${styles.value}`}>{formatBRL(value)}</p>
    </div>
  );
}

// ── Badge Tipo ───────────────────────────────────────────────────
function TipoBadge({ tipo }: { tipo: 'entrada' | 'saida' }) {
  if (tipo === 'entrada') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold bg-ivs-green-100 text-ivs-green-700 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-ivs-green-500 inline-block" />
        Entrada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      Saída
    </span>
  );
}

// ── Página Principal ─────────────────────────────────────────────
export default function FluxoDeCaixa() {
  const [resumo, setResumo]                 = useState<Resumo | null>(null);
  const [movimentacoes, setMovimentacoes]   = useState<Movimentacao[]>([]);
  const [loading, setLoading]               = useState(true);
  const [erro, setErro]                     = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get<FluxoResponse>('/fluxo-de-caixa');
        setResumo(data.resumo);
        setMovimentacoes(data.movimentacoes);
      } catch {
        setErro('Não foi possível carregar o fluxo de caixa.');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ivs-gold-600 tracking-tight">Fluxo de Caixa</h1>
        <p className="text-sm text-gray-400 mt-1">Histórico completo de entradas e saídas</p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-400 py-20 justify-center">
          <span className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
          <span className="text-sm">Carregando…</span>
        </div>
      )}

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700 flex items-center gap-2">
          <span>⚠</span> {erro}
        </div>
      )}

      {!loading && !erro && resumo && (
        <>
          {/* ── Cards de Resumo ──────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <ResumoCard
              label="Total de Entradas"
              value={resumo.total_entradas}
              variant="green"
              icon="↑"
            />
            <ResumoCard
              label="Total de Saídas"
              value={resumo.total_saidas}
              variant="red"
              icon="↓"
            />
            <ResumoCard
              label="Saldo Acumulado"
              value={resumo.saldo}
              variant="gold"
              icon="$"
            />
          </div>

          {/* ── Tabela de Movimentações ───────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">Movimentações</h2>
                <p className="text-xs text-gray-400 mt-0.5">{movimentacoes.length} registro(s)</p>
              </div>
            </div>

            {/* Cabeçalho */}
            <div className="px-6 py-3 bg-gray-50 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <span className="col-span-2">Tipo</span>
              <span className="col-span-5">Descrição</span>
              <span className="col-span-2 text-center">Data</span>
              <span className="col-span-3 text-right">Valor</span>
            </div>

            {movimentacoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 gap-2">
                <span className="text-3xl">💰</span>
                <p className="text-sm text-gray-400">Nenhuma movimentação registrada ainda.</p>
                <p className="text-xs text-gray-300">As baixas do Caderninho aparecerão aqui.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {movimentacoes.map((m) => (
                  <div
                    key={m.id}
                    className="px-6 py-3.5 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-2">
                      <TipoBadge tipo={m.tipo} />
                    </div>

                    <span className="col-span-5 text-sm text-gray-700 truncate" title={m.descricao ?? ''}>
                      {m.descricao ?? <span className="italic text-gray-300">Sem descrição</span>}
                    </span>

                    <span className="col-span-2 text-center text-xs text-gray-400 font-medium tabular-nums">
                      {formatDate(m.data_movimento)}
                    </span>

                    <span
                      className={`col-span-3 text-right text-sm font-bold tabular-nums ${
                        m.tipo === 'entrada' ? 'text-ivs-green-700' : 'text-red-600'
                      }`}
                    >
                      {m.tipo === 'entrada' ? '+' : '−'} {formatBRL(m.valor)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
