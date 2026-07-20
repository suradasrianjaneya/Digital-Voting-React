import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-dark-bg text-slate-100">
      <Navbar />
      <main className="flex-1 w-full mx-auto flex flex-col justify-start">
        <Outlet />
      </main>
      <footer className="py-8 text-center text-slate-500 text-xs border-t border-white/5 bg-slate-950/20">
        <p>&copy; {new Date().getFullYear()} SecureVote Platform. Engineered with cryptographic-grade voting standards.</p>
      </footer>
    </div>
  );
}
