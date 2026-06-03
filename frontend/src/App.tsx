import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Estoque from './pages/Estoque';
import Clientes from './pages/Clientes';
import FluxoDeCaixa from './pages/FluxoDeCaixa';
import FluxoCaixa from './pages/FluxoCaixa';
import Pdv from './pages/Pdv';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pdv" element={<Pdv />} />
          <Route path="estoque" element={<Estoque />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="fluxo-de-caixa" element={<FluxoDeCaixa />} />
          <Route path="fluxo-caixa" element={<FluxoCaixa />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
