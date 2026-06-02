import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import api from '../services/api';

interface Produto {
  id: number;
  codigo_barras: string | null;
  descricao: string;
  marca: string | null;
  preco_venda: string;
  estoque_qtd: number;
}

interface ImportResult {
  sucesso: boolean;
  total_itens: number;
  produtos_cadastrados: number;
  produtos_atualizados: number;
}

function formatBRL(value: string | number) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Estoque() {
  const [produtos, setProdutos]           = useState<Produto[]>([]);
  const [loadingTable, setLoadingTable]   = useState(true);
  const [uploading, setUploading]         = useState(false);
  const [dragging, setDragging]           = useState(false);
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [importResult, setImportResult]   = useState<ImportResult | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Busca produtos ───────────────────────────────────────────────
  const fetchProdutos = async () => {
    setLoadingTable(true);
    try {
      const { data } = await api.get<Produto[]>('/produtos');
      setProdutos(data);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => { fetchProdutos(); }, []);

  // ── Validação de arquivo ─────────────────────────────────────────
  const processFile = (file: File) => {
    setError(null);
    setImportResult(null);
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setError('Apenas arquivos .xml são aceitos.');
      return;
    }
    setSelectedFile(file);
  };

  // ── Drag & Drop ──────────────────────────────────────────────────
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // ── Click para selecionar ────────────────────────────────────────
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // ── Upload para o backend ────────────────────────────────────────
  const handleImport = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    // Campo deve bater com upload.single('arquivo') no backend
    formData.append('arquivo', selectedFile);

    try {
      const { data } = await api.post<ImportResult>('/produtos/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(data);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchProdutos(); // atualiza tabela imediatamente
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao importar o arquivo.');
    } finally {
      setUploading(false);
    }
  };

  // ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ivs-gold-600 tracking-tight">Estoque</h1>
        <p className="text-sm text-gray-400 mt-1">Importe NF-e ou gerencie produtos manualmente</p>
      </div>

      {/* ── Upload Card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-5 h-5 text-ivs-green-600">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
          </span>
          Importar NF-e XML
        </h2>

        {/* Drop zone */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          className="hidden"
          onChange={handleFileChange}
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`h-44 flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all select-none ${
            dragging
              ? 'border-ivs-green-500 bg-ivs-green-100 scale-[1.01]'
              : selectedFile
              ? 'border-ivs-green-400 bg-ivs-green-50'
              : 'border-ivs-green-200 bg-ivs-green-50 hover:border-ivs-green-400 hover:bg-ivs-green-100'
          }`}
        >
          {selectedFile ? (
            <>
              <span className="text-3xl mb-2">✅</span>
              <p className="text-sm font-semibold text-ivs-green-700">{selectedFile.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB · Clique em Importar para processar
              </p>
            </>
          ) : (
            <>
              <span className="text-3xl mb-2">📄</span>
              <p className="text-sm font-semibold text-ivs-green-700">
                {dragging ? 'Solte o arquivo aqui' : 'Arraste o arquivo XML aqui'}
              </p>
              <p className="text-xs text-gray-400 mt-1">ou clique para selecionar · máx. 2 MB</p>
            </>
          )}
        </div>

        {/* Erro de validação / upload */}
        {error && (
          <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
            <span className="text-red-500 text-sm">⚠</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Resultado da importação */}
        {importResult && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="bg-ivs-green-50 border border-ivs-green-200 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-ivs-green-700">{importResult.total_itens}</p>
              <p className="text-xs text-ivs-green-600 mt-0.5">Itens na nota</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{importResult.produtos_cadastrados}</p>
              <p className="text-xs text-blue-600 mt-0.5">Novos produtos</p>
            </div>
            <div className="bg-ivs-pink-100 border border-ivs-pink-200 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-bold text-ivs-pink-600">{importResult.produtos_atualizados}</p>
              <p className="text-xs text-ivs-pink-500 mt-0.5">Estoque atualizado</p>
            </div>
          </div>
        )}

        {/* Botão importar */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleImport}
            disabled={!selectedFile || uploading}
            className="flex items-center gap-2 text-sm font-semibold bg-ivs-green-600 hover:bg-ivs-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg transition-colors"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importando…
              </>
            ) : (
              'Importar NF-e'
            )}
          </button>
        </div>
      </div>

      {/* ── Tabela de Produtos ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Produtos Cadastrados</h2>
            <p className="text-xs text-gray-400 mt-0.5">{produtos.length} produto(s) no estoque</p>
          </div>
          <button className="text-xs font-semibold bg-ivs-green-600 hover:bg-ivs-green-700 text-white px-4 py-2 rounded-lg transition-colors">
            + Adicionar manual
          </button>
        </div>

        {/* Cabeçalho */}
        <div className="px-6 py-3 bg-gray-50 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
          <span className="col-span-4">Descrição</span>
          <span className="col-span-3">EAN</span>
          <span className="col-span-2">Marca</span>
          <span className="col-span-1 text-center">Qtd</span>
          <span className="col-span-2 text-right">Preço Venda</span>
        </div>

        {/* Linhas */}
        {loadingTable ? (
          <div className="flex items-center justify-center h-40 gap-2 text-gray-400">
            <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
            <span className="text-sm">Carregando produtos…</span>
          </div>
        ) : produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="text-3xl">📦</span>
            <p className="text-sm text-gray-400">Nenhum produto cadastrado ainda.</p>
            <p className="text-xs text-gray-300">Importe uma NF-e para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {produtos.map((p) => (
              <div
                key={p.id}
                className="px-6 py-3.5 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors"
              >
                <span className="col-span-4 text-sm text-gray-800 font-medium truncate" title={p.descricao}>
                  {p.descricao}
                </span>
                <span className="col-span-3 font-mono text-xs text-gray-400">
                  {p.codigo_barras ?? <span className="italic">Sem EAN</span>}
                </span>
                <span className="col-span-2 text-sm text-gray-500 truncate">
                  {p.marca ?? '—'}
                </span>
                <span className="col-span-1 text-center">
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                    p.estoque_qtd === 0
                      ? 'bg-red-100 text-red-600'
                      : p.estoque_qtd <= 3
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-ivs-green-100 text-ivs-green-700'
                  }`}>
                    {p.estoque_qtd}
                  </span>
                </span>
                <span className="col-span-2 text-right text-sm font-semibold text-gray-800">
                  {formatBRL(p.preco_venda)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
