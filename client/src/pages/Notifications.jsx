import React from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../services/social';

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const typeIcon = {
  follow: '👥',
  like_story: '❤️',
  like_comment: '❤️',
  comment: '💬',
  reply: '↩️',
  share: '↗️',
  save: '🔖',
  mention: '@',
  publish: '✨',
};

const linkFor = (n) => {
  if (n.story?._id) return `/stories/${n.story._id}${n.comment ? '#comments' : ''}`;
  return '#';
};

const Notifications = () => {
  const queryClient = useQueryClient();
  const { items, isLoading, sentinelRef, isFetchingNextPage } = useInfiniteFeed(
    ['notifications'],
    (page) => fetchNotifications({ page })
  );

  const handleReadAll = async () => {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['unread-count'] });
  };

  const handleClick = async (n) => {
    if (!n.read) {
      await markNotificationRead(n._id);
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl">Notifications</h1>
          <button onClick={handleReadAll} className="text-xs text-cyan">
            Mark all as read
          </button>
        </div>

        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-ink/40 dark:text-white/40">You're all caught up — nothing here yet.</p>
        )}

        <div className="space-y-2">
          {items.map((n) => (
            <Link
              key={n._id}
              to={linkFor(n)}
              onClick={() => handleClick(n)}
              className={`glass rounded-xl p-4 flex items-start gap-3 block transition-colors ${
                !n.read ? 'border-cyan/40' : ''
              }`}
            >
              <span className="text-lg shrink-0">{typeIcon[n.type] || '🔔'}</span>
              <div className="min-w-0">
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-ink/40 dark:text-white/40 font-mono mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <span className="ml-auto w-2 h-2 rounded-full bg-cyan shrink-0 mt-1.5" />}
            </Link>
          ))}
        </div>

        <div ref={sentinelRef} className="h-8">
          {isFetchingNextPage && <span className="text-xs text-ink/40 dark:text-white/40 font-mono">Loading more…</span>}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
