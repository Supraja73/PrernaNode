import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/AdminLayout.jsx';
import { fetchTopPerformers, fetchMostActiveUsers, fetchEngagementRate, fetchDailyActivity } from '../../services/admin';

const AdminAnalytics = () => {
  const { data: top } = useQuery({ queryKey: ['admin-top'], queryFn: fetchTopPerformers });
  const { data: active } = useQuery({ queryKey: ['admin-active-users'], queryFn: fetchMostActiveUsers });
  const { data: engagement } = useQuery({ queryKey: ['admin-engagement'], queryFn: fetchEngagementRate });
  const { data: daily } = useQuery({ queryKey: ['admin-daily'], queryFn: fetchDailyActivity });

  return (
    <AdminLayout>
      <h1 className="font-display font-bold text-2xl mb-6">Analytics</h1>

      {engagement && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="glass rounded-xl p-4 text-center"><p className="font-display font-bold text-xl">{engagement.totalStories}</p><p className="text-[10px] font-mono text-ink/40 dark:text-white/40 uppercase">Stories</p></div>
          <div className="glass rounded-xl p-4 text-center"><p className="font-display font-bold text-xl">{engagement.totalLikes}</p><p className="text-[10px] font-mono text-ink/40 dark:text-white/40 uppercase">Likes</p></div>
          <div className="glass rounded-xl p-4 text-center"><p className="font-display font-bold text-xl">{engagement.totalViews}</p><p className="text-[10px] font-mono text-ink/40 dark:text-white/40 uppercase">Views</p></div>
          <div className="glass rounded-xl p-4 text-center"><p className="font-display font-bold text-xl">{engagement.engagementEventsPerStory}</p><p className="text-[10px] font-mono text-ink/40 dark:text-white/40 uppercase">Engagement/story</p></div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {top && (
          <>
            <div className="glass rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">Top communities</p>
              {top.topCommunities.map((c) => <p key={c._id} className="text-sm">{c.name} — {c.memberCount} members</p>)}
            </div>
            <div className="glass rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">Top mentors</p>
              {top.topMentors.map((m) => <p key={m._id} className="text-sm">{m.skillName} — {m.mentor?.name} ({m.averageRating}★)</p>)}
            </div>
            <div className="glass rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">Top businesses</p>
              {top.topBusinesses.map((b) => <p key={b._id} className="text-sm">{b.businessName} — {b.followersCount} followers</p>)}
            </div>
            <div className="glass rounded-xl p-4">
              <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">Top products</p>
              {top.topProducts.map((p) => <p key={p._id} className="text-sm">{p.name} — {p.viewCount} views</p>)}
            </div>
            <div className="glass rounded-xl p-4 md:col-span-2">
              <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">Trending stories</p>
              {top.trendingStories.map((s) => <p key={s._id} className="text-sm">{s.title} — {s.author?.name} ({s.likesCount} likes)</p>)}
            </div>
          </>
        )}
      </div>

      {active && (
        <div className="glass rounded-xl p-4 mb-6">
          <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-2">Most active users</p>
          {active.map((a) => <p key={a.user._id} className="text-sm">{a.user.name} — {a.storyCount} stories, {a.totalLikes} total likes</p>)}
        </div>
      )}

      {daily?.newUsersPerDay?.length > 0 && (
        <div className="glass rounded-xl p-4">
          <p className="font-mono text-[10px] uppercase text-ink/40 dark:text-white/40 mb-3">Daily activity (30 days)</p>
          <div className="flex items-end gap-0.5 h-24">
            {daily.newUsersPerDay.map((d) => (
              <div key={d.date} title={`${d.date}: ${d.count}`} className="flex-1 bg-gradient-to-t from-gold to-magenta rounded-t" style={{ height: `${Math.min(100, d.count * 20)}%` }} />
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAnalytics;
