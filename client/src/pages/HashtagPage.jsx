import React from 'react';
import { useParams } from 'react-router-dom';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { fetchHashtagPage } from '../services/social';
import StoryCard from '../components/StoryCard.jsx';

const HashtagPage = () => {
  const { tag } = useParams();
  const { items, isLoading, isFetchingNextPage, hasNextPage, sentinelRef, data } = useInfiniteFeed(
    ['hashtag', tag],
    (page) => fetchHashtagPage(tag, { page })
  );
  const usageCount = data?.pages?.[0]?.usageCount;

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl mb-1">#{tag}</h1>
        {usageCount !== undefined && (
          <p className="text-sm text-ink/40 dark:text-white/40 font-mono mb-6">{usageCount} stories</p>
        )}
        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-ink/40 dark:text-white/40">No stories tagged #{tag} yet.</p>
        )}
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
    </div>
  );
};

export default HashtagPage;
