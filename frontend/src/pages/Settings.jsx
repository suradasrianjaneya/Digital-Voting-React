import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, Loader2, Key, ShieldCheck, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' }
  });

  const newPasswordVal = watch('newPassword');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.put('/users/profile/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Your account password was updated successfully.');
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Profile Settings</h1>
        <p className="text-slate-400 text-sm font-light">Manage your security credentials and profile info.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-6 h-fit">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <User className="h-4.5 w-4.5 text-brand-primary" /> Profile Credentials
          </h3>
          
          <div className="flex flex-col gap-4 text-sm font-light">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Full Name</span>
              <span className="text-white font-medium">{user?.fullName}</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Email Address</span>
              <span className="text-white font-medium flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {user?.email}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Access Clearance</span>
              <span className="text-brand-primary font-bold tracking-wider uppercase text-xs">{user?.role}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status verification</span>
              <span className="text-brand-success font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Key className="h-4.5 w-4.5 text-brand-primary" /> Update Password
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-xl">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="password"
                  {...register('currentPassword', { required: 'Current password is required' })}
                  placeholder="••••••••"
                  className={`glass-input w-full h-11 pl-10 pr-3 rounded-lg text-sm ${errors.currentPassword ? 'border-red-500/50' : ''}`}
                />
              </div>
              {errors.currentPassword && <span className="text-xs text-red-400 pl-1">{errors.currentPassword.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="password"
                  {...register('newPassword', { 
                    required: 'New password is required', 
                    minLength: { value: 6, message: 'Password must be at least 6 characters' } 
                  })}
                  placeholder="••••••••"
                  className={`glass-input w-full h-11 pl-10 pr-3 rounded-lg text-sm ${errors.newPassword ? 'border-red-500/50' : ''}`}
                />
              </div>
              {errors.newPassword && <span className="text-xs text-red-400 pl-1">{errors.newPassword.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="password"
                  {...register('confirmNewPassword', { 
                    required: 'Confirm your password',
                    validate: (val) => val === newPasswordVal || "New passwords don't match"
                  })}
                  placeholder="••••••••"
                  className={`glass-input w-full h-11 pl-10 pr-3 rounded-lg text-sm ${errors.confirmNewPassword ? 'border-red-500/50' : ''}`}
                />
              </div>
              {errors.confirmNewPassword && <span className="text-xs text-red-400 pl-1">{errors.confirmNewPassword.message}</span>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="h-11 px-6 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:pointer-events-none mt-2 w-fit"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Saving new password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
