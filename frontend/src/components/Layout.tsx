import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    sublabel: 'Alertas e visão geral',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 10a8 8 0 1 1 16 0A8 8 0 0 1 2 10Zm8-4a1 1 0 0 0-1 1v3a1 1 0 0 0 .553.894l2.5 1.25a1 1 0 1 0 .894-1.788L11 9.382V7a1 1 0 0 0-1-1Z" />
      </svg>
    ),
  },
  {
    to: '/estoque',
    label: 'Estoque',
    sublabel: 'Produtos e importação XML',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 3a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3Zm0 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9Zm1 5a1 1 0 0 0 0 2h14a1 1 0 0 0 0-2H3Z" />
      </svg>
    ),
  },
  {
    to: '/clientes',
    label: 'Caderninho',
    sublabel: 'Clientes e cobranças',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 17a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.606.048-.91a7.477 7.477 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
      </svg>
    ),
  },
  {
    to: '/fluxo-de-caixa',
    label: 'Fluxo de Caixa',
    sublabel: 'Entradas e saídas',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.798 7.45c.512-.67 1.135-1.2 1.892-1.2.757 0 1.38.53 1.892 1.2.511.67.918 1.555.918 2.55s-.407 1.88-.918 2.55C12.07 13.22 11.447 13.75 10.69 13.75s-1.38-.53-1.892-1.2C8.287 11.88 7.88 10.995 7.88 10s.407-1.88.918-2.55Z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col shadow-sm">

        {/* Brand */}
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-bold tracking-tight text-ivs-gold-600">IVS</span>
            <span className="text-2xl font-bold tracking-tight text-gray-800">STORE</span>
          </div>
          <p className="text-[11px] font-medium tracking-widest text-gray-400 uppercase mt-0.5">
            Sistema de Gestão
          </p>
          {/* Linha dourada decorativa */}
          <div className="mt-4 h-px bg-gradient-to-r from-ivs-gold-200 via-ivs-gold-100 to-transparent" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 space-y-0.5">
          {navItems.map(({ to, label, sublabel, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-ivs-green-50 border-l-[3px] border-ivs-green-600 pl-[9px]'
                    : 'border-l-[3px] border-transparent hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`shrink-0 transition-colors ${
                      isActive
                        ? 'text-ivs-green-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  >
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold leading-tight transition-colors ${
                        isActive
                          ? 'text-ivs-green-700'
                          : 'text-gray-700 group-hover:text-gray-900'
                      }`}
                    >
                      {label}
                    </p>
                    <p
                      className={`text-[11px] leading-tight mt-0.5 transition-colors ${
                        isActive ? 'text-ivs-green-500' : 'text-gray-400'
                      }`}
                    >
                      {sublabel}
                    </p>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ivs-green-400 animate-pulse" />
            <p className="text-xs text-gray-400">Sistema online · MVP v0.1</p>
          </div>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">

        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-8 py-3 flex items-center justify-between">
          <div className="h-4 w-48 text-xs text-gray-400 flex items-center gap-2">
            {/* Breadcrumb gerado pelas páginas — espaço reservado */}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">IVSSTORE</span>
            <div className="w-7 h-7 rounded-full bg-ivs-pink-100 flex items-center justify-center text-ivs-pink-600 text-xs font-bold">
              I
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
