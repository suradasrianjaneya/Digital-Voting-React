import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Settings, 
  PlusCircle, 
  Users, 
  FileText, 
  LogOut, 
  Vote, 
  Shield 
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Move "Create Election" into the general menu items so all voters can create elections
  const navItems = [
    { to: '/dashboard', label: 'Elections Panel', icon: LayoutDashboard },
    { to: '/admin/create-election', label: 'Create Election', icon: PlusCircle },
    { to: '/settings', label: 'Profile & Settings', icon: Settings },
  ];

  const adminItems = [
    { to: '/admin/users', label: 'Voter Approvals', icon: Users },
    { to: '/admin/logs', label: 'Security Audit Logs', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border h-screen sticky top-0 flex flex-col justify-between p-4 z-40">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2 py-3 border-b border-white/5">
          <div className="bg-brand-primary/20 p-2 rounded-lg border border-brand-primary/30">
            <Vote className="h-5 w-5 text-brand-primary" />
          </div>
          <span className="font-extrabold text-lg text-white tracking-wide">
            SecureVote
          </span>
        </div>

        <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center gap-3">
          <div className="h-9 w-9 bg-brand-primary/20 rounded-full flex items-center justify-center font-bold text-brand-primary border border-brand-primary/30">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{user?.fullName}</h4>
            <span className="text-xs text-brand-primary font-bold tracking-wider uppercase block">
              {user?.role}
            </span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase px-2 mb-2 tracking-wider">
            Menu
          </span>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-primary/20 text-white border-l-4 border-brand-primary pl-2'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          {user?.role === 'ADMIN' && (
            <>
              <span className="text-xs font-bold text-slate-500 uppercase px-2 mt-6 mb-2 tracking-wider">
                Admin Panel
              </span>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-primary/20 text-white border-l-4 border-brand-primary pl-2'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <item.icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg text-sm font-medium transition-all w-full mt-auto"
      >
        <LogOut className="h-4.5 w-4.5" />
        <span>Logout Session</span>
      </button>
    </aside>
  );
}
