import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Flag, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/metrics')
      .then((res) => setMetrics(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-slate-400">Loading dashboard metrics...</div>;

  const statCards = [
    { title: 'Tenant Users', value: metrics?.userCount, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
    { title: 'Campaigns', value: metrics?.campaignCount, icon: Flag, color: 'text-green-400 bg-green-500/10' },
    { title: 'Open Events', value: metrics?.openEventsCount, icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10' },
    { title: 'Critical Active Threats', value: metrics?.criticalEventsCount, icon: ShieldCheck, color: 'text-red-400 bg-red-500/10' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">{card.title}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Recent Activity & Audit Trail</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {metrics?.recentActivity?.length === 0 ? (
            <p className="text-slate-500 text-sm py-4">No recent activity found.</p>
          ) : (
            metrics?.recentActivity.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-indigo-400">{act.action}</span>
                  <span className="text-slate-400 ml-2">by {act.user ? act.user.name : 'System'}</span>
                  <p className="text-xs text-slate-500">{act.details}</p>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(act.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}