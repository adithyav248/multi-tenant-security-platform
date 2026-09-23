import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LayoutDashboard, Flag, AlertTriangle, Users, History, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Campaigns', path: '/campaigns', icon: Flag },
    { name: 'Security Events', path: '/events', icon: AlertTriangle },
    { name: 'Users', path: '/users', icon: Users },
    ...(user?.role !== 'USER' ? [{ name: 'Audit Logs', path: '/audit-logs', icon: History }] : [])
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-indigo-400" />
            <span className="font-bold text-lg tracking-wider">DEEP TRACE</span>
          </div>
          <nav className="flex space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs text-indigo-400 font-semibold">{user?.tenantName}</div>
            <div className="text-xs text-slate-400">{user?.name} ({user?.role})</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}