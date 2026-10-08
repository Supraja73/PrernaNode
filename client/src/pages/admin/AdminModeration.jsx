import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../components/AdminLayout.jsx';
import { fetchFlaggedContent, moderateContent } from '../../services/admin';

const Row = ({ label, subtitle, reportsCount, onHide, onDelete, onRestore, hidden }) => (
  <div className="glass rounded-xl p-4 flex items-center justify-between gap-3">
    <div className="min-w-0">
      <p className="text-sm font-semibold truncate">{label}</p>
      <p className="text-xs text-ink/40 dark:text-white/40 truncate">{subtitle} · {reportsCount} report(s){hidden ? ' · hidden' : ''}</p>
    </div>
    <div className="flex gap-2 text-xs shrink-0">
      {!hidden ? <button onClick={onHide} className="text-gold">Hide</button> : <button onClick={onRestore} className="text-cyan">Restore</button>}
      <button onClick={onDelete} className="text-magenta">Delete</button>
    </div>
  </div>
);

const AdminModeration = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-flagged'], queryFn: fetchFlaggedContent });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-flagged'] });
  const act = async (type, id, action) => { await moderateContent(type, id, action); refresh(); };

  return (
    <AdminLayout>
      <h1 className="font-display font-bold text-2xl mb-6">Content moderation</h1>
      {isLoading && <p className="text-sm text-ink/40 dark:text-white/40">Loading flagged content…</p>}

      {data && (
        <div className="space-y-8">
          <div>
            <h2 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-3">Products ({data.products.length})</h2>
            <div className="space-y-2">
              {data.products.map((p) => (
                <Row key={p._id} label={p.name} subtitle={p.seller?.name} reportsCount={p.reportsCount} hidden={p.status === 'hidden'}
                  onHide={() => act('product', p._id, 'hide')} onRestore={() => act('product', p._id, 'restore')} onDelete={() => act('product', p._id, 'delete')} />
              ))}
              {data.products.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">Nothing flagged.</p>}
            </div>
          </div>

          <div>
            <h2 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-3">Reviews ({data.reviews.length})</h2>
            <div className="space-y-2">
              {data.reviews.map((r) => (
                <Row key={r._id} label={r.description?.slice(0, 60)} subtitle={r.author?.name} reportsCount={r.reportsCount} hidden={r.hidden}
                  onHide={() => act('review', r._id, 'hide')} onRestore={() => act('review', r._id, 'restore')} onDelete={() => act('review', r._id, 'delete')} />
              ))}
              {data.reviews.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">Nothing flagged.</p>}
            </div>
          </div>

          <div>
            <h2 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-3">Community posts ({data.communityPosts.length})</h2>
            <div className="space-y-2">
              {data.communityPosts.map((p) => (
                <Row key={p._id} label={p.content?.slice(0, 60)} subtitle={p.author?.name} reportsCount={p.reportsCount} hidden={p.hidden}
                  onHide={() => act('community_post', p._id, 'hide')} onRestore={() => act('community_post', p._id, 'restore')} onDelete={() => act('community_post', p._id, 'delete')} />
              ))}
              {data.communityPosts.length === 0 && <p className="text-sm text-ink/40 dark:text-white/40">Nothing flagged.</p>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminModeration;
