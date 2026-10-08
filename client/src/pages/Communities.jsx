import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { listCommunities, fetchCommunityCategories } from '../services/communities';

const CommunityCard = ({ c }) => (
  <Link to={`/communities/${c._id}`} className="glass rounded-2xl overflow-hidden block hover:-translate-y-1 transition-transform duration-300">
    <div className="h-20 bg-gradient-to-br from-violet/30 to-cyan/20 relative">
      {c.banner?.url && <img src={c.banner.url} alt="" className="w-full h-full object-cover" />}
      <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-magenta flex items-center justify-center font-display font-bold border-4 border-white dark:border-deep overflow-hidden text-sm">
        {c.logo?.url ? <img src={c.logo.url} alt="" className="w-full h-full object-cover" /> : c.name?.slice(0, 2).toUpperCase()}
      </div>
    </div>
    <div className="p-4 pt-7">
      <h3 className="font-display font-semibold text-sm truncate">{c.name}</h3>
      <p className="text-[10px] font-mono text-cyan uppercase mt-0.5">{c.category}</p>
      <p className="text-xs text-ink/40 dark:text-white/40 mt-2">{c.memberCount} members</p>
    </div>
  </Link>
);

const Communities = () => {
  const [filters, setFilters] = useState({ category: '', q: '' });
  const { data: categories = [] } = useQuery({ queryKey: ['community-categories'], queryFn: fetchCommunityCategories });
  const { items, isLoading, isFetchingNextPage, sentinelRef } = useInfiniteFeed(
    ['communities', filters],
    (page) => listCommunities({ ...filters, page })
  );

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl">Communities</h1>
          <Link to="/communities/new" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full">
            + Create community
          </Link>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search communities…"
            className="flex-1 min-w-[200px] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-cyan"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 text-sm outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
        {!isLoading && items.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No communities match yet.</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((c) => <CommunityCard key={c._id} c={c} />)}
        </div>

        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-6">
          {isFetchingNextPage && <span className="text-xs text-ink/40 dark:text-white/40 font-mono">Loading more…</span>}
        </div>
      </div>
    </div>
  );
};

export default Communities;
