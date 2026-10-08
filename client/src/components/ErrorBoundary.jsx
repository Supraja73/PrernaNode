import React from 'react';

// A real React error boundary — catches render-time errors in the subtree below it so
// one broken component doesn't blank the whole app. Wired once at the App root (see
// App.jsx); it's a new component, not a retrofit of any existing page.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-mist dark:bg-void">
          <h1 className="font-display font-bold text-3xl mb-3">Something went wrong</h1>
          <p className="text-ink/50 dark:text-white/50 text-sm max-w-sm mb-6">
            This page hit an unexpected error. Reloading usually fixes it — if it keeps happening, let us know.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-semibold bg-gradient-to-r from-gold to-magenta text-void px-6 py-3 rounded-full"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
