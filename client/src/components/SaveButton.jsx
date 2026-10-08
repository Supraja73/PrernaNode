import React, { useState } from 'react';
import { saveItem } from '../services/collections';
import { useAuth } from '../context/AuthContext.jsx';

const SaveButton = ({ resourceType, resourceId, className = '' }) => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    if (busy || saved) return;
    setBusy(true);
    try {
      await saveItem(resourceType, resourceId);
      setSaved(true);
    } catch (err) {
      // already saved or transient error — non-fatal
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={busy}
      className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
        saved ? 'border-gold text-gold' : 'border-black/10 dark:border-white/15 hover:border-gold'
      } ${className}`}
    >
      {saved ? 'Saved' : 'Save'}
    </button>
  );
};

export default SaveButton;
