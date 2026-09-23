import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { History, ShieldCheck } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchLogs = async (page = 1) => {
    try {
      const res = await api.get('/audit-logs', { params: { page, limit: 12 } });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center space-x-3">
        <History className="w-6 h-6 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Immutable Audit Trail</h1>
          <p className="text-sm text-slate-400">Security-critical actions recorded within your tenant</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Actor</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/50 text-xs">
                <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-mono font-bold text-indigo-400">{log.action}</td>
                <td className="px-6 py-4 text-slate-300">{log.user?.email || 'System'}</td>
                <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{log.details}</td>
                <td className="px-6 py-4 font-mono text-slate-500">{log.ipAddress || 'unknown'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}