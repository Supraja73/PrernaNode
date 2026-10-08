import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { fetchFollowing, fetchUserByUsername } from '../services/social';
import FollowButton from '../components/FollowButton.jsx';

const Following = () => {
  const { username } = useParams();
  const { data: profileUser } = useQuery({ queryKey: ['user', username], queryFn: () => fetchUserByUsername(username) });
  const userId = profileUser?._id;

  const { items, isLoading, sentinelRef, isFetchingNextPage } = useInfiniteFeed(
    ['following', userId],
    (page) => fetchFollowing(userId, { page }),
    { enabled: !!userId }
  );

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="font-display font-bold text-2xl mb-6">Following</h1>
        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
        {!isLoading && items.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">Not following anyone yet.</p>}
        <div className="space-y-3">
          {items.map((u) => (
            <div key={u._id} className="glass rounded-xl p-4 flex items-center justify-between">
              <Link to={`/u/${u.username}`} className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan to-violet flex items-center justify-center text-xs font-bold shrink-0">
                  {u.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{u.name}</p>
                  <p className="text-xs text-ink/40 dark:text-white/40 truncate">@{u.username}</p>
                </div>
              </Link>
              <FollowButton userId={u._id} initiallyFollowing />
            </div>
          ))}
        </div>
        <div ref={sentinelRef} className="h-8">
          {isFetchingNextPage && <span className="text-xs text-ink/40 dark:text-white/40 font-mono">Loading more…</span>}
        </div>
      </div>
    </div>
  );
};

export default Following;
