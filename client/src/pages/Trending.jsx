import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { fetchFeed } from '../services/stories';
import { fetchPopularCreators, fetchTrendingMentors, fetchTrendingHashtags } from '../services/social';
import StoryCard from '../components/StoryCard.jsx';
import HashtagChip from '../components/HashtagChip.jsx';
import FollowButton from '../components/FollowButton.jsx';

const Trending = () => {
  const { items, isLoading, isFetchingNextPage, hasNextPage, sentinelRef } = useInfiniteFeed(
    ['feed', 'trending', ''],
    (page) => fetchFeed({ sort: 'trending', page })
  );
  const { data: creators = [] } = useQuery({ queryKey: ['popular-creators'], queryFn: () => fetchPopularCreators(6) });
  const { data: mentors = [] } = useQuery({ queryKey: ['trending-mentors'], queryFn: () => fetchTrendingMentors(6) });
  const { data: tags = [] } = useQuery({ queryKey: ['trending-hashtags'], queryFn: () => fetchTrendingHashtags(12) });

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <h1 className="font-display font-bold text-2xl mb-6">Trending stories</h1>
          {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
          <div className="space-y-6">
            {items.map((story) => (
              <StoryCard key={story._id} story={story} />
            ))}
          </div>
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && <span className="text-xs text-ink/40 dark:text-white/40 font-mono">Loading more…</span>}
            {!hasNextPage && items.length > 0 && <span className="text-xs text-ink/30 dark:text-white/30 font-mono">End of list</span>}
          </div>
        </div>

        <aside className="space-y-6">
          {tags.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Trending topics</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((h) => (
                  <HashtagChip key={h.tag} tag={h.tag} count={h.usageCount} />
                ))}
              </div>
            </div>
          )}

          {creators.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Popular creators</h3>
              <div className="space-y-3">
                {creators.map((c) => (
                  <div key={c._id} className="flex items-center justify-between gap-2">
                    <Link to={`/u/${c.username}`} className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-magenta flex items-center justify-center text-xs font-bold shrink-0">
                        {c.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm truncate">{c.name}</span>
                    </Link>
                    <FollowButton userId={c._id} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {mentors.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Trending mentors</h3>
              <div className="space-y-3">
                {mentors.map((m) => (
                  <div key={m._id} className="flex items-center justify-between gap-2">
                    <Link to={`/u/${m.username}`} className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-violet flex items-center justify-center text-xs font-bold shrink-0">
                        {m.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm truncate">{m.name}</span>
                    </Link>
                    <FollowButton userId={m._id} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Trending;
