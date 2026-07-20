import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, Vote } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' }
  });

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    setSubmitting(true);
    const res = await login(data.email, data.password);
    setSubmitting(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else if (res.code === 'UNVERIFIED') {
      navigate('/verify-otp', { state: { email: data.email } });
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-16 px-6 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none -z-10"></div>
      
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl flex flex-col gap-6 shadow-2xl relative">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-brand-primary/20 p-2.5 rounded-xl border border-brand-primary/40">
            <Vote className="h-6 w-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mt-2">Welcome Back</h2>
          <p className="text-slate-400 text-sm font-light">Login to cast your vote and view active ballots.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                {...register('email', { 
                  required: 'Email is required', 
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } 
                })}
                placeholder="you@domain.com"
                className={`glass-input w-full h-11 pl-10 pr-3 rounded-lg text-sm ${errors.email ? 'border-red-500/50 focus:border-red-500' : ''}`}
              />
            </div>
            {errors.email && <span className="text-xs text-red-400 pl-1">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-400">Account Password</label>
              <Link to="/forgot-password" className="text-xs text-brand-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                placeholder="••••••••"
                className={`glass-input w-full h-11 pl-10 pr-3 rounded-lg text-sm ${errors.password ? 'border-red-500/50 focus:border-red-500' : ''}`}
              />
            </div>
            {errors.password && <span className="text-xs text-red-400 pl-1">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Logging session in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs font-light">
          Don't have a secure voter profile?{' '}
          <Link to="/register" className="text-brand-primary hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
