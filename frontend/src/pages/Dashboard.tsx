export default function Dashboard() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ivs-gold-600 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Alertas de validade e produtos parados</p>
      </div>

      {/* Alert cards */}
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
