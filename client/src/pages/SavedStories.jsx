import React from 'react';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { fetchSavedStories } from '../services/stories';
import StoryCard from '../components/StoryCard.jsx';

const SavedStories = () => {
  const { items, isLoading, isFetchingNextPage, hasNextPage, sentinelRef } = useInfiniteFeed(
    ['saved-stories'],
    (page) => fetchSavedStories({ page })
  );

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl mb-6">Saved stories</h1>
        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-ink/40 dark:text-white/40">You haven't saved any stories yet.</p>
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

export default SavedStories;
