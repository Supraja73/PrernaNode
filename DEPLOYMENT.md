# PrernaNode — Deployment Guide

Target stack: **Vercel** (client) + **Render** (server) + **MongoDB Atlas** (database)
+ **Cloudinary** (media). This isn't the only valid combination — the app has no
hard dependency on any one host — but it's what's configured out of the box.

## 1. MongoDB Atlas

1. Create a free or paid cluster.
2. Create a database user with a strong, generated password (not your account password).
3. Network access: add `0.0.0.0/0` only if you must (e.g. Render's dynamic IPs on the
   free tier); otherwise restrict to your hosting provider's IP range/VPC peering.
4. Copy the connection string into `MONGO_URI`.
5. Run `npm run health-check` locally against the Atlas URI before deploying, to catch
   connection issues early.

## 2. Cloudinary

1. Create an account, grab Cloud Name / API Key / API Secret from the dashboard.
2. No bucket/folder setup needed — every upload path in this app creates its own
   folder structure automatically (`prernanode/stories/images`, `prernanode/part3/...`,
   etc.) on first use.

## 3. Server → Render

1. Push this repo to GitHub/GitLab.
2. In Render: New → Web Service → connect the repo, root directory `server/`.
3. Render will read `server/render.yaml` for the service definition — confirm build
   command `npm install`, start command `npm start`, health check path `/api/health`.
4. Fill in every environment variable listed in `render.yaml` (they're marked
   `sync: false` deliberately — secrets should never live in the yaml file itself).
5. Deploy. Confirm `GET https://<your-service>.onrender.com/api/health` returns
   `{ "success": true }`.
6. **Set `CLIENT_URL` to your eventual Vercel domain before going live** — CORS is
   locked to this single origin (see `server/server.js`), so a mismatch here will
   silently break every client request with a CORS error, not a helpful message.

## 4. Client → Vercel

1. New Project → import the repo, root directory `client/`.
2. Vercel will read `client/vercel.json` (build command, output dir, SPA rewrite rule
   so client-side routing works on refresh/direct links, and baseline security headers).
3. Set the environment variable `VITE_API_URL` to your Render URL + `/api`
   (e.g. `https://prernanode-api.onrender.com/api`).
4. Deploy. Confirm the landing page loads and `/api` calls succeed (check the Network
   tab — a CORS error here almost always means step 3.6 above wasn't done).

## 5. Post-deploy checklist

- [ ] `npm run health-check` passes against production env vars
- [ ] Register a test account end-to-end (email verification actually arrives — confirms SMTP)
- [ ] Upload an avatar (confirms Cloudinary)
- [ ] Promote your account to `admin` directly in Atlas (see main README) and confirm
      `/admin` loads and shows real data
- [ ] Set `AI_PROVIDER` + `AI_API_KEY` (or a legacy `ANTHROPIC_API_KEY`/`GEMINI_API_KEY`/
      `OPENAI_API_KEY`) if you want the AI Assistant live; otherwise confirm it fails
      with a clear 503, not a silent/fake response
- [ ] Socket.io: open two browser sessions, confirm a chat message sent in one appears
      live in the other without a refresh
- [ ] Confirm `robots.txt` and `sitemap.xml` are reachable at the client domain root
- [ ] Toggle `maintenanceMode` on via `/admin/settings`, confirm non-admin API calls
      return 503, then toggle it back off
- [ ] Set up a scheduled job (Render Cron Job, GitHub Action, etc.) to run
      `npm run backup:db` on a schedule — see `BACKUP.md`

## Alternative: Docker (self-hosted / Railway / any VM)

The Vercel+Render path above needs no Docker knowledge at all — use it if that's your
preference. If you'd rather run this as containers (self-hosted, Railway, a VPS,
Kubernetes, etc.), a full Docker Compose stack ships at the repo root as of Part 6:
`server/Dockerfile`, `client/Dockerfile` (multi-stage Vite build served by nginx,
`client/nginx.conf`), and `docker-compose.yml` wiring both together with a `mongo`
service.

```bash
cp server/.env.example server/.env   # fill in real secrets
# point MONGO_URI at the compose network's mongo service:
#   MONGO_URI=mongodb://mongo:27017/prernanode
docker compose up --build
```

- Server: `http://localhost:5000` (health check at `/api/health`, wired into the
  container's own `HEALTHCHECK` instruction).
- Client: `http://localhost:5173` (nginx on port 80 inside the container, mapped out).
- `VITE_API_URL` is a Vite **build-time** variable, so it's passed as a Docker build
  arg (`docker compose build --build-arg VITE_API_URL=https://your-api.example.com/api`
  or set it in your shell before `docker compose up --build`) — changing it after the
  image is built requires a rebuild, not a restart.
- Swap the `mongo` service for a managed instance (Atlas, Railway's Mongo add-on) by
  deleting that service and pointing `MONGO_URI` in `server/.env` at it instead; the
  `server`/`client` services don't change.
- The same `server/Dockerfile` is what Railway will use automatically if you point a
  Railway service at the `server/` directory (Railway detects and builds Dockerfiles
  natively) — `render.yaml` and this Dockerfile aren't mutually exclusive, they're
  just two different paths to the same running container.

## Environment-specific notes

- **CORS**: locked to a single `CLIENT_URL` origin by design (see `server/server.js`).
  If you need staging + production simultaneously, either deploy separate server
  instances per environment (recommended) or extend the CORS config to accept an array
  — that's a `server.js` change, so treat it deliberately rather than loosening it
  casually.
- **Cookies**: the refresh-token cookie is `secure: true` in production
  (`NODE_ENV=production`), which requires HTTPS — both Vercel and Render provide this
  by default, but if you self-host behind a plain HTTP reverse proxy, login will appear
  to "not persist" because the browser silently drops the cookie.
- **Socket.io + Render**: Render's free tier can idle/sleep a service with no traffic,
  which will drop open WebSocket connections. The client's `services/socket.js`
  reconnects automatically on the next `connectSocket()` call, but be aware sessions
  can visibly "go quiet" on the free tier under low traffic.
