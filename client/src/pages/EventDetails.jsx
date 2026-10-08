import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchEvent, rsvpToEvent, leaveEventFeedback } from '../services/events';
import StarRating from '../components/StarRating.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: event, isLoading, refetch } = useQuery({ queryKey: ['event', id], queryFn: () => fetchEvent(id) });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading…</div>;
  if (!event) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Not found.</div>;

  const isGoing = user && event.rsvpGoing.some((u) => u === user._id || u === user.id || u._id === user._id);
  const isInterested = user && event.rsvpInterested.some((u) => u === user._id || u === user.id || u._id === user._id);

  const rsvp = async (status) => { await rsvpToEvent(id, status); refetch(); };
  const submitFeedback = async (e) => { e.preventDefault(); await leaveEventFeedback(id, rating, comment); setComment(''); refetch(); };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto glass rounded-2xl overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-violet/30 to-cyan/20">
          {event.banner?.url && <img src={event.banner.url} alt={event.title} className="w-full h-full object-cover" />}
        </div>
        <div className="p-8">
          <p className="text-[10px] font-mono text-cyan uppercase">{event.mode} · {event.status}</p>
          <h1 className="font-display font-bold text-2xl mt-1">{event.title}</h1>
          <p className="text-sm text-ink/50 dark:text-white/50 mt-1">
            {new Date(event.date).toLocaleDateString()} at {event.time} · by {event.organizer?.name}
          </p>
          {event.venue && <p className="text-xs text-ink/40 dark:text-white/40 mt-1">📍 {event.venue}</p>}
          {event.onlineLink && <a href={event.onlineLink} target="_blank" rel="noreferrer" className="text-xs text-cyan block mt-1">🔗 Join online</a>}

          <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed mt-5 whitespace-pre-wrap">{event.description}</p>

          {event.speakers?.length > 0 && (
            <div className="mt-5">
              <h3 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-2">Speakers</h3>
              <div className="flex flex-wrap gap-3">
                {event.speakers.map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-magenta mx-auto" />
                    <p className="text-xs mt-1">{s.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {event.schedule?.length > 0 && (
            <div className="mt-5">
              <h3 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-2">Schedule</h3>
              {event.schedule.map((s, i) => (
                <div key={i} className="flex gap-3 text-sm text-ink/60 dark:text-white/60">
                  <span className="font-mono text-xs w-16 shrink-0">{s.time}</span>
                  <span>{s.activity}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-6 flex-wrap">
            <span className="text-xs text-ink/40 dark:text-white/40">{event.rsvpGoing.length} going · {event.rsvpInterested.length} interested</span>
          </div>

          {user && (
            <div className="flex gap-3 mt-3">
              <button onClick={() => rsvp('going')} className={`text-sm font-semibold px-5 py-2.5 rounded-full ${isGoing ? 'bg-gradient-to-r from-gold to-magenta text-void' : 'border border-black/10 dark:border-white/15'}`}>Going</button>
              <button onClick={() => rsvp('interested')} className={`text-sm font-semibold px-5 py-2.5 rounded-full ${isInterested ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/15'}`}>Interested</button>
            </div>
          )}

          {event.gallery?.length > 0 && (
            <div className="flex gap-2 mt-6 overflow-x-auto">
              {event.gallery.map((g, i) => <img key={i} src={g.url} alt="" className="w-28 h-28 object-cover rounded-lg shrink-0" />)}
            </div>
          )}

          {event.status === 'completed' && user && (
            <form onSubmit={submitFeedback} className="mt-6 glass rounded-xl p-5 space-y-2">
              <h3 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40">Leave feedback</h3>
              <StarRating value={rating} onChange={setRating} size={18} />
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was it?" rows={2} className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
              <button type="submit" className="text-xs font-semibold text-cyan">Submit</button>
            </form>
          )}

          {event.feedback?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-2">Feedback ({event.feedback.length})</h3>
              {event.feedback.map((f, i) => (
                <div key={i} className="mb-2">
                  <StarRating value={f.rating} readOnly size={12} />
                  <p className="text-sm text-ink/60 dark:text-white/60">{f.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
