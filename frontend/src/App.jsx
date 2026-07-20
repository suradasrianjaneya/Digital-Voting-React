import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// User Dashboard Pages
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import VotePage from './pages/VotePage';
import ResultsPage from './pages/ResultsPage';

// Admin Pages
import CreateElection from './pages/admin/CreateElection';
import ManageCandidates from './pages/admin/ManageCandidates';
import UserApprovals from './pages/admin/UserApprovals';
import SecurityLogs from './pages/admin/SecurityLogs';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Views Layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected Voter Dashboard Layout */}
          <Route element={<DashboardLayout requireAdmin={false} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/election/:id" element={<VotePage />} />
            <Route path="/election/:id/results" element={<ResultsPage />} />
            <Route path="/admin/create-election" element={<CreateElection />} />
            <Route path="/admin/election/:electionId/candidates" element={<ManageCandidates />} />
          </Route>

          {/* Protected Administrative Dashboard Layout */}
          <Route element={<DashboardLayout requireAdmin={true} />}>
            <Route path="/admin/users" element={<UserApprovals />} />
            <Route path="/admin/logs" element={<SecurityLogs />} />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* React Hot Toast notification toaster overlay */}
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #1e293b',
              fontSize: '13px',
              fontFamily: "'Outfit', sans-serif"
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#0f172a'
              }
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#0f172a'
              }
            }
          }} 
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
