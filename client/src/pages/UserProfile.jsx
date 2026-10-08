import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchUserByUsername } from '../services/social';
import FollowButton from '../components/FollowButton.jsx';
import StoryCard from '../components/StoryCard.jsx';

const UserProfile = () => {
  const { username } = useParams();
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', username],
    queryFn: () => fetchUserByUsername(username),
  });

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading…</div>;
  if (!user) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">User not found.</div>;

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-2xl font-display font-bold overflow-hidden shrink-0">
                {user.avatar?.url ? (
                  <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl">{user.name}</h1>
                <p className="text-ink/50 dark:text-white/50 text-sm">
                  @{user.username} · {user.headline || 'No headline yet'}
                </p>
                <span className="inline-block mt-1 text-[11px] font-mono uppercase tracking-wide text-cyan">{user.role}</span>
              </div>
            </div>
            <FollowButton userId={user._id} initiallyFollowing={user.isFollowing} />
          </div>

          {user.bio && <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed mt-6">{user.bio}</p>}

          <div className="flex gap-6 mt-6 text-sm">
            <Link to={`/u/${user.username}/followers`} className="hover:text-cyan transition-colors">
              <b className="font-display">{user.followersCount}</b> Followers
            </Link>
            <Link to={`/u/${user.username}/following`} className="hover:text-cyan transition-colors">
              <b className="font-display">{user.followingCount}</b> Following
            </Link>
          </div>
        </div>

        {user.pinnedStories?.length > 0 && (
          <div className="mt-8">
            <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Pinned</h2>
            <div className="space-y-6">
              {user.pinnedStories.map((s) => (
                <StoryCard key={s._id} story={{ ...s, author: user }} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-4">Recent stories</h2>
          {user.recentStories?.length === 0 && (
            <p className="text-sm text-ink/40 dark:text-white/40">No published stories yet.</p>
          )}
          <div className="space-y-6">
            {user.recentStories?.map((s) => (
              <StoryCard key={s._id} story={{ ...s, author: user }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
