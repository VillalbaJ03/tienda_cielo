import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  MoreHorizontal,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/ventas', icon: ShoppingCart, label: 'Ventas' },
  { to: '/inventario', icon: Package, label: 'Inventario' },
  { to: '/fiados', icon: Users, label: 'Fiados' },
  { to: '/mas', icon: MoreHorizontal, label: 'Más' },
];

export default function NavBar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
          >
            {({ isActive }) => (
              <div className={`nav-item ${isActive ? 'active' : 'inactive'}`}>
                <Icon size={21} strokeWidth={isActive ? 2.2 : 1.6} />
                <span>{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
