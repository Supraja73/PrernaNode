import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthShell } from './Register.jsx';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('checking'); // checking | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email/${token}`);
        if (!cancelled) {
          setStatus('success');
          setMessage(data.message);
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Verification link is invalid or has expired');
        }
      }
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <AuthShell title="Email verification">
      {status === 'checking' && <p className="text-ink/60 dark:text-white/60 text-sm">Verifying your email…</p>}
      {status === 'success' && <p className="text-cyan text-sm">{message}</p>}
      {status === 'error' && (
        <div className="space-y-3">
          <p className="text-magenta text-sm">{message}</p>
          <p className="text-xs text-ink/60 dark:text-white/60">
            Need a new link?{' '}
            <Link to="/resend-verification" className="text-cyan font-medium underline">
              Request a new verification email
            </Link>
          </p>
        </div>
      )}
      <p className="text-ink/50 dark:text-white/50 text-sm mt-6">
        <Link to="/login" className="text-cyan">
          Go to login
        </Link>
      </p>
    </AuthShell>
  );
};

export default VerifyEmail;
