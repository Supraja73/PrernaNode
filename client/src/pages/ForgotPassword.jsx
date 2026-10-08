import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { AuthShell, inputClass } from './Register.jsx';

const ForgotPassword = () => {
  const [message, setMessage] = useState('');
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async ({ email }) => {
    setServerError('');
    setMessage('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a reset link.">
      {message ? (
        <p className="text-cyan text-sm">{message}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <input
              className={inputClass}
              type="email"
              placeholder="Email"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="text-magenta text-xs mt-1">{errors.email.message}</p>}
          </div>
          {serverError && <p className="text-magenta text-sm">{serverError}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60"
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
