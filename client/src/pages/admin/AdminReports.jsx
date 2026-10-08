import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/AdminLayout.jsx';
import { fetchReports, resolveReport, moderateContent } from '../../services/admin';

const AdminReports = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('pending');
  const { data, isLoading } = useQuery({ queryKey: ['admin-reports', status], queryFn: () => fetchReports({ status }) });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] });

  const handle = async (report, actionTaken) => {
    if (actionTaken === 'hidden' || actionTaken === 'deleted') {
      try {
        await moderateContent(report.targetType, report.targetId, actionTaken === 'hidden' ? 'hide' : 'delete');
      } catch (err) {
        // content type may not be moderatable via the generic handler (e.g. 'message', 'profile') — still resolve the report
      }
    }
    await resolveReport(report._id, { status: 'resolved', actionTaken });
    refresh();
  };

  const dismiss = async (report) => {
    await resolveReport(report._id, { status: 'dismissed', actionTaken: 'none' });
    refresh();
  };

  return (
    <AdminLayout>
      <h1 className="font-display font-bold text-2xl mb-6">Reports</h1>

      <div className="flex gap-2 mb-6">
        {['pending', 'reviewed', 'resolved', 'dismissed'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`text-xs px-3 py-1.5 rounded-full capitalize ${status === s ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10'}`}>{s}</button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
      <div className="space-y-3">
        {data?.data?.map((r) => (
          <div key={r._id} className="glass rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold capitalize">{r.targetType.replace('_', ' ')} · {r.reason.replace('_', ' ')}</p>
              <span className="text-xs font-mono text-ink/40 dark:text-white/40">{new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-ink/40 dark:text-white/40 mt-1">Reported by {r.reporter?.name}</p>
            {r.description && <p className="text-sm text-ink/60 dark:text-white/60 mt-2">{r.description}</p>}
            {r.status === 'pending' && (
              <div className="flex gap-2 mt-3 text-xs flex-wrap">
                <button onClick={() => handle(r, 'hidden')} className="text-gold">Hide content</button>
                <button onClick={() => handle(r, 'deleted')} className="text-magenta">Delete content</button>
                <button onClick={() => handle(r, 'warned')} className="text-violet">Mark: warned user</button>
                <button onClick={() => dismiss(r)} className="text-ink/40 dark:text-white/40">Dismiss report</button>
              </div>
            )}
            {r.status !== 'pending' && <p className="text-xs text-cyan mt-2">Resolved: {r.actionTaken}</p>}
          </div>
        ))}
        {!isLoading && data?.data?.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No {status} reports.</p>}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
