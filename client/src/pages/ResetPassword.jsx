import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthShell, inputClass } from './Register.jsx';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password');

  const onSubmit = async ({ password }) => {
    setServerError('');
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Reset link is invalid or has expired');
    }
  };

  return (
    <AuthShell title="Set a new password">
      {success ? (
        <p className="text-cyan text-sm">{success}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <input
              className={inputClass}
              type="password"
              placeholder="New password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
                pattern: { value: /\d/, message: 'Include at least one number' },
              })}
            />
            {errors.password && <p className="text-magenta text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <input
              className={inputClass}
              type="password"
              placeholder="Confirm new password"
              {...register('confirmPassword', {
                validate: (v) => v === password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <p className="text-magenta text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
          {serverError && <p className="text-magenta text-sm">{serverError}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : 'Reset password'}
          </button>
        </form>
      )}
      <p className="text-ink/50 dark:text-white/50 text-sm mt-6">
        <Link to="/login" className="text-cyan">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
};

export default ResetPassword;
