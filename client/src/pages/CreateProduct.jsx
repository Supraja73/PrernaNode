import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { createProduct, fetchProductCategories } from '../services/products';
import { fetchBusinessesByOwner } from '../services/business';
import { useAuth } from '../context/AuthContext.jsx';

const inputClass =
  'w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-cyan transition-colors placeholder:text-ink/40 dark:placeholder:text-white/40';

const CreateProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery({ queryKey: ['product-categories'], queryFn: fetchProductCategories });
  const { data: myBusinesses = [] } = useQuery({
    queryKey: ['my-businesses'],
    queryFn: () => fetchBusinessesByOwner(user._id || user.id),
    enabled: !!user,
  });
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (form) => {
    setServerError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== '') formData.append(key, value);
      });
      images.forEach((f) => formData.append('images', f));
      if (video) formData.append('video', video);

      const product = await createProduct(formData);
      navigate(`/marketplace/${product._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not create listing');
    }
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto glass rounded-2xl p-8">
        <Link to="/marketplace" className="text-sm text-ink/50 dark:text-white/50 hover:text-cyan">← Back to marketplace</Link>
        <h1 className="font-display font-bold text-2xl mt-4 mb-6">Create a listing</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input className={inputClass} placeholder="Product name" {...register('name', { required: true })} />
          <select className={inputClass} {...register('category', { required: true })} defaultValue="">
            <option value="" disabled>Category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea className={inputClass} rows={5} placeholder="Description" {...register('description', { required: true, minLength: 10 })} />
          <input className={inputClass} placeholder="Tags, comma separated" {...register('tags')} />

          <div className="grid sm:grid-cols-3 gap-3">
            <input type="number" min="0" className={inputClass} placeholder="Stock" defaultValue={1} {...register('stock')} />
            <select className={inputClass} {...register('availability')} defaultValue="in-stock">
              <option value="in-stock">In stock</option>
              <option value="made-to-order">Made to order</option>
              <option value="out-of-stock">Out of stock</option>
            </select>
            <select className={inputClass} {...register('condition')} defaultValue="new">
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
              <option value="digital">Digital</option>
            </select>
          </div>

          <input className={inputClass} placeholder="Shipping info (optional)" {...register('shippingInfo')} />

          {myBusinesses.length > 0 && (
            <select className={inputClass} {...register('businessId')} defaultValue="">
              <option value="">List as an individual (no business)</option>
              {myBusinesses.map((b) => <option key={b._id} value={b._id}>{b.businessName}</option>)}
            </select>
          )}

          <div>
            <label className="text-xs font-mono text-ink/40 dark:text-white/40">Images (up to 10)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 10))} className="block text-sm mt-1" />
          </div>
          <div>
            <label className="text-xs font-mono text-ink/40 dark:text-white/40">Video (optional)</label>
            <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] || null)} className="block text-sm mt-1" />
          </div>

          {serverError && <p className="text-magenta text-sm">{serverError}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60">
            {isSubmitting ? 'Publishing…' : 'Publish listing'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
