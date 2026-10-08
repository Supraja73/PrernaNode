import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="border-t border-black/5 dark:border-white/10 bg-white/40 dark:bg-deep/60">
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
        <div className="col-span-2">
          <div className="font-display font-extrabold text-lg flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-gradient-to-br from-gold to-magenta" />
            PrernaNode
          </div>
          <p className="text-sm text-ink/50 dark:text-white/50 max-w-xs leading-relaxed">
            Connect. Inspire. Rise. An AI-powered networking and growth platform for women.
          </p>
        </div>
        <div>
          <h6 className="font-mono text-[11px] uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">
            Platform
          </h6>
          <ul className="space-y-2 text-sm text-ink/60 dark:text-white/60">
            <li><a href="/#about" className="hover:text-cyan">About</a></li>
            <li><a href="/#features" className="hover:text-cyan">Features</a></li>
            <li><a href="/#community" className="hover:text-cyan">Community</a></li>
          </ul>
        </div>
        <div>
          <h6 className="font-mono text-[11px] uppercase tracking-wide text-ink/40 dark:text-white/40 mb-3">
            Account
          </h6>
          <ul className="space-y-2 text-sm text-ink/60 dark:text-white/60">
            <li><Link to="/login" className="hover:text-cyan">Login</Link></li>
            <li><Link to="/register" className="hover:text-cyan">Register</Link></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap justify-between items-center gap-3 text-xs font-mono text-ink/40 dark:text-white/40 border-t border-black/5 dark:border-white/10 pt-6">
        <span>© {new Date().getFullYear()} PrernaNode. All rights reserved.</span>
        <span>Built for the women still rising.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
