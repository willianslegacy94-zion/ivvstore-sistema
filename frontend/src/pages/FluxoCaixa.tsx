import { useState, useEffect, useCallback } from 'react';
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
  total_saidas:   number;
  saldo:          number;
}

interface FluxoResponse {
  resumo:          Resumo;
  movimentacoes:   Movimentacao[];
}

// ── Helpers ──────────────────────────────────────────────────────
function formatBRL(v: number | string) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

// ── Cards de Resumo ──────────────────────────────────────────────
function ResumoCard({
  label, value, variant, icon,
}: {
  label: string; value: number; variant: 'green' | 'red' | 'gold'; icon: string;
}) {
  const s = {
    green: { wrap: 'bg-ivs-green-50 border-ivs-green-200', label: 'text-ivs-green-600', val: 'text-ivs-green-700' },
    red:   { wrap: 'bg-red-50 border-red-200',             label: 'text-red-500',        val: 'text-red-600' },
    gold:  {
      wrap: 'bg-ivs-gold-50 border-ivs-gold-200',
      label: 'text-ivs-gold-600',
      val: value >= 0 ? 'text-ivs-gold-700' : 'text-red-600',
    },
  }[variant];

  return (
    <div className={`rounded-2xl border px-5 py-4 ${s.wrap}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{icon}</span>
        <p className={`text-xs font-semibold uppercase tracking-wider ${s.label}`}>{label}</p>
      </div>
      <p className={`text-2xl font-bold tabular-nums ${s.val}`}>{formatBRL(value)}</p>
    </div>
  );
}

// ── Badge Tipo ───────────────────────────────────────────────────
function TipoBadge({ tipo }: { tipo: 'entrada' | 'saida' }) {
  if (tipo === 'entrada') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold bg-ivs-green-100 text-ivs-green-700 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-ivs-green-500" />
        Entrada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Saída
    </span>
  );
}

// ── Modal Nova Despesa ───────────────────────────────────────────
function ModalDespesa({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor]         = useState('');
  const [submitting, setSub]      = useState(false);
  const [erro, setErro]           = useState('');

  async function handleSalvar() {
    if (!descricao.trim()) { setErro('Descrição é obrigatória.'); return; }
    const v = Number(valor.replace(',', '.'));
    if (isNaN(v) || v <= 0) { setErro('Informe um valor válido.'); return; }

    setSub(true); setErro('');
    try {
      await api.post('/fluxo-de-caixa', { tipo: 'saida', valor: v, descricao: descricao.trim() });
      onSaved();
    } catch (e: any) {
      setErro(e.response?.data?.error ?? 'Erro ao registrar despesa.');
      setSub(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <span className="text-base">💸</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Nova Despesa</h2>
            <p className="text-xs text-gray-400 mt-0.5">Registrar saída manual no caixa</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Compra de sacolas, passagem…"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ivs-green-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={valor}
                onChange={e => setValor(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ivs-green-400 focus:border-transparent"
              />
            </div>
          </div>
          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {submitting
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Registrar Despesa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página Principal ─────────────────────────────────────────────
export default function FluxoCaixa() {
  const [resumo, setResumo]               = useState<Resumo | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading]             = useState(true);
  const [erro, setErro]                   = useState<string | null>(null);
  const [modalDespesa, setModalDespesa]   = useState(false);
  const [toast, setToast]                 = useState('');

  const fetchFluxo = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<FluxoResponse>('/fluxo-de-caixa');
      setResumo(data.resumo);
      setMovimentacoes(data.movimentacoes);
    } catch {
      setErro('Não foi possível carregar o fluxo de caixa.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFluxo(); }, [fetchFluxo]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  return (
    <div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-40 bg-ivs-green-700 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {modalDespesa && (
        <ModalDespesa
          onClose={() => setModalDespesa(false)}
          onSaved={() => {
            setModalDespesa(false);
            fetchFluxo();
            showToast('✅ Despesa registrada!');
          }}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ivs-gold-600 tracking-tight">Fluxo de Caixa</h1>
          <p className="text-sm text-gray-400 mt-1">Saúde financeira da loja</p>
        </div>
        <button
          onClick={() => setModalDespesa(true)}
          className="flex items-center gap-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl transition-colors"
        >
          <span className="text-base">💸</span>
          + Nova Despesa
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-20">
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
            <ResumoCard label="Total de Entradas" value={resumo.total_entradas} variant="green" icon="↑" />
            <ResumoCard label="Total de Saídas"   value={resumo.total_saidas}   variant="red"   icon="↓" />
            <ResumoCard label="Saldo Atual"        value={resumo.saldo}          variant="gold"  icon="$" />
          </div>

          {/* ── Tabela ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">Histórico de Movimentações</h2>
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
                <p className="text-xs text-gray-300">Finalize uma venda ou registre uma despesa.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {movimentacoes.map(m => (
                  <div
                    key={m.id}
                    className="px-6 py-3.5 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="col-span-2"><TipoBadge tipo={m.tipo} /></div>

                    <span className="col-span-5 text-sm text-gray-700 truncate" title={m.descricao ?? ''}>
                      {m.descricao ?? <span className="italic text-gray-300">Sem descrição</span>}
                    </span>

                    <span className="col-span-2 text-center text-xs text-gray-400 font-medium tabular-nums">
                      {formatDate(m.data_movimento)}
                    </span>

                    <span className={`col-span-3 text-right text-sm font-bold tabular-nums ${m.tipo === 'entrada' ? 'text-ivs-green-700' : 'text-red-600'}`}>
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
