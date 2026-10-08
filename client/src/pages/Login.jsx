import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthShell, inputClass } from './Register.jsx';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { rememberMe: true } });

  const onSubmit = async ({ email, password, rememberMe }) => {
    setServerError('');
    try {
      await login(email, password, rememberMe);
      const redirectTo = location.state?.from?.pathname || '/profile';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your ascent.">
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
        <div>
          <input
            className={inputClass}
            type="password"
            placeholder="Password"
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && <p className="text-magenta text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-ink/60 dark:text-white/60 cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-cyan w-3.5 h-3.5"
              {...register('rememberMe')}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-xs text-cyan">
            Forgot password?
          </Link>
        </div>

        {serverError && (
          <div className="space-y-1">
            <p className="text-magenta text-sm">{serverError}</p>
            {serverError.toLowerCase().includes('verify') && (
              <p className="text-xs text-ink/60 dark:text-white/60">
                Didn't receive the email?{' '}
                <Link to="/resend-verification" className="text-cyan font-medium underline">
                  Resend verification email
                </Link>
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-gold to-magenta text-void font-semibold py-3 rounded-full disabled:opacity-60"
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="text-ink/50 dark:text-white/50 text-sm mt-6">
        New to PrernaNode?{' '}
        <Link to="/register" className="text-cyan">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
};

export default Login;
