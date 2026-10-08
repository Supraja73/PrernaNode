import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCollections, createCollection, renameCollection, deleteCollection, fetchCollectionItems, removeItem } from '../services/collections';
import StarRating from '../components/StarRating.jsx';

const SavedCollections = () => {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState(null);
  const [newName, setNewName] = useState('');

  const { data: collections = [], isLoading } = useQuery({ queryKey: ['collections'], queryFn: fetchCollections });
  const { data: items } = useQuery({
    queryKey: ['collection-items', activeId],
    queryFn: () => fetchCollectionItems(activeId),
    enabled: !!activeId,
  });

  const refreshCollections = () => queryClient.invalidateQueries({ queryKey: ['collections'] });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createCollection(newName.trim());
    setNewName('');
    refreshCollections();
  };

  const handleRename = async (id) => {
    const name = window.prompt('New collection name?');
    if (!name) return;
    await renameCollection(id, name);
    refreshCollections();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this collection?')) return;
    await deleteCollection(id);
    if (activeId === id) setActiveId(null);
    refreshCollections();
  };

  const handleRemoveItem = async (resourceType, resourceId) => {
    await removeItem(activeId, resourceType, resourceId);
    queryClient.invalidateQueries({ queryKey: ['collection-items', activeId] });
  };

  return (
    <div className="min-h-screen bg-mist dark:bg-void pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto grid md:grid-cols-[240px_1fr] gap-6">
        <aside className="glass rounded-2xl p-5 h-fit">
          <h2 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">Collections</h2>
          {isLoading && <p className="text-xs text-ink/40 dark:text-white/40">Loading…</p>}
          <div className="space-y-1">
            {collections.map((c) => (
              <div key={c._id} className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm ${activeId === c._id ? 'bg-cyan/10 text-cyan' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                <button onClick={() => setActiveId(c._id)} className="flex-1 text-left truncate">{c.name} ({c.itemCount})</button>
                <button onClick={() => handleRename(c._id)} className="text-xs text-ink/30 dark:text-white/30 hover:text-cyan ml-1">✎</button>
                <button onClick={() => handleDelete(c._id)} className="text-xs text-ink/30 dark:text-white/30 hover:text-magenta ml-1">✕</button>
              </div>
            ))}
          </div>
          <form onSubmit={handleCreate} className="flex gap-1 mt-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New collection"
              className="flex-1 min-w-0 text-xs bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1.5 outline-none"
            />
            <button type="submit" className="text-xs text-cyan shrink-0">Add</button>
          </form>
        </aside>

        <div>
          {!activeId && <p className="text-sm text-ink/40 dark:text-white/40">Select a collection to view its items.</p>}
          {items && (
            <div className="space-y-8">
              {items.mentors?.length > 0 && (
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">Mentors</h3>
                  <div className="space-y-2">
                    {items.mentors.map((m) => (
                      <div key={m._id} className="glass rounded-xl p-4 flex items-center justify-between">
                        <Link to={`/skills/${m._id}`} className="min-w-0">
                          <p className="text-sm font-semibold truncate">{m.skillName}</p>
                          <StarRating value={m.averageRating} readOnly size={12} />
                        </Link>
                        <button onClick={() => handleRemoveItem('mentor', m._id)} className="text-xs text-magenta shrink-0">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {items.businesses?.length > 0 && (
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">Businesses</h3>
                  <div className="space-y-2">
                    {items.businesses.map((b) => (
                      <div key={b._id} className="glass rounded-xl p-4 flex items-center justify-between">
                        <Link to={`/businesses/${b._id}`} className="text-sm font-semibold truncate">{b.businessName}</Link>
                        <button onClick={() => handleRemoveItem('business', b._id)} className="text-xs text-magenta shrink-0">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {items.products?.length > 0 && (
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">Products</h3>
                  <div className="space-y-2">
                    {items.products.map((p) => (
                      <div key={p._id} className="glass rounded-xl p-4 flex items-center justify-between">
                        <Link to={`/marketplace/${p._id}`} className="text-sm font-semibold truncate">{p.name}</Link>
                        <button onClick={() => handleRemoveItem('product', p._id)} className="text-xs text-magenta shrink-0">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!items.mentors?.length && !items.businesses?.length && !items.products?.length && (
                <p className="text-sm text-ink/40 dark:text-white/40">Nothing saved here yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedCollections;
