import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Award, 
  AlertCircle,
  TrendingUp,
  UserCheck,
  PlusCircle,
  Key,
  Copy,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const [elections, setElections] = useState({ active: [], upcoming: [], completed: [], drafts: [] });
  const [votingHistory, setVotingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Join by code state
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const electionsRes = await api.get('/elections');
      setElections(electionsRes.data);

      const profileRes = await api.get('/users/profile');
      setVotingHistory(profileRes.data.votingHistory || []);
    } catch (error) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code.');
      return;
    }

    setJoining(true);
    try {
      const res = await api.post('/elections/join', { inviteCode: inviteCode.trim() });
      toast.success(res.data.message);
      setInviteCode('');
      fetchDashboardData(); // Refresh list to show joined election
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join election.');
    } finally {
      setJoining(false);
    }
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasVotedInElection = (electionId) => {
    return votingHistory.some((history) => history.electionId === electionId);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Synchronizing live election data...</p>
      </div>
    );
  }

  const votedElectionsCount = votingHistory.length;
  const activeElectionsCount = elections.active.length;

  return (
    <div className="flex flex-col gap-10">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">Voter Dashboard</h1>
          <p className="text-slate-400 font-light text-sm md:text-base">
            Participate in democratic voting, configure candidate panels, or inspect security logs.
          </p>
        </div>
        <Link
          to="/admin/create-election"
          className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg text-sm shadow-md transition-all hover:translate-y-[-1px] flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create Election</span>
        </Link>
      </div>

      {/* Join Election Banner & Analytics Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Join by Code */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 md:col-span-2 flex flex-col justify-center gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="h-4 w-4 text-brand-primary" /> Join Private Election
          </h3>
          <form onSubmit={handleJoinByCode} className="flex gap-2 w-full">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter 6-digit Invite Code (e.g. A8F4B9)"
              className="glass-input h-10 px-3 rounded-lg text-xs flex-1 uppercase tracking-widest font-semibold text-center"
            />
            <button
              type="submit"
              disabled={joining}
              className="px-5 bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-55"
            >
              {joining ? 'Joining...' : 'Join'}
            </button>
          </form>
        </div>

        {/* Voter Stats Widget */}
        <div className="glass-panel p-5 rounded-xl border border-white/5 flex items-center gap-4">
          <div className="bg-brand-success/10 p-3 rounded-lg border border-brand-success/20">
            <CheckCircle className="h-6 w-6 text-brand-success" />
          </div>
          <div>
            <h4 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Elections Voted In</h4>
            <span className="text-lg font-extrabold text-white">{votedElectionsCount}</span>
          </div>
        </div>
      </div>

      {/* Active Elections Grid */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-primary" />
          Active Elections ({activeElectionsCount})
        </h2>
        {elections.active.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-500 rounded-xl border border-white/5 flex flex-col items-center gap-3">
            <AlertCircle className="h-8 w-8 text-slate-600" />
            <p className="text-sm font-light">There are no elections currently accepting ballots.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elections.active.map((el) => {
              const voted = hasVotedInElection(el.id);
              const isCreator = el.creatorId === user?.id;
              
              return (
                <div key={el.id} className="glass-card p-6 rounded-xl flex flex-col justify-between border border-white/5 relative overflow-hidden">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-brand-primary uppercase tracking-wider bg-brand-primary/10 px-2.5 py-1 rounded-md border border-brand-primary/20">
                        {el.type}
                      </span>
                      <div className="flex gap-2">
                        {isCreator && (
                          <span className="text-xs font-bold text-brand-secondary uppercase tracking-wider bg-brand-secondary/10 px-2.5 py-1 rounded-md border border-brand-secondary/20">
                            My Election
                          </span>
                        )}
                        {voted ? (
                          <span className="text-xs font-bold text-brand-success uppercase tracking-wider bg-brand-success/10 px-2.5 py-1 rounded-md border border-brand-success/20">
                            Voted
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-brand-success uppercase tracking-wider bg-brand-success/10 px-2.5 py-1 rounded-md border border-brand-success/20">
                            Open
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white line-clamp-1">{el.name}</h3>
                    <p className="text-slate-400 text-xs font-light line-clamp-2">{el.description}</p>
                    
                    {/* Invite Code Share Widget */}
                    {el.inviteCode && (
                      <div className="mt-2 flex items-center justify-between bg-slate-950/40 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs">
                        <span className="text-slate-500">Invite Code:</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-brand-primary">
                          <span>{el.inviteCode}</span>
                          <button
                            onClick={() => handleCopyCode(el.inviteCode, el.id)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                            title="Copy Code"
                          >
                            {copiedId === el.id ? <Check className="h-3 w-3 text-brand-success" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-white/5 mt-6 pt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-slate-500 text-[11px] font-medium">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Ends: {formatDate(el.endDate)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Closes: {el.votingEndTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={voted ? `/election/${el.id}/results` : `/election/${el.id}`}
                        className={`flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          voted 
                            ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/5' 
                            : 'bg-brand-primary hover:bg-brand-primary/95 text-white shadow-md shadow-brand-primary/10'
                        }`}
                      >
                        {voted ? 'Inspect Results' : 'Enter Ballot Panel'}
                      </Link>
                      {(isCreator || user?.role === 'ADMIN') && (
                        <Link
                          to={`/admin/election/${el.id}/candidates`}
                          className="h-9 px-3 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 flex items-center justify-center border border-white/5"
                          title="Manage candidates"
                        >
                          Candidates
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming & Drafts & Completed Lists */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Drafts (visible to creators/admins) */}
        {elections.drafts?.length > 0 && (
          <div className="flex flex-col gap-4 md:col-span-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-primary" />
              My Election Drafts ({elections.drafts.length})
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {elections.drafts.map((el) => (
                <div key={el.id} className="glass-panel p-5 rounded-xl border border-white/5 flex justify-between items-center gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/20 w-fit">
                      {el.type}
                    </span>
                    <h4 className="font-bold text-white text-sm line-clamp-1">{el.name}</h4>
                    {el.inviteCode && <span className="text-[11px] text-slate-500 font-mono">Invite Code: {el.inviteCode}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/admin/election/${el.id}/candidates`}
                      className="px-3.5 h-8 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg text-xs flex items-center justify-center transition-all"
                    >
                      Configure & Activate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-secondary" />
            Upcoming Elections ({elections.upcoming.length})
          </h3>
          <div className="flex flex-col gap-4">
            {elections.upcoming.length === 0 ? (
              <div className="glass-panel p-6 text-center text-slate-500 text-xs rounded-xl border border-white/5 font-light">
                No upcoming elections scheduled.
              </div>
            ) : (
              elections.upcoming.map((el) => {
                const isCreator = el.creatorId === user?.id;
                return (
                  <div key={el.id} className="glass-panel p-5 rounded-xl border border-white/5 flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-brand-secondary uppercase tracking-wider bg-brand-secondary/10 px-2 py-0.5 rounded border border-brand-secondary/20 w-fit">
                        {el.type}
                      </span>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{el.name}</h4>
                      <p className="text-slate-500 text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Starts: {formatDate(el.startDate)} at {el.votingStartTime}
                      </p>
                    </div>
                    {(isCreator || user?.role === 'ADMIN') && (
                      <Link to={`/admin/election/${el.id}/candidates`} className="text-xs text-brand-primary font-bold hover:underline">
                        Manage Candidates
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Completed */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-success" />
            Completed Elections ({elections.completed.length})
          </h3>
          <div className="flex flex-col gap-4">
            {elections.completed.length === 0 ? (
              <div className="glass-panel p-6 text-center text-slate-500 text-xs rounded-xl border border-white/5 font-light">
                No concluded elections archived.
              </div>
            ) : (
              elections.completed.map((el) => {
                const voted = hasVotedInElection(el.id);
                return (
                  <div key={el.id} className="glass-panel p-5 rounded-xl border border-white/5 flex justify-between items-center gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <span className="text-[10px] font-bold text-brand-success uppercase tracking-wider bg-brand-success/10 px-2 py-0.5 rounded border border-brand-success/20 w-fit">
                          Concluded
                        </span>
                        {voted && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700 w-fit">
                            Voted
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-sm line-clamp-1">{el.name}</h4>
                      <p className="text-slate-500 text-xs">
                        Ended: {formatDate(el.endDate)}
                      </p>
                    </div>
                    <Link
                      to={`/election/${el.id}/results`}
                      className="px-3.5 h-8 bg-slate-800 hover:bg-slate-750 text-white font-bold rounded-lg text-xs flex items-center justify-center border border-white/5 transition-all"
                    >
                      View Results
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
