import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCommunity, joinCommunity, leaveCommunity, fetchCommunityPosts, createCommunityPost,
  likeCommunityPost, unlikeCommunityPost, voteOnPoll, togglePinPost, deleteCommunityPost,
  listCommunityMembers, listJoinRequests, respondToJoinRequest, fetchCommunityChatId, deleteCommunity,
  fetchCommunityAnalytics,
} from '../services/communities';
import { useAuth } from '../context/AuthContext.jsx';

const PostComposer = ({ communityId, onPosted }) => {
  const [type, setType] = useState('post');
  const [content, setContent] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('content', content);
      if (type === 'poll') {
        formData.append('pollQuestion', pollQuestion);
        formData.append('pollOptions', pollOptions);
      }
      images.forEach((f) => formData.append('images', f));
      await createCommunityPost(communityId, formData);
      setContent(''); setPollQuestion(''); setPollOptions(''); setImages([]);
      onPosted();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post');
    }
  };

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-5 mb-6 space-y-3">
      <div className="flex gap-2">
        {['post', 'poll', 'question', 'discussion', 'resource'].map((t) => (
          <button type="button" key={t} onClick={() => setType(t)} className={`text-xs px-3 py-1.5 rounded-full capitalize ${type === t ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10 text-ink/50 dark:text-white/50'}`}>
            {t}
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={type === 'poll' ? 'Add context for your poll…' : `Share a ${type}…`}
        rows={3}
        className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan"
      />
      {type === 'poll' && (
        <>
          <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll question" className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
          <input value={pollOptions} onChange={(e) => setPollOptions(e.target.value)} placeholder="Options separated by | (e.g. Yes|No|Maybe)" className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
        </>
      )}
      {type !== 'poll' && (
        <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []))} className="text-sm" />
      )}
      {error && <p className="text-magenta text-xs">{error}</p>}
      <button type="submit" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full">
        Post
      </button>
    </form>
  );
};

const PostCard = ({ post, isOwnerOrMod, onChange }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const toggleLike = async () => {
    if (liked) { const r = await unlikeCommunityPost(post._id); setLiked(false); setLikesCount(r.likesCount); }
    else { const r = await likeCommunityPost(post._id); setLiked(true); setLikesCount(r.likesCount); }
  };

  const vote = async (i) => { await voteOnPoll(post._id, i); onChange(); };
  const isAuthor = user && (user._id === post.author?._id || user.id === post.author?._id);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-xs font-bold shrink-0">
            {post.author?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{post.author?.name}</p>
            <p className="text-[10px] font-mono text-cyan uppercase">{post.type}{post.pinned ? ' · Pinned' : ''}</p>
          </div>
        </div>
        {isOwnerOrMod && (
          <div className="flex gap-2 text-xs">
            <button onClick={async () => { await togglePinPost(post._id); onChange(); }} className="text-ink/40 dark:text-white/40 hover:text-cyan">Pin</button>
          </div>
        )}
        {(isAuthor || isOwnerOrMod) && (
          <button onClick={async () => { await deleteCommunityPost(post._id); onChange(); }} className="text-xs text-magenta">Delete</button>
        )}
      </div>

      <p className="text-sm text-ink/70 dark:text-white/70 mt-3 leading-relaxed">{post.content}</p>

      {post.images?.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {post.images.map((img, i) => <img key={i} src={img.url} alt="" className="w-32 h-32 object-cover rounded-lg shrink-0" />)}
        </div>
      )}

      {post.type === 'poll' && post.poll && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold">{post.poll.question}</p>
          {post.poll.options.map((opt, i) => {
            const total = post.poll.options.reduce((s, o) => s + o.votes.length, 0) || 1;
            const pct = Math.round((opt.votes.length / total) * 100);
            return (
              <button key={i} onClick={() => vote(i)} className="w-full text-left text-xs relative overflow-hidden rounded-lg border border-black/10 dark:border-white/10 px-3 py-2">
                <div className="absolute inset-0 bg-cyan/10" style={{ width: `${pct}%` }} />
                <span className="relative flex justify-between"><span>{opt.text}</span><span>{pct}%</span></span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-5 mt-4 text-sm text-ink/50 dark:text-white/50">
        <button onClick={toggleLike} className={liked ? 'text-magenta' : ''}>♥ {likesCount}</button>
        <span>💬 {post.commentsCount}</span>
        <span>↗ {post.sharesCount}</span>
      </div>
    </div>
  );
};

const CommunityDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('posts');

  const { data: community, isLoading, refetch } = useQuery({ queryKey: ['community', id], queryFn: () => fetchCommunity(id) });
  const { data: postsData, refetch: refetchPosts } = useQuery({ queryKey: ['community-posts', id], queryFn: () => fetchCommunityPosts(id), enabled: !!community });
  const { data: membersData } = useQuery({ queryKey: ['community-members', id], queryFn: () => listCommunityMembers(id), enabled: tab === 'members' });
  const { data: requests = [] } = useQuery({ queryKey: ['community-requests', id], queryFn: () => listJoinRequests(id), enabled: tab === 'requests' });

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading…</div>;
  if (!community) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Community not found.</div>;

  const isOwner = user && (user._id === community.owner?._id || user.id === community.owner?._id);
  const isMod = user && community.moderators?.some((m) => m._id === user._id || m._id === user.id);
  const isMember = community.viewerMembership?.status === 'active';
  const isPending = community.viewerMembership?.status === 'pending';

  const handleJoin = async () => { await joinCommunity(id); refetch(); };
  const handleLeave = async () => { await leaveCommunity(id); refetch(); };
  const openChat = async () => {
    const chatId = await fetchCommunityChatId(id);
    navigate(`/messages/${chatId}`);
  };
  const handleDelete = async () => {
    if (!window.confirm('Delete this community permanently?')) return;
    await deleteCommunity(id);
    navigate('/communities');
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-violet/30 to-cyan/20 relative">
            {community.banner?.url && <img src={community.banner.url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="p-6 -mt-8">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-magenta flex items-center justify-center font-display font-bold border-4 border-white dark:border-deep overflow-hidden">
                {community.logo?.url ? <img src={community.logo.url} alt="" className="w-full h-full object-cover" /> : community.name?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex gap-2">
                {isMember && <button onClick={openChat} className="text-xs font-semibold border border-black/10 dark:border-white/15 px-4 py-2 rounded-full hover:border-cyan">Chat</button>}
                {isOwner && <button onClick={handleDelete} className="text-xs text-magenta">Delete</button>}
                {!isMember && !isPending && user && <button onClick={handleJoin} className="text-xs font-semibold bg-gradient-to-r from-gold to-magenta text-void px-4 py-2 rounded-full">Join</button>}
                {isPending && <span className="text-xs text-gold font-mono">Request pending</span>}
                {isMember && !isOwner && <button onClick={handleLeave} className="text-xs font-semibold border border-black/10 dark:border-white/15 px-4 py-2 rounded-full">Leave</button>}
              </div>
            </div>
            <h1 className="font-display font-bold text-2xl mt-3">{community.name}</h1>
            <p className="text-sm text-ink/50 dark:text-white/50">{community.category} · {community.memberCount} members · {community.visibility}</p>
            {community.description && <p className="text-sm text-ink/60 dark:text-white/60 mt-3">{community.description}</p>}
          </div>
        </div>

        <div className="flex gap-2 my-6 overflow-x-auto">
          {['posts', 'about', 'members', ...(isOwner || isMod ? ['requests', 'analytics'] : [])].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`text-xs px-3 py-1.5 rounded-full capitalize whitespace-nowrap ${tab === t ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10 text-ink/50 dark:text-white/50'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'posts' && (
          <div>
            {isMember && <PostComposer communityId={id} onPosted={refetchPosts} />}
            <div className="space-y-4">
              {postsData?.data?.map((p) => (
                <PostCard key={p._id} post={p} isOwnerOrMod={isOwner || isMod} onChange={refetchPosts} />
              ))}
              {postsData?.data?.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No posts yet.</p>}
            </div>
          </div>
        )}

        {tab === 'about' && (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">Rules</h3>
            {community.rules?.length ? (
              <ol className="list-decimal list-inside text-sm text-ink/60 dark:text-white/60 space-y-1">
                {community.rules.map((r, i) => <li key={i}>{r}</li>)}
              </ol>
            ) : <p className="text-sm text-ink/40 dark:text-white/40">No rules set.</p>}
            <div className="flex flex-wrap gap-2 mt-4">
              {community.tags?.map((t) => <span key={t} className="text-xs font-mono px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">#{t}</span>)}
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-2">
            {membersData?.data?.map((m) => (
              <div key={m._id} className="glass rounded-xl p-4 flex items-center justify-between">
                <Link to={`/u/${m.user?.username}`} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan to-violet flex items-center justify-center text-xs font-bold">{m.user?.name?.slice(0, 2).toUpperCase()}</div>
                  <span className="text-sm">{m.user?.name}</span>
                </Link>
                <span className="text-xs font-mono text-ink/40 dark:text-white/40 capitalize">{m.role}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'requests' && (
          <div className="space-y-2">
            {requests.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No pending requests.</p>}
            {requests.map((r) => (
              <div key={r._id} className="glass rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm">{r.user?.name}</span>
                <div className="flex gap-2">
                  <button onClick={async () => { await respondToJoinRequest(id, r.user._id, 'accept'); queryClient.invalidateQueries({ queryKey: ['community-requests', id] }); }} className="text-xs text-cyan">Accept</button>
                  <button onClick={async () => { await respondToJoinRequest(id, r.user._id, 'reject'); queryClient.invalidateQueries({ queryKey: ['community-requests', id] }); }} className="text-xs text-magenta">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'analytics' && <CommunityAnalyticsPanel id={id} />}
      </div>
    </div>
  );
};

const CommunityAnalyticsPanel = ({ id }) => {
  const { data } = useQuery({ queryKey: ['community-analytics', id], queryFn: () => fetchCommunityAnalytics(id) });
  if (!data) return <p className="text-sm text-ink/40 dark:text-white/40">Loading analytics…</p>;
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center"><p className="font-display font-bold text-xl">{data.memberCount}</p><p className="text-xs text-ink/40 dark:text-white/40 font-mono">Members</p></div>
        <div className="text-center"><p className="font-display font-bold text-xl">{data.postCount}</p><p className="text-xs text-ink/40 dark:text-white/40 font-mono">Posts</p></div>
      </div>
      <div>
        <h3 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-2">Top posts</h3>
        {data.topPosts.map((p) => <p key={p._id} className="text-sm text-ink/60 dark:text-white/60 truncate">{p.content} — {p.likesCount} likes</p>)}
      </div>
    </div>
  );
};

export default CommunityDetails;
