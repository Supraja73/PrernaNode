import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ImageCarousel from './ImageCarousel.jsx';
import HashtagChip from './HashtagChip.jsx';
import { likeStory, unlikeStory, saveStory, unsaveStory, shareStory } from '../services/stories';

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
};

const StoryCard = ({ story }) => {
  const [liked, setLiked] = useState(story.isLiked);
  const [likesCount, setLikesCount] = useState(story.likesCount);
  const [saved, setSaved] = useState(story.isSaved);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (liked) {
        const res = await unlikeStory(story._id);
        setLiked(false);
        setLikesCount(res.likesCount);
      } else {
        const res = await likeStory(story._id);
        setLiked(true);
        setLikesCount(res.likesCount);
      }
    } catch (err) {
      // no-op — a failed like shouldn't disrupt the feed
    } finally {
      setBusy(false);
    }
  };

  const toggleSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (saved) {
        await unsaveStory(story._id);
        setSaved(false);
      } else {
        await saveStory(story._id);
        setSaved(true);
      }
    } catch (err) {
      // no-op
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    try {
      const res = await shareStory(story._id);
      if (navigator.share) {
        await navigator.share({ title: story.title, url: res.url });
      } else {
        await navigator.clipboard.writeText(res.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch (err) {
      // user cancelled share sheet or clipboard blocked — non-fatal
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="p-5 flex items-center gap-3">
        <Link to={`/u/${story.author?.username}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center font-display font-bold text-sm shrink-0 overflow-hidden">
          {story.author?.avatar?.url ? (
            <img src={story.author.avatar.url} alt={story.author.name} className="w-full h-full object-cover" />
          ) : (
            story.author?.name?.slice(0, 2).toUpperCase()
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/u/${story.author?.username}`} className="font-display font-semibold text-sm hover:text-cyan transition-colors">
            {story.author?.name}
          </Link>
          <p className="text-xs text-ink/40 dark:text-white/40 font-mono">
            {timeAgo(story.publishedAt || story.createdAt)} · {story.category}
          </p>
        </div>
      </div>

      {(story.images?.length > 0 || story.video?.url) && (
        <div className="px-5">
          <ImageCarousel images={story.images} video={story.video} alt={story.title} />
        </div>
      )}

      <div className="p-5">
        <Link to={`/stories/${story._id}`}>
          <h3 className="font-display font-bold text-lg mb-2 hover:text-cyan transition-colors">{story.title}</h3>
        </Link>
        <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed line-clamp-3">{story.description}</p>

        {story.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {story.hashtags.slice(0, 5).map((tag) => (
              <HashtagChip key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pb-5 flex items-center gap-5 text-sm">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 transition-colors ${liked ? 'text-magenta' : 'text-ink/50 dark:text-white/50 hover:text-magenta'}`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
          </svg>
          {likesCount}
        </button>
        <Link to={`/stories/${story._id}#comments`} className="flex items-center gap-1.5 text-ink/50 dark:text-white/50 hover:text-cyan transition-colors">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4H3l3.2-3.2A8.4 8.4 0 1 1 21 11.5z" />
          </svg>
          {story.commentsCount}
        </Link>
        <button onClick={handleShare} className="flex items-center gap-1.5 text-ink/50 dark:text-white/50 hover:text-gold transition-colors">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.6 10.5 15.4 6.5M8.6 13.5l6.8 4" />
          </svg>
          {copied ? 'Copied' : story.sharesCount}
        </button>
        <button onClick={toggleSave} className={`ml-auto flex items-center gap-1.5 transition-colors ${saved ? 'text-gold' : 'text-ink/50 dark:text-white/50 hover:text-gold'}`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
    </motion.article>
  );
};

export default StoryCard;
