import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { followUser, unfollowUser } from '../services/social';
import { useAuth } from '../context/AuthContext.jsx';

const FollowButton = ({ userId, initiallyFollowing = false, className = '' }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);

  const mutation = useMutation({
    mutationFn: () => (isFollowing ? unfollowUser(userId) : followUser(userId)),
    onSuccess: () => {
      setIsFollowing((f) => !f);
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', userId] });
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
    },
  });

  if (!user || user._id === userId || user.id === userId) return null;

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors disabled:opacity-60 ${
        isFollowing
          ? 'border border-black/10 dark:border-white/15 hover:border-magenta hover:text-magenta'
          : 'bg-gradient-to-r from-gold to-magenta text-void'
      } ${className}`}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
};

export default FollowButton;
