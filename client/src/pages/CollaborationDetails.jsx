import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCollaboration, applyToCollaboration, respondToApplicant, closeCollaboration } from '../services/collaborations';
import { useAuth } from '../context/AuthContext.jsx';

const CollaborationDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const { data: collab, isLoading, refetch } = useQuery({ queryKey: ['collaboration', id], queryFn: () => fetchCollaboration(id) });

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading…</div>;
  if (!collab) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Not found.</div>;

  const isOwner = user && (user._id === collab.postedBy?._id || user.id === collab.postedBy?._id);
  const alreadyApplied = user && collab.applicants.some((a) => a.user?._id === user._id || a.user?._id === user.id);

  const apply = async (e) => {
    e.preventDefault();
    await applyToCollaboration(id, message);
    setMessage('');
    refetch();
  };

  const respond = async (userId, action) => {
    await respondToApplicant(id, userId, action);
    refetch();
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <Link to="/collaborations" className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan">← Back</Link>
        <p className="text-[10px] font-mono text-cyan uppercase mt-4">{collab.type} · {collab.status}</p>
        <h1 className="font-display font-bold text-2xl mt-1">{collab.title}</h1>
        <p className="text-sm text-ink/50 dark:text-white/50 mt-1">by {collab.postedBy?.name}</p>
        <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed mt-5 whitespace-pre-wrap">{collab.description}</p>

        {collab.rolesNeeded?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {collab.rolesNeeded.map((r) => <span key={r} className="text-xs font-mono px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">{r}</span>)}
          </div>
        )}

        {isOwner && collab.status === 'open' && (
          <button onClick={async () => { await closeCollaboration(id); refetch(); }} className="text-xs text-magenta mt-4">Close this posting</button>
        )}

        {!isOwner && user && collab.status === 'open' && !alreadyApplied && (
          <form onSubmit={apply} className="mt-6 flex gap-2">
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Why are you a good fit?" className="flex-1 text-sm bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2 outline-none" />
            <button type="submit" className="text-sm font-semibold text-cyan">Apply</button>
          </form>
        )}
        {alreadyApplied && <p className="text-sm text-cyan mt-6">You've applied to this collaboration.</p>}

        {isOwner && (
          <div className="mt-8">
            <h3 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-3">Applicants ({collab.applicants.length})</h3>
            <div className="space-y-2">
              {collab.applicants.map((a) => (
                <div key={a.user?._id} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <Link to={`/u/${a.user?.username}`} className="text-sm font-semibold hover:text-cyan">{a.user?.name}</Link>
                    <span className="text-xs font-mono text-ink/40 dark:text-white/40 capitalize">{a.status}</span>
                  </div>
                  {a.message && <p className="text-sm text-ink/60 dark:text-white/60 mt-1">{a.message}</p>}
                  {a.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => respond(a.user._id, 'accept')} className="text-xs text-cyan">Accept</button>
                      <button onClick={() => respond(a.user._id, 'reject')} className="text-xs text-magenta">Reject</button>
                    </div>
                  )}
                </div>
              ))}
              {collab.applicants.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No applicants yet.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationDetails;
