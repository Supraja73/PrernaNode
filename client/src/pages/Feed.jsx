import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { fetchFeed, fetchCategories } from '../services/stories';
import { fetchSuggestedUsers, fetchTrendingHashtags } from '../services/social';
import StoryCard from '../components/StoryCard.jsx';
import FollowButton from '../components/FollowButton.jsx';
import HashtagChip from '../components/HashtagChip.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const sorts = [
  { key: 'newest', label: 'Newest' },
  { key: 'trending', label: 'Trending' },
  { key: 'most-liked', label: 'Most Liked' },
  { key: 'following', label: 'Following', authOnly: true },
  { key: 'recommended', label: 'Recommended', authOnly: true },
];

const Feed = () => {
  const { user } = useAuth();
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('');

  const { items, isLoading, isFetchingNextPage, hasNextPage, sentinelRef } = useInfiniteFeed(
    ['feed', sort, category],
    (page) => fetchFeed({ sort, page, category: category || undefined })
  );

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => fetchSuggestedUsers(5),
    enabled: !!user,
  });
  const { data: trendingTags = [] } = useQuery({ queryKey: ['trending-hashtags'], queryFn: () => fetchTrendingHashtags(10) });

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex gap-2 overflow-x-auto">
              {sorts
                .filter((s) => !s.authOnly || user)
                .map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSort(s.key)}
                    className={`text-sm px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                      sort === s.key
                        ? 'bg-gradient-to-r from-gold to-magenta text-void font-semibold'
                        : 'border border-black/10 dark:border-white/15 text-ink/60 dark:text-white/60'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
            </div>
            {user && (
              <Link
                to="/create-story"
                className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full"
              >
                + New story
              </Link>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
            <button
              onClick={() => setCategory('')}
              className={`text-xs font-mono px-3 py-1.5 rounded-full whitespace-nowrap ${
                !category ? 'bg-cyan/20 text-cyan' : 'text-ink/40 dark:text-white/40 border border-black/10 dark:border-white/10'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-xs font-mono px-3 py-1.5 rounded-full whitespace-nowrap ${
                  category === c ? 'bg-cyan/20 text-cyan' : 'text-ink/40 dark:text-white/40 border border-black/10 dark:border-white/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading feed…</p>}
          {!isLoading && items.length === 0 && (
            <p className="text-sm text-ink/40 dark:text-white/40">
              No stories here yet{sort === 'following' ? ' — follow some creators to fill this feed' : ''}.
            </p>
          )}

          <div className="space-y-6">
            {items.map((story) => (
              <StoryCard key={story._id} story={story} />
            ))}
          </div>

          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && <span className="text-xs text-ink/40 dark:text-white/40 font-mono">Loading more…</span>}
            {!hasNextPage && items.length > 0 && (
              <span className="text-xs text-ink/30 dark:text-white/30 font-mono">You're all caught up</span>
            )}
          </div>
        </div>

        <aside className="space-y-6 hidden lg:block">
          {user && suggestions.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Suggested for you</h3>
              <div className="space-y-3">
                {suggestions.map((u) => (
                  <div key={u._id} className="flex items-center justify-between gap-2">
                    <Link to={`/u/${u.username}`} className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-xs font-bold shrink-0">
                        {u.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm truncate">{u.name}</span>
                    </Link>
                    <FollowButton userId={u._id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {trendingTags.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Trending hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((h) => (
                  <HashtagChip key={h.tag} tag={h.tag} count={h.usageCount} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Feed;
