# PrernaNode API Documentation

Base URL: `http://localhost:5000/api` (development) or your deployed server URL.

## Conventions

- **Auth**: `Private` routes require `Authorization: Bearer <accessToken>`. `Public`
  routes work without a token; several accept one anyway (via `optionalAuth`) to
  personalize the response (e.g. `isLiked` flags) without requiring login.
- **Responses**: every endpoint returns `{ success: boolean, data?, message?,
  pagination? }`. Paginated list endpoints return `pagination: { page, limit, total,
  pages }`.
- **Errors**: non-2xx responses return `{ success: false, message }`. Validation
  errors (400) additionally include an `errors` array from `express-validator`.
- **Rate limits**: the global API limiter is 300 requests/15min per IP. Sensitive or
  expensive endpoints (auth, story/comment creation, AI calls, report filing) have
  tighter, endpoint-specific limits noted below.

---

## Part 1 — Auth, Profiles, Sessions, Bookmarks

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | name, username, email, password |
| GET | `/auth/verify-email/:token` | Public | |
| POST | `/auth/resend-verification` | Public | |
| POST | `/auth/login` | Public | `{ email, password, rememberMe }` |
| POST | `/auth/refresh` | Public (cookie) | Rotates the refresh token |
| POST | `/auth/logout` | Public | |
| GET | `/auth/sessions` | Private | List active device sessions |
| DELETE | `/auth/sessions/:id` | Private | Revoke a session |
| POST | `/auth/forgot-password` | Public | |
| POST | `/auth/reset-password/:token` | Public | Revokes all sessions |
| GET | `/auth/me` | Private | |
| GET | `/users?search=` | Public | Paginated user search |
| GET | `/users/:id` | Public | |
| GET | `/users/u/:username` | Public | Enriched profile: pinned/recent stories, real follow counts |
| PATCH | `/users/me` | Private | |
| POST | `/users/me/avatar` \| `/cover` | Private | multipart |
| GET/POST/DELETE | `/bookmarks` | Private | Generic bookmark (story/product/mentor/opportunity/collaboration/event...) |

## Part 2 — Social Network

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/stories/feed?sort=` | Public/Private | `newest\|trending\|most-liked\|following\|recommended` |
| POST | `/stories` | Private | multipart: title, description, category, hashtags, images[], video |
| GET/PATCH/DELETE | `/stories/:id` | Public/Owner | |
| PATCH | `/stories/:id/archive\|pin` | Private (owner) | |
| POST/DELETE | `/stories/:id/like\|save` | Private | |
| POST | `/stories/:id/share` | Private | |
| POST/GET | `/stories/:storyId/comments` | Private/Public | |
| GET/PATCH/DELETE | `/comments/:id` | — | edit/delete own comment |
| POST/DELETE | `/comments/:id/like` | Private | |
| POST/DELETE | `/follow/:userId` | Private | |
| GET | `/follow/:userId/followers\|following\|mutual` | — | |
| GET | `/follow/suggestions\|new-members` | — | |
| GET | `/hashtags/trending` \| `/hashtags/:tag` | Public | |
| GET | `/search?q=&type=` | Public | users/stories/hashtags/skills |
| GET | `/notifications` \| `/unread-count` | Private | |
| PATCH | `/notifications/:id/read` \| `/read-all` | Private | |

## Part 3 — Skills, Mentorship, Marketplace, Business Directory

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/skills?skillName=&category=&sort=` | Public | Full discovery filter set |
| POST | `/skills` | Private | Become a mentor (resume/portfolio/certificates/demo media) |
| POST | `/mentor-requests` | Private | Send a mentorship request |
| GET | `/mentor-requests?role=student\|mentor&status=` | Private | |
| PATCH | `/mentor-requests/:id/accept\|reject\|suggest-time\|complete\|cancel` | Private | |
| GET | `/businesses?category=&q=` | Public | Directory |
| POST/PATCH/DELETE | `/businesses/:id` | Private | |
| POST/DELETE | `/businesses/:id/follow` | Private | |
| GET | `/products?category=&q=` | Public | Marketplace |
| POST/PATCH/DELETE | `/products/:id` | Private | |
| PATCH | `/products/:id/hide\|sold` | Private (owner) | |
| POST | `/products/:productId/inquiries` | Private | Contact seller |
| GET | `/inquiries?role=buyer\|seller` | Private | |
| POST/PATCH | `/inquiries/:id/reply\|accept\|reject\|reserve\|cancel` | Private | |
| POST | `/reviews` | Private | targetType: skill/business/product, one per user per target |
| GET | `/reviews?targetType=&targetId=` | Public | |
| POST | `/reviews/:id/helpful\|report` | Private | |
| GET/POST | `/collections` | Private | Named saved collections |
| POST | `/collections/save` | Private | |
| GET | `/dashboard/mentor\|business\|marketplace` | Private | Real aggregated stats |

## Part 4 — Communities, Real-Time Chat, AI, Opportunities, Events, Collaboration

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/communities?category=&q=` | Public | |
| POST/PATCH/DELETE | `/communities/:id` | Private | |
| POST/DELETE | `/communities/:id/join` | Private | Instant for public, pending for private/invite-only |
| GET/PATCH | `/communities/:id/requests` | Private (owner/mod) | |
| GET | `/communities/:id/chat` | Private (member) | Get/create the community's group chat |
| GET/POST | `/community-posts/:communityId` | — | Feed, posts/polls/questions |
| POST | `/community-posts/post/:id/vote\|like\|comments\|report\|share` | Private | |
| GET | `/chats` | Private | Your chat list with unread counts + presence |
| POST | `/chats/direct/:userId` \| `/chats/group` | Private | |
| GET/POST | `/chats/:id/messages` | Private | REST history + fallback send |
| PATCH | `/chats/messages/:id/pin\|star` | Private | |
| **Socket.io events** | `chat:join/leave/message/typing/seen/delete`, `notification:new`, `presence:online` | — | See `PART4.md` |
| POST | `/ai/career/:feature` | Private | 15 features, real Anthropic API call, needs `ANTHROPIC_API_KEY` |
| POST | `/ai/story/:feature` | Private | 7 features, same requirement |
| GET | `/ai/mentor-match` \| `/ai/business-recommendations` | Private | Real algorithms, no API key needed |
| GET | `/opportunities?type=&mode=` | Public | |
| POST | `/opportunities` | Private | |
| POST/DELETE | `/opportunities/:id/bookmark` | Private | |
| GET | `/events?upcoming=true` | Public | |
| POST | `/events` | Private | |
| POST | `/events/:id/rsvp\|feedback` | Private | |
| GET | `/collaborations?type=&status=` | Public | |
| POST | `/collaborations` | Private | |
| POST/PATCH | `/collaborations/:id/apply\|applicants/:userId\|close` | Private | |
| GET | `/advanced-search?q=&type=` | Public/Private | communities/events/opportunities/collaborations/your chats |

## Part 5 — Admin Panel, Moderation, Reports, Settings

All `/admin/*` routes require `Authorization` + role `admin` (some allow `moderator` —
see table). Reports and verification requests are user-facing (any authenticated user).

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/admin/dashboard/overview\|growth\|health\|recent-activity` | admin | Real counts/aggregations, no placeholders |
| GET | `/admin/users?q=&role=&status=` | admin, moderator | |
| GET | `/admin/users/:id` | admin, moderator | |
| PATCH | `/admin/users/:id/suspend\|reactivate` | admin, moderator | |
| PATCH | `/admin/users/:id/ban\|unban` | admin only | |
| DELETE | `/admin/users/:id` | admin only | Hard delete |
| POST | `/admin/users/:id/warn` | admin, moderator | |
| PATCH | `/admin/users/:id/assign-moderator\|remove-moderator` | admin only | |
| GET/PATCH | `/admin/verification-requests` | admin, moderator | |
| PATCH | `/admin/moderation/:targetType/:id` | admin, moderator | `{ action: 'hide'\|'restore'\|'delete' }` — targetType ∈ story, comment, review, product, community, community_post, business, event, collaboration, message |
| DELETE | `/admin/moderation/ai-history/:id` | admin only | |
| GET | `/admin/moderation/flagged` | admin, moderator | Content with `reportsCount > 0` |
| GET | `/admin/reports?status=&targetType=` | admin, moderator | |
| PATCH | `/admin/reports/:id` | admin, moderator | `{ status, actionTaken, adminNote }` |
| GET | `/admin/analytics/top\|active-users\|engagement\|daily-activity` | admin only | |
| GET/PATCH | `/admin/settings` | admin only | Feature toggles, maintenance mode |
| POST | `/reports` | Private | File a report (any authenticated user) — 20/hour limit |
| GET | `/reports/mine` | Private | |
| POST | `/verification-requests` | Private | Request a verified badge |
| GET | `/verification-requests/mine` | Private | |
| GET | `/health` | Public | Basic liveness check |

### Validation rules reference

Every creation/update endpoint above that accepts a body is validated with
`express-validator` before reaching its controller — see the corresponding file in
`server/validators/` for the exact rules (min/max lengths, enum membership, required
fields). Validation failures return `400` with the first failing rule's message plus a
full `errors` array.

### Error codes

| Code | Meaning |
|---|---|
| 400 | Validation failure or malformed request |
| 401 | Missing/invalid/expired access token |
| 403 | Authenticated but not authorized (wrong role, not a resource owner, suspended/banned account, maintenance mode) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email/username, already liked/followed/applied) |
| 429 | Rate limit exceeded |
| 500 / 502 / 503 | Server error / upstream (AI provider) error / feature not configured |
