import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchStory, updateStory, fetchCategories } from '../services/stories';

const inputClass =
  'w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-cyan transition-colors placeholder:text-ink/40 dark:placeholder:text-white/40';

const EditStory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState(null);
  const [video, setVideo] = useState(null);
  const [serverError, setServerError] = useState('');
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: story, isLoading } = useQuery({ queryKey: ['story', id], queryFn: () => fetchStory(id) });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm();

  useEffect(() => {
    if (story) {
      reset({
        title: story.title,
        category: story.category,
        description: story.description,
        hashtags: story.hashtags?.join(', ') || '',
      });
    }
  }, [story, reset]);

  const onSubmit = async (form) => {
    setServerError('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('hashtags', form.hashtags || '');
      if (images) images.forEach((img) => formData.append('images', img));
      if (video) formData.append('video', video);

      const updated = await updateStory(id, formData);
      navigate(`/stories/${updated._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not save changes.');
    }
  };

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading…</div>;
  if (!story) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Story not found.</div>;

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <Link to={`/stories/${id}`} className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan transition-colors">
          ← Back to story
        </Link>
        <h1 className="font-display font-bold text-2xl mt-4 mb-6">Edit story</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input className={inputClass} placeholder="Title" {...register('title', { required: true })} />
          <select className={inputClass} {...register('category', { required: true })}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <textarea className={inputClass} rows={8} {...register('description', { required: true, minLength: 10 })} />
          <input className={inputClass} placeholder="Hashtags, comma separated" {...register('hashtags')} />

          <div>
            <label className="block text-xs font-mono uppercase text-ink/40 dark:text-white/40 mb-2">
              Replace images (optional — leave empty to keep current)
            </label>
            <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 10))} className="text-sm" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-ink/40 dark:text-white/40 mb-2">
              Replace video (optional)
            </label>
            <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} className="text-sm" />
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

export default EditStory;
