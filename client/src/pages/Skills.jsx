import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { discoverSkills, fetchSkillCategories } from '../services/skills';
import StarRating from '../components/StarRating.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const sorts = [
  { key: 'highest-rated', label: 'Highest Rated' },
  { key: 'most-popular', label: 'Most Popular' },
  { key: 'recently-joined', label: 'Recently Joined' },
  { key: 'alphabetical', label: 'A–Z' },
];

const SkillCard = ({ skill }) => (
  <Link to={`/skills/${skill._id}`} className="glass rounded-2xl p-5 block hover:-translate-y-1 transition-transform duration-300">
    <div className="flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet to-magenta flex items-center justify-center font-display font-bold text-sm shrink-0 overflow-hidden">
        {skill.mentor?.avatar?.url ? (
          <img src={skill.mentor.avatar.url} alt="" className="w-full h-full object-cover" />
        ) : (
          skill.mentor?.name?.slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="min-w-0">
        <p className="font-display font-semibold text-sm truncate">{skill.mentor?.name}</p>
        <p className="text-xs text-ink/40 dark:text-white/40 font-mono">{skill.teachingMode} · {skill.experienceLevel}</p>
      </div>
    </div>
    <h3 className="font-display font-bold text-lg mt-3">{skill.skillName}</h3>
    <p className="text-xs font-mono text-cyan mt-0.5">{skill.category}</p>
    <div className="flex items-center justify-between mt-4">
      <StarRating value={skill.averageRating} readOnly size={13} />
      <span className="text-xs font-mono px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">{skill.priceLabel}</span>
    </div>
  </Link>
);

const Skills = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ category: '', teachingMode: '', sort: 'recently-joined', skillName: '' });
  const { data: categories = [] } = useQuery({ queryKey: ['skill-categories'], queryFn: fetchSkillCategories });

  const { items, isLoading, isFetchingNextPage, hasNextPage, sentinelRef } = useInfiniteFeed(
    ['skills', filters],
    (page) => discoverSkills({ ...filters, page })
  );

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl">Find a mentor</h1>
          {user && (
            <Link to="/skills/new" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full">
              Become a mentor
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <input
            value={filters.skillName}
            onChange={(e) => setFilters((f) => ({ ...f, skillName: e.target.value }))}
            placeholder="Search skills…"
            className="flex-1 min-w-[200px] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-cyan"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 text-sm outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filters.teachingMode}
            onChange={(e) => setFilters((f) => ({ ...f, teachingMode: e.target.value }))}
            className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 text-sm outline-none"
          >
            <option value="">Any mode</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
            <option value="Hybrid">Hybrid</option>
          </select>
          <div className="flex gap-2">
            {sorts.map((s) => (
              <button
                key={s.key}
                onClick={() => setFilters((f) => ({ ...f, sort: s.key }))}
                className={`text-xs px-3 py-2 rounded-full whitespace-nowrap ${
                  filters.sort === s.key ? 'bg-cyan/20 text-cyan' : 'border border-black/10 dark:border-white/10 text-ink/50 dark:text-white/50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading mentors…</p>}
        {!isLoading && items.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No mentors match those filters yet.</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((skill) => (
            <SkillCard key={skill._id} skill={skill} />
          ))}
        </div>

        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-6">
          {isFetchingNextPage && <span className="text-xs text-ink/40 dark:text-white/40 font-mono">Loading more…</span>}
        </div>
      </div>
    </div>
  );
};

export default Skills;
