import React, { useRef, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api';
import { Link } from 'react-router-dom';

const SessionsPanel = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => (await api.get('/auth/sessions')).data.data,
  });

  const revoke = useMutation({
    mutationFn: (id) => api.delete(`/auth/sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  if (isLoading) {
    return <p className="text-xs text-ink/40 dark:text-white/40 mt-2">Loading sessions…</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {(data || []).map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between bg-black/[0.03] dark:bg-white/5 rounded-lg px-4 py-3 text-sm"
        >
          <div>
            <p className="truncate max-w-[220px] sm:max-w-xs">{s.userAgent}</p>
            <p className="text-xs text-ink/40 dark:text-white/40 font-mono">
              {s.isCurrent ? 'This device' : new Date(s.lastUsedAt).toLocaleString()}
            </p>
          </div>
          {!s.isCurrent && (
            <button
              onClick={() => revoke.mutate(s.id)}
              className="text-xs text-magenta hover:underline shrink-0 ml-3"
            >
              Revoke
            </button>
          )}
        </div>
      ))}
      {(!data || data.length === 0) && (
        <p className="text-xs text-ink/40 dark:text-white/40">No active sessions found.</p>
      )}
    </div>
  );
};

const Profile = () => {
  const { user, refreshMe, logout } = useAuth();
  const avatarInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshMe();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not upload avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void px-4 py-14">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="font-display font-extrabold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-gold to-magenta"></span>
            PrernaNode
          </Link>
          <button onClick={logout} className="text-sm text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors">
            Log out
          </button>
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={() => avatarInput.current?.click()}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-2xl font-display font-bold overflow-hidden shrink-0"
            title="Change avatar"
          >
            {user.avatar?.url ? (
              <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name?.slice(0, 2).toUpperCase()
            )}
          </button>
          <input
            ref={avatarInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div>
            <h1 className="font-display font-bold text-2xl">{user.name}</h1>
            <p className="text-ink/50 dark:text-white/50 text-sm">
              @{user.username} · {user.headline || 'No headline yet'}
            </p>
            <span className="inline-block mt-1 text-[11px] font-mono uppercase tracking-wide text-cyan">
              {user.role}
            </span>
          </div>
        </div>

        {uploading && <p className="text-ink/40 dark:text-white/40 text-xs mt-3">Uploading avatar…</p>}
        {error && <p className="text-magenta text-xs mt-3">{error}</p>}

        <div className="mt-6">
          <div className="flex justify-between text-xs font-mono text-ink/40 dark:text-white/40 mb-1.5">
            <span>Profile completion</span>
            <span>{user.profileCompletion ?? 0}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold to-magenta transition-all duration-500"
              style={{ width: `${user.profileCompletion ?? 0}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div className="bg-black/[0.03] dark:bg-white/5 rounded-xl py-4">
            <div className="font-display font-bold text-xl">{user.followers?.length || 0}</div>
            <div className="text-ink/40 dark:text-white/40 text-xs font-mono uppercase">Followers</div>
          </div>
          <div className="bg-black/[0.03] dark:bg-white/5 rounded-xl py-4">
            <div className="font-display font-bold text-xl">{user.following?.length || 0}</div>
            <div className="text-ink/40 dark:text-white/40 text-xs font-mono uppercase">Following</div>
          </div>
          <div className="bg-black/[0.03] dark:bg-white/5 rounded-xl py-4">
            <div className="font-display font-bold text-xl">{user.skills?.length || 0}</div>
            <div className="text-ink/40 dark:text-white/40 text-xs font-mono uppercase">Skills</div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-2">Bio</h2>
          <p className="text-ink/70 dark:text-white/70 text-sm leading-relaxed">
            {user.bio || 'No bio yet. Add one from Edit profile.'}
          </p>
        </div>

        <div className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-2">
            Active sessions
          </h2>
          <SessionsPanel />
        </div>

        <div className="flex gap-3 mt-8 flex-wrap">
          <Link
            to="/profile/edit"
            className="inline-block bg-gradient-to-r from-gold to-magenta text-void font-semibold text-sm px-6 py-3 rounded-full"
          >
            Edit profile
          </Link>
          <Link
            to="/saved-stories"
            className="inline-block border border-black/10 dark:border-white/15 font-semibold text-sm px-6 py-3 rounded-full hover:border-cyan transition-colors"
          >
            Saved stories
          </Link>
          <Link
            to="/saved-collections"
            className="inline-block border border-black/10 dark:border-white/15 font-semibold text-sm px-6 py-3 rounded-full hover:border-cyan transition-colors"
          >
            Saved collections
          </Link>
          <Link
            to="/mentor-requests"
            className="inline-block border border-black/10 dark:border-white/15 font-semibold text-sm px-6 py-3 rounded-full hover:border-cyan transition-colors"
          >
            Mentorship requests
          </Link>
          <Link
            to="/inquiries"
            className="inline-block border border-black/10 dark:border-white/15 font-semibold text-sm px-6 py-3 rounded-full hover:border-cyan transition-colors"
          >
            Inquiries
          </Link>
          <Link
            to="/dashboard/mentor"
            className="inline-block border border-black/10 dark:border-white/15 font-semibold text-sm px-6 py-3 rounded-full hover:border-cyan transition-colors"
          >
            Mentor dashboard
          </Link>
          <Link
            to="/dashboard/entrepreneur"
            className="inline-block border border-black/10 dark:border-white/15 font-semibold text-sm px-6 py-3 rounded-full hover:border-cyan transition-colors"
          >
            Entrepreneur dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
