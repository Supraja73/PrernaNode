import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { globalSearch } from '../services/social';
import StoryCard from '../components/StoryCard.jsx';
import HashtagChip from '../components/HashtagChip.jsx';
import FollowButton from '../components/FollowButton.jsx';

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'users', label: 'People' },
  { key: 'stories', label: 'Stories' },
  { key: 'hashtags', label: 'Hashtags' },
  { key: 'skills', label: 'Skills' },
];

const SearchResults = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [input, setInput] = useState(q);
  const [type, setType] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['search', q, type],
    queryFn: () => globalSearch(q, type),
    enabled: !!q,
  });

  const submit = (e) => {
    e.preventDefault();
    setParams({ q: input });
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={submit} className="mb-6">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search people, stories, skills, hashtags…"
            className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-cyan"
          />
        </form>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`text-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                type === t.key ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10 text-ink/50 dark:text-white/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!q && <p className="text-sm text-ink/40 dark:text-white/40">Type something to search PrernaNode.</p>}
        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Searching…</p>}

        {data?.users?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">People</h3>
            <div className="space-y-3">
              {data.users.map((u) => (
                <div key={u._id} className="glass rounded-xl p-4 flex items-center justify-between">
                  <Link to={`/u/${u.username}`} className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-xs font-bold shrink-0">
                      {u.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{u.name}</p>
                      <p className="text-xs text-ink/40 dark:text-white/40 truncate">@{u.username}</p>
                    </div>
                  </Link>
                  <FollowButton userId={u._id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.hashtags?.length > 0 && (
          <div className="mb-8">
            <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">Hashtags</h3>
            <div className="flex flex-wrap gap-2">
              {data.hashtags.map((h) => (
                <HashtagChip key={h.tag} tag={h.tag} count={h.usageCount} />
              ))}
            </div>
          </div>
        )}

        {data?.stories?.length > 0 && (
          <div>
            <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">Stories</h3>
            <div className="space-y-6">
              {data.stories.map((s) => (
                <StoryCard key={s._id} story={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
