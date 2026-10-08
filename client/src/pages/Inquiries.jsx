import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchInquiries, fetchInquiry, replyToInquiry, acceptInquiry, rejectInquiry, reserveInquiry, cancelInquiry,
} from '../services/inquiries';
import { useAuth } from '../context/AuthContext.jsx';

const Thread = ({ inquiryId, onChange }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const { data: inquiry, refetch } = useQuery({ queryKey: ['inquiry', inquiryId], queryFn: () => fetchInquiry(inquiryId) });

  if (!inquiry) return null;
  const isSeller = user && (user._id === inquiry.seller?._id || user.id === inquiry.seller?._id);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await replyToInquiry(inquiryId, text.trim());
    setText('');
    refetch();
  };

  const act = async (fn) => {
    await fn(inquiryId);
    refetch();
    onChange();
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link to={`/marketplace/${inquiry.product?._id}`} className="font-display font-semibold hover:text-cyan">
            {inquiry.product?.name}
          </Link>
          <p className="text-xs text-ink/40 dark:text-white/40 font-mono">{inquiry.status}</p>
        </div>
        {isSeller && inquiry.status === 'open' && (
          <div className="flex gap-2">
            <button onClick={() => act(acceptInquiry)} className="text-xs font-semibold bg-cyan/20 text-cyan px-3 py-1.5 rounded-full">Accept</button>
            <button onClick={() => act(rejectInquiry)} className="text-xs font-semibold bg-magenta/20 text-magenta px-3 py-1.5 rounded-full">Reject</button>
            <button onClick={() => act(reserveInquiry)} className="text-xs font-semibold bg-gold/20 text-gold px-3 py-1.5 rounded-full">Reserve</button>
          </div>
        )}
        {['open', 'accepted'].includes(inquiry.status) && (
          <button onClick={() => act(cancelInquiry)} className="text-xs text-ink/40 dark:text-white/40 hover:text-magenta">Cancel</button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
        {inquiry.messages.map((m, i) => {
          const mine = user && (user._id === m.sender?._id || user.id === m.sender?._id);
          return (
            <div key={i} className={`text-sm px-3 py-2 rounded-lg max-w-[80%] ${mine ? 'ml-auto bg-cyan/10 text-right' : 'bg-black/[0.03] dark:bg-white/5'}`}>
              <p>{m.text}</p>
              <p className="text-[10px] text-ink/30 dark:text-white/30 font-mono mt-1">{m.sender?.name}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply…"
          className="flex-1 text-sm bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2 outline-none focus:border-cyan"
        />
        <button type="submit" className="text-xs font-semibold text-cyan">Send</button>
      </form>
    </div>
  );
};

const Inquiries = () => {
  const [role, setRole] = useState('buyer');
  const [activeId, setActiveId] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['inquiries', role], queryFn: () => fetchInquiries({ role }) });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['inquiries', role] });

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto grid md:grid-cols-[280px_1fr] gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl mb-4">Inquiries</h1>
          <div className="flex gap-2 mb-4">
            {[['buyer', 'As buyer'], ['seller', 'As seller']].map(([k, label]) => (
              <button key={k} onClick={() => { setRole(k); setActiveId(null); }} className={`text-xs px-3 py-1.5 rounded-full ${role === k ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10'}`}>
                {label}
              </button>
            ))}
          </div>
          {isLoading && <p className="text-xs text-ink/40 dark:text-white/40">Loading…</p>}
          <div className="space-y-2">
            {data?.data?.map((i) => (
              <button
                key={i._id}
                onClick={() => setActiveId(i._id)}
                className={`w-full text-left glass rounded-xl p-3 text-sm ${activeId === i._id ? 'border-cyan' : ''}`}
              >
                <p className="font-semibold truncate">{i.product?.name}</p>
                <p className="text-xs text-ink/40 dark:text-white/40 font-mono">{i.status}</p>
              </button>
            ))}
            {!isLoading && (data?.data?.length ?? 0) === 0 && <p className="text-xs text-ink/40 dark:text-white/40">No inquiries yet.</p>}
          </div>
        </div>

        <div>
          {activeId ? <Thread inquiryId={activeId} onChange={refresh} /> : <p className="text-sm text-ink/40 dark:text-white/40">Select an inquiry to view the conversation.</p>}
        </div>
      </div>
    </div>
  );
};

export default Inquiries;
