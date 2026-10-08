import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../components/AdminLayout.jsx';
import { fetchSettings, updateSettings } from '../../services/admin';

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between text-sm py-2">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-cyan w-4 h-4" />
  </label>
);

const AdminSettings = () => {
  const { data, isLoading, refetch } = useQuery({ queryKey: ['admin-settings'], queryFn: fetchSettings });
  const [local, setLocal] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  if (isLoading || !local) return <AdminLayout><p className="text-sm text-ink/40 dark:text-white/40">Loading settings…</p></AdminLayout>;

  const save = async () => {
    await updateSettings({
      maintenanceMode: local.maintenanceMode,
      maintenanceMessage: local.maintenanceMessage,
      features: local.features,
      registration: local.registration,
      email: local.email,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    refetch();
  };

  return (
    <AdminLayout>
      <h1 className="font-display font-bold text-2xl mb-6">Platform settings</h1>

      <div className="glass rounded-2xl p-6 mb-4">
        <h2 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-3">Maintenance mode</h2>
        <Toggle label="Enable maintenance mode (blocks all non-admin API access)" checked={local.maintenanceMode} onChange={(v) => setLocal((s) => ({ ...s, maintenanceMode: v }))} />
        <textarea
          value={local.maintenanceMessage}
          onChange={(e) => setLocal((s) => ({ ...s, maintenanceMessage: e.target.value }))}
          rows={2}
          className="w-full mt-2 bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="glass rounded-2xl p-6 mb-4">
        <h2 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-3">Feature toggles</h2>
        {Object.entries(local.features).map(([key, value]) => (
          <Toggle key={key} label={key.replace(/([A-Z])/g, ' $1')} checked={value} onChange={(v) => setLocal((s) => ({ ...s, features: { ...s.features, [key]: v } }))} />
        ))}
      </div>

      <div className="glass rounded-2xl p-6 mb-4">
        <h2 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-3">Registration</h2>
        <Toggle label="Allow new registrations" checked={local.registration.allowNewRegistrations} onChange={(v) => setLocal((s) => ({ ...s, registration: { ...s.registration, allowNewRegistrations: v } }))} />
        <Toggle label="Require email verification" checked={local.registration.requireEmailVerification} onChange={(v) => setLocal((s) => ({ ...s, registration: { ...s.registration, requireEmailVerification: v } }))} />
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="font-mono text-xs uppercase text-ink/40 dark:text-white/40 mb-3">Email</h2>
        <Toggle label="Weekly digest enabled" checked={local.email.weeklyDigestEnabled} onChange={(v) => setLocal((s) => ({ ...s, email: { ...s.email, weeklyDigestEnabled: v } }))} />
      </div>

      <button onClick={save} className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-6 py-3 rounded-full">
        {saved ? 'Saved ✓' : 'Save settings'}
      </button>
    </AdminLayout>
  );
};

export default AdminSettings;
