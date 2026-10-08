import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Same pattern as ProtectedRoute (Part 1), extended with a role check. Kept as its own
// component rather than adding a `roles` prop to ProtectedRoute, since ProtectedRoute
// is auth-module code this part shouldn't touch.
const AdminRoute = ({ children, allowModerator = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink/60 dark:text-white/60 font-mono text-sm">
        Checking permissions…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const allowedRoles = allowModerator ? ['admin', 'moderator'] : ['admin'];
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="font-display font-bold text-2xl mb-2">403 — Not authorized</p>
        <p className="text-ink/50 dark:text-white/50 text-sm">This area is restricted to PrernaNode staff.</p>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
