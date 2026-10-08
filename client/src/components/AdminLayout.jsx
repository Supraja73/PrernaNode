import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  ['/admin', 'Dashboard'],
  ['/admin/users', 'Users'],
  ['/admin/moderation', 'Moderation'],
  ['/admin/reports', 'Reports'],
  ['/admin/analytics', 'Analytics'],
  ['/admin/settings', 'Settings'],
];

const AdminLayout = ({ children }) => (
  <div className="min-h-screen bg-mist dark:bg-void pt-24 pb-20 px-4">
    <div className="max-w-6xl mx-auto grid lg:grid-cols-[220px_1fr] gap-6">
      <aside className="glass rounded-2xl p-4 h-fit lg:sticky lg:top-24">
        <p className="font-mono text-[10px] uppercase tracking-wide text-ink/40 dark:text-white/40 px-2 mb-2">Admin</p>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto" aria-label="Admin navigation">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  isActive ? 'bg-cyan/20 text-cyan font-semibold' : 'text-ink/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  </div>
);

export default AdminLayout;
