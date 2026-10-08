import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  fetchMentorRequests, acceptMentorRequest, rejectMentorRequest,
  suggestNewTime, completeMentorRequest, cancelMentorRequest,
} from '../services/mentorRequests';

const statusColor = {
  pending: 'text-gold',
  accepted: 'text-cyan',
  rescheduled: 'text-violet',
  completed: 'text-green-500',
  cancelled: 'text-ink/40 dark:text-white/40',
  rejected: 'text-magenta',
};

const RequestCard = ({ request, role, onChange }) => {
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestedDate, setSuggestedDate] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');

  const other = role === 'mentor' ? request.student : request.mentor;

  const act = async (fn) => {
    await fn(request._id);
    onChange();
  };

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-xs font-bold shrink-0">
            {other?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{other?.name}</p>
            <p className="text-xs text-ink/40 dark:text-white/40 font-mono">{request.skill?.skillName}</p>
          </div>
        </div>
        <span className={`text-xs font-mono uppercase ${statusColor[request.status]}`}>{request.status}</span>
      </div>

      <p className="text-xs text-ink/50 dark:text-white/50 font-mono mt-3">
        {new Date(request.preferredDate).toLocaleDateString()} at {request.preferredTime}
      </p>
      {request.message && <p className="text-sm text-ink/60 dark:text-white/60 mt-2">{request.message}</p>}
      {request.status === 'rescheduled' && request.suggestedDate && (
        <p className="text-xs text-violet mt-2">
          Suggested: {new Date(request.suggestedDate).toLocaleDateString()} at {request.suggestedTime}
        </p>
      )}

      {role === 'mentor' && request.status === 'pending' && (
        <div className="flex gap-2 mt-4 flex-wrap">
          <button onClick={() => act(acceptMentorRequest)} className="text-xs font-semibold bg-cyan/20 text-cyan px-4 py-2 rounded-full">Accept</button>
          <button onClick={() => act(rejectMentorRequest)} className="text-xs font-semibold bg-magenta/20 text-magenta px-4 py-2 rounded-full">Reject</button>
          <button onClick={() => setShowSuggest((s) => !s)} className="text-xs font-semibold border border-black/10 dark:border-white/15 px-4 py-2 rounded-full">Suggest new time</button>
        </div>
      )}

      {role === 'mentor' && request.status === 'accepted' && (
        <button onClick={() => act(completeMentorRequest)} className="text-xs font-semibold bg-green-500/20 text-green-500 px-4 py-2 rounded-full mt-4">
          Mark completed
        </button>
      )}

      {['pending', 'accepted', 'rescheduled'].includes(request.status) && (
        <button onClick={() => act(cancelMentorRequest)} className="text-xs font-semibold text-ink/40 dark:text-white/40 mt-4 ml-2 hover:text-magenta">
          Cancel
        </button>
      )}

      {showSuggest && (
        <div className="flex gap-2 mt-3 flex-wrap items-center">
          <input type="date" value={suggestedDate} onChange={(e) => setSuggestedDate(e.target.value)} className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs" />
          <input type="time" value={suggestedTime} onChange={(e) => setSuggestedTime(e.target.value)} className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs" />
          <button
            onClick={async () => { await suggestNewTime(request._id, suggestedDate, suggestedTime); setShowSuggest(false); onChange(); }}
            className="text-xs font-semibold text-cyan"
          >
            Send suggestion
          </button>
        </div>
      )}
    </div>
  );
};

const MentorRequests = () => {
  const [role, setRole] = useState('student');
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['mentor-requests', role, status],
    queryFn: () => fetchMentorRequests({ role, status: status || undefined }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['mentor-requests', role, status] });

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl mb-6">Mentorship requests</h1>

        <div className="flex gap-2 mb-4">
          {[['student', 'Sent by me'], ['mentor', 'Received as mentor']].map(([k, label]) => (
            <button key={k} onClick={() => setRole(k)} className={`text-sm px-4 py-2 rounded-full ${role === k ? 'bg-gradient-to-r from-gold to-magenta text-void font-semibold' : 'border border-black/10 dark:border-white/15'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['', 'pending', 'accepted', 'rescheduled', 'completed', 'cancelled', 'rejected'].map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${status === s ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10 text-ink/50 dark:text-white/50'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading…</p>}
        {!isLoading && (data?.data?.length ?? 0) === 0 && (
          <p className="text-sm text-ink/40 dark:text-white/40">
            No requests here yet. <Link to="/skills" className="text-cyan">Browse mentors →</Link>
          </p>
        )}

        <div className="space-y-3">
          {data?.data?.map((r) => (
            <RequestCard key={r._id} request={r} role={role} onChange={refresh} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MentorRequests;
