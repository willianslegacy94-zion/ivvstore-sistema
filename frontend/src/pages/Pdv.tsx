import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

// ── Types ────────────────────────────────────────────────────────
interface Produto {
  id: number;
  descricao: string;
  marca: string | null;
  preco_venda: string;
  estoque_qtd: number;
  codigo_barras: string | null;
}

interface Cliente {
  id: number;
  nome: string;
  dia_vencimento_preferencial: number;
}

interface CartItem {
  produto_id: number;
  descricao: string;
  preco_unitario: number;
  quantidade: number;
}

type FormaPagamento = 'dinheiro' | 'pix' | 'cartao' | 'fiado';

// ── Helpers ──────────────────────────────────────────────────────
function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function proximoVencimento(): string {
  const now   = new Date();
  const day   = now.getDate();
  let month   = now.getMonth();
  let year    = now.getFullYear();
  let target: number;

  if (day < 15)       { target = 15; }
  else if (day < 30)  { target = 30; }
  else                { target = 15; month += 1; if (month > 11) { month = 0; year += 1; } }

  return `${year}-${String(month + 1).padStart(2, '0')}-${String(target).padStart(2, '0')}`;
}

// ── Botão de Forma de Pagamento ──────────────────────────────────
interface FormaBtn {
  key: FormaPagamento;
  label: string;
  icon: string;
}

const FORMAS: FormaBtn[] = [
  { key: 'dinheiro', label: 'Dinheiro',         icon: '💵' },
  { key: 'pix',      label: 'Pix',              icon: '📱' },
  { key: 'cartao',   label: 'Cartão',           icon: '💳' },
  { key: 'fiado',    label: 'Fiado / Caderninho', icon: '📖' },
];

// ── Página PDV ───────────────────────────────────────────────────
export default function Pdv() {
  const [produtos, setProdutos]   = useState<Produto[]>([]);
  const [clientes, setClientes]   = useState<Cliente[]>([]);
  const [busca, setBusca]         = useState('');
  const [aberto, setAberto]       = useState(false);
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [forma, setForma]         = useState<FormaPagamento>('dinheiro');
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [dataVenc, setDataVenc]   = useState(proximoVencimento());
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro]           = useState<string | null>(null);
  const [sucesso, setSucesso]     = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get<Produto[]>('/produtos'),
      api.get<Cliente[]>('/clientes'),
    ]).then(([pRes, cRes]) => {
      setProdutos(pRes.data);
      setClientes(cRes.data);
    });
  }, []);

  const produtosFiltrados = busca.trim().length >= 2
    ? produtos.filter(p =>
        p.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        (p.codigo_barras ?? '').includes(busca)
      ).slice(0, 8)
    : [];

  function adicionarAoCart(p: Produto) {
    setCart(prev => {
      const existe = prev.find(i => i.produto_id === p.id);
      if (existe) {
        return prev.map(i =>
          i.produto_id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i,
        );
      }
      return [...prev, { produto_id: p.id, descricao: p.descricao, preco_unitario: Number(p.preco_venda), quantidade: 1 }];
    });
    setBusca('');
    setAberto(false);
    searchRef.current?.focus();
  }

  function alterarQtd(produto_id: number, delta: number) {
    setCart(prev =>
      prev
        .map(i => i.produto_id === produto_id ? { ...i, quantidade: i.quantidade + delta } : i)
        .filter(i => i.quantidade > 0),
    );
  }

  const total = cart.reduce((acc, i) => acc + i.preco_unitario * i.quantidade, 0);

  async function handleFinalizar() {
    if (cart.length === 0) return;
    if (forma === 'fiado' && !clienteId) {
      setErro('Selecione o cliente para venda fiado.');
      return;
    }

    setSubmitting(true);
    setErro(null);
    try {
      await api.post('/vendas', {
        itens: cart.map(i => ({
          produto_id:     i.produto_id,
          quantidade:     i.quantidade,
          preco_unitario: i.preco_unitario,
        })),
        forma_pagamento: forma,
        ...(forma === 'fiado' ? { cliente_id: clienteId, data_vencimento: dataVenc } : {}),
      });

      setSucesso(true);
      setCart([]);
      setForma('dinheiro');
      setClienteId('');
      setDataVenc(proximoVencimento());
      setTimeout(() => setSucesso(false), 3500);
    } catch (err: any) {
      setErro(err.response?.data?.error ?? 'Erro ao finalizar venda.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* ── Toast sucesso ──────────────────────────────────────── */}
      {sucesso && (
        <div className="fixed bottom-6 right-6 z-40 bg-ivs-green-700 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg">
          ✅ Venda registrada com sucesso!
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ivs-gold-600 tracking-tight">PDV / Frente de Caixa</h1>
        <p className="text-sm text-gray-400 mt-1">Registre vendas à vista ou fiado</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Coluna esquerda: Busca + Carrinho ──────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Busca de produto */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-ivs-green-600">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
              </svg>
              Buscar Produto
            </h2>
            <div className="relative">
              <input
                ref={searchRef}
                type="text"
                value={busca}
                onChange={e => { setBusca(e.target.value); setAberto(true); }}
                onFocus={() => setAberto(true)}
                placeholder="Digite o nome ou código de barras…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ivs-green-400 focus:border-transparent"
              />

              {/* Dropdown */}
              {aberto && produtosFiltrados.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                  {produtosFiltrados.map(p => (
                    <button
                      key={p.id}
                      onMouseDown={() => adicionarAoCart(p)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-ivs-green-50 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{p.descricao}</p>
                        <p className="text-xs text-gray-400">{p.codigo_barras ?? 'Sem EAN'} · Estoque: {p.estoque_qtd}</p>
                      </div>
                      <span className="text-sm font-bold text-ivs-green-700 ml-3 shrink-0">
                        {formatBRL(Number(p.preco_venda))}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {aberto && busca.trim().length >= 2 && produtosFiltrados.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 px-4 py-3 text-sm text-gray-400">
                  Nenhum produto encontrado.
                </div>
              )}
            </div>
            {busca.trim().length < 2 && (
              <p className="text-xs text-gray-300 mt-2">Digite ao menos 2 caracteres para buscar.</p>
            )}
          </div>

          {/* Carrinho */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Carrinho</h2>
              <span className="text-xs text-gray-400">{cart.length} item(ns)</span>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 gap-2 text-gray-300">
                <span className="text-3xl">🛒</span>
                <p className="text-sm">Carrinho vazio</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cart.map(item => (
                  <div key={item.produto_id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.descricao}</p>
                      <p className="text-xs text-gray-400">{formatBRL(item.preco_unitario)} / un</p>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => alterarQtd(item.produto_id, -1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm font-bold transition-colors"
                      >−</button>
                      <span className="text-sm font-bold text-gray-800 w-6 text-center tabular-nums">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => alterarQtd(item.produto_id, +1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-sm font-bold transition-colors"
                      >+</button>
                    </div>

                    <span className="text-sm font-bold text-gray-900 tabular-nums w-20 text-right shrink-0">
                      {formatBRL(item.preco_unitario * item.quantidade)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Total do carrinho */}
            {cart.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500">Total</span>
                <span className="text-lg font-bold text-gray-900 tabular-nums">{formatBRL(total)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Coluna direita: Pagamento + Finalizar ──────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Forma de pagamento */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Forma de Pagamento</h2>
            <div className="grid grid-cols-2 gap-2">
              {FORMAS.map(f => (
                <button
                  key={f.key}
                  onClick={() => { setForma(f.key); setErro(null); }}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                    forma === f.key
                      ? 'bg-ivs-green-600 border-ivs-green-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">{f.icon}</span>
                  <span className="leading-tight">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Painel Fiado */}
          {forma === 'fiado' && (
            <div className="bg-ivs-green-50 border border-ivs-green-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-ivs-green-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm">📖</span>
                </div>
                <p className="text-sm font-bold text-ivs-green-800">Venda Fiado</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Cliente
                </label>
                <select
                  value={clienteId}
                  onChange={e => setClienteId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ivs-green-400"
                >
                  <option value="">Selecione o cliente…</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Data de Vencimento
                  <span className="text-xs font-normal text-ivs-green-600 ml-1">(sugerido: próximo dia 15 ou 30)</span>
                </label>
                <input
                  type="date"
                  value={dataVenc}
                  onChange={e => setDataVenc(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ivs-green-400"
                />
              </div>
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-700">
              <span>⚠</span> {erro}
            </div>
          )}

          {/* Botão finalizar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Total a cobrar</span>
              <span className="text-2xl font-bold text-gray-900 tabular-nums">{formatBRL(total)}</span>
            </div>
            <button
              onClick={handleFinalizar}
              disabled={cart.length === 0 || submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-ivs-green-600 hover:bg-ivs-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registrando…
                </>
              ) : (
                <>
                  Finalizar Venda
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
