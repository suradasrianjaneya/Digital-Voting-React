import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Mail, Loader2, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    const res = await forgotPassword(data.email);
    setSubmitting(false);

    if (res.success) {
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-16 px-6 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none -z-10"></div>
      
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl flex flex-col gap-6 shadow-2xl relative">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-brand-primary/20 p-2.5 rounded-xl border border-brand-primary/40">
            <KeyRound className="h-6 w-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mt-2">Recover Password</h2>
          <p className="text-slate-400 text-sm font-light">Enter your email to receive a password reset verification code.</p>
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Generating recovery code...</span>
              </>
            ) : (
              <span>Request Reset OTP</span>
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs font-light">
          Remembered your password?{' '}
          <Link to="/login" className="text-brand-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
