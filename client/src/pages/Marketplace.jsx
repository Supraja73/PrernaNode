import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useInfiniteFeed } from '../hooks/useInfiniteFeed.js';
import { listProducts, fetchProductCategories } from '../services/products';
import { useAuth } from '../context/AuthContext.jsx';

const ProductCard = ({ product }) => (
  <Link to={`/marketplace/${product._id}`} className="glass rounded-2xl overflow-hidden block hover:-translate-y-1 transition-transform duration-300">
    <div className="aspect-square bg-black/5 dark:bg-white/5 relative">
      {product.images?.[0]?.url ? (
        <img src={product.images[0].url} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
      )}
      {product.featured && <span className="absolute top-2 left-2 text-[10px] font-mono bg-gold text-void px-2 py-0.5 rounded-full">FEATURED</span>}
      {product.status === 'sold' && <span className="absolute top-2 right-2 text-[10px] font-mono bg-magenta text-white px-2 py-0.5 rounded-full">SOLD</span>}
    </div>
    <div className="p-4">
      <p className="text-[10px] font-mono text-cyan uppercase">{product.category}</p>
      <h3 className="font-display font-semibold text-sm mt-1 truncate">{product.name}</h3>
      <p className="text-xs text-ink/40 dark:text-white/40 mt-1">{product.seller?.name}</p>
    </div>
  </Link>
);

const Marketplace = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ category: '', q: '' });
  const { data: categories = [] } = useQuery({ queryKey: ['product-categories'], queryFn: fetchProductCategories });

  const { items, isLoading, isFetchingNextPage, sentinelRef } = useInfiniteFeed(
    ['products', filters],
    (page) => listProducts({ ...filters, page })
  );

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display font-bold text-2xl">Marketplace</h1>
          {user && (
            <Link to="/marketplace/new" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-5 py-2 rounded-full">
              + New listing
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Search products…"
            className="flex-1 min-w-[200px] bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-cyan"
          />
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-full px-4 py-2.5 text-sm outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading listings…</p>}
        {!isLoading && items.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">No listings match yet.</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>

        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-6">
          {isFetchingNextPage && <span className="text-xs text-ink/40 dark:text-white/40 font-mono">Loading more…</span>}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
