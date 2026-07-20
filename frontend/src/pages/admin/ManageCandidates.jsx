import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { 
  UserPlus, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageCandidates() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [imagePreviews, setImagePreviews] = useState({});

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

  const fetchElectionAndCandidates = async () => {
    try {
      setLoading(true);
      const electionRes = await api.get(`/elections/${electionId}`);
      setElection(electionRes.data.election);

      const candidatesRes = await api.get(`/candidates/election/${electionId}`);
      setCandidates(candidatesRes.data.candidates);
    } catch (error) {
      toast.error('Failed to load candidate configuration or not authorized.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElectionAndCandidates();
  }, [electionId]);

  const handleImageFileChange = (e, definitionId) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setValue(definitionId, reader.result);
      setImagePreviews((prev) => ({
        ...prev,
        [definitionId]: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await api.post(`/candidates/election/${electionId}`, {
        fieldValues: data,
      });

      toast.success('Candidate successfully added to election!');
      reset();
      setImagePreviews({});
      fetchElectionAndCandidates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add candidate.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!window.confirm('Are you sure you want to remove this candidate? This will wipe all associated data.')) return;

    try {
      await api.delete(`/candidates/${candidateId}`);
      toast.success('Candidate removed successfully.');
      fetchElectionAndCandidates();
    } catch (error) {
      toast.error('Failed to remove candidate.');
    }
  };

  const handlePublishElection = async () => {
    if (candidates.length < 2) {
      toast.error('You need at least 2 candidates to activate an election.');
      return;
    }

    setPublishing(true);
    try {
      await api.put(`/elections/${electionId}/status`, { status: 'ACTIVE' });
      toast.success('Election activated! Voters can now access ballot panels.');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to publish election.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">Loading dynamic fields structures...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div className="flex flex-col gap-2">
          <Link to="/dashboard" className="text-xs text-brand-primary hover:underline flex items-center gap-1.5 w-fit">
            <ArrowLeft className="h-3 w-3" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-white">{election?.name}</h1>
          <p className="text-slate-400 text-sm font-light">
            Status: <span className="text-brand-primary font-bold uppercase text-xs">{election?.status}</span> | Custom Candidates Management
          </p>
        </div>

        {election?.status === 'DRAFT' && (
          <button
            onClick={handlePublishElection}
            disabled={publishing}
            className="h-11 px-6 bg-brand-success hover:bg-brand-success/95 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-success/20 transition-all hover:translate-y-[-1px] disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4.5 w-4.5" />
                <span>Activate Election</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 glass-panel p-6 rounded-xl border border-white/5 h-fit flex flex-col gap-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <UserPlus className="h-4.5 w-4.5 text-brand-primary" /> Add Candidate
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {election?.fieldDefinitions.map((fd) => {
              const inputId = fd.id;
              const isRequired = fd.isRequired;
              
              return (
                <div key={fd.id} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    {fd.name} {isRequired && <span className="text-red-400">*</span>}
                  </label>

                  {fd.type === 'TEXTAREA' ? (
                    <textarea
                      rows={3}
                      {...register(inputId, { required: isRequired ? `${fd.name} is required` : false })}
                      placeholder={`Enter candidate ${fd.name.toLowerCase()}...`}
                      className="glass-input p-3 rounded-lg text-sm resize-none"
                    ></textarea>
                  ) : fd.type === 'IMAGE' ? (
                    <div className="flex flex-col gap-3">
                      <div className="relative h-10 w-full">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, inputId)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                        />
                        <div className="absolute inset-0 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between px-3 text-slate-400 text-xs hover:border-slate-700 select-none">
                          <span className="truncate">{imagePreviews[inputId] ? 'Image uploaded!' : 'Choose candidate image...'}</span>
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      </div>
                      <input
                        type="hidden"
                        {...register(inputId, { required: isRequired ? `${fd.name} image is required` : false })}
                      />
                      {imagePreviews[inputId] && (
                        <div className="h-20 w-20 rounded-lg overflow-hidden border border-white/10">
                          <img src={imagePreviews[inputId]} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type={fd.type === 'NUMBER' ? 'number' : fd.type === 'DATE' ? 'date' : 'text'}
                      {...register(inputId, { required: isRequired ? `${fd.name} is required` : false })}
                      placeholder={`Enter ${fd.name.toLowerCase()}...`}
                      className="glass-input h-10 px-3 rounded-lg text-sm"
                    />
                  )}
                  {errors[inputId] && <span className="text-[10px] text-red-400 pl-1">{errors[inputId].message}</span>}
                </div>
              );
            })}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving candidate details...</span>
                </>
              ) : (
                <span>Register Candidate</span>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-white/5 flex flex-col gap-6 h-fit">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <FileText className="h-4.5 w-4.5 text-brand-primary" /> Registered Candidates Roster ({candidates.length})
          </h3>

          {candidates.length === 0 ? (
            <div className="p-12 text-center text-slate-500 rounded-xl flex flex-col items-center gap-3">
              <AlertCircle className="h-8 w-8 text-slate-600" />
              <p className="text-sm font-light">No candidates registered in this election yet. Setup details using the adjacent form.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {candidates.map((cand) => {
                return (
                  <div key={cand.id} className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 relative flex flex-col gap-4">
                    <button
                      onClick={() => handleDeleteCandidate(cand.id)}
                      className="absolute top-3 right-3 text-slate-500 hover:text-red-400 p-1.5 hover:bg-red-500/5 rounded-lg border border-transparent hover:border-red-500/10 transition-all"
                      title="Delete Candidate"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex gap-4">
                      {cand.details['Photo'] && (
                        <div className="h-16 w-16 rounded-full overflow-hidden border border-white/10 bg-slate-950 flex-shrink-0">
                          <img src={cand.details['Photo']} alt="Candidate" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="overflow-hidden flex flex-col justify-center">
                        <h4 className="font-bold text-white text-base truncate">{cand.details['Candidate Name'] || 'Unnamed Candidate'}</h4>
                        {cand.details['Party Name'] && (
                          <span className="text-xs text-brand-primary font-semibold truncate block mt-0.5">{cand.details['Party Name']}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-3">
                      {cand.fields
                        .filter(f => f.name !== 'Candidate Name' && f.name !== 'Photo' && f.name !== 'Party Name' && f.value)
                        .map(f => (
                          <div key={f.name} className="flex flex-col col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">{f.name}</span>
                            <span className="text-slate-300 font-medium truncate mt-0.5" title={f.value}>{f.value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
