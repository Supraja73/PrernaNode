import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAIStatus, fetchAIHistory, runCareerFeature, runStoryFeature, fetchMentorMatches, fetchBusinessRecommendations,
} from '../services/ai';
import { fetchUserStories } from '../services/stories';
import { useAuth } from '../context/AuthContext.jsx';
import StarRating from '../components/StarRating.jsx';

const CAREER_FEATURES = [
  ['resume_suggestions', 'Resume Suggestions'], ['career_roadmap', 'Career Roadmap'],
  ['interview_prep', 'Interview Prep'], ['skill_recommendations', 'Skill Recommendations'],
  ['learning_recommendations', 'Learning Path'], ['profile_improvement', 'Profile Improvement'],
  ['portfolio_review', 'Portfolio Review'], ['community_recommendations', 'Community Picks'],
  ['business_growth', 'Business Growth'], ['entrepreneurship_tips', 'Entrepreneurship Tips'],
  ['networking_suggestions', 'Networking Tips'], ['job_prep', 'Job Prep'],
  ['hackathon_suggestions', 'Hackathon Picks'], ['scholarship_suggestions', 'Scholarship Picks'],
  ['daily_productivity_tip', 'Daily Tip'],
];
const STORY_FEATURES = [
  ['story_improvement', 'Improve Story'], ['story_title', 'Better Titles'], ['story_grammar', 'Grammar Check'],
  ['story_hashtags', 'Suggest Hashtags'], ['story_summary', 'Summary'], ['story_key_learnings', 'Key Learnings'],
  ['story_motivational_ending', 'Motivational Ending'],
];

const OutputBox = ({ loading, output, error }) => {
  if (loading) return <p className="text-sm text-ink/40 dark:text-white/40 mt-4">Thinking…</p>;
  if (error) return <p className="text-sm text-magenta mt-4">{error}</p>;
  if (!output) return null;
  return <div className="glass rounded-xl p-5 mt-4 whitespace-pre-wrap text-sm text-ink/70 dark:text-white/75 leading-relaxed">{output}</div>;
};

const CareerTab = () => {
  const [active, setActive] = useState(null);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async (feature) => {
    setActive(feature); setLoading(true); setError(''); setOutput('');
    try {
      const res = await runCareerFeature(feature);
      setOutput(res.output);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate a response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-2">
        {CAREER_FEATURES.map(([key, label]) => (
          <button key={key} onClick={() => run(key)} className={`text-xs font-semibold px-3 py-2.5 rounded-lg text-left ${active === key ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10 hover:border-cyan'}`}>
            {label}
          </button>
        ))}
      </div>
      <OutputBox loading={loading} output={output} error={error} />
    </div>
  );
};

const StoryTab = () => {
  const { user } = useAuth();
  const [storyId, setStoryId] = useState('');
  const [active, setActive] = useState(null);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: storiesRes } = useQuery({
    queryKey: ['my-stories-ai'],
    queryFn: () => fetchUserStories(user._id || user.id, { status: 'published' }),
    enabled: !!user,
  });

  const run = async (feature) => {
    if (!storyId) { setError('Select a story first'); return; }
    setActive(feature); setLoading(true); setError(''); setOutput('');
    try {
      const res = await runStoryFeature(feature, storyId);
      setOutput(res.output);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate a response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <select value={storyId} onChange={(e) => setStoryId(e.target.value)} className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm outline-none mb-4">
        <option value="">Select one of your stories…</option>
        {storiesRes?.data?.map((s) => <option key={s._id} value={s._id}>{s.title}</option>)}
      </select>
      <div className="grid sm:grid-cols-3 gap-2">
        {STORY_FEATURES.map(([key, label]) => (
          <button key={key} onClick={() => run(key)} className={`text-xs font-semibold px-3 py-2.5 rounded-lg text-left ${active === key ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10 hover:border-cyan'}`}>
            {label}
          </button>
        ))}
      </div>
      <OutputBox loading={loading} output={output} error={error} />
    </div>
  );
};

const MentorMatchTab = () => {
  const { data, isLoading } = useQuery({ queryKey: ['ai-mentor-match'], queryFn: fetchMentorMatches });
  if (isLoading) return <p className="text-sm text-ink/40 dark:text-white/40">Finding matches…</p>;
  if (!data?.length) return <p className="text-sm text-ink/40 dark:text-white/40">No matches yet — fill in your skills and languages on your profile for better results.</p>;
  return (
    <div className="space-y-3">
      {data.map(({ skill, matchScore, reasons }) => (
        <Link key={skill._id} to={`/skills/${skill._id}`} className="glass rounded-xl p-4 flex items-center justify-between block">
          <div>
            <p className="text-sm font-semibold">{skill.skillName} — {skill.mentor?.name}</p>
            <StarRating value={skill.averageRating} readOnly size={12} />
            <p className="text-xs text-ink/40 dark:text-white/40 mt-1">{reasons.join(' · ')}</p>
          </div>
          <span className="text-xs font-mono text-cyan shrink-0">{matchScore}% match</span>
        </Link>
      ))}
    </div>
  );
};

const BusinessRecTab = () => {
  const { data, isLoading } = useQuery({ queryKey: ['ai-business-rec'], queryFn: fetchBusinessRecommendations });
  if (isLoading) return <p className="text-sm text-ink/40 dark:text-white/40">Loading recommendations…</p>;
  if (!data) return null;
  return (
    <div className="space-y-6">
      {data.potentialCollaborators.length > 0 && (
        <div>
          <h3 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-2">Potential collaborators</h3>
          {data.potentialCollaborators.map((b) => <Link key={b._id} to={`/businesses/${b._id}`} className="block text-sm hover:text-cyan">{b.businessName}</Link>)}
        </div>
      )}
      {data.trendingCategories.length > 0 && (
        <div>
          <h3 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-2">Trending categories</h3>
          {data.trendingCategories.map((c) => <p key={c.category} className="text-sm text-ink/60 dark:text-white/60">{c.category} — {c.listings} listings, {c.totalViews} views</p>)}
        </div>
      )}
      {data.communitySuggestions.length > 0 && (
        <div>
          <h3 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-2">Communities to join</h3>
          {data.communitySuggestions.map((c) => <Link key={c._id} to={`/communities/${c._id}`} className="block text-sm hover:text-cyan">{c.name}</Link>)}
        </div>
      )}
    </div>
  );
};

const AIAssistant = () => {
  const [tab, setTab] = useState('career');
  const { data: status } = useQuery({ queryKey: ['ai-status'], queryFn: fetchAIStatus });

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl mb-2">AI Assistant</h1>
        {status && !status.configured && (
          <p className="text-xs text-gold font-mono mb-4">
            Career and Story assistant features need an ANTHROPIC_API_KEY set on the server — Mentor Match and Business Recommendations work regardless (they're real-data algorithms, not AI calls).
          </p>
        )}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[['career', 'Career'], ['story', 'Story'], ['mentors', 'Mentor Match'], ['business', 'Business']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`text-sm px-4 py-2 rounded-full whitespace-nowrap ${tab === k ? 'bg-gradient-to-r from-gold to-magenta text-void font-semibold' : 'border border-black/10 dark:border-white/15'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'career' && <CareerTab />}
        {tab === 'story' && <StoryTab />}
        {tab === 'mentors' && <MentorMatchTab />}
        {tab === 'business' && <BusinessRecTab />}
      </div>
    </div>
  );
};

export default AIAssistant;
