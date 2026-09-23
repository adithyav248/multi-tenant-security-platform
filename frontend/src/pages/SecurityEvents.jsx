import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Plus, Filter } from 'lucide-react';

export default function SecurityEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    eventType: 'MALWARE_ALERT',
    severity: 'MEDIUM',
    description: '',
    status: 'OPEN'
  });

  const fetchEvents = useCallback(async (page = 1) => {
    try {
      const res = await api.get('/events', {
        params: { page, limit: 8, severity: severityFilter || undefined, status: statusFilter || undefined }
      });
      setEvents(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    }
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    fetchEvents(1);
  }, [fetchEvents]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', newEvent);
      setShowModal(false);
      setNewEvent({ title: '', eventType: 'MALWARE_ALERT', severity: 'MEDIUM', description: '', status: 'OPEN' });
      fetchEvents(1);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/events/${id}/status`, { status });
      fetchEvents(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Events</h1>
          <p className="text-sm text-slate-400">Monitor and resolve tenant security alerts</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Report Event</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white"
        >
          <option value="">All Severities</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Event Details</th>
              <th className="px-6 py-3">Severity</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Reported</th>
              {canEdit && <th className="px-6 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {events.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-white">{ev.title}</div>
                  <div className="text-xs text-indigo-400 font-mono">{ev.eventType}</div>
                  <div className="text-xs text-slate-500 mt-1">{ev.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    ev.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    ev.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    ev.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {ev.severity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded ${
                    ev.status === 'RESOLVED' ? 'bg-green-500/10 text-green-400' :
                    ev.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {ev.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(ev.createdAt).toLocaleString()}
                </td>
                {canEdit && (
                  <td className="px-6 py-4 text-right space-x-2">
                    {ev.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleStatusChange(ev.id, 'RESOLVED')}
                        className="text-xs text-green-400 hover:underline"
                      >
                        Resolve
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Report Security Event</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Title</label>
                <input
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Event Type</label>
                <input
                  required
                  value={newEvent.eventType}
                  onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Severity</label>
                <select
                  value={newEvent.severity}
                  onChange={(e) => setNewEvent({ ...newEvent, severity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
                <textarea
                  required
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}