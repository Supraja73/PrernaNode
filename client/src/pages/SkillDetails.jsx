import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchSkill } from '../services/skills';
import { createMentorRequest } from '../services/mentorRequests';
import StarRating from '../components/StarRating.jsx';
import SaveButton from '../components/SaveButton.jsx';
import ReviewsSection from '../components/ReviewsSection.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const SkillDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [resume, setResume] = useState(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { data: skill, isLoading } = useQuery({ queryKey: ['skill', id], queryFn: () => fetchSkill(id) });

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading…</div>;
  if (!skill) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Mentor listing not found.</div>;

  const isOwner = user && (user._id === skill.mentor?._id || user.id === skill.mentor?._id);

  const submitRequest = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('skillId', skill._id);
      formData.append('preferredDate', date);
      formData.append('preferredTime', time);
      formData.append('message', message);
      if (resume) formData.append('resume', resume);
      await createMentorRequest(formData);
      setSent(true);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send request');
    }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="glass rounded-2xl p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Link to={`/u/${skill.mentor?.username}`} className="w-16 h-16 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center font-display font-bold text-xl overflow-hidden">
                {skill.mentor?.avatar?.url ? <img src={skill.mentor.avatar.url} alt="" className="w-full h-full object-cover" /> : skill.mentor?.name?.slice(0, 2).toUpperCase()}
              </Link>
              <div>
                <h1 className="font-display font-bold text-2xl">{skill.skillName}</h1>
                <Link to={`/u/${skill.mentor?.username}`} className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan">
                  by {skill.mentor?.name}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating value={skill.averageRating} readOnly size={14} />
                  <span className="text-xs text-ink/40 dark:text-white/40">({skill.reviewsCount})</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SaveButton resourceType="mentor" resourceId={skill._id} />
              {!isOwner && user && (
                <button onClick={() => setShowForm((s) => !s)} className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2.5 rounded-full">
                  Request mentorship
                </button>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-6 text-center">
            <div className="bg-black/[0.03] dark:bg-white/5 rounded-xl py-3">
              <p className="font-display font-bold">{skill.experienceLevel}</p>
              <p className="text-xs text-ink/40 dark:text-white/40 font-mono">{skill.yearsOfExperience} yrs exp</p>
            </div>
            <div className="bg-black/[0.03] dark:bg-white/5 rounded-xl py-3">
              <p className="font-display font-bold">{skill.teachingMode}</p>
              <p className="text-xs text-ink/40 dark:text-white/40 font-mono">{skill.sessionDurationMinutes} min sessions</p>
            </div>
            <div className="bg-black/[0.03] dark:bg-white/5 rounded-xl py-3">
              <p className="font-display font-bold">{skill.totalStudents}</p>
              <p className="text-xs text-ink/40 dark:text-white/40 font-mono">students taught</p>
            </div>
          </div>

          {skill.bio && <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed mt-6">{skill.bio}</p>}

          {(skill.city || skill.country) && (
            <p className="text-xs text-ink/40 dark:text-white/40 font-mono mt-3">
              📍 {[skill.city, skill.state, skill.country].filter(Boolean).join(', ')}
              {skill.languagesSpoken?.length > 0 && ` · Speaks ${skill.languagesSpoken.join(', ')}`}
            </p>
          )}

          {skill.demoImages?.length > 0 && (
            <div className="flex gap-2 mt-5 overflow-x-auto">
              {skill.demoImages.map((img, i) => (
                <img key={i} src={img.url} alt="" className="w-28 h-28 object-cover rounded-lg shrink-0" />
              ))}
            </div>
          )}

          <div className="flex gap-4 mt-5 text-xs">
            {skill.socialLinks?.github && <a href={skill.socialLinks.github} target="_blank" rel="noreferrer" className="text-cyan">GitHub</a>}
            {skill.socialLinks?.linkedin && <a href={skill.socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-cyan">LinkedIn</a>}
            {skill.socialLinks?.portfolioWebsite && <a href={skill.socialLinks.portfolioWebsite} target="_blank" rel="noreferrer" className="text-cyan">Portfolio</a>}
            {skill.resume?.url && <a href={skill.resume.url} target="_blank" rel="noreferrer" className="text-gold">Resume</a>}
          </div>

          {sent && <p className="text-cyan text-sm mt-4">Request sent! Track it from "My Requests".</p>}

          {showForm && (
            <form onSubmit={submitRequest} className="mt-6 glass rounded-xl p-5 space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
                <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message…"
                rows={3}
                className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <div>
                <label className="text-xs font-mono text-ink/40 dark:text-white/40">Attach resume (optional)</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files?.[0] || null)} className="block text-sm mt-1" />
              </div>
              {error && <p className="text-magenta text-xs">{error}</p>}
              <button type="submit" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full">
                Send request
              </button>
            </form>
          )}
        </div>

        <div className="glass rounded-2xl p-6 mt-6">
          <ReviewsSection targetType="skill" targetId={skill._id} />
        </div>
      </div>
    </div>
  );
};

export default SkillDetails;
