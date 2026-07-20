import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthHeader, setupInterceptors } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore
    } finally {
      setUser(null);
      setToken(null);
      setAuthHeader(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    setupInterceptors(setToken, logout);
  }, []);

  useEffect(() => {
    setAuthHeader(token);
  }, [token]);

  useEffect(() => {
    const autoAuthenticate = async () => {
      try {
        const res = await api.post('/auth/refresh-token');
        setToken(res.data.accessToken);
        setUser(res.data.user);
      } catch (err) {
        // Safe check failed
      } finally {
        setLoading(false);
      }
    };
    autoAuthenticate();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setToken(res.data.accessToken);
      setUser(res.data.user);
      toast.success('Welcome back!');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
      return { success: false, error: msg, code: error.response?.data?.code };
    }
  };

  const register = async (fullName, email, password, confirmPassword) => {
    try {
      const res = await api.post('/auth/register', { fullName, email, password, confirmPassword });
      toast.success(res.data.message || 'OTP verification sent to your email.');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await api.post('/auth/verify-account', { email, otp });
      toast.success(res.data.message || 'Account verified successfully!');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid or expired OTP.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const resendOtp = async (email, type) => {
    try {
      const res = await api.post('/auth/resend-otp', { email, type });
      toast.success(res.data.message || 'OTP sent successfully.');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to send OTP.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      toast.success('Password reset instructions sent to your email.');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Unable to request password reset.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const resetPassword = async (email, otp, password, confirmPassword) => {
    try {
      const res = await api.post('/auth/reset-password', { email, otp, password, confirmPassword });
      toast.success('Password reset completed successfully.');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Unable to reset password.';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be called from inside AuthProvider');
  }
  return context;
};
