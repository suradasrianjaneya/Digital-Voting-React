import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Loader2, Vote } from 'lucide-react';

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' }
  });

  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    const res = await authRegister(data.fullName, data.email, data.password, data.confirmPassword);
    setSubmitting(false);

    if (res.success) {
      navigate('/verify-otp', { state: { email: data.email } });
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none -z-10"></div>
      
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl flex flex-col gap-6 shadow-2xl relative">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-brand-primary/20 p-2.5 rounded-xl border border-brand-primary/40">
            <Vote className="h-6 w-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mt-2">Voter Registration</h2>
          <p className="text-slate-400 text-sm font-light">Create a secure profile to participate in elections.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-slate-400">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                {...register('fullName', { required: 'Full Name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
                placeholder="John Doe"
                className={`glass-input w-full h-11 pl-10 pr-3 rounded-lg text-sm ${errors.fullName ? 'border-red-500/50' : ''}`}
              />
            </div>
            {errors.fullName && <span className="text-xs text-red-400 pl-1">{errors.fullName.message}</span>}
          </div>

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
                placeholder="john@example.com"
                className={`glass-input w-full h-11 pl-10 pr-3 rounded-lg text-sm ${errors.email ? 'border-red-500/50' : ''}`}
              />
            </div>
            {errors.email && <span className="text-xs text-red-400 pl-1">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                placeholder="••••••••"
                className={`glass-input w-full h-11 pl-10 pr-3 rounded-lg text-sm ${errors.password ? 'border-red-500/50' : ''}`}
              />
            </div>
            {errors.password && <span className="text-xs text-red-400 pl-1">{errors.password.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-slate-400">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: (val) => val === passwordVal || "Passwords don't match"
                })}
                placeholder="••••••••"
                className={`glass-input w-full h-11 pl-10 pr-3 rounded-lg text-sm ${errors.confirmPassword ? 'border-red-500/50' : ''}`}
              />
            </div>
            {errors.confirmPassword && <span className="text-xs text-red-400 pl-1">{errors.confirmPassword.message}</span>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Registering Account...</span>
              </>
            ) : (
              <span>Create Voter Profile</span>
            )}
          </button>
        </form>

        <p className="text-center text-slate-400 text-xs font-light">
          Already registered?{' '}
          <Link to="/login" className="text-brand-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
