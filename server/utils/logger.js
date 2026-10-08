// A small structured logger — leveled console output plus an append-only file per day
// under server/logs/. Deliberately dependency-free (no Winston) to avoid adding a new
// npm dependency for something this simple; swap in Winston/Pino later without
// changing call sites if log volume ever demands it.
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const write = (level, message, meta) => {
  const entry = {
    level,
    message,
    ...(meta ? { meta } : {}),
    timestamp: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);

  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  consoleFn(line);

  const file = path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`);
  fs.appendFile(file, line + '\n', () => {}); // fire-and-forget; logging must never block or crash the request
};

module.exports = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') write('debug', message, meta);
  },
};
