import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBusinessDashboard, fetchMarketplaceDashboard } from '../services/dashboard';
import StarRating from '../components/StarRating.jsx';

const StatCard = ({ label, value }) => (
  <div className="glass rounded-xl p-5 text-center">
    <p className="font-display font-bold text-2xl">{value}</p>
    <p className="text-xs font-mono text-ink/40 dark:text-white/40 uppercase mt-1">{label}</p>
  </div>
);

const EntrepreneurDashboard = () => {
  const { data, isLoading } = useQuery({ queryKey: ['business-dashboard'], queryFn: fetchBusinessDashboard });
  const { data: marketplace } = useQuery({ queryKey: ['marketplace-dashboard'], queryFn: fetchMarketplaceDashboard });

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading dashboard…</div>;

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl">Entrepreneur dashboard</h1>
          <div className="flex gap-2">
            <Link to="/businesses/new" className="text-sm font-semibold border border-black/10 dark:border-white/15 px-5 py-2 rounded-full">
              + New business
            </Link>
            <Link to="/marketplace/new" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full">
              + New listing
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Followers" value={data.totalFollowers} />
          <StatCard label="Profile views" value={data.totalProfileViews} />
          <StatCard label="Products" value={data.totalProducts} />
          <StatCard label="Product views" value={data.totalProductViews} />
        </div>

        {data.businesses.length === 0 && (
          <p className="text-sm text-ink/40 dark:text-white/40 mb-8">
            You haven't set up a business profile yet. <Link to="/businesses/new" className="text-cyan">Create one →</Link>
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Inquiries by status</h2>
            <div className="space-y-2">
              {Object.entries(data.inquiriesByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="capitalize text-ink/60 dark:text-white/60">{status}</span>
                  <span className="font-mono font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Recent inquiries</h2>
            {data.recentInquiries.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No inquiries yet.</p>}
            <div className="space-y-3">
              {data.recentInquiries.map((i) => (
                <div key={i._id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{i.buyer?.name} — {i.product?.name}</span>
                  <span className="text-xs font-mono text-ink/40 dark:text-white/40">{i.status}</span>
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

          {marketplace && (
            <div className="glass rounded-2xl p-6">
              <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Top performing listings</h2>
              {marketplace.topPerforming.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No listings yet.</p>}
              <div className="space-y-2">
                {marketplace.topPerforming.map((p) => (
                  <Link key={p._id} to={`/marketplace/${p._id}`} className="flex items-center justify-between text-sm hover:text-cyan">
                    <span className="truncate">{p.name}</span>
                    <span className="text-xs font-mono text-ink/40 dark:text-white/40">{p.viewCount} views</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntrepreneurDashboard;
