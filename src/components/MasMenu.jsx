import { Link } from 'react-router-dom';
import { Wallet, Receipt, DollarSign, Truck, ChevronRight } from 'lucide-react';

const menuItems = [
  { to: '/caja', icon: Wallet, label: 'Caja Diaria', desc: 'Apertura y cierre de caja', bg: '#eff6ff', color: '#3b82f6' },
  { to: '/gastos', icon: Receipt, label: 'Gastos', desc: 'Registrar gastos del día', bg: '#fff7ed', color: '#f97316' },
  { to: '/historial-ventas', icon: DollarSign, label: 'Historial Ventas', desc: 'Ventas anteriores', bg: '#ecfdf5', color: '#059669' },
  { to: '/proveedores', icon: Truck, label: 'Proveedores', desc: 'Gestión de proveedores', bg: '#eef2ff', color: '#6366f1' },
];

export default function MasMenu() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Más opciones</h1>
      </div>

      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {menuItems.map(({ to, icon: Icon, label, desc, bg, color }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card card-interactive" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem' }}>
              <div style={{
                width: 42, height: 42, borderRadius: '0.75rem',
                background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={20} color={color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{desc}</div>
              </div>
              <ChevronRight size={16} color="var(--color-text-muted)" />
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
        <p style={{ fontWeight: 700, marginBottom: '0.1rem' }}>Tienda Cielo v1.0</p>
        <p>Sistema de gestión offline-first</p>
      </div>
    </div>
  );
}
