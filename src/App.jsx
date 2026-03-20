import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './modules/dashboard/Dashboard';
import Ventas from './modules/ventas/Ventas';
import HistorialVentas from './modules/ventas/HistorialVentas';
import Inventario from './modules/inventario/Inventario';
import FormProducto from './modules/inventario/FormProducto';
import Caja from './modules/caja/Caja';
import Fiados from './modules/fiados/Fiados';
import FormFiado from './modules/fiados/FormFiado';
import Gastos from './modules/gastos/Gastos';
import Proveedores from './modules/proveedores/Proveedores';
import MasMenu from './components/MasMenu';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/historial-ventas" element={<HistorialVentas />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/inventario/nuevo" element={<FormProducto />} />
          <Route path="/inventario/editar/:id" element={<FormProducto />} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/fiados" element={<Fiados />} />
          <Route path="/fiados/nuevo" element={<FormFiado />} />
          <Route path="/gastos" element={<Gastos />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/mas" element={<MasMenu />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
