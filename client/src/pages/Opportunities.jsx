import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { listOpportunities, fetchOpportunityTypes } from '../services/opportunities';
import { useAuth } from '../context/AuthContext.jsx';

const daysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return diff;
};

const Opportunities = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ type: '', mode: '', q: '' });
  const { data: types = [] } = useQuery({ queryKey: ['opportunity-types'], queryFn: fetchOpportunityTypes });
  const { items, isLoading, isFetchingNextPage, sentinelRef } = useInfiniteFeed(
    ['opportunities', filters],
    (page) => listOpportunities({ ...filters, page })
  );

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl">Opportunities Hub</h1>
          {user && <Link to="/opportunities/new" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full">+ Post opportunity</Link>}
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <input value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Search…" className="flex-1 min-w-[180px] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 text-sm outline-none" />
          <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 text-sm outline-none">
            <option value="">All types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.mode} onChange={(e) => setFilters((f) => ({ ...f, mode: e.target.value }))} className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 text-sm outline-none">
            <option value="">Any mode</option>
            <option>Remote</option><option>Hybrid</option><option>Offline</option>
          </select>
        </div>

        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
        <div className="space-y-3">
          {items.map((o) => {
            const dl = daysLeft(o.deadline);
            return (
              <Link key={o._id} to={`/opportunities/${o._id}`} className="glass rounded-xl p-5 flex items-center justify-between gap-4 block hover:-translate-y-0.5 transition-transform">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-cyan uppercase">{o.type} · {o.mode}</p>
                  <h3 className="font-display font-semibold truncate">{o.title}</h3>
                  <p className="text-xs text-ink/40 dark:text-white/40 truncate">{o.organization}</p>
                </div>
                {dl !== null && (
                  <span className={`text-xs font-mono px-2 py-1 rounded-full shrink-0 ${dl < 0 ? 'bg-black/10 dark:bg-white/10 text-ink/40 dark:text-white/40' : dl <= 7 ? 'bg-magenta/20 text-magenta' : 'bg-cyan/20 text-cyan'}`}>
                    {dl < 0 ? 'Closed' : `${dl}d left`}
                  </span>
                )}
              </Link>
            );
          })}
          {!isLoading && items.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No opportunities match yet.</p>}
        </div>
        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
          {isFetchingNextPage && <span className="text-xs text-ink/40 dark:text-white/40 font-mono">Loading more…</span>}
        </div>
      </div>
    </div>
  );
};

export default Opportunities;
