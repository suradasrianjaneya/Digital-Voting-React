import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Vote as VoteIcon,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  User,
  ExternalLink,
  ChevronRight,
  Info,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function VotePage() {
  const { id: electionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [votingStatus, setVotingStatus] = useState({ hasVoted: false, votesCount: 0, maxVotesAllowed: 1, votedCandidateIds: [] });
  const [loading, setLoading] = useState(true);
  
  // Selection/Confirmation Modal
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);

  // Time validity check
  const [isTimeValid, setIsTimeValid] = useState(true);
  const [timeWarning, setTimeWarning] = useState('');

  const fetchElectionDetails = async () => {
    try {
      setLoading(true);
      // Load election details
      const electionRes = await api.get(`/elections/${electionId}`);
      setElection(electionRes.data.election);

      // Load candidates list
      const candidatesRes = await api.get(`/candidates/election/${electionId}`);
      setCandidates(candidatesRes.data.candidates);

      // Check current user voting status
      const statusRes = await api.get(`/votes/status/${electionId}`);
      setVotingStatus(statusRes.data);

      // Validate daily time windows
      checkVotingTimeWindow(electionRes.data.election);

    } catch (error) {
      toast.error('Failed to load election details.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElectionDetails();
  }, [electionId]);

  const checkVotingTimeWindow = (el) => {
    const now = new Date();
    
    // Check Date Boundaries
    const startDate = new Date(el.startDate);
    const endDate = new Date(el.endDate);
    startDate.setHours(0,0,0,0);
    endDate.setHours(23,59,59,999);

    if (now < startDate) {
      setIsTimeValid(false);
      setTimeWarning(`Voting has not opened yet. It starts on ${formatDate(el.startDate)}.`);
      return;
    }
    if (now > endDate) {
      setIsTimeValid(false);
      setTimeWarning('This election date window has concluded.');
      return;
    }

    // Check Daily Time boundaries
    const [startH, startM] = el.votingStartTime.split(':').map(Number);
    const [endH, endM] = el.votingEndTime.split(':').map(Number);
    
    const startTimeToday = new Date(now);
    startTimeToday.setHours(startH, startM, 0, 0);
    
    const endTimeToday = new Date(now);
    endTimeToday.setHours(endH, endM, 0, 0);

    if (now < startTimeToday || now > endTimeToday) {
      setIsTimeValid(false);
      setTimeWarning(`Ballots are sealed. Voting is only open between ${el.votingStartTime} and ${el.votingEndTime} daily.`);
    } else {
      setIsTimeValid(true);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleOpenConfirm = (candidate) => {
    setSelectedCandidate(candidate);
    setConfirmModalOpen(true);
  };

  const handleCloseConfirm = () => {
    setSelectedCandidate(null);
    setConfirmModalOpen(false);
  };

  const handleCastVote = async () => {
    if (!selectedCandidate) return;
    setSubmittingVote(true);

    try {
      await api.post('/votes', {
        electionId,
        candidateId: selectedCandidate.id,
      });

      toast.success('Your vote was successfully cast and encrypted!');
      handleCloseConfirm();
      fetchElectionDetails(); // Refresh voting status details
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit vote.');
      handleCloseConfirm();
    } finally {
      setSubmittingVote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-semibold animate-pulse">Establishing encrypted election handshakes...</p>
      </div>
    );
  }

  const { hasVoted, votesCount, maxVotesAllowed, votedCandidateIds } = votingStatus;
  const remainingVotes = maxVotesAllowed - votesCount;

  return (
    <div className="flex flex-col gap-8 relative">
      {/* Back button */}
      <div>
        <Link to="/dashboard" className="text-xs text-brand-primary hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>
      </div>

      {/* Warning/Status Banner */}
      {!isTimeValid ? (
        <div className="bg-brand-warning/10 border border-brand-warning/20 p-5 rounded-xl flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-brand-warning flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white text-sm">Voting Suspended</h4>
            <p className="text-slate-400 text-xs mt-1">{timeWarning}</p>
          </div>
        </div>
      ) : hasVoted ? (
        <div className="bg-brand-success/10 border border-brand-success/20 p-5 rounded-xl flex items-start gap-4">
          <CheckCircle className="h-6 w-6 text-brand-success flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white text-sm">Ballots Submitted Successfully</h4>
            <p className="text-slate-400 text-xs mt-1">
              You have cast the maximum allowed votes ({maxVotesAllowed}) in this election. Thank you for participating.
            </p>
            <Link to={`/election/${electionId}/results`} className="text-xs text-brand-primary font-bold hover:underline mt-2 inline-block">
              Inspect Concluded Results &raquo;
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-brand-primary/10 border border-brand-primary/20 p-5 rounded-xl flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 text-brand-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white text-sm">Secure Session Handshake</h4>
            <p className="text-slate-400 text-xs mt-1">
              Your session is verified. You can cast up to <strong className="text-white">{remainingVotes}</strong> more vote(s) in this ballot.
            </p>
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="glass-panel p-6 md:p-8 rounded-xl border border-white/5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full w-fit uppercase tracking-wider">
            {election?.type}
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold text-white">{election?.name}</h1>
          <p className="text-slate-400 text-xs md:text-sm font-light max-w-2xl">{election?.description}</p>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Ends: {formatDate(election?.endDate)}</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Window: {election?.votingStartTime} - {election?.votingEndTime} daily</span>
        </div>
      </div>

      {/* Rules / Guidelines */}
      {(election?.instructions || election?.rules) && (
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Info className="h-4 w-4 text-slate-400" /> Election Guidelines & Rules
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-xs font-light text-slate-400">
            {election.instructions && (
              <div>
                <strong className="text-slate-300 block mb-1">Instructions:</strong>
                <p className="leading-relaxed">{election.instructions}</p>
              </div>
            )}
            {election.rules && (
              <div>
                <strong className="text-slate-300 block mb-1">Regulations:</strong>
                <p className="leading-relaxed">{election.rules}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidates Grid */}
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <User className="h-4.5 w-4.5 text-brand-primary" />
          Ballot Candidates ({candidates.length})
        </h2>

        {candidates.length === 0 ? (
          <div className="glass-panel p-10 text-center text-slate-500 text-sm rounded-xl">
            No candidates configured in this election.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {candidates.map((cand) => {
              const name = cand.details['Candidate Name'] || 'Unnamed';
              const party = cand.details['Party Name'];
              const photo = cand.details['Photo'];
              
              const hasVotedForThisCand = votedCandidateIds.includes(cand.id);
              const disableVoteButton = !isTimeValid || hasVoted || hasVotedForThisCand;

              return (
                <div key={cand.id} className="glass-card p-6 rounded-xl border border-white/5 flex flex-col justify-between gap-5 relative overflow-hidden">
                  
                  {/* Photo & Name */}
                  <div className="flex gap-5">
                    {photo ? (
                      <div className="h-20 w-20 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-slate-950">
                        <img src={photo} alt={name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 font-bold text-lg flex-shrink-0">
                        {name.charAt(0)}
                      </div>
                    )}

                    <div className="overflow-hidden flex flex-col justify-center gap-1">
                      {cand.details['Custom Badge'] && (
                        <span className="text-[9px] font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2 py-0.5 rounded-full w-fit uppercase tracking-wide">
                          {cand.details['Custom Badge']}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-white truncate">{name}</h3>
                      {party && (
                        <span className="text-xs text-brand-secondary font-semibold flex items-center gap-1.5 truncate">
                          {cand.details['Party Symbol'] && (
                            <img src={cand.details['Party Symbol']} alt="Symbol" className="h-3.5 w-3.5 rounded object-cover" />
                          )}
                          {party}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Render configurable visible details (Toggles + Custom Fields marked visible) */}
                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-white/5 pt-4">
                    {cand.fields
                      .filter(f => f.isVisibleOnCard && f.name !== 'Candidate Name' && f.name !== 'Photo' && f.name !== 'Party Name' && f.name !== 'Party Symbol' && f.name !== 'Custom Badge' && f.value)
                      .map(f => (
                        <div key={f.name} className="flex flex-col col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">{f.name}</span>
                          
                          {f.type === 'URL' ? (
                            <a href={f.value} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline font-medium flex items-center gap-1 mt-0.5 truncate">
                              Link <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : f.type === 'TEXTAREA' ? (
                            <p className="text-slate-300 font-light leading-normal line-clamp-3 col-span-2 mt-0.5" title={f.value}>
                              {f.value}
                            </p>
                          ) : (
                            <span className="text-slate-300 font-medium truncate mt-0.5" title={f.value}>{f.value}</span>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Vote CTA */}
                  <button
                    onClick={() => handleOpenConfirm(cand)}
                    disabled={disableVoteButton}
                    className={`w-full h-10 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all mt-4 border ${
                      hasVotedForThisCand 
                        ? 'bg-brand-success/15 border-brand-success/35 text-brand-success cursor-default' 
                        : disableVoteButton
                          ? 'bg-slate-900 border-white/5 text-slate-500 cursor-not-allowed opacity-50' 
                          : 'bg-brand-primary border-brand-primary/10 hover:bg-brand-primary/95 text-white shadow-md shadow-brand-primary/10 hover:translate-y-[-1px]'
                    }`}
                  >
                    <VoteIcon className="h-4 w-4" />
                    <span>
                      {hasVotedForThisCand 
                        ? 'Ballot cast for candidate' 
                        : hasVoted 
                          ? 'Ballot limit reached' 
                          : 'Cast Ballot'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border p-6 rounded-xl w-full max-w-md shadow-2xl flex flex-col gap-5 animate-scaleIn">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                <VoteIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Confirm Voting Ballot</h3>
              <p className="text-slate-400 text-xs font-light">
                Are you sure you want to cast your ballot for:
              </p>
              <div className="bg-slate-900/60 p-4 rounded-lg border border-white/5 w-full flex items-center gap-3 justify-center">
                {selectedCandidate.details['Photo'] && (
                  <img src={selectedCandidate.details['Photo']} alt="Profile" className="h-9 w-9 rounded-full object-cover border border-white/10" />
                )}
                <div className="text-left">
                  <h4 className="font-bold text-white text-sm">{selectedCandidate.details['Candidate Name']}</h4>
                  {selectedCandidate.details['Party Name'] && (
                    <span className="text-[10px] text-brand-primary font-bold uppercase">{selectedCandidate.details['Party Name']}</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-brand-danger bg-brand-danger/10 border border-brand-danger/25 px-3 py-1.5 rounded-md font-semibold">
                ⚠️ Cast actions are final, encrypted in logs, and cannot be revoked.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCloseConfirm}
                disabled={submittingVote}
                className="flex-1 h-10 bg-slate-800 hover:bg-slate-750 border border-white/5 text-slate-300 font-bold text-xs rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCastVote}
                disabled={submittingVote}
                className="flex-1 h-10 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                {submittingVote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Confirm Tally</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
