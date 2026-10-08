import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-mist dark:bg-void">
    <p className="font-mono text-xs uppercase tracking-widest text-cyan mb-4">404</p>
    <h1 className="font-display font-bold text-3xl mb-3">This page drifted out of orbit</h1>
    <p className="text-ink/50 dark:text-white/50 text-sm max-w-sm mb-6">
      The page you're looking for doesn't exist, or it moved. Let's get you back on track.
    </p>
    <Link to="/" className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-6 py-3 rounded-full">
      Back to home
    </Link>
  </div>
);

export default NotFound;
