import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Trash2 } from 'lucide-react';

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ title: '', description: '', status: 'DRAFT' });

  const fetchCampaigns = useCallback(async (page = 1) => {
    try {
      const res = await api.get('/campaigns', {
        params: { page, limit: 6, search, status: statusFilter || undefined }
      });
      setCampaigns(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchCampaigns(1);
  }, [fetchCampaigns]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/campaigns', newCampaign);
      setShowModal(false);
      setNewCampaign({ title: '', description: '', status: 'DRAFT' });
      fetchCampaigns(1);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create campaign');
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    try {
      await api.put(`/campaigns/${id}`, { status: nextStatus });
      fetchCampaigns(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status transition');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      fetchCampaigns(pagination.page);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete');
    }
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canDelete = user?.role === 'ADMIN';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaign Management</h1>
          <p className="text-sm text-slate-400">Manage security awareness & testing campaigns</p>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Assignees</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/50 transition">
                <td className="px-6 py-4">
                  <div className="font-semibold text-white">{c.title}</div>
                  <div className="text-xs text-slate-500">{c.description || 'No description'}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    c.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                    c.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400' :
                    c.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-400">
                  {c.assignees?.map(a => a.user.name).join(', ') || 'Unassigned'}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {canEdit && c.status === 'DRAFT' && (
                    <button onClick={() => handleStatusChange(c.id, 'ACTIVE')} className="text-xs text-green-400 hover:underline">Activate</button>
                  )}
                  {canEdit && c.status === 'ACTIVE' && (
                    <button onClick={() => handleStatusChange(c.id, 'COMPLETED')} className="text-xs text-blue-400 hover:underline">Complete</button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(c.id)} className="text-slate-500 hover:text-red-400 transition ml-2">
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
        <div className="space-x-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchCampaigns(pagination.page - 1)}
            className="px-3 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-40"
          >
            Previous
          </button>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchCampaigns(pagination.page + 1)}
            className="px-3 py-1 bg-slate-900 border border-slate-800 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Create Campaign</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Title</label>
                <input
                  required
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}