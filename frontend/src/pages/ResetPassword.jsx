import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, KeyRound, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { email: '', otp: '', password: '', confirmPassword: '' }
  });

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setValue('email', emailParam);
    } else {
      toast.error('Email parameter missing. Please request a new code.');
      navigate('/forgot-password');
    }
  }, [searchParams, setValue, navigate]);

  const passwordVal = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    const res = await resetPassword(data.email, data.otp, data.password, data.confirmPassword);
    setSubmitting(false);

    if (res.success) {
      navigate('/login');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none -z-10"></div>
      
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl flex flex-col gap-6 shadow-2xl relative">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-brand-primary/20 p-2.5 rounded-xl border border-brand-primary/40">
            <KeyRound className="h-6 w-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mt-2">Reset Password</h2>
          <p className="text-slate-400 text-sm font-light">Input the verification code and set a new password.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-600" />
              <input
                type="email"
                readOnly
                {...register('email')}
                className="glass-input w-full h-11 pl-10 pr-3 rounded-lg text-sm bg-slate-950/40 text-slate-400 cursor-not-allowed border-white/5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-slate-400">6-Digit Verification Code</label>
            <div className="relative">
              <CheckSquare className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                maxLength={6}
                {...register('otp', { 
                  required: 'Verification code is required', 
                  length: { value: 6, message: 'Must be exactly 6 digits' } 
                })}
                placeholder="000000"
                className={`glass-input w-full h-11 pl-10 pr-3 rounded-lg text-sm tracking-widest font-semibold ${errors.otp ? 'border-red-500/50' : ''}`}
              />
            </div>
            {errors.otp && <span className="text-xs text-red-400 pl-1">{errors.otp.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-slate-400">New Password</label>
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
            <label className="text-xs font-semibold text-slate-400">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                {...register('confirmPassword', { 
                  required: 'Please confirm password',
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
                <span>Saving new password...</span>
              </>
            ) : (
              <span>Reset Password & Login</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
