import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMentorDashboard, fetchMentorAnalytics } from '../services/dashboard';
import StarRating from '../components/StarRating.jsx';

const StatCard = ({ label, value }) => (
  <div className="glass rounded-xl p-5 text-center">
    <p className="font-display font-bold text-2xl">{value}</p>
    <p className="text-xs font-mono text-ink/40 dark:text-white/40 uppercase mt-1">{label}</p>
  </div>
);

const MentorDashboard = () => {
  const { data, isLoading } = useQuery({ queryKey: ['mentor-dashboard'], queryFn: fetchMentorDashboard });
  const { data: analytics } = useQuery({ queryKey: ['mentor-analytics'], queryFn: fetchMentorAnalytics });

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading dashboard…</div>;

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl">Mentor dashboard</h1>
          <Link to="/skills/new" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full">
            + New skill listing
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Listings" value={data.totalSkillListings} />
          <StatCard label="Profile views" value={data.totalProfileViews} />
          <StatCard label="Students" value={data.totalStudents} />
          <StatCard label="Avg rating" value={data.averageRating} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Requests by status</h2>
            <div className="space-y-2">
              {Object.entries(data.requestsByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="capitalize text-ink/60 dark:text-white/60">{status}</span>
                  <span className="font-mono font-semibold">{count}</span>
                </div>
              ))}
            </div>
            <Link to="/mentor-requests" className="inline-block text-xs text-cyan mt-4">View all requests →</Link>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Recent requests</h2>
            {data.recentRequests.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No requests yet.</p>}
            <div className="space-y-3">
              {data.recentRequests.map((r) => (
                <div key={r._id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{r.student?.name} — {r.skill?.skillName}</span>
                  <span className="text-xs font-mono text-ink/40 dark:text-white/40">{r.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Recent reviews</h2>
            {data.recentReviews.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No reviews yet.</p>}
            <div className="space-y-3">
              {data.recentReviews.map((r) => (
                <div key={r._id}>
                  <StarRating value={r.rating} readOnly size={12} />
                  <p className="text-sm text-ink/60 dark:text-white/60 mt-1 line-clamp-2">{r.description}</p>
                </div>
              ))}
            </div>
          </div>

          {analytics?.requestsPerMonth?.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Requests per month</h2>
              <div className="space-y-1.5">
                {analytics.requestsPerMonth.map((m) => (
                  <div key={m.month} className="flex items-center gap-3 text-xs">
                    <span className="w-16 text-ink/40 dark:text-white/40 font-mono">{m.month}</span>
                    <div className="flex-1 h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-gold to-magenta" style={{ width: `${Math.min(100, m.count * 12)}%` }} />
                    </div>
                    <span className="font-mono">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
