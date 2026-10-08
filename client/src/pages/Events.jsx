import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { listEvents } from '../services/events';
import { useAuth } from '../context/AuthContext.jsx';

const EventCard = ({ e }) => (
  <Link to={`/events/${e._id}`} className="glass rounded-2xl overflow-hidden block hover:-translate-y-1 transition-transform duration-300">
    <div className="aspect-video bg-gradient-to-br from-violet/30 to-cyan/20">
      {e.banner?.url && <img src={e.banner.url} alt={e.title} className="w-full h-full object-cover" />}
    </div>
    <div className="p-4">
      <p className="text-[10px] font-mono text-cyan uppercase">{e.mode} · {new Date(e.date).toLocaleDateString()}</p>
      <h3 className="font-display font-semibold text-sm mt-1 truncate">{e.title}</h3>
      <p className="text-xs text-ink/40 dark:text-white/40 mt-1">by {e.organizer?.name}</p>
    </div>
  </Link>
);

const Events = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ upcoming: 'true' });
  const { items, isLoading, isFetchingNextPage, sentinelRef } = useInfiniteFeed(['events', filters], (page) => listEvents({ ...filters, page }));

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl">Events & Meetups</h1>
          {user && <Link to="/events/new" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full">+ Create event</Link>}
        </div>
        <div className="flex gap-2 mb-8">
          <button onClick={() => setFilters({ upcoming: 'true' })} className={`text-xs px-3 py-1.5 rounded-full ${filters.upcoming ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10'}`}>Upcoming</button>
          <button onClick={() => setFilters({})} className={`text-xs px-3 py-1.5 rounded-full ${!filters.upcoming ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10'}`}>All</button>
        </div>
        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((e) => <EventCard key={e._id} e={e} />)}
        </div>
        {!isLoading && items.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No events yet.</p>}
        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-6">
          {isFetchingNextPage && <span className="text-xs text-ink/40 dark:text-white/40 font-mono">Loading more…</span>}
        </div>
      </div>
    </div>
  );
};

export default Events;
