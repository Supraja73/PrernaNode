import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { listCollaborations, fetchCollaborationTypes, applyToCollaboration } from '../services/collaborations';
import { useAuth } from '../context/AuthContext.jsx';

const CollabCard = ({ c }) => {
  const { user } = useAuth();
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const isOwner = user && (user._id === c.postedBy?._id || user.id === c.postedBy?._id);

  const apply = async (e) => {
    e.preventDefault();
    await applyToCollaboration(c._id, message);
    setApplied(true);
    setShowForm(false);
  };

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-[10px] font-mono text-cyan uppercase">{c.type}</p>
      <Link to={`/collaborations/${c._id}`}><h3 className="font-display font-semibold mt-1 hover:text-cyan">{c.title}</h3></Link>
      <p className="text-sm text-ink/60 dark:text-white/60 mt-1 line-clamp-2">{c.description}</p>
      {c.rolesNeeded?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {c.rolesNeeded.map((r) => <span key={r} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10">{r}</span>)}
        </div>
      )}
      <p className="text-xs text-ink/40 dark:text-white/40 mt-2">by {c.postedBy?.name}</p>

      {!isOwner && user && !applied && (
        <button onClick={() => setShowForm((s) => !s)} className="text-xs font-semibold text-cyan mt-3">Apply</button>
      )}
      {applied && <p className="text-xs text-cyan mt-3">Application sent</p>}
      {showForm && (
        <form onSubmit={apply} className="flex gap-2 mt-2">
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Short message…" className="flex-1 text-xs bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1.5 outline-none" />
          <button type="submit" className="text-xs font-semibold text-cyan">Send</button>
        </form>
      )}
    </div>
  );
};

const CollaborationHub = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ type: '' });
  const { data: types = [] } = useQuery({ queryKey: ['collab-types'], queryFn: fetchCollaborationTypes });
  const { items, isLoading, isFetchingNextPage, sentinelRef } = useInfiniteFeed(['collaborations', filters], (page) => listCollaborations({ ...filters, page }));

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl">Collaboration Hub</h1>
          {user && <Link to="/collaborations/new" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full">+ Post a request</Link>}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setFilters({ type: '' })} className={`text-xs px-3 py-1.5 rounded-full ${!filters.type ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10'}`}>All</button>
          {types.map((t) => (
            <button key={t} onClick={() => setFilters({ type: t })} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${filters.type === t ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10'}`}>{t}</button>
          ))}
        </div>
        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((c) => <CollabCard key={c._id} c={c} />)}
        </div>
        {!isLoading && items.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No open collaborations yet.</p>}
        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
          {isFetchingNextPage && <span className="text-xs text-ink/40 dark:text-white/40 font-mono">Loading more…</span>}
        </div>
      </div>
    </div>
  );
};

export default CollaborationHub;
