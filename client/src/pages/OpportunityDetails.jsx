import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchOpportunity, shareOpportunity, bookmarkOpportunity, unbookmarkOpportunity } from '../services/opportunities';
import { useAuth } from '../context/AuthContext.jsx';

const OpportunityDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const { data: o, isLoading } = useQuery({ queryKey: ['opportunity', id], queryFn: () => fetchOpportunity(id) });

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading…</div>;
  if (!o) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Not found.</div>;

  const handleShare = async () => {
    const res = await shareOpportunity(id);
    if (navigator.share) await navigator.share({ title: o.title, url: res.url || window.location.href }).catch(() => {});
    else await navigator.clipboard.writeText(window.location.href);
  };

  const toggleSave = async () => {
    if (saved) { await unbookmarkOpportunity(id); setSaved(false); }
    else { await bookmarkOpportunity(id); setSaved(true); }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <Link to="/opportunities" className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan">← Back</Link>
        <p className="text-[10px] font-mono text-cyan uppercase mt-4">{o.type} · {o.mode}</p>
        <h1 className="font-display font-bold text-2xl mt-1">{o.title}</h1>
        <p className="text-sm text-ink/50 dark:text-white/50 mt-1">{o.organization} {o.location && `· ${o.location}`}</p>
        {o.deadline && <p className="text-xs font-mono text-magenta mt-2">Deadline: {new Date(o.deadline).toLocaleDateString()}</p>}

        <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed mt-5 whitespace-pre-wrap">{o.description}</p>

        {o.eligibility && (
          <div className="mt-5">
            <h3 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-1">Eligibility</h3>
            <p className="text-sm text-ink/60 dark:text-white/60 whitespace-pre-wrap">{o.eligibility}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-8">
          <a href={o.applyLink} target="_blank" rel="noreferrer" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-6 py-3 rounded-full">
            Apply now ↗
          </a>
          {user && (
            <>
              <button onClick={toggleSave} className={`text-sm font-semibold border px-5 py-3 rounded-full ${saved ? 'border-gold text-gold' : 'border-black/10 dark:border-white/15'}`}>
                {saved ? 'Saved' : 'Save'}
              </button>
              <button onClick={handleShare} className="text-sm font-semibold border border-black/10 dark:border-white/15 px-5 py-3 rounded-full">Share</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityDetails;
