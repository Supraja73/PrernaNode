import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/AdminLayout.jsx';
import { fetchOverview, fetchSystemHealth, fetchRecentActivity, fetchGrowth } from '../../services/admin';

const StatCard = ({ label, value }) => (
  <div className="glass rounded-xl p-4 text-center">
    <p className="font-display font-bold text-xl">{value}</p>
    <p className="text-[10px] font-mono text-ink/40 dark:text-white/40 uppercase mt-1">{label}</p>
  </div>
);

const AdminDashboard = () => {
  const { data: overview, isLoading } = useQuery({ queryKey: ['admin-overview'], queryFn: fetchOverview, refetchInterval: 30000 });
  const { data: health } = useQuery({ queryKey: ['admin-health'], queryFn: fetchSystemHealth, refetchInterval: 15000 });
  const { data: activity } = useQuery({ queryKey: ['admin-activity'], queryFn: fetchRecentActivity });
  const { data: growth } = useQuery({ queryKey: ['admin-growth'], queryFn: fetchGrowth });

  return (
    <AdminLayout>
      <h1 className="font-display font-bold text-2xl mb-6">System overview</h1>
      {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}

      {overview && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total users" value={overview.users.total} />
            <StatCard label="Daily active" value={overview.users.dailyActive} />
            <StatCard label="New (30d)" value={overview.users.newLast30Days} />
            <StatCard label="Pending reports" value={overview.moderation.pendingReports} />
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <div className="glass rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">Content</p>
              <p className="text-sm">Stories: {overview.stories.published}/{overview.stories.total} published</p>
              <p className="text-sm">Communities: {overview.communities.total}</p>
              <p className="text-sm">Events: {overview.events.upcoming} upcoming</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">Marketplace & mentorship</p>
              <p className="text-sm">Products: {overview.marketplace.activeProducts}/{overview.marketplace.totalProducts} active</p>
              <p className="text-sm">Mentors: {overview.mentorship.totalSkillListings}</p>
              <p className="text-sm">Requests: {overview.mentorship.totalRequests}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">Trust & safety</p>
              <p className="text-sm">Banned: {overview.users.banned}</p>
              <p className="text-sm">Suspended: {overview.users.suspended}</p>
              <p className="text-sm">Businesses: {overview.businesses.total}</p>
            </div>
          </div>
        </>
      )}

      {health && (
        <div className="glass rounded-xl p-4 mb-6">
          <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">System health</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className={health.database.connected ? 'text-cyan' : 'text-magenta'}>DB: {health.database.state}</span>
            <span>Uptime: {Math.floor(health.uptimeSeconds / 3600)}h {Math.floor((health.uptimeSeconds % 3600) / 60)}m</span>
            <span>Memory: {health.memory.heapUsedMB}MB / {health.memory.heapTotalMB}MB</span>
            <span>Node {health.nodeVersion}</span>
          </div>
        </div>
      )}

      {growth?.userGrowth?.length > 0 && (
        <div className="glass rounded-xl p-4 mb-6">
          <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-3">User growth (monthly)</p>
          <div className="space-y-1.5">
            {growth.userGrowth.map((g) => (
              <div key={g.month} className="flex items-center gap-3 text-xs">
                <span className="w-16 text-ink/40 dark:text-white/40 font-mono">{g.month}</span>
                <div className="flex-1 h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gold to-magenta" style={{ width: `${Math.min(100, g.count * 8)}%` }} />
                </div>
                <span className="font-mono">{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activity && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4">
            <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">New users</p>
            {activity.newUsers.slice(0, 6).map((u) => <p key={u._id} className="text-sm">{u.name} (@{u.username})</p>)}
          </div>
          <div className="glass rounded-xl p-4">
            <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">Recent reports</p>
            {activity.newReports.slice(0, 6).map((r) => <p key={r._id} className="text-sm">{r.reporter?.name} reported a {r.targetType.replace('_', ' ')}</p>)}
            {activity.newReports.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">None yet.</p>}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
