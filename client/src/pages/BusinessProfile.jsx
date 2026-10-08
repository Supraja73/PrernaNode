import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchBusiness, followBusiness, unfollowBusiness, deleteBusiness } from '../services/business';
import { fetchProductsBySeller } from '../services/products';
import ReviewsSection from '../components/ReviewsSection.jsx';
import SaveButton from '../components/SaveButton.jsx';
import StarRating from '../components/StarRating.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const BusinessProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: business, isLoading, refetch } = useQuery({ queryKey: ['business', id], queryFn: () => fetchBusiness(id) });
  const { data: products = [] } = useQuery({
    queryKey: ['seller-products', business?.owner?._id],
    queryFn: () => fetchProductsBySeller(business.owner._id),
    enabled: !!business?.owner?._id,
  });
  const [busy, setBusy] = useState(false);

  if (isLoading) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Loading…</div>;
  if (!business) return <div className="min-h-screen pt-32 text-center text-ink/40 dark:text-white/40">Business not found.</div>;

  const isOwner = user && (user._id === business.owner?._id || user.id === business.owner?._id);

  const toggleFollow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (business.isFollowing) await unfollowBusiness(business._id);
      else await followBusiness(business._id);
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this business profile permanently?')) return;
    await deleteBusiness(business._id);
    navigate('/businesses');
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="glass rounded-2xl overflow-hidden">
          <div className="h-36 bg-gradient-to-br from-violet/30 to-magenta/20 relative">
            {business.coverBanner?.url && <img src={business.coverBanner.url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="p-6 -mt-10">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold to-magenta flex items-center justify-center font-display font-bold text-xl border-4 border-white dark:border-deep overflow-hidden">
                {business.logo?.url ? <img src={business.logo.url} alt="" className="w-full h-full object-cover" /> : business.businessName?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex items-center gap-2">
                <SaveButton resourceType="business" resourceId={business._id} />
                {!isOwner && user && (
                  <button onClick={toggleFollow} disabled={busy} className={`text-xs font-semibold px-4 py-2 rounded-full ${business.isFollowing ? 'border border-black/10 dark:border-white/15' : 'bg-gradient-to-r from-gold to-magenta text-void'}`}>
                    {business.isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
                {isOwner && <button onClick={handleDelete} className="text-xs text-magenta">Delete</button>}
              </div>
            </div>

            <h1 className="font-display font-bold text-2xl mt-3">{business.businessName}</h1>
            <p className="text-sm text-ink/50 dark:text-white/50">Founded by {business.founderName} · {business.category}</p>
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={business.averageRating} readOnly size={14} />
              <span className="text-xs text-ink/40 dark:text-white/40">({business.reviewsCount})</span>
              <span className="text-xs text-ink/40 dark:text-white/40">· {business.followersCount} followers</span>
            </div>

            {business.description && <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed mt-4">{business.description}</p>}

            <div className="flex flex-wrap gap-3 mt-4 text-xs">
              {business.website && <a href={business.website} target="_blank" rel="noreferrer" className="text-cyan">Website</a>}
              {business.email && <a href={`mailto:${business.email}`} className="text-cyan">{business.email}</a>}
              {business.phone && <span className="text-ink/40 dark:text-white/40">{business.phone}</span>}
            </div>

            {business.gallery?.length > 0 && (
              <div className="flex gap-2 mt-5 overflow-x-auto">
                {business.gallery.map((g, i) => <img key={i} src={g.url} alt="" className="w-24 h-24 object-cover rounded-lg shrink-0" />)}
              </div>
            )}
          </div>
        </div>

        {products.length > 0 && (
          <div className="mt-6">
            <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <Link key={p._id} to={`/marketplace/${p._id}`} className="glass rounded-xl overflow-hidden">
                  <div className="aspect-square bg-black/5 dark:bg-white/5">
                    {p.images?.[0]?.url && <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />}
                  </div>
                  <p className="text-xs font-semibold p-2 truncate">{p.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="glass rounded-2xl p-6 mt-6">
          <ReviewsSection targetType="business" targetId={business._id} />
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;
