import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchChats } from '../services/chat';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const Messages = () => {
  const { data: chats = [], isLoading } = useQuery({ queryKey: ['chats'], queryFn: fetchChats, refetchInterval: 15000 });

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="font-display font-bold text-2xl mb-6">Messages</h1>
        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
        {!isLoading && chats.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No conversations yet. Visit a profile to say hello.</p>}
        <div className="space-y-2">
          {chats.map((chat) => {
            const other = !chat.isGroup ? chat.participants.find((p) => p) : null;
            const displayName = chat.isGroup ? (chat.community?.name || chat.name || 'Group chat') : other?.name;
            return (
              <Link key={chat._id} to={`/messages/${chat._id}`} className="glass rounded-xl p-4 flex items-center gap-3 block">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-sm font-bold overflow-hidden">
                    {displayName?.slice(0, 2).toUpperCase()}
                  </div>
                  {chat.isOtherOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-deep" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate">{displayName}</p>
                    <span className="text-[10px] text-ink/30 dark:text-white/30 font-mono shrink-0">{timeAgo(chat.lastMessage?.sentAt)}</span>
                  </div>
                  <p className="text-xs text-ink/40 dark:text-white/40 truncate">{chat.lastMessage?.text || 'Say hello 👋'}</p>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="text-[10px] font-mono bg-magenta text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0">{chat.unreadCount}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Messages;
