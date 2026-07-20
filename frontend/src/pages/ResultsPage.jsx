import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { 
  ArrowLeft, 
  Trophy, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  FileText,
  AlertCircle,
  PieChart as PieIcon,
  BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function ResultsPage() {
  const { id: electionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/elections/${electionId}/results`);
      setResults(res.data.results);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Results are sealed until the election ends.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [electionId]);

  const handleExportCSV = () => {
    if (!results) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Candidate Name,Party,Votes Received,Percentage Share\n";
    
    results.candidates.forEach((c, index) => {
      csvContent += `${index + 1},"${c.name}","${c.party}",${c.votesCount},${c.percentage}%\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${results.electionName.replace(/\s+/g, '_')}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report downloaded!');
  };

  const handlePrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-semibold">Tallying cryptographic audit ballots...</p>
      </div>
    );
  }

  const { electionName, electionDescription, totalVotesCast, candidates, winners } = results;

  return (
    <div className="flex flex-col gap-8 print:p-8">
      {/* Back & Actions */}
      <div className="flex justify-between items-center print:hidden">
        <Link to="/dashboard" className="text-xs text-brand-primary hover:underline flex items-center gap-1.5 w-fit">
          <ArrowLeft className="h-3 w-3" /> Back to Dashboard
        </Link>

        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="h-9 px-3.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-850 flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>CSV Data</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="h-9 px-3.5 bg-brand-primary hover:bg-brand-primary/95 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md shadow-brand-primary/10"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="glass-panel p-6 md:p-8 rounded-xl border border-white/5 flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
        <span className="text-[10px] font-bold text-brand-success bg-brand-success/10 border border-brand-success/20 px-2.5 py-0.5 rounded-full w-fit uppercase tracking-wider">
          Official Tally Report
        </span>
        <h1 className="text-xl md:text-2xl font-extrabold text-white">{electionName}</h1>
        <p className="text-slate-400 text-xs md:text-sm font-light max-w-2xl">{electionDescription}</p>
        <div className="border-t border-white/5 mt-4 pt-4 flex gap-6 text-xs text-slate-500 font-medium">
          <span>Tally Count: <strong className="text-slate-300 font-bold">{totalVotesCast} total votes cast</strong></span>
        </div>
      </div>

      {/* Winners Block */}
      {winners.length > 0 && (
        <div className="bg-brand-primary/10 border border-brand-primary/20 p-6 rounded-xl flex flex-col sm:flex-row gap-5 items-center justify-between relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-brand-primary/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4.5">
            <div className="h-12 w-12 rounded-full bg-brand-primary/20 border border-brand-primary/45 flex items-center justify-center text-brand-primary flex-shrink-0 glow-brand">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[9px] font-extrabold text-brand-primary uppercase tracking-widest block">Declared Winner</span>
              <h3 className="text-lg font-extrabold text-white mt-0.5">
                {winners.map(w => w.name).join(' & ')}
              </h3>
              <p className="text-slate-400 text-xs mt-0.5 font-light">
                Party: {winners.map(w => w.party).join(', ')}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <span className="text-2xl font-extrabold text-white">{winners[0].votesCount} Votes</span>
            <span className="text-[10px] text-brand-primary font-bold block uppercase tracking-wider mt-0.5">
              {winners[0].percentage}% of total share
            </span>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {totalVotesCast > 0 ? (
        <div className="grid md:grid-cols-2 gap-8 print:grid-cols-1">
          {/* Bar Chart */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" /> Votes Distribution (Tally count)
            </h3>
            
            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={candidates} margin={{ top: 20, right: 10, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" allowDecimals={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="votesCount" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {candidates.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <PieIcon className="h-4 w-4" /> Vote Percentage share
            </h3>
            
            <div className="h-72 w-full text-xs flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={candidates}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={80}
                    fill="#8b5cf6"
                    dataKey="votesCount"
                  >
                    {candidates.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-10 text-center text-slate-500 rounded-xl flex flex-col items-center gap-3">
          <AlertCircle className="h-8 w-8 text-slate-600" />
          <p className="text-sm font-light">Zero ballots cast in this election. Charts will render once votes are recorded.</p>
        </div>
      )}

      {/* Ranks Table */}
      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-slate-900/40">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Rank Summary</h3>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 bg-slate-950/20 font-semibold">
                <th className="p-3 pl-6">Rank</th>
                <th className="p-3">Candidate Name</th>
                <th className="p-3">Party Name</th>
                <th className="p-3 text-right">Votes</th>
                <th className="p-3 pr-6 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-light">
              {candidates.map((c, index) => (
                <tr key={c.id} className="hover:bg-white/2 transition-colors">
                  <td className="p-3 pl-6 font-bold">{index + 1}</td>
                  <td className="p-3 font-semibold text-white">{c.name}</td>
                  <td className="p-3">{c.party}</td>
                  <td className="p-3 text-right font-bold text-white">{c.votesCount}</td>
                  <td className="p-3 pr-6 text-right font-bold text-brand-primary">{c.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
