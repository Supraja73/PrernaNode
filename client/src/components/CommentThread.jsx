import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchReplies,
  addComment,
  likeComment,
  unlikeComment,
  deleteComment,
} from '../services/stories';

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const CommentItem = ({ comment, storyId, depth = 0 }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likesCount);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState(null);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [deleted, setDeleted] = useState(comment.deleted);

  const toggleLike = async () => {
    try {
      if (liked) {
        const res = await unlikeComment(comment._id);
        setLiked(false);
        setLikesCount(res.likesCount);
      } else {
        const res = await likeComment(comment._id);
        setLiked(true);
        setLikesCount(res.likesCount);
      }
    } catch (err) {
      // non-fatal
    }
  };

  const loadReplies = async () => {
    if (replies) {
      setReplies(null); // toggle closed
      return;
    }
    setLoadingReplies(true);
    try {
      const res = await fetchReplies(comment._id);
      setReplies(res.data);
    } finally {
      setLoadingReplies(false);
    }
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const created = await addComment(storyId, replyText.trim(), comment._id);
    setReplies((prev) => [...(prev || []), created]);
    setReplyText('');
    setShowReplyBox(false);
  };

  const handleDelete = async () => {
    await deleteComment(comment._id);
    setDeleted(true);
  };

  return (
    <div className={depth > 0 ? 'ml-10 mt-3' : 'mt-4'}>
      <div className="flex gap-3">
        <Link to={`/u/${comment.author?.username}`} className="w-8 h-8 rounded-full bg-gradient-to-br from-violet to-cyan flex items-center justify-center text-xs font-display font-bold shrink-0 overflow-hidden">
          {comment.author?.avatar?.url ? (
            <img src={comment.author.avatar.url} alt="" className="w-full h-full object-cover" />
          ) : (
            comment.author?.name?.slice(0, 2).toUpperCase()
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="glass rounded-xl px-4 py-2.5 inline-block max-w-full">
            <Link to={`/u/${comment.author?.username}`} className="font-display font-semibold text-xs hover:text-cyan">
              {comment.author?.name}
            </Link>
            <p className="text-sm mt-0.5 break-words">{deleted ? <span className="italic text-ink/40 dark:text-white/40">[deleted]</span> : comment.content}</p>
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-ink/40 dark:text-white/40 font-mono">
            <span>{timeAgo(comment.createdAt)}</span>
            {!deleted && (
              <>
                <button onClick={toggleLike} className={liked ? 'text-magenta' : 'hover:text-magenta transition-colors'}>
                  Like {likesCount > 0 && `(${likesCount})`}
                </button>
                <button onClick={() => setShowReplyBox((s) => !s)} className="hover:text-cyan transition-colors">
                  Reply
                </button>
                {user && (user._id === comment.author?._id || user.id === comment.author?._id) && (
                  <button onClick={handleDelete} className="hover:text-magenta transition-colors">
                    Delete
                  </button>
                )}
              </>
            )}
            {comment.repliesCount > 0 && (
              <button onClick={loadReplies} className="hover:text-cyan transition-colors">
                {loadingReplies ? 'Loading…' : replies ? 'Hide replies' : `View replies (${comment.repliesCount})`}
              </button>
            )}
          </div>

          {showReplyBox && (
            <form onSubmit={submitReply} className="mt-2 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                className="flex-1 text-sm bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-1.5 outline-none focus:border-cyan"
              />
              <button type="submit" className="text-xs font-semibold text-cyan">
                Post
              </button>
            </form>
          )}

          {replies && replies.map((r) => <CommentItem key={r._id} comment={r} storyId={storyId} depth={depth + 1} />)}
        </div>
      </div>
    </div>
  );
};

const CommentThread = ({ comments, storyId }) => (
  <div>
    {comments.map((c) => (
      <CommentItem key={c._id} comment={c} storyId={storyId} />
    ))}
  </div>
);

export default CommentThread;
