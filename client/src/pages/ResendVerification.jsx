import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { AuthShell, inputClass } from './Register.jsx';

const ResendVerification = () => {
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email }) => {
    setServerError('');
    setSuccess('');
    try {
      const { data } = await api.post('/auth/resend-verification', { email });
      setSuccess(data.message || 'If an unverified account exists with that email, a verification link has been sent.');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to send verification email. Please try again.');
    }
  };

  return (
    <AuthShell title="Resend Verification Email" subtitle="Enter your email to receive a new verification link.">
      {success ? (
        <div className="space-y-4">
          <p className="text-cyan text-sm">{success}</p>
          <p className="text-ink/50 dark:text-white/50 text-sm">
            <Link to="/login" className="text-cyan font-medium">
              Return to Login
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <input
              className={inputClass}
              type="email"
              placeholder="Email address"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <p className="text-magenta text-xs mt-1">{errors.email.message}</p>}
          </div>

          {serverError && <p className="text-magenta text-sm">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60"
          >
            {isSubmitting ? 'Sending email…' : 'Send verification email'}
          </button>

          <p className="text-ink/50 dark:text-white/50 text-sm mt-6 text-center">
            Remembered your credentials?{' '}
            <Link to="/login" className="text-cyan font-medium">
              Log in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
};

export default ResendVerification;
