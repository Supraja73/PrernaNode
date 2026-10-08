import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { createEvent } from '../services/events';

const inputClass =
  'w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-cyan transition-colors placeholder:text-ink/40 dark:placeholder:text-white/40';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
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
      const event = await createEvent(formData);
      navigate(`/events/${event._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not create event');
    }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <Link to="/events" className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan">← Back</Link>
        <h1 className="font-display font-bold text-2xl mt-4 mb-6">Create an event</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input className={inputClass} placeholder="Event title" {...register('title', { required: true })} />
          <textarea className={inputClass} rows={4} placeholder="Description" {...register('description', { required: true })} />
          <div className="grid sm:grid-cols-3 gap-3">
            <select className={inputClass} {...register('mode')} defaultValue="Online">
              <option>Online</option><option>Offline</option><option>Hybrid</option>
            </select>
            <input type="date" className={inputClass} {...register('date', { required: true })} />
            <input type="time" className={inputClass} {...register('time', { required: true })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={inputClass} placeholder="Venue (if offline/hybrid)" {...register('venue')} />
            <input className={inputClass} placeholder="Online link (if online/hybrid)" {...register('onlineLink')} />
          </div>
          <input type="number" min="0" className={inputClass} placeholder="Seats (0 = unlimited)" {...register('seats')} />
          <div>
            <label className="text-xs font-mono text-ink/40 dark:text-white/40">Banner</label>
            <input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files?.[0] || null)} className="block text-sm mt-1" />
          </div>
          {serverError && <p className="text-magenta text-sm">{serverError}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60">
            {isSubmitting ? 'Creating…' : 'Create event'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
