import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';

const AuthShell = ({ title, subtitle, children }) => (
  <div className="min-h-screen flex items-center justify-center px-4 bg-mist dark:bg-void">
    <div className="w-full max-w-md glass rounded-2xl p-8">
      <Link to="/" className="font-display font-extrabold text-lg flex items-center gap-2 mb-8">
        <span className="w-2 h-2 rounded-full bg-gradient-to-br from-gold to-magenta"></span>
        PrernaNode
      </Link>
      <h1 className="font-display font-bold text-2xl mb-1">{title}</h1>
      {subtitle && <p className="text-ink/50 dark:text-white/50 text-sm mb-6">{subtitle}</p>}
      {children}
    </div>
  </div>
);

const inputClass =
  'w-full bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-sm outline-none focus:border-cyan transition-colors placeholder:text-ink/40 dark:placeholder:text-white/40';

const Register = () => {
  const { register: registerUser } = useAuth();
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

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      const res = await registerUser(formData.name, formData.username, formData.email, formData.password);
      setSuccess(res.message || 'Account created. Check your email to verify your account.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join the constellation.">
      {success ? (
        <p className="text-cyan text-sm">{success}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <input
              className={inputClass}
              placeholder="Full name"
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name is too short' } })}
            />
            {errors.name && <p className="text-magenta text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <input
              className={inputClass}
              placeholder="Username"
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'At least 3 characters' },
                maxLength: { value: 30, message: 'Under 30 characters' },
                pattern: {
                  value: /^[a-z0-9_]+$/i,
                  message: 'Letters, numbers, and underscores only',
                },
              })}
            />
            {errors.username && <p className="text-magenta text-xs mt-1">{errors.username.message}</p>}
          </div>
          <div>
            <input
              className={inputClass}
              type="email"
              placeholder="Email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />
            {errors.email && <p className="text-magenta text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <input
              className={inputClass}
              type="password"
              placeholder="Password"
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
              placeholder="Confirm password"
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
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
      <p className="text-ink/50 dark:text-white/50 text-sm mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-cyan">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
};

export default Register;
export { AuthShell, inputClass };
