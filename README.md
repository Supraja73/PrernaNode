# PrernaNode

**Connect. Inspire. Rise.**

An AI-powered networking and growth platform for women — mentorship, a maker
marketplace, professional communities, real-time chat, an opportunities hub, events,
and career-focused AI tools, all in one application.

This README is the top-level guide to the whole system. Detailed, per-phase build logs
live in [`PART2.md`](./PART2.md), [`PART3.md`](./PART3.md), [`PART4.md`](./PART4.md),
and [`PART5.md`](./PART5.md) — each documents exactly what was added, why specific
design tradeoffs were made, and any integration notes worth knowing before extending
that area further. The full API surface is indexed in [`API_DOCS.md`](./API_DOCS.md).

---

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [Feature list](#feature-list)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Running locally](#running-locally)
- [Testing](#testing)
- [Production deployment](#production-deployment)
- [API documentation](#api-documentation)
- [Security](#security)
- [Future scope](#future-scope)
- [Contributors guide](#contributors-guide)
- [License](#license)

---

## Overview

PrernaNode was built in five phases, each additive on top of the last:

| Phase | What it added |
|---|---|
| **Part 1** | Auth (JWT access + rotating refresh tokens), user profiles, device sessions, bookmarks, the landing page |
| **Part 2** | Social network: stories, feed (5 sort modes), nested comments, likes, follows, hashtags, notifications |
| **Part 3** | Skill sharing/mentorship requests, entrepreneur business profiles, marketplace with inquiries (no payments), polymorphic reviews, saved collections, role dashboards |
| **Part 4** | Communities (with posts/polls), Socket.io real-time chat, a real LLM-backed AI assistant + algorithmic mentor/business matching, opportunities hub, events, collaboration hub |
| **Part 5** | Admin panel, content moderation, formal report system, platform analytics, system settings, security/logging hardening, testing, deployment configuration |

Every phase was built with the same constraint: **no mock data, no fake APIs, no
placeholder components.** Where a feature genuinely needs external configuration to
work (the AI assistant needs an Anthropic API key; email needs SMTP credentials), the
code fails with a clear, honest error rather than faking a response.

## Architecture

```
┌─────────────┐      HTTPS/REST       ┌──────────────┐
│   React 18  │ ──────────────────────▶│   Express    │
│   (Vite)    │◀────────────────────── │   API        │
└─────────────┘                        └──────┬───────┘
      │                                        │
      │ WebSocket (Socket.io)                  │ Mongoose
      ▼                                        ▼
┌─────────────┐                        ┌──────────────┐
│  Socket.io  │                        │   MongoDB    │
│  server     │                        │              │
└─────────────┘                        └──────────────┘
                                               │
                          ┌────────────────────┼─────────────────────┐
                          ▼                    ▼                     ▼
                    ┌──────────┐        ┌────────────┐       ┌─────────────┐
                    │Cloudinary│        │  Anthropic  │       │   SMTP      │
                    │ (media)  │        │  (AI text)  │       │  (email)    │
                    └──────────┘        └────────────┘       └─────────────┘
```

- **Client**: React 18 + Vite, Tailwind CSS (class-based dark mode), React Router,
  TanStack React Query, Framer Motion, Three.js (hero scene), Socket.io-client,
  react-hook-form, react-helmet-async.
- **Server**: Node.js + Express on a raw `http.Server` (required for Socket.io),
  MongoDB/Mongoose, JWT auth, Cloudinary for all media, Nodemailer for email, the
  Anthropic Messages API for generative AI features.
- **Real-time**: one Socket.io server handles 1:1 chat, group chat, and community chat
  through a single `Chat`/`ChatMessage` schema pair; presence and typing indicators are
  live socket events, not polling.

## Folder structure

```
prernanode/
├── README.md                 # this file
├── PART2.md … PART5.md       # detailed per-phase build logs
├── API_DOCS.md                # full endpoint reference
├── DEPLOYMENT.md              # deployment checklist
├── BACKUP.md                  # backup & disaster recovery strategy
│
├── server/
│   ├── config/                # db.js, cloudinary.js
│   ├── models/                # ~30 Mongoose models across all 5 phases
│   ├── controllers/           # business logic, one file per resource
│   ├── routes/                # Express routers, one file per resource
│   ├── middleware/             # auth, uploads, rate limiting, activity logging, maintenance mode
│   ├── services/               # shared logic: chat, notifications, ratings, hashtags, AI, audit
│   ├── socket/                 # Socket.io server + presence/event bus
│   ├── validators/             # express-validator rule sets
│   ├── utils/                  # token generation, email, text parsing, logger
│   ├── scripts/                 # seedCategories, backupDatabase, healthCheck
│   ├── tests/                   # Jest + Supertest backend tests
│   └── server.js                # app assembly + HTTP/Socket.io bootstrap
│
└── client/
    ├── public/                  # robots.txt, sitemap.xml
    ├── scripts/                  # generateSitemap.js
    └── src/
        ├── components/           # shared UI: Navbar, Footer, cards, AdminLayout, SEO, ErrorBoundary...
        ├── context/               # AuthContext, ThemeContext
        ├── services/               # one file per API resource (axios wrappers)
        ├── hooks/                   # useInfiniteFeed
        ├── pages/                   # one file per route, pages/admin/ for the admin panel
        └── tests/                   # Vitest + Testing Library frontend tests
```

## Feature list

**Identity & profile** — registration, email verification, login with "remember me",
forgot/reset password, device session management, role-based access (member / mentor /
seller / moderator / admin), profile completion tracking, verification badges.

**Social** — stories with drafts/publishing/archiving, a 5-mode feed (newest, trending,
most-liked, following, recommended), nested comments with mentions, likes, saves,
shares, hashtags, follows, discovery/search.

**Mentorship & marketplace** — mentor skill listings with full booking lifecycle
(request → accept/reject/reschedule → complete/cancel), a maker marketplace with
inquiry-based negotiation instead of checkout, entrepreneur business profiles,
polymorphic reviews with helpful-votes, named saved collections.

**Community & real-time** — communities with roles/join-requests/pinned posts/polls,
one-to-one/group/community chat over Socket.io with typing indicators, read receipts,
attachments, replies, pin/star, and delete-for-me/everyone.

**AI** — a career assistant and story assistant backed by a real LLM call (Anthropic),
plus mentor-matching and business-recommendation engines that are real scoring
algorithms over live data (no LLM cost, no configuration required).

**Discovery** — opportunities hub (jobs/internships/scholarships/hackathons/grants...),
events with RSVP and feedback, a collaboration hub for team formation, advanced search.

**Admin & trust/safety** — a full admin panel (system overview, growth analytics, top
performers, engagement metrics), user management (suspend/ban/warn/moderator
assignment/verification review), content moderation across every content type, a
formal report queue, platform-wide settings with a maintenance-mode kill switch.

## Installation

Requires Node.js 18+, a MongoDB instance (local or Atlas), and a Cloudinary account.
SMTP credentials and an Anthropic API key are optional but unlock email delivery and
the AI assistant respectively.

```bash
git clone <this-repo>
cd prernanode

cd server && npm install
cd ../client && npm install
```

## Environment variables

Copy `server/.env.example` to `server/.env` and fill in:

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB connection string |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | ✅ | Token signing — use long, random values |
| `CLIENT_URL` | ✅ | Used for CORS and links in emails |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | Recommended | All image/video/document uploads |
| `SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM` | Recommended | Verification, reset, and notification emails |
| `ANTHROPIC_API_KEY` | Optional | Powers the AI Career/Story Assistant — without it those two endpoint groups return a clear 503 |
| `ANTHROPIC_MODEL` | Optional | Defaults to `claude-sonnet-4-6` |

Copy `client/.env.example` to `client/.env` and set `VITE_API_URL` (defaults to
`http://localhost:5000/api`).

## Running locally

```bash
# Terminal 1
cd server
npm run health-check   # validates env vars + DB connectivity before you start
npm run dev             # http://localhost:5000, Express + Socket.io

# Terminal 2
cd client
npm run dev              # http://localhost:5173
```

To promote your first user to admin (there's no UI for this — intentionally, the very
first admin has to be granted directly):

```js
// in a mongo shell or Compass, against your database:
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## Testing

```bash
cd server && npm test    # Jest + Supertest — auth, authorization, validation
cd client && npm test    # Vitest + Testing Library — component tests
```

Backend tests spin up an in-memory MongoDB (`mongodb-memory-server`) and exercise the
real route/controller/model code — not a separate mock implementation. See
`server/tests/` for what's covered today (auth flow, role-based authorization,
suspension enforcement, input validation) and add to it as new critical paths emerge.

## Production deployment

Full checklist in [`DEPLOYMENT.md`](./DEPLOYMENT.md). Summary:

- **Client** → Vercel (`client/vercel.json` included; build command `npm run build`,
  output `dist/`)
- **Server** → Render (`server/render.yaml` included; Node web service, health check at
  `/api/health`)
- **Database** → MongoDB Atlas
- **Media** → Cloudinary (already used in every environment, not just production)

## API documentation

The full endpoint reference — every route, method, auth requirement, and what it does
— is in [`API_DOCS.md`](./API_DOCS.md), organized by the same phases as this README.

## Security

Helmet, gzip compression, rate limiting (global + endpoint-specific, e.g. tighter on
auth/AI/report creation), `express-mongo-sanitize`, `xss-clean`, bcrypt password
hashing, short-lived access tokens with rotating httpOnly refresh tokens, per-session
revocation, structured request/error/login/admin-action logging, suspension/ban
enforcement in the auth middleware itself, and a maintenance-mode kill switch. Full
rationale and what's intentionally out of scope (e.g. why there's no full CSRF token
system on top of `sameSite=strict` cookies) is in [`PART5.md`](./PART5.md#security).

## Future scope

- Merge the two follow systems from Parts 1/2 (flagged, not fixed, in `PART2.md`)
- Move Socket.io presence tracking to Redis for multi-instance deployments
- Extend Part 2's global search to cover Part 3/4 resources (skills, businesses,
  communities, events) in one query
- Real email delivery wiring for the templates built in Part 5 beyond the weekly digest
- Full OpenAPI/Swagger spec generated from the route definitions

## Contributors guide

1. Read the relevant `PART*.md` before touching a module — several design decisions
   (which fields mean what, why two systems exist in parallel in one or two places)
   are explained there and aren't obvious from the code alone.
2. Follow the additive pattern this project was built with: prefer new files and
   reused existing fields over modifying a working module, unless the change is a
   genuinely required integration point (documented under "Known integration notes" in
   each part's `.md`).
3. Run `npm run health-check` in `server/` before opening a PR that touches
   environment/config.
4. New API routes should get a validator (see `server/validators/`), a rate limiter if
   they're a creation endpoint, and an entry in `API_DOCS.md`.

## License

Proprietary — all rights reserved. (Replace with your chosen license before any public
release.)
