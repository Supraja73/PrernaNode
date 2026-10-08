import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import NotificationBell from './NotificationBell.jsx';

const navItems = [
  { to: '/#about', label: 'About' },
  { to: '/#features', label: 'Features' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/#community', label: 'Community' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'py-3 bg-mist/80 dark:bg-void/70 backdrop-blur-xl border-b border-black/5 dark:border-white/10'
          : 'py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="font-display font-extrabold text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-gold to-magenta" />
          PrernaNode
        </Link>

        <ul className="hidden md:flex items-center gap-8 text-sm text-ink/60 dark:text-white/60">
          <li>
            <Link to="/" className="hover:text-ink dark:hover:text-white transition-colors">
              Home
            </Link>
          </li>
          {user && (
            <>
              <li>
                <Link to="/feed" className="hover:text-ink dark:hover:text-white transition-colors">
                  Feed
                </Link>
              </li>
              <li>
                <Link to="/skills" className="hover:text-ink dark:hover:text-white transition-colors">
                  Mentors
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-ink dark:hover:text-white transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/businesses" className="hover:text-ink dark:hover:text-white transition-colors">
                  Businesses
                </Link>
              </li>
              <li>
                <Link to="/communities" className="hover:text-ink dark:hover:text-white transition-colors">
                  Communities
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-ink dark:hover:text-white transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/opportunities" className="hover:text-ink dark:hover:text-white transition-colors">
                  Opportunities
                </Link>
              </li>
              <li>
                <Link to="/collaborations" className="hover:text-ink dark:hover:text-white transition-colors">
                  Collaborate
                </Link>
              </li>
              <li>
                <Link to="/messages" className="hover:text-ink dark:hover:text-white transition-colors">
                  Messages
                </Link>
              </li>
              <li>
                <Link to="/ai-assistant" className="hover:text-ink dark:hover:text-white transition-colors">
                  AI Assistant
                </Link>
              </li>
              {(user.role === 'admin' || user.role === 'moderator') && (
                <li>
                  <Link to="/admin" className="text-gold hover:text-magenta transition-colors">
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <Link to="/trending" className="hover:text-ink dark:hover:text-white transition-colors">
                  Trending
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-ink dark:hover:text-white transition-colors">
                  Search
                </Link>
              </li>
            </>
          )}
          {navItems.map((item) => (
            <li key={item.to}>
              <a href={item.to} className="hover:text-ink dark:hover:text-white transition-colors">
                {item.label}
                {item.label === 'Pricing' && (
                  <span className="ml-1 text-[9px] align-top font-mono text-cyan">SOON</span>
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          {user ? (
            <>
              <Link to="/profile" className="text-sm hidden sm:inline">
                {user.name?.split(' ')[0]}
              </Link>
              <button
                onClick={logout}
                className="text-sm border border-black/10 dark:border-white/15 rounded-full px-4 py-2 hover:border-cyan transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm hidden sm:inline hover:text-cyan transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void rounded-full px-5 py-2"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
