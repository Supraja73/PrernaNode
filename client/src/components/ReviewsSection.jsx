import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchReviews, createReview, toggleReviewHelpful, reportReview } from '../services/reviews';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from './StarRating.jsx';

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 86400) return 'today';
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const ReviewCard = ({ review }) => {
  const queryClient = useQueryClient();
  const [helpful, setHelpful] = useState(review.helpfulByViewer);
  const [count, setCount] = useState(review.helpfulCount);

  const markHelpful = async () => {
    const res = await toggleReviewHelpful(review._id);
    setHelpful(res.helpfulByViewer);
    setCount(res.helpfulCount);
  };

  const report = async () => {
    await reportReview(review._id);
  };

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-[10px] font-bold">
            {review.author?.name?.slice(0, 2).toUpperCase() || 'AN'}
          </div>
          <span className="text-sm font-semibold">{review.author?.name || 'Anonymous'}</span>
        </div>
        <span className="text-xs text-ink/40 dark:text-white/40 font-mono">{timeAgo(review.createdAt)}</span>
      </div>
      <StarRating value={review.rating} readOnly size={14} />
      {review.title && <p className="font-display font-semibold text-sm mt-2">{review.title}</p>}
      <p className="text-sm text-ink/60 dark:text-white/60 mt-1 leading-relaxed">{review.description}</p>
      {(review.pros?.length > 0 || review.cons?.length > 0) && (
        <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
          {review.pros?.length > 0 && (
            <div>
              <p className="text-cyan font-mono uppercase mb-1">Pros</p>
              <ul className="text-ink/50 dark:text-white/50 list-disc list-inside">{review.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          )}
          {review.cons?.length > 0 && (
            <div>
              <p className="text-magenta font-mono uppercase mb-1">Cons</p>
              <ul className="text-ink/50 dark:text-white/50 list-disc list-inside">{review.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-4 mt-3 text-xs text-ink/40 dark:text-white/40">
        <button onClick={markHelpful} className={helpful ? 'text-cyan' : 'hover:text-cyan transition-colors'}>
          Helpful {count > 0 && `(${count})`}
        </button>
        <button onClick={report} className="hover:text-magenta transition-colors">
          Report
        </button>
      </div>
    </div>
  );
};

const ReviewsSection = ({ targetType, targetId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', targetType, targetId],
    queryFn: () => fetchReviews(targetType, targetId),
  });

  const submitReview = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('targetType', targetType);
      formData.append('targetId', targetId);
      formData.append('rating', rating);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('anonymous', anonymous);
      await createReview(formData);
      setShowForm(false);
      setTitle('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['reviews', targetType, targetId] });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit review');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg">Reviews ({data?.pagination?.total ?? 0})</h2>
        {user && (
          <button onClick={() => setShowForm((s) => !s)} className="text-xs font-semibold text-cyan">
            {showForm ? 'Cancel' : 'Write a review'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submitReview} className="glass rounded-xl p-5 mb-4 space-y-3">
          <StarRating value={rating} onChange={setRating} size={20} />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title (optional)"
            className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Share your experience…"
            rows={3}
            className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan"
          />
          <label className="flex items-center gap-2 text-xs text-ink/60 dark:text-white/60">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="accent-cyan" />
            Post anonymously
          </label>
          {error && <p className="text-magenta text-xs">{error}</p>}
          <button type="submit" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full">
            Submit review
          </button>
        </form>
      )}

      {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading reviews…</p>}
      {!isLoading && (data?.data?.length ?? 0) === 0 && (
        <p className="text-sm text-ink/40 dark:text-white/40">No reviews yet — be the first.</p>
      )}
      <div className="space-y-3">
        {data?.data?.map((r) => (
          <ReviewCard key={r._id} review={r} />
        ))}
      </div>
    </div>
  );
};

export default ReviewsSection;
