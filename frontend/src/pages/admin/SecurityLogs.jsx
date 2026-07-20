import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  FileText, 
  Search, 
  Clock, 
  MapPin, 
  User, 
  AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit');
      setLogs(res.data.logs);
    } catch (error) {
      toast.error('Failed to retrieve system security logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action) => {
    if (action.includes('VOTE_CAST')) return 'text-brand-success bg-brand-success/10 border border-brand-success/15';
    if (action.includes('ELECTION_DELETE') || action.includes('USER_DELETE')) return 'text-brand-danger bg-brand-danger/10 border border-brand-danger/15';
    if (action.includes('ELECTION_STATUS')) return 'text-brand-warning bg-brand-warning/10 border border-brand-warning/15';
    if (action.includes('REGISTER') || action.includes('VERIFIED')) return 'text-brand-secondary bg-brand-secondary/10 border border-brand-secondary/15';
    return 'text-slate-400 bg-slate-900 border border-slate-800';
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.includes(searchTerm);
      
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const uniqueActions = ['ALL', ...new Set(logs.map(log => log.action))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-semibold">Synchronizing audit logs history...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">System Security Logs</h1>
        <p className="text-slate-400 text-sm font-light">Immutable system audit logs tracking account activations, credentials adjustments, and ballot submissions.</p>
      </div>

      <div className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/20">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search details, emails, IPs..."
            className="glass-input h-10 pl-10 pr-3 rounded-lg text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="glass-input h-10 px-3 rounded-lg text-xs bg-slate-950 w-full sm:w-48"
          >
            {uniqueActions.map((act) => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5 bg-slate-900/40">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-brand-primary" /> Chronological Activity Trace ({filteredLogs.length})
          </h3>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 bg-slate-950/20 font-semibold">
                <th className="p-4 pl-6 text-xs uppercase tracking-wider">Timestamp</th>
                <th className="p-4 text-xs uppercase tracking-wider">Action Label</th>
                <th className="p-4 text-xs uppercase tracking-wider">Log Details</th>
                <th className="p-4 text-xs uppercase tracking-wider">Associated Actor</th>
                <th className="p-4 pr-6 text-xs uppercase tracking-wider text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500 font-light text-xs">
                    <AlertCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    No audit records match your search parameters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateFormatted = new Date(log.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-white/2 transition-colors">
                      <td className="p-4 pl-6 text-slate-300 font-light text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-500" /> {dateFormatted}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 font-light max-w-xs md:max-w-md truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="p-4 text-slate-300 font-light text-xs">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-slate-500" />
                            <span>
                              {log.user.fullName} <span className="text-slate-500">({log.user.email})</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Anonymous System</span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right text-slate-500 text-xs font-mono">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-600" /> {log.ipAddress || 'Unknown'}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
