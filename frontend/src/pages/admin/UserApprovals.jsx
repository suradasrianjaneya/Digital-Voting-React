import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Shield,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserApprovals() {
  const { user: currentLoggedUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsersList(res.data.users);
    } catch (error) {
      toast.error('Failed to load user rosters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleApproval = async (userId, isApproved) => {
    setUpdatingId(userId);
    try {
      const res = await api.put(`/users/${userId}/approval`, { isApproved });
      toast.success(res.data.message);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update approval status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (userId, role) => {
    setUpdatingId(userId);
    try {
      const res = await api.put(`/users/${userId}/role`, { role });
      toast.success(res.data.message);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? All associated vote history will be wiped.')) return;

    setUpdatingId(userId);
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User deleted successfully.');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-semibold">Synchronizing user credentials list...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Voter Approvals & Roster</h1>
        <p className="text-slate-400 text-sm font-light">Moderate registered members, control authorization status, and manage clearances.</p>
      </div>

      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-slate-900/40">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-brand-primary" /> Registered Users ({usersList.length})
          </h3>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 bg-slate-950/20 font-semibold">
                <th className="p-4 pl-6 text-xs uppercase tracking-wider">Full Name</th>
                <th className="p-4 text-xs uppercase tracking-wider">Email Address</th>
                <th className="p-4 text-xs uppercase tracking-wider text-center">Verified</th>
                <th className="p-4 text-xs uppercase tracking-wider text-center">Approval Status</th>
                <th className="p-4 text-xs uppercase tracking-wider text-center">Security Clearance</th>
                <th className="p-4 pr-6 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usersList.map((userItem) => {
                const isSelf = userItem.id === currentLoggedUser?.id;
                const isUpdating = updatingId === userItem.id;
                
                return (
                  <tr key={userItem.id} className="hover:bg-white/2 transition-colors">
                    <td className="p-4 pl-6 font-bold text-white">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-brand-primary/15 rounded-full flex items-center justify-center font-bold text-brand-primary text-xs border border-brand-primary/25">
                          {userItem.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span>
                          {userItem.fullName}
                          {isSelf && <span className="ml-2 text-[10px] text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">You</span>}
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-slate-300 font-light">{userItem.email}</td>

                    <td className="p-4 text-center">
                      {userItem.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-success bg-brand-success/10 px-2 py-1 rounded border border-brand-success/15">
                          <CheckCircle2 className="h-3 w-3" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-danger bg-brand-danger/10 px-2 py-1 rounded border border-brand-danger/15">
                          <XCircle className="h-3 w-3" /> No
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      {userItem.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-success bg-brand-success/10 px-2 py-1 rounded border border-brand-success/15">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-warning bg-brand-warning/10 px-2 py-1 rounded border border-brand-warning/15">
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${
                        userItem.role === 'ADMIN' ? 'text-brand-primary' : 'text-slate-400'
                      }`}>
                        {userItem.role === 'ADMIN' && <Shield className="h-3.5 w-3.5" />}
                        {userItem.role}
                      </span>
                    </td>

                    <td className="p-4 pr-6 text-right">
                      {isSelf ? (
                        <span className="text-xs text-slate-500 italic">No administrative adjustments</span>
                      ) : (
                        <div className="inline-flex items-center gap-3">
                          {userItem.isApproved ? (
                            <button
                              onClick={() => handleToggleApproval(userItem.id, false)}
                              disabled={isUpdating}
                              className="px-2.5 h-8 bg-brand-warning/10 hover:bg-brand-warning/20 text-brand-warning text-xs font-bold border border-brand-warning/15 hover:border-brand-warning/35 rounded-lg transition-colors flex items-center justify-center"
                              title="Suspend voter access"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleApproval(userItem.id, true)}
                              disabled={isUpdating}
                              className="px-2.5 h-8 bg-brand-success/10 hover:bg-brand-success/20 text-brand-success text-xs font-bold border border-brand-success/15 hover:border-brand-success/35 rounded-lg transition-colors flex items-center justify-center"
                              title="Approve voter access"
                            >
                              Approve
                            </button>
                          )}

                          {userItem.role === 'ADMIN' ? (
                            <button
                              onClick={() => handleRoleChange(userItem.id, 'USER')}
                              disabled={isUpdating}
                              className="px-2.5 h-8 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold border border-white/5 rounded-lg transition-colors flex items-center justify-center"
                              title="Demote to Voter"
                            >
                              Demote
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(userItem.id, 'ADMIN')}
                              disabled={isUpdating}
                              className="px-2.5 h-8 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold border border-brand-primary/15 hover:border-brand-primary/35 rounded-lg transition-colors flex items-center justify-center"
                              title="Promote to Admin"
                            >
                              Make Admin
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteUser(userItem.id)}
                            disabled={isUpdating}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 rounded-lg transition-colors"
                            title="Delete User Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
