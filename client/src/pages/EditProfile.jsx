import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api';

const inputClass =
  'w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-cyan transition-colors placeholder:text-ink/40 dark:placeholder:text-white/40';

const EditProfile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      headline: user?.headline || '',
      bio: user?.bio || '',
      location: user?.location || '',
      skills: user?.skills?.join(', ') || '',
      website: user?.socialLinks?.website || '',
      github: user?.socialLinks?.github || '',
      linkedin: user?.socialLinks?.linkedin || '',
      portfolio: user?.socialLinks?.portfolio || '',
    },
  });

  if (!user) return null;

  const onSubmit = async (form) => {
    setServerError('');
    try {
      const payload = {
        name: form.name,
        headline: form.headline,
        bio: form.bio,
        location: form.location,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        socialLinks: {
          website: form.website,
          github: form.github,
          linkedin: form.linkedin,
          portfolio: form.portfolio,
        },
      };
      const { data } = await api.patch('/users/me', payload);
      setUser(data.data);
      navigate('/profile');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not save changes');
    }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void px-4 py-14">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <Link to="/profile" className="text-sm text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white transition-colors">
          ← Back to profile
        </Link>
        <h1 className="font-display font-bold text-2xl mt-4 mb-6">Edit profile</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input className={inputClass} placeholder="Full name" {...register('name', { required: true })} />
          <input className={inputClass} placeholder="Headline (e.g. Product Designer at Loop)" {...register('headline')} />
          <textarea className={inputClass} rows={4} placeholder="Bio" {...register('bio', { maxLength: 600 })} />
          <input className={inputClass} placeholder="Location" {...register('location')} />
          <input className={inputClass} placeholder="Skills, comma separated" {...register('skills')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Website URL" {...register('website')} />
            <input className={inputClass} placeholder="Portfolio URL" {...register('portfolio')} />
            <input className={inputClass} placeholder="GitHub URL" {...register('github')} />
            <input className={inputClass} placeholder="LinkedIn URL" {...register('linkedin')} />
          </div>

          {serverError && <p className="text-magenta text-sm">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
