import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ImageCarousel from '../components/ImageCarousel.jsx';
import HashtagChip from '../components/HashtagChip.jsx';
import CommentThread from '../components/CommentThread.jsx';
import FollowButton from '../components/FollowButton.jsx';
import {
  fetchStory,
  fetchComments,
  addComment,
  likeStory,
  unlikeStory,
  saveStory,
  unsaveStory,
  shareStory,
  deleteStory,
} from '../services/stories';
import { useAuth } from '../context/AuthContext.jsx';

const StoryDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState(null);

  const { data: story, isLoading, refetch } = useQuery({
    queryKey: ['story', id],
    queryFn: () => fetchStory(id),
  });

  const { data: commentsRes } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => fetchComments(id),
    enabled: !!story,
  });

  const comments = localComments || commentsRes?.data || [];

  if (isLoading) {
    return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading story…</div>;
  }
  if (!story) {
    return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Story not found.</div>;
  }

  const isOwner = user && (user._id === story.author?._id || user.id === story.author?._id);

  const toggleLike = async () => {
    if (story.isLiked) await unlikeStory(story._id);
    else await likeStory(story._id);
    refetch();
  };

  const toggleSave = async () => {
    if (story.isSaved) await unsaveStory(story._id);
    else await saveStory(story._id);
    refetch();
  };

  const handleShare = async () => {
    const res = await shareStory(story._id);
    if (navigator.share) {
      await navigator.share({ title: story.title, url: res.url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(res.url);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this story permanently?')) return;
    await deleteStory(story._id);
    navigate('/feed');
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const created = await addComment(story._id, commentText.trim());
    setLocalComments([created, ...comments]);
    setCommentText('');
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/u/${story.author?.username}`} className="w-11 h-11 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center font-display font-bold overflow-hidden">
                {story.author?.avatar?.url ? (
                  <img src={story.author.avatar.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  story.author?.name?.slice(0, 2).toUpperCase()
                )}
              </Link>
              <div>
                <Link to={`/u/${story.author?.username}`} className="font-display font-semibold hover:text-cyan">
                  {story.author?.name}
                </Link>
                <p className="text-xs text-ink/40 dark:text-white/40 font-mono">
                  {story.category} · {new Date(story.publishedAt || story.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {story.author?._id && <FollowButton userId={story.author._id} />}
          </div>

          {(story.images?.length > 0 || story.video?.url) && (
            <div className="px-6">
              <ImageCarousel images={story.images} video={story.video} alt={story.title} />
            </div>
          )}

          <div className="p-6">
            <h1 className="font-display font-bold text-2xl mb-4">{story.title}</h1>
            <p className="text-ink/70 dark:text-white/70 leading-relaxed whitespace-pre-wrap">{story.description}</p>

            {story.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {story.hashtags.map((tag) => (
                  <HashtagChip key={tag} tag={tag} />
                ))}
              </div>
            )}

            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-black/5 dark:border-white/10 text-sm">
              <button onClick={toggleLike} className={story.isLiked ? 'text-magenta font-semibold' : 'text-ink/50 dark:text-white/50'}>
                ♥ {story.likesCount} Likes
              </button>
              <span className="text-ink/50 dark:text-white/50">💬 {story.commentsCount} Comments</span>
              <button onClick={handleShare} className="text-ink/50 dark:text-white/50">
                ↗ {story.sharesCount} Shares
              </button>
              <button onClick={toggleSave} className={story.isSaved ? 'text-gold font-semibold ml-auto' : 'text-ink/50 dark:text-white/50 ml-auto'}>
                {story.isSaved ? 'Saved' : 'Save'}
              </button>
              {isOwner && (
                <>
                  <Link to={`/edit-story/${story._id}`} className="text-cyan">
                    Edit
                  </Link>
                  <button onClick={handleDelete} className="text-magenta">
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div id="comments" className="glass rounded-2xl p-6 mt-6">
          <h2 className="font-display font-semibold text-lg mb-4">Comments ({story.commentsCount})</h2>
          {user ? (
            <form onSubmit={submitComment} className="flex gap-2 mb-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment… use @username to mention"
                className="flex-1 text-sm bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 outline-none focus:border-cyan"
              />
              <button type="submit" className="text-sm font-semibold text-void bg-gradient-to-r from-gold to-magenta px-5 rounded-full">
                Post
              </button>
            </form>
          ) : (
            <p className="text-sm text-ink/40 dark:text-white/40">
              <Link to="/login" className="text-cyan">
                Log in
              </Link>{' '}
              to join the conversation.
            </p>
          )}
          <CommentThread comments={comments} storyId={story._id} />
        </div>
      </div>
    </div>
  );
};

export default StoryDetails;
