import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createBusiness, fetchBusinessCategories } from '../services/business';

const inputClass =
  'w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-cyan transition-colors placeholder:text-ink/40 dark:placeholder:text-white/40';

const CreateBusiness = () => {
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery({ queryKey: ['business-categories'], queryFn: fetchBusinessCategories });
  const [logo, setLogo] = useState(null);
  const [coverBanner, setCoverBanner] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (form) => {
    setServerError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== '') formData.append(key, value);
      });
      if (logo) formData.append('logo', logo);
      if (coverBanner) formData.append('coverBanner', coverBanner);
      gallery.forEach((f) => formData.append('gallery', f));

      const business = await createBusiness(formData);
      navigate(`/businesses/${business._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not create business profile');
    }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <Link to="/businesses" className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan">← Back to directory</Link>
        <h1 className="font-display font-bold text-2xl mt-4 mb-6">Set up your business profile</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input className={inputClass} placeholder="Business name" {...register('businessName', { required: true })} />
          <input className={inputClass} placeholder="Founder name" {...register('founderName')} />
          <select className={inputClass} {...register('category', { required: true })} defaultValue="">
            <option value="" disabled>Category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea className={inputClass} rows={4} placeholder="Description" {...register('description')} />

          <div className="grid sm:grid-cols-3 gap-3">
            <input className={inputClass} placeholder="City" {...register('city')} />
            <input className={inputClass} placeholder="State" {...register('state')} />
            <input className={inputClass} placeholder="Country" {...register('country')} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <input className={inputClass} placeholder="Website" {...register('website')} />
            <input className={inputClass} placeholder="Email" {...register('email')} />
            <input className={inputClass} placeholder="Phone" {...register('phone')} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Instagram URL" {...register('instagram')} />
            <input className={inputClass} placeholder="Facebook URL" {...register('facebook')} />
            <input className={inputClass} placeholder="Twitter/X URL" {...register('twitter')} />
            <input className={inputClass} placeholder="LinkedIn URL" {...register('linkedin')} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-mono text-ink/40 dark:text-white/40">Logo</label>
              <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} className="block text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-mono text-ink/40 dark:text-white/40">Cover banner</label>
              <input type="file" accept="image/*" onChange={(e) => setCoverBanner(e.target.files?.[0] || null)} className="block text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-mono text-ink/40 dark:text-white/40">Gallery images</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setGallery(Array.from(e.target.files || []))} className="block text-sm mt-1" />
            </div>
          </div>

          {serverError && <p className="text-magenta text-sm">{serverError}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60">
            {isSubmitting ? 'Publishing…' : 'Create business profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateBusiness;
