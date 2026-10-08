import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/AdminLayout.jsx';
import {
  fetchAdminUsers, suspendUser, reactivateUser, banUser, unbanUser, warnUser,
  assignModerator, removeModerator, fetchVerificationRequests, reviewVerificationRequest,
} from '../../services/admin';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ q: '', role: '', status: '' });
  const { data, isLoading } = useQuery({ queryKey: ['admin-users', filters], queryFn: () => fetchAdminUsers(filters) });
  const { data: verifications = [] } = useQuery({ queryKey: ['admin-verifications'], queryFn: fetchVerificationRequests });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
  };

  const act = async (fn, ...args) => {
    await fn(...args);
    refresh();
  };

  return (
    <AdminLayout>
      <h1 className="font-display font-bold text-2xl mb-6">User management</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <input value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Search name/email/username…" className="flex-1 min-w-[200px] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2 text-sm outline-none" />
        <select value={filters.role} onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))} className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2 text-sm outline-none">
          <option value="">All roles</option>
          {['member', 'mentor', 'seller', 'moderator', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2 text-sm outline-none">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
      <div className="space-y-2">
        {data?.data?.map((u) => (
          <div key={u._id} className="glass rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{u.name} <span className="text-ink/40 dark:text-white/40 font-normal">@{u.username}</span></p>
              <p className="text-xs text-ink/40 dark:text-white/40 font-mono">{u.email} · {u.role} {u.isBanned && '· BANNED'} {u.isSuspended && '· SUSPENDED'}</p>
            </div>
            <div className="flex gap-2 flex-wrap text-xs">
              {!u.isSuspended ? (
                <button onClick={() => act(suspendUser, u._id, window.prompt('Suspension reason?') || 'Policy violation')} className="text-gold">Suspend</button>
              ) : (
                <button onClick={() => act(reactivateUser, u._id)} className="text-cyan">Reactivate</button>
              )}
              {!u.isBanned ? (
                <button onClick={() => act(banUser, u._id, window.prompt('Ban reason?') || 'Policy violation')} className="text-magenta">Ban</button>
              ) : (
                <button onClick={() => act(unbanUser, u._id)} className="text-cyan">Unban</button>
              )}
              <button onClick={() => act(warnUser, u._id, window.prompt('Warning reason?') || '')} className="text-ink/50 dark:text-white/50">Warn</button>
              {u.role !== 'moderator' && u.role !== 'admin' && (
                <button onClick={() => act(assignModerator, u._id)} className="text-violet">Make moderator</button>
              )}
              {u.role === 'moderator' && (
                <button onClick={() => act(removeModerator, u._id)} className="text-ink/50 dark:text-white/50">Remove moderator</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {verifications.length > 0 && (
        <div className="mt-8">
          <h2 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-3">Verification requests</h2>
          <div className="space-y-2">
            {verifications.map((v) => (
              <div key={v._id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{v.user?.name}</p>
                  <p className="text-xs text-ink/50 dark:text-white/50">{v.reason}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => act(reviewVerificationRequest, v._id, 'approve')} className="text-cyan">Approve</button>
                  <button onClick={() => act(reviewVerificationRequest, v._id, 'reject')} className="text-magenta">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
