import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createCommunity, fetchCommunityCategories } from '../services/communities';

const inputClass =
  'w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-cyan transition-colors placeholder:text-ink/40 dark:placeholder:text-white/40';

const CreateCommunity = () => {
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery({ queryKey: ['community-categories'], queryFn: fetchCommunityCategories });
  const [banner, setBanner] = useState(null);
  const [logo, setLogo] = useState(null);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (form) => {
    setServerError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== '') formData.append(key, value);
      });
      if (banner) formData.append('banner', banner);
      if (logo) formData.append('logo', logo);

      const community = await createCommunity(formData);
      navigate(`/communities/${community._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not create community');
    }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <Link to="/communities" className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan">← Back to communities</Link>
        <h1 className="font-display font-bold text-2xl mt-4 mb-6">Create a community</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input className={inputClass} placeholder="Community name" {...register('name', { required: true })} />
          <select className={inputClass} {...register('category', { required: true })} defaultValue="">
            <option value="" disabled>Category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea className={inputClass} rows={4} placeholder="Description" {...register('description')} />
          <textarea className={inputClass} rows={3} placeholder="Community rules, one per line" {...register('rules')} />
          <input className={inputClass} placeholder="Tags, comma separated" {...register('tags')} />
          <select className={inputClass} {...register('visibility')} defaultValue="public">
            <option value="public">Public — anyone can join instantly</option>
            <option value="private">Private — join requests need approval</option>
            <option value="invite-only">Invite only — hidden from discovery</option>
          </select>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-ink/40 dark:text-white/40">Banner</label>
              <input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files?.[0] || null)} className="block text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-mono text-ink/40 dark:text-white/40">Logo</label>
              <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} className="block text-sm mt-1" />
            </div>
          </div>

          {serverError && <p className="text-magenta text-sm">{serverError}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60">
            {isSubmitting ? 'Creating…' : 'Create community'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunity;
