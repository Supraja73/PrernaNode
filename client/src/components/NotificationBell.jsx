import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchUnreadCount } from '../services/social';
import { useAuth } from '../context/AuthContext.jsx';

const NotificationBell = () => {
  const { user } = useAuth();

  // Polling, not push — a good candidate for Socket.io in a later part.
  const { data: count = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: fetchUnreadCount,
    enabled: !!user,
    refetchInterval: 20000,
  });

  if (!user) return null;

  return (
    <Link to="/notifications" className="relative w-9 h-9 rounded-full flex items-center justify-center border border-black/10 dark:border-white/15 hover:border-cyan transition-colors">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-magenta text-white text-[10px] font-mono flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
