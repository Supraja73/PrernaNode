import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ImageCarousel from '../components/ImageCarousel.jsx';
import ReviewsSection from '../components/ReviewsSection.jsx';
import SaveButton from '../components/SaveButton.jsx';
import { fetchProduct, createInquiry, toggleHideProduct, toggleSoldProduct, deleteProduct, reportProduct, shareProduct } from '../services/products';
import { useAuth } from '../context/AuthContext.jsx';

const ProductDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { data: product, isLoading, refetch } = useQuery({ queryKey: ['product', id], queryFn: () => fetchProduct(id) });

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading…</div>;
  if (!product) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Listing not found.</div>;

  const isOwner = user && (user._id === product.seller?._id || user.id === product.seller?._id);

  const sendInquiry = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createInquiry(product._id, message);
      setSent(true);
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send inquiry');
    }
  };

  const handleShare = async () => {
    const res = await shareProduct(product._id);
    if (navigator.share) await navigator.share({ title: product.name, url: res.url }).catch(() => {});
    else await navigator.clipboard.writeText(res.url);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this listing permanently?')) return;
    await deleteProduct(product._id);
    navigate('/marketplace');
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6">
            <ImageCarousel images={product.images} video={product.video} alt={product.name} />
          </div>
          <div className="px-6 pb-6">
            <p className="text-[10px] font-mono text-cyan uppercase">{product.category}</p>
            <div className="flex items-center justify-between mt-1">
              <h1 className="font-display font-bold text-2xl">{product.name}</h1>
              <SaveButton resourceType="product" resourceId={product._id} />
            </div>
            <p className="text-sm text-ink/50 dark:text-white/50 mt-1">
              Sold by <Link to={`/u/${product.seller?.username}`} className="text-cyan">{product.seller?.name}</Link>
              {product.business?.businessName && ` · ${product.business.businessName}`}
            </p>

            <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed mt-4 whitespace-pre-wrap">{product.description}</p>

            <div className="flex flex-wrap gap-2 mt-4 text-xs font-mono">
              <span className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">{product.availability}</span>
              <span className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">{product.condition}</span>
              <span className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">Stock: {product.stock}</span>
              {product.status === 'sold' && <span className="px-2 py-1 rounded-full bg-magenta/20 text-magenta">Sold</span>}
            </div>

            {product.shippingInfo && <p className="text-xs text-ink/40 dark:text-white/40 mt-3">📦 {product.shippingInfo}</p>}

            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-black/5 dark:border-white/10 text-sm">
              <span className="text-ink/50 dark:text-white/50">👁 {product.viewCount} views</span>
              <button onClick={handleShare} className="text-ink/50 dark:text-white/50">↗ {product.sharesCount} Shares</button>
              {!isOwner && user && (
                <button onClick={() => reportProduct(product._id)} className="text-ink/40 dark:text-white/40 ml-auto text-xs hover:text-magenta">Report</button>
              )}
              {isOwner && (
                <div className="flex gap-3 ml-auto text-xs">
                  <button onClick={async () => { await toggleHideProduct(product._id); refetch(); }} className="text-cyan">Hide/Unhide</button>
                  <button onClick={async () => { await toggleSoldProduct(product._id); refetch(); }} className="text-gold">Mark sold</button>
                  <button onClick={handleDelete} className="text-magenta">Delete</button>
                </div>
              )}
            </div>

            {!isOwner && user && product.status !== 'sold' && (
              <div className="mt-6">
                {sent ? (
                  <p className="text-cyan text-sm">Inquiry sent! The seller will respond soon.</p>
                ) : (
                  <form onSubmit={sendInquiry} className="flex gap-2">
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask the seller a question…"
                      className="flex-1 text-sm bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 outline-none focus:border-cyan"
                    />
                    <button type="submit" className="text-sm font-semibold text-void bg-gradient-to-r from-gold to-magenta px-5 rounded-full">
                      Contact seller
                    </button>
                  </form>
                )}
                {error && <p className="text-magenta text-xs mt-2">{error}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 mt-6">
          <ReviewsSection targetType="product" targetId={product._id} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
