import { useState, useEffect } from 'react';
import api from '../services/api';

// ── Types ────────────────────────────────────────────────────────
interface Cliente {
  id: number;
  nome: string;
  whatsapp: string;
  saldo_devedor: string;
  dia_vencimento_preferencial: number;
}

interface Lembrete extends Cliente {
  proxima_data_vencimento: string;
  dias_para_vencer: number;
  link_whatsapp: string;
  mensagem_whatsapp: string;
}

interface NovoClienteForm {
  nome: string;
  whatsapp: string;
  saldo_devedor: string;
  dia_vencimento_preferencial: '15' | '30';
}

// ── Helpers ──────────────────────────────────────────────────────
function formatBRL(value: string | number) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function whatsappLink(whatsapp: string, mensagem: string) {
  const num = whatsapp.replace(/\D/g, '');
  const numBR = num.startsWith('55') ? num : `55${num}`;
  return `https://wa.me/${numBR}?text=${encodeURIComponent(mensagem)}`;
}

function mensagemCobranca(cliente: Cliente) {
  return (
    `Olá ${cliente.nome}! Passando para lembrar que seu acerto na IVSSTORE ` +
    `vence dia ${cliente.dia_vencimento_preferencial} no valor de ${formatBRL(cliente.saldo_devedor)}. ` +
    `Se precisar da nossa chave Pix, é só avisar!`
  );
}

// ── Modal Dar Baixa ──────────────────────────────────────────────
interface ModalBaixaProps {
  cliente: Cliente;
  onClose: () => void;
  onConfirm: (valor: number) => Promise<void>;
}

function ModalBaixa({ cliente, onClose, onConfirm }: ModalBaixaProps) {
  const [valor, setValor] = useState(Number(cliente.saldo_devedor).toFixed(2));
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState('');

  const saldoNum = Number(cliente.saldo_devedor);
  const valorNum = Number(valor.replace(',', '.'));
  const valido   = valorNum > 0 && valorNum <= saldoNum;

  async function handleConfirm() {
    if (!valido) return;
    setSubmitting(true);
    setErro('');
    try {
      await onConfirm(valorNum);
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao processar baixa');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ivs-gold-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-ivs-gold-600">
                <path d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 0 0-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.582Z" />
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-6a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.744.74.925 1.2a.75.75 0 0 1-1.395.55 1.35 1.35 0 0 0-.447-.563 2.187 2.187 0 0 0-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 0 1-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.857-.717-1.078-1.188a.75.75 0 1 1 1.359-.636c.08.173.245.376.54.569.313.205.706.353 1.138.432v-2.748a3.782 3.782 0 0 1-1.653-.713C6.9 9.433 6.5 8.681 6.5 7.875c0-.805.4-1.558 1.097-2.096a3.78 3.78 0 0 1 1.653-.713V4.75A.75.75 0 0 1 10 4Z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Dar Baixa no Saldo</h2>
              <p className="text-xs text-gray-400 mt-0.5">{cliente.nome}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Saldo atual */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Saldo devedor atual</span>
            <span className="text-lg font-bold text-gray-900">{formatBRL(cliente.saldo_devedor)}</span>
          </div>

          {/* Input valor recebido */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Valor recebido
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={saldoNum}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ivs-green-400 focus:border-transparent"
              />
            </div>
            {valorNum > saldoNum && (
              <p className="text-xs text-red-500 mt-1">Valor não pode ser maior que o saldo devedor.</p>
            )}
          </div>

          {/* Novo saldo preview */}
          {valido && (
            <div className="bg-ivs-green-50 border border-ivs-green-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-ivs-green-700">Novo saldo após baixa</span>
              <span className="text-base font-bold text-ivs-green-700">
                {formatBRL(Math.max(0, saldoNum - valorNum))}
              </span>
            </div>
          )}

          {/* Fluxo de caixa info */}
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-ivs-green-500 shrink-0">
              <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.646-1.648a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.12-.09l4.224-5.44Z" clipRule="evenodd"/>
            </svg>
            Uma entrada de {valido ? formatBRL(valorNum) : '—'} será registrada no fluxo de caixa automaticamente.
          </p>

          {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!valido || submitting}
            className="flex-1 py-2.5 rounded-xl bg-ivs-green-600 hover:bg-ivs-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processando…
              </>
            ) : 'Confirmar Baixa'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Novo Cliente ───────────────────────────────────────────
interface ModalNovoClienteProps {
  onClose: () => void;
  onSaved: () => void;
}

function ModalNovoCliente({ onClose, onSaved }: ModalNovoClienteProps) {
  const [form, setForm] = useState<NovoClienteForm>({
    nome: '', whatsapp: '', saldo_devedor: '', dia_vencimento_preferencial: '30',
  });
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState('');

  function update(field: keyof NovoClienteForm, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSalvar() {
    if (!form.nome.trim() || !form.whatsapp.trim()) {
      setErro('Nome e WhatsApp são obrigatórios.');
      return;
    }
    setSubmitting(true);
    setErro('');
    try {
      await api.post('/clientes', {
        nome:                       form.nome.trim(),
        whatsapp:                   form.whatsapp.trim(),
        saldo_devedor:              Number(form.saldo_devedor) || 0,
        dia_vencimento_preferencial: Number(form.dia_vencimento_preferencial),
      });
      onSaved();
    } catch (e: any) {
      setErro(e.response?.data?.error ?? 'Erro ao cadastrar cliente');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Novo Cliente</h2>
          <p className="text-xs text-gray-400 mt-0.5">Adicionar ao caderninho</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: 'Nome completo', field: 'nome' as const, placeholder: 'Ex: Ana Paula Silva', type: 'text' },
            { label: 'WhatsApp', field: 'whatsapp' as const, placeholder: '11987654321', type: 'tel' },
            { label: 'Saldo devedor inicial (R$)', field: 'saldo_devedor' as const, placeholder: '0,00', type: 'number' },
          ].map(({ label, field, placeholder, type }) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[field]}
                onChange={e => update(field, e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ivs-green-400 focus:border-transparent"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dia de vencimento</label>
            <div className="flex gap-3">
              {(['15', '30'] as const).map(dia => (
                <button
                  key={dia}
                  onClick={() => update('dia_vencimento_preferencial', dia)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                    form.dia_vencimento_preferencial === dia
                      ? 'bg-ivs-green-600 border-ivs-green-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Dia {dia}
                </button>
              ))}
            </div>
          </div>

          {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} disabled={submitting} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSalvar} disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-ivs-green-600 hover:bg-ivs-green-700 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2">
            {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salvar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página Principal ─────────────────────────────────────────────
export default function Clientes() {
  const [clientes, setClientes]           = useState<Cliente[]>([]);
  const [lembretes, setLembretes]         = useState<Lembrete[]>([]);
  const [loading, setLoading]             = useState(true);
  const [modalBaixa, setModalBaixa]       = useState<Cliente | null>(null);
  const [modalNovo, setModalNovo]         = useState(false);
  const [toastMsg, setToastMsg]           = useState('');

  async function fetchTudo() {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        api.get<Cliente[]>('/clientes'),
        api.get<Lembrete[]>('/clientes/lembretes-cobranca'),
      ]);
      setClientes(cRes.data);
      setLembretes(lRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTudo(); }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  }

  async function handleBaixa(cliente: Cliente, valorRecebido: number) {
    await api.patch(`/clientes/${cliente.id}/baixa`, { valor_recebido: valorRecebido });
    setModalBaixa(null);
    showToast(`✅ Baixa de ${formatBRL(valorRecebido)} registrada para ${cliente.nome}`);
    await fetchTudo();
  }

  return (
    <div>
      {/* ── Toast ──────────────────────────────────────────────── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-40 bg-ivs-green-700 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg animate-pulse">
          {toastMsg}
        </div>
      )}

      {/* ── Modais ─────────────────────────────────────────────── */}
      {modalBaixa && (
        <ModalBaixa
          cliente={modalBaixa}
          onClose={() => setModalBaixa(null)}
          onConfirm={(v) => handleBaixa(modalBaixa, v)}
        />
      )}
      {modalNovo && (
        <ModalNovoCliente
          onClose={() => setModalNovo(false)}
          onSaved={() => { setModalNovo(false); fetchTudo(); showToast('✅ Cliente cadastrado com sucesso!'); }}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ivs-gold-600 tracking-tight">Caderninho</h1>
        <p className="text-sm text-gray-400 mt-1">Saldo devedor e lembretes de cobrança via WhatsApp</p>
      </div>

      {/* ── Banner de Lembretes ─────────────────────────────────── */}
      {lembretes.length > 0 && (
        <div className="bg-ivs-green-50 border border-ivs-green-200 rounded-2xl px-5 py-4 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-ivs-green-600 flex items-center justify-center shrink-0">
              <span className="text-white text-sm">💬</span>
            </div>
            <div>
              <p className="text-sm font-bold text-ivs-green-800">
                {lembretes.length} cliente{lembretes.length > 1 ? 's' : ''} vencem hoje ou em até 2 dias
              </p>
              <p className="text-xs text-ivs-green-600">Clique em WhatsApp para enviar o lembrete direto</p>
            </div>
          </div>
          <div className="space-y-2">
            {lembretes.map(l => (
              <div key={l.id} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 border border-ivs-green-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{l.nome}</p>
                  <p className="text-xs text-gray-400">
                    Vence em <span className="font-bold text-ivs-green-600">{l.dias_para_vencer === 0 ? 'hoje' : `${l.dias_para_vencer} dia(s)`}</span> · {formatBRL(l.saldo_devedor)}
                  </p>
                </div>
                <a
                  href={l.link_whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold bg-ivs-green-600 hover:bg-ivs-green-700 text-white px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  <span>WhatsApp</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabela de Clientes ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Todos os Clientes</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {clientes.filter(c => Number(c.saldo_devedor) > 0).length} com saldo em aberto
            </p>
          </div>
          <button
            onClick={() => setModalNovo(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-ivs-green-600 hover:bg-ivs-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            + Novo Cliente
          </button>
        </div>

        {/* Cabeçalho */}
        <div className="px-6 py-3 bg-gray-50 grid grid-cols-12 gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
          <span className="col-span-3">Cliente</span>
          <span className="col-span-2">WhatsApp</span>
          <span className="col-span-2 text-center">Vencimento</span>
          <span className="col-span-2 text-right">Saldo Devedor</span>
          <span className="col-span-3 text-right">Ações</span>
        </div>

        {/* Linhas */}
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
            <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
            <span className="text-sm">Carregando clientes…</span>
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="text-3xl">📋</span>
            <p className="text-sm text-gray-400">Nenhum cliente cadastrado.</p>
            <button onClick={() => setModalNovo(true)} className="text-xs text-ivs-green-600 font-semibold hover:underline">
              Cadastrar primeiro cliente
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clientes.map(c => {
              const saldo     = Number(c.saldo_devedor);
              const temSaldo  = saldo > 0;
              const mensagem  = mensagemCobranca(c);

              return (
                <div key={c.id} className={`px-6 py-3.5 grid grid-cols-12 gap-3 items-center hover:bg-gray-50 transition-colors ${temSaldo ? '' : 'opacity-60'}`}>
                  <div className="col-span-3 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.nome}</p>
                  </div>

                  <span className="col-span-2 font-mono text-xs text-gray-400 truncate">
                    {c.whatsapp}
                  </span>

                  <div className="col-span-2 flex justify-center">
                    <span className="text-xs font-bold bg-ivs-gold-100 text-ivs-gold-700 px-2.5 py-1 rounded-full">
                      Dia {c.dia_vencimento_preferencial}
                    </span>
                  </div>

                  <div className="col-span-2 text-right">
                    <span className={`text-sm font-bold ${temSaldo ? 'text-red-600' : 'text-ivs-green-600'}`}>
                      {temSaldo ? formatBRL(saldo) : '✓ Quitado'}
                    </span>
                  </div>

                  <div className="col-span-3 flex items-center justify-end gap-2">
                    {temSaldo && (
                      <>
                        <a
                          href={whatsappLink(c.whatsapp, mensagem)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold bg-ivs-green-600 hover:bg-ivs-green-700 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          WhatsApp
                        </a>
                        <button
                          onClick={() => setModalBaixa(c)}
                          className="text-xs font-bold border border-ivs-gold-300 text-ivs-gold-700 hover:bg-ivs-gold-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Dar Baixa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
