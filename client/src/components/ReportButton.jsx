import React, { useState } from 'react';
import { createReport } from '../services/reports';
import { useAuth } from '../context/AuthContext.jsx';

const REASONS = [
  ['spam', 'Spam'], ['harassment', 'Harassment'], ['hate_speech', 'Hate speech'],
  ['misinformation', 'Misinformation'], ['inappropriate_content', 'Inappropriate content'],
  ['impersonation', 'Impersonation'], ['scam', 'Scam'], ['other', 'Other'],
];

// A generic, reusable report trigger — built new in Part 5 so it's available to wire
// into any page going forward, without retrofitting existing (protected) pages here.
// Usage: <ReportButton targetType="story" targetId={story._id} />
const ReportButton = ({ targetType, targetId, className = '' }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createReport(targetType, targetId, reason, description);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit report');
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={`text-xs text-ink/40 dark:text-white/40 hover:text-magenta ${className}`} aria-haspopup="dialog">
        Report
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Report content">
          <div className="glass rounded-2xl p-6 w-full max-w-sm">
            {submitted ? (
              <>
                <p className="text-sm text-cyan mb-4">Report submitted. Thank you for helping keep PrernaNode safe.</p>
                <button onClick={() => { setOpen(false); setSubmitted(false); }} className="text-xs text-ink/50 dark:text-white/50">Close</button>
              </>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <h3 className="font-display font-semibold">Report this content</h3>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
                  {REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details (optional)"
                  rows={3}
                  className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
                />
                {error && <p className="text-magenta text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button type="submit" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-4 py-2 rounded-full">Submit</button>
                  <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/50 dark:text-white/50 px-4 py-2">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;
