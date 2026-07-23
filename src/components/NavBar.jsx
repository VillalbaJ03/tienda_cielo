import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Cloud,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  UserRound,
  MoreHorizontal,
  Wallet,
  Receipt,
  History,
  Truck,
  X,
} from 'lucide-react';

const itemsIzquierda = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
];

const itemsDerecha = [
  { to: '/fiados', icon: Users, label: 'Fiados' },
];

// Módulos del hub "Más" — los que no tienen espacio en la barra
const modulosSecundarios = [
  { to: '/clientes', icon: UserRound, label: 'Clientes' },
  { to: '/caja', icon: Wallet, label: 'Caja diaria' },
  { to: '/gastos', icon: Receipt, label: 'Gastos' },
  { to: '/historial-ventas', icon: History, label: 'Historial' },
  { to: '/proveedores', icon: Truck, label: 'Proveedores' },
];

const todosLosModulos = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/ventas', icon: ShoppingCart, label: 'Vender' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  { to: '/fiados', icon: Users, label: 'Fiados' },
  ...modulosSecundarios,
];

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <span className="nav-icon">
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function NavBar() {
  const [showMas, setShowMas] = useState(false);
  const { pathname } = useLocation();

  const enSecundario = modulosSecundarios.some((m) => pathname.startsWith(m.to));

  return (
    <>
      {/* Barra lateral — solo escritorio (≥1024px) */}
      <aside className="sidenav">
        <div className="brand">
          <Cloud size={19} strokeWidth={2.2} />
          <span>Tienda Cielo</span>
        </div>

        <NavLink to="/ventas" className={({ isActive }) => `sidenav-cta ${isActive ? 'active' : ''}`}>
          <ShoppingCart size={16} strokeWidth={2.1} />
          <span>Vender</span>
        </NavLink>

        {[
          { titulo: null, items: [{ to: '/', icon: LayoutDashboard, label: 'Inicio' }] },
          { titulo: 'Catálogo', items: [
            { to: '/inventario', icon: Package, label: 'Inventario' },
            { to: '/proveedores', icon: Truck, label: 'Proveedores' },
          ] },
          { titulo: 'Personas', items: [
            { to: '/clientes', icon: UserRound, label: 'Clientes' },
            { to: '/fiados', icon: Users, label: 'Fiados' },
          ] },
          { titulo: 'Finanzas', items: [
            { to: '/caja', icon: Wallet, label: 'Caja diaria' },
            { to: '/gastos', icon: Receipt, label: 'Gastos' },
            { to: '/historial-ventas', icon: History, label: 'Historial de ventas' },
          ] },
        ].map(({ titulo, items }) => (
          <div key={titulo || 'principal'} className="sidenav-grupo">
            {titulo && <div className="sidenav-grupo-titulo">{titulo}</div>}
            {items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `sidenav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidenav-footer">
          Tienda Cielo v1.0<br />Gestión offline-first
        </div>
      </aside>

      {/* Barra inferior — solo móvil */}
      <nav className="navbar">
        <div className="navbar-inner">
          {itemsIzquierda.map((item) => <NavItem key={item.to} {...item} />)}

          <NavLink to="/ventas" className={({ isActive }) => `nav-action ${isActive ? 'active' : ''}`}>
            <span className="nav-action-btn">
              <ShoppingCart size={22} strokeWidth={2.2} />
            </span>
            <span>Vender</span>
          </NavLink>

          {itemsDerecha.map((item) => <NavItem key={item.to} {...item} />)}

          <button
            type="button"
            className={`nav-item ${enSecundario || showMas ? 'active' : ''}`}
            onClick={() => setShowMas(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
          >
            <span className="nav-icon">
              <MoreHorizontal size={20} strokeWidth={enSecundario ? 2.2 : 1.8} />
            </span>
            <span>Más</span>
          </button>
        </div>
      </nav>

      {showMas && (
        <div className="modal-overlay" onClick={() => setShowMas(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Todos los módulos</h2>
              <button className="icon-btn" onClick={() => setShowMas(false)} aria-label="Cerrar">
                <X size={17} />
              </button>
            </div>

            <div className="module-grid">
              {todosLosModulos.map(({ to, icon: Icon, label }) => {
                const activo = to === '/' ? pathname === '/' : pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`module-tile ${activo ? 'is-active' : ''}`}
                    onClick={() => setShowMas(false)}
                  >
                    <Icon size={20} strokeWidth={1.8} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>

            <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.6875rem', color: 'var(--color-ink-4)' }}>
              Tienda Cielo v1.0 · Gestión offline-first
            </p>
          </div>
        </div>
      )}
    </>
  );
}
