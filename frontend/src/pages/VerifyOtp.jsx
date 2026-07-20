import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const stateEmail = location.state?.email;
    const searchEmail = new URLSearchParams(location.search).get('email');
    
    if (stateEmail) {
      setEmail(stateEmail);
    } else if (searchEmail) {
      setEmail(searchEmail);
    } else {
      toast.error('No email specified for OTP verification.');
      navigate('/register');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (e, index) => {
    const { value } = e.target;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (!newOtp[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          newOtp[index - 1] = '';
        }
      } else {
        newOtp[index] = '';
      }
      setOtp(newOtp);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      toast.error('Please enter all 6 digits.');
      return;
    }

    setSubmitting(true);
    const res = await verifyOtp(email, code);
    setSubmitting(false);

    if (res.success) {
      navigate('/login');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setCanResend(false);
    setTimer(60);
    
    await resendOtp(email, 'VERIFY_ACCOUNT');
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-16 px-6 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none -z-10"></div>
      
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl flex flex-col gap-6 shadow-2xl relative">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-brand-primary/20 p-2.5 rounded-xl border border-brand-primary/40">
            <ShieldCheck className="h-6 w-6 text-brand-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mt-2">Email Verification</h2>
          <p className="text-slate-400 text-sm font-light">We sent a 6-digit OTP code to:</p>
          <span className="text-brand-primary font-semibold text-sm flex items-center gap-2">
            <Mail className="h-4 w-4" /> {email}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                value={digit}
                maxLength={1}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 bg-slate-900 border border-slate-800 text-center font-bold text-xl rounded-lg text-white focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Activating account...</span>
              </>
            ) : (
              <span>Verify & Activate</span>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 font-light flex flex-col gap-2">
          <span>Didn't receive the email verification code?</span>
          <button
            onClick={handleResend}
            disabled={!canResend}
            className={`font-semibold hover:underline ${canResend ? 'text-brand-primary cursor-pointer' : 'text-slate-500 cursor-not-allowed'}`}
          >
            {canResend ? 'Resend OTP Code' : `Resend available in ${timer}s`}
          </button>
        </div>
      </div>
    </div>
  );
}
