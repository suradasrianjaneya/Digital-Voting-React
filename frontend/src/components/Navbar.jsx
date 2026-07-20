import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Vote, LayoutDashboard, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center shadow-lg">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="bg-brand-primary/20 p-2 rounded-lg border border-brand-primary/40 group-hover:scale-105 transition-transform duration-200">
          <Vote className="h-6 w-6 text-brand-primary" />
        </div>
        <span className="font-extrabold text-xl bg-gradient-to-r from-white via-slate-200 to-brand-primary bg-clip-text text-transparent tracking-wide">
          SecureVote
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-slate-300 font-medium">
        <a href="#features" className="hover:text-brand-primary transition-colors">Features</a>
        <a href="#about" className="hover:text-brand-primary transition-colors">About</a>
        <a href="#how-it-works" className="hover:text-brand-primary transition-colors">How It Works</a>
        <a href="#contact" className="hover:text-brand-primary transition-colors">Contact</a>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 px-4 h-10 bg-brand-primary hover:bg-brand-primary/95 text-white font-semibold rounded-lg shadow-md shadow-brand-primary/10 hover:shadow-brand-primary/25 hover:translate-y-[-1px] active:translate-y-[0px] transition-all text-sm"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center justify-center h-10 w-10 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg border border-white/5 hover:border-red-500/20 transition-all"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="text-slate-300 hover:text-white px-4 py-2 text-sm font-semibold transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="bg-white/10 hover:bg-white/15 text-white px-5 h-10 flex items-center justify-center text-sm font-bold rounded-lg border border-white/10 transition-all hover:translate-y-[-1px]"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
