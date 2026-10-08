import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createOpportunity, fetchOpportunityTypes } from '../services/opportunities';

const inputClass =
  'w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-cyan transition-colors placeholder:text-ink/40 dark:placeholder:text-white/40';

const CreateOpportunity = () => {
  const navigate = useNavigate();
  const { data: types = [] } = useQuery({ queryKey: ['opportunity-types'], queryFn: fetchOpportunityTypes });
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (form) => {
    setServerError('');
    try {
      const opportunity = await createOpportunity(form);
      navigate(`/opportunities/${opportunity._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not post opportunity');
    }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <Link to="/opportunities" className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan">← Back</Link>
        <h1 className="font-display font-bold text-2xl mt-4 mb-6">Post an opportunity</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input className={inputClass} placeholder="Title" {...register('title', { required: true })} />
          <div className="grid sm:grid-cols-2 gap-3">
            <select className={inputClass} {...register('type', { required: true })} defaultValue="">
              <option value="" disabled>Type</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className={inputClass} {...register('mode')} defaultValue="Remote">
              <option>Remote</option><option>Hybrid</option><option>Offline</option>
            </select>
          </div>
          <input className={inputClass} placeholder="Organization" {...register('organization', { required: true })} />
          <input className={inputClass} placeholder="Location" {...register('location')} />
          <textarea className={inputClass} rows={5} placeholder="Description" {...register('description', { required: true, minLength: 10 })} />
          <textarea className={inputClass} rows={3} placeholder="Eligibility" {...register('eligibility')} />
          <input type="datetime-local" className={inputClass} {...register('deadline')} />
          <input className={inputClass} placeholder="Official apply link (https://…)" {...register('applyLink', { required: true })} />
          {serverError && <p className="text-magenta text-sm">{serverError}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60">
            {isSubmitting ? 'Publishing…' : 'Publish opportunity'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateOpportunity;
