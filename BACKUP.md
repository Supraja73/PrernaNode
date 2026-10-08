# PrernaNode — Backup & Disaster Recovery

## What needs backing up (and what doesn't)

| Data | Where it lives | Backup strategy |
|---|---|---|
| Application data (users, stories, products, chats, everything in Mongoose models) | MongoDB | `npm run backup:db` (see below), or Atlas's built-in continuous backups if you're on a paid tier |
| Media (avatars, story images, story videos, resumes, product photos, chat attachments...) | Cloudinary | Not duplicated by this app — Cloudinary is itself off-server, versioned, and redundant. Treat it as the durable store; there is no separate media backup job here, deliberately, to avoid paying to re-store data that's already safely stored |
| Environment secrets (`.env`) | Wherever you deploy | Keep in your host's secret manager (Render env vars, Vercel env vars) and a password manager — never in git |
| Logs (`server/logs/*.log`) | Local disk on the server instance | Ephemeral by design on most PaaS hosts (Render wipes local disk on redeploy) — if you need durable logs, ship them to a log aggregator (see "Future scope" below) rather than relying on local files in production |

## Database backup: `npm run backup:db`

```bash
cd server
npm run backup:db
```

This runs `scripts/backupDatabase.js`, which:

1. Requires `mongodump` (part of the MongoDB Database Tools) to be installed and on
   `PATH`. This script orchestrates it; it doesn't reimplement dump logic.
2. Writes a compressed archive to `server/backups/prernanode-<timestamp>.gz`.
3. Automatically prunes backups beyond the most recent 14.

### Restoring

```bash
mongorestore --uri "<MONGO_URI>" --archive=server/backups/prernanode-<timestamp>.gz --gzip
```

**Test this restore process before you need it.** An untested backup is a hope, not a
plan — run a restore against a scratch database at least once after setting this up.

### Scheduling

This script is not self-scheduling. In production, run it via:

- A Render Cron Job (if your plan supports it) calling `npm run backup:db`, or
- A GitHub Action on a `schedule` trigger that SSHes in or hits a protected endpoint, or
- MongoDB Atlas's built-in automated backups (paid tiers) — the simplest option if
  you're already on Atlas, since it needs no scheduling infrastructure of your own.

## Startup health check

Before deploying (or as a container/orchestrator health probe), run:

```bash
npm run health-check
```

This validates every required environment variable is present and that MongoDB is
actually reachable — catching a broken deploy before it serves traffic, rather than
after. See `scripts/healthCheck.js`.

## Future scope

- Ship `server/logs/` to a real log aggregator (e.g. Datadog, Better Stack, or even
  just S3) instead of local disk, for durability across redeploys.
- Automate the backup schedule itself (currently manual/cron-triggered, not built into
  the app process).
- Point-in-time recovery — Atlas offers this on paid tiers; `mongodump` snapshots do not.
