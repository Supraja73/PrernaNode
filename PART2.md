# PrernaNode — Part 2: Social Network

Extends the existing PrernaNode codebase (auth, profiles, landing page) with a
LinkedIn+Instagram-style social layer: stories, feed, comments, likes, saves, shares,
follow system, discovery, search, hashtags, trending, and notifications.

**Nothing in Part 1 was rewritten.** Every file below is new, except for four small,
additive integration touches called out at the bottom.

## New MongoDB collections

`Story`, `Comment`, `Like` (generic: stories + comments), `Follow`, `Notification`,
`Hashtag`, `Category`. `Bookmark` (from Part 1) is reused for "Save" — no new save
model was needed.

## New backend modules

```
server/
  models/       Story.js, Comment.js, Like.js, Follow.js, Notification.js, Hashtag.js, Category.js
  controllers/  storyController.js, commentController.js, likeController.js,
                followController.js, notificationController.js, hashtagController.js,
                searchController.js, discoveryController.js
  routes/       storyRoutes.js, commentRoutes.js, followRoutes.js, notificationRoutes.js,
                hashtagRoutes.js, searchRoutes.js, discoveryRoutes.js
  middleware/   storyUpload.js (Cloudinary, images[] + video in one multipart request)
  validators/   storyValidators.js, commentValidators.js
  services/     notificationService.js, hashtagService.js
  utils/        parseText.js (extracts #hashtags and @mentions from free text)
  scripts/      seedCategories.js (loads the real 11-category taxonomy — run manually,
                not auto-executed, and not fake content: these are the categories the
                spec itself defines)
```

## New frontend modules

```
client/src/
  hooks/        useInfiniteFeed.js — IntersectionObserver + React Query useInfiniteQuery
  components/   StoryCard, ImageCarousel, CommentThread, FollowButton, HashtagChip,
                NotificationBell
  services/     stories.js, social.js
  pages/        Feed, StoryDetails, CreateStory, EditStory, SavedStories, Trending,
                HashtagPage, SearchResults, Followers, Following, Notifications,
                UserProfile (new public profile at /u/:username)
```

## API reference (new)

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/stories/categories` | Public | The 11 story categories |
| GET | `/api/stories/feed?sort=&category=&page=&limit=` | Public/Private* | `newest`, `trending`, `most-liked`, `following`*, `recommended`* |
| GET | `/api/stories/search?q=` | Public | Full-text story search |
| GET | `/api/stories/saved` | Private | Your saved stories |
| GET | `/api/stories/user/:userId` | Public | A user's published stories (or drafts, if it's you) |
| POST | `/api/stories` | Private | Create (multipart: title, description, category, hashtags, images[], video) |
| GET | `/api/stories/:id` | Public | Story detail (increments view count) |
| PATCH | `/api/stories/:id` | Private (owner) | Edit story / publish a draft |
| PATCH | `/api/stories/:id/archive` | Private (owner) | Archive |
| PATCH | `/api/stories/:id/pin` | Private (owner) | Pin/unpin (max 3) |
| DELETE | `/api/stories/:id` | Private (owner) | Delete, cleans up Cloudinary + comments/likes/saves |
| POST/DELETE | `/api/stories/:id/like` | Private | Like / unlike |
| GET | `/api/stories/:id/likes` | Public | Who liked it |
| POST/DELETE | `/api/stories/:id/save` | Private | Save / unsave |
| POST | `/api/stories/:id/share` | Private | Increments share count, returns a link |
| POST | `/api/stories/:storyId/comments` | Private | Add comment or reply (`parent` for nesting) |
| GET | `/api/stories/:storyId/comments` | Public | Top-level comments, paginated |
| GET | `/api/comments/:id/replies` | Public | Replies to a comment |
| PATCH/DELETE | `/api/comments/:id` | Private (author) | Edit / soft-delete |
| POST/DELETE | `/api/comments/:id/like` | Private | Like / unlike a comment |
| POST/DELETE | `/api/follow/:userId` | Private | Follow / unfollow |
| GET | `/api/follow/:userId/followers` \| `/following` | Public | Paginated lists |
| GET | `/api/follow/:userId/mutual` | Private | Mutual followers |
| GET | `/api/follow/suggestions` | Private | Popular creators you don't follow yet |
| GET | `/api/follow/new-members` | Public | Newest verified members |
| GET | `/api/discovery/popular-creators` \| `/trending-mentors` | Public | Aggregated from real like/follow counts |
| GET | `/api/hashtags/trending` | Public | By usage count |
| GET | `/api/hashtags/:tag` | Public | Stories under a hashtag, paginated |
| GET | `/api/search?q=&type=` | Public | `all\|users\|stories\|hashtags\|skills` |
| GET | `/api/notifications` | Private | Paginated |
| GET | `/api/notifications/unread-count` | Private | For the navbar badge |
| PATCH | `/api/notifications/:id/read` \| `/read-all` | Private | Mark read |
| GET | `/api/users/u/:username` | Public | New enriched public profile (pinned/recent stories, real follow counts) |

\* `following` and `recommended` sorts require auth.

## Design decisions worth knowing about

- **Trending** is a real aggregation (`$addFields` scoring by likes/comments/shares/saves,
  weighted, over the last 14 days) — not a hardcoded list.
- **Recommended** looks at the categories behind your last 50 likes/saves and ranks
  stories in those categories; falls back to most-liked overall for new users with no
  interaction history yet. Real logic, no fabricated "for you" data.
- **Infinite scroll** uses `IntersectionObserver` + cursor-style page fetching via React
  Query, not a virtualization library (`react-window`, etc.) — appropriate for feed-sized
  pages; swap in virtualization later if a feed page realistically grows into the
  thousands of DOM nodes.
- **"Real-time" badge updates** are implemented as polling (`refetchInterval: 20000` on
  the unread-count query), not WebSockets. True push notifications need Socket.io (or
  similar) wired server-side, which is a good candidate for a dedicated future part —
  said explicitly rather than pretending polling is push.
- **Spam prevention**: story/comment creation is rate-limited (30 per 15 min) in addition
  to the global API limiter from Part 1.

## Known integration debt (please read before wiring more features on top)

1. **Two follow systems now exist.** Part 1's `User.followers`/`User.following` embedded
   arrays (via `POST /api/users/:id/follow`) still work and were **not removed**, per the
   "never delete existing functionality" instruction. Part 2 introduces a normalized
   `Follow` collection (`/api/follow/*`) that the new frontend actually uses, because it's
   what the spec's mutuals/suggestions/trending-mentors features need. **These two systems
   do not sync with each other.** The existing `/profile` page (Part 1) still shows counts
   from the old embedded arrays; the new `/u/:username` page shows real counts from the
   `Follow` collection. Recommend migrating Part 1's profile page to read from `Follow` in
   a future pass and formally deprecating the embedded-array endpoints — flagging rather
   than silently doing that migration myself, since it touches Part 1 code.
2. **Activity timeline** (from the "Profile Improvements" list) is represented as "recent
   stories" only — a full activity feed (likes, comments, follows as timeline events) was
   scoped out to keep this deliverable honest about what's real vs. padded.
3. Video upload has no separate compression/transcoding step beyond what Cloudinary's
   `resource_type: video` does by default — fine for typical short clips, not tuned for
   large uploads.

## Setup

No new environment variables or dependencies were required — Part 2 reuses the Cloudinary,
MongoDB, and JWT configuration already in `server/.env`. If you want the real category
taxonomy in the `Category` collection (optional — `Story.category` is enum-validated
either way and works without it):

```bash
cd server
npm run seed:categories
```

Everything else runs the same way as Part 1 (`npm run dev` in both `server/` and
`client/`). As before, this sandbox has no network access, so dependencies could not be
installed or the app booted here — every new file was verified with `node --check`
(server) and a bracket-balance sweep (client JSX), same rigor as Part 1.
