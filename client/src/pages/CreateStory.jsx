import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createStory, fetchCategories } from '../services/stories';

const inputClass =
  'w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-cyan transition-colors placeholder:text-ink/40 dark:placeholder:text-white/40';

const CreateStory = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [serverError, setServerError] = useState('');
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();

  const onSubmit = async (form, publish) => {
    setServerError('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('hashtags', form.hashtags || '');
      formData.append('status', publish ? 'published' : 'draft');
      images.forEach((img) => formData.append('images', img));
      if (video) formData.append('video', video);

      const story = await createStory(formData);
      navigate(publish ? `/stories/${story._id}` : '/profile');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not create story. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <Link to="/feed" className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan transition-colors">
          ← Back to feed
        </Link>
        <h1 className="font-display font-bold text-2xl mt-4 mb-6">Share your story</h1>

        <form className="space-y-4">
          <input className={inputClass} placeholder="Title" {...register('title', { required: true })} />

          <select className={inputClass} {...register('category', { required: true })} defaultValue="">
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <textarea
            className={inputClass}
            rows={8}
            placeholder="Tell your story… use #hashtags anywhere in the text"
            {...register('description', { required: true, minLength: 10 })}
          />

          <input className={inputClass} placeholder="Extra hashtags, comma separated (optional)" {...register('hashtags')} />

          <div>
            <label className="block text-xs font-mono uppercase text-ink/40 dark:text-white/40 mb-2">
              Images (up to 10)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 10))}
              className="text-sm"
            />
            {images.length > 0 && <p className="text-xs text-ink/40 dark:text-white/40 mt-1">{images.length} image(s) selected</p>}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-ink/40 dark:text-white/40 mb-2">
              Video (optional)
            </label>
            <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} className="text-sm" />
          </div>

          {serverError && <p className="text-magenta text-sm">{serverError}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit((form) => onSubmit(form, false))}
              className="flex-1 border border-black/10 dark:border-white/15 font-semibold py-3 rounded-full disabled:opacity-60"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit((form) => onSubmit(form, true))}
              className="flex-1 bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60"
            >
              {isSubmitting ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStory;
