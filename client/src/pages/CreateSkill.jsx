import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createSkill, fetchSkillCategories } from '../services/skills';

const inputClass =
  'w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-cyan transition-colors placeholder:text-ink/40 dark:placeholder:text-white/40';

const CreateSkill = () => {
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery({ queryKey: ['skill-categories'], queryFn: fetchSkillCategories });
  const [certificates, setCertificates] = useState([]);
  const [demoImages, setDemoImages] = useState([]);
  const [demoVideo, setDemoVideo] = useState(null);
  const [resume, setResume] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (form) => {
    setServerError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== '') formData.append(key, value);
      });
      certificates.forEach((f) => formData.append('certificates', f));
      demoImages.forEach((f) => formData.append('demoImages', f));
      if (demoVideo) formData.append('demoVideo', demoVideo);
      if (resume) formData.append('resume', resume);
      if (portfolio) formData.append('portfolio', portfolio);

      const skill = await createSkill(formData);
      navigate(`/skills/${skill._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not create listing');
    }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <Link to="/skills" className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan">← Back to mentors</Link>
        <h1 className="font-display font-bold text-2xl mt-4 mb-6">Become a mentor</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input className={inputClass} placeholder="Skill name (e.g. React, Product Design)" {...register('skillName', { required: true })} />
          <div className="grid sm:grid-cols-2 gap-3">
            <select className={inputClass} {...register('category', { required: true })} defaultValue="">
              <option value="" disabled>Category</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={inputClass} {...register('experienceLevel', { required: true })} defaultValue="">
              <option value="" disabled>Experience level</option>
              {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input type="number" min="0" max="60" className={inputClass} placeholder="Years of experience" {...register('yearsOfExperience', { required: true })} />
            <select className={inputClass} {...register('teachingMode', { required: true })} defaultValue="">
              <option value="" disabled>Teaching mode</option>
              {['Online', 'Offline', 'Hybrid'].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <input className={inputClass} placeholder="City" {...register('city')} />
            <input className={inputClass} placeholder="State" {...register('state')} />
            <input className={inputClass} placeholder="Country" {...register('country')} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <input className={inputClass} placeholder="Timezone (e.g. IST)" {...register('timezone')} />
            <input type="number" className={inputClass} placeholder="Session length (minutes)" {...register('sessionDurationMinutes')} />
            <select className={inputClass} {...register('priceLabel')} defaultValue="Free">
              <option value="Free">Free (display only)</option>
              <option value="Paid">Paid (display only)</option>
            </select>
          </div>
          <input className={inputClass} placeholder="Languages spoken, comma separated" {...register('languagesSpoken')} />
          <textarea className={inputClass} rows={4} placeholder="Bio" {...register('bio')} />
          <input className={inputClass} placeholder="Achievements, comma separated" {...register('achievements')} />

          <div className="grid sm:grid-cols-3 gap-3">
            <input className={inputClass} placeholder="GitHub URL" {...register('github')} />
            <input className={inputClass} placeholder="LinkedIn URL" {...register('linkedin')} />
            <input className={inputClass} placeholder="Portfolio website URL" {...register('portfolioWebsite')} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-ink/40 dark:text-white/40">Resume (PDF/Word)</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files?.[0] || null)} className="block text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-mono text-ink/40 dark:text-white/40">Portfolio file (optional)</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setPortfolio(e.target.files?.[0] || null)} className="block text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-mono text-ink/40 dark:text-white/40">Certificates (images)</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setCertificates(Array.from(e.target.files || []))} className="block text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-mono text-ink/40 dark:text-white/40">Demo images</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setDemoImages(Array.from(e.target.files || []))} className="block text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-mono text-ink/40 dark:text-white/40">Demo video (optional)</label>
              <input type="file" accept="video/*" onChange={(e) => setDemoVideo(e.target.files?.[0] || null)} className="block text-sm mt-1" />
            </div>
          </div>

          {serverError && <p className="text-magenta text-sm">{serverError}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60">
            {isSubmitting ? 'Publishing…' : 'Publish mentor profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateSkill;
