# PrernaNode — Part 4: Communities, Real-Time Chat, AI, Opportunities, Events & Collaboration

Extends the existing PrernaNode codebase (auth/profiles, social network, skills/
marketplace/business layer) with communities, Socket.io-powered real-time chat, a real
AI assistant, an opportunities hub, events, and a collaboration hub.

**Nothing in Parts 1–3 was rewritten.** Every file below is new, except the small,
required integration touches listed at the bottom — the same discipline as Parts 2 and 3.

## The one structural change: Socket.io needs an HTTP server

Express apps normally run on `app.listen()`. Real-time features need a raw HTTP server
that both Express *and* Socket.io can attach to. `server.js` now does:

```js
const httpServer = http.createServer(app);
initSocket(httpServer);
httpServer.listen(PORT, ...);
```

This is the one place Part 4 couldn't avoid touching a Part 1 file — every other line in
`server.js` is unchanged, and every existing REST route behaves exactly as before.

## New MongoDB collections

`Community`, `CommunityMember`, `CommunityPost`, `CommunityPostComment`, `Chat`,
`ChatMessage`, `Opportunity`, `Event`, `Collaboration`, `AIHistory`.

Note: the spec listed `CommunityMessage` as a separate collection — it's folded into
`ChatMessage` instead (a community chat is just a `Chat` document with `community` set),
avoiding a second, near-identical message schema and matching the "never create
duplicate implementations" instruction.

## New backend modules

```
server/
  models/       Community, CommunityMember, CommunityPost, CommunityPostComment,
                Chat, ChatMessage, Opportunity, Event, Collaboration, AIHistory
  controllers/  communityController, communityPostController, chatController,
                aiController, opportunityController, eventController,
                collaborationController, advancedSearchController
  routes/       communityRoutes, communityPostRoutes, chatRoutes, aiRoutes,
                opportunityRoutes, eventRoutes, collaborationRoutes, advancedSearchRoutes
  socket/       index.js (Socket.io server, JWT-authenticated handshake, chat events),
                socketBus.js (presence tracking + cross-module emit helper)
  services/     chatService.js (shared send-message logic for both socket and REST),
                aiService.js (real Anthropic API client)
  middleware/   communityUpload.js (Cloudinary: banners, logos, post media, event
                galleries, chat attachments — images/video/documents/voice notes)
```

## New frontend modules

```
client/src/
  services/    communities.js, chat.js, ai.js, opportunities.js, events.js,
               collaborations.js, advancedSearch.js, socket.js
  pages/       Communities, CommunityDetails, CreateCommunity, Messages, ChatWindow,
               Events, EventDetails, CreateEvent, Opportunities, OpportunityDetails,
               CreateOpportunity, CollaborationHub, CollaborationDetails,
               CreateCollaboration, AIAssistant
```

`CreateEvent`, `CreateOpportunity`, `CreateCollaboration`, and `CollaborationDetails`
weren't explicitly named in the page list but are the forms/detail view needed for
"users can create X" to actually work end to end.

## Real-time chat — how it actually works

- `services/socket.js` on the client holds one shared, authenticated Socket.io
  connection (JWT passed via `auth: { token }`, same access token Axios uses).
  `AuthContext` connects it on login/session-restore and disconnects it on logout —
  the only other required integration touch outside `server.js`.
- The server authenticates every socket in middleware (`socket/index.js`) before any
  event handler runs; an invalid/missing token is rejected at the handshake, not per-event.
- One-to-one, group, and community chat all share the same `Chat`/`ChatMessage`
  collections — a community chat is auto-created when the community is created, and
  members are added/removed from it as they join/leave.
- Presence (`socketBus.js`) is tracked in memory (`Map<userId, Set<socketId>>`) —
  correct for a single Node process; if this app ever runs multiple server instances,
  presence would need to move to Redis (flagging this now rather than pretending a
  single-process in-memory map scales horizontally).
- Typing indicators, seen receipts, delete-for-me/everyone, pin, and star are all real
  socket events / REST toggles, not UI-only state — they write to the database.
- **Attachments (images/documents/voice notes) go through the REST endpoint, not the
  socket**, because Cloudinary uploads need multipart form data, which Socket.io isn't
  built for. The chat UI transparently falls back to REST when a file is attached and
  uses the live socket for everything else — one send button, no visible seam.

## AI features — real integration, not simulated output

- **Career Assistant** (15 features: resume suggestions, career roadmap, interview
  prep, etc.) and **Story Assistant** (7 features: title suggestions, grammar,
  hashtags, etc.) call a real LLM — the Anthropic Messages API — using the user's
  actual profile/story data pulled from MongoDB. **This requires `ANTHROPIC_API_KEY`
  in `server/.env`.** Without it, those two endpoint groups return a clear `503` with
  an explanatory message — never fabricated text pretending to be a model's output.
  This felt like the only honest option: the brief explicitly forbids mock APIs and
  fake data, and a hardcoded "AI-sounding" response generator would be exactly that.
- **AI Mentor Matching** and **AI Business Recommendations** are deliberately *not*
  LLM calls — they're real scoring/aggregation algorithms over live `Skill`/`Follow`/
  `Product`/`Business`/`Collaboration` data (skill overlap, shared language, location,
  rating, aggregated category trends). This is a better fit for a structured ranking
  problem than a generative model, and it works with zero configuration — no API key
  needed, no per-request cost, instant response.
- Every AI call — LLM or algorithmic — is rate-limited (30/hour on the LLM endpoints)
  and, for the LLM ones, logged to `AIHistory` with the real input/output pair.

## API reference (new, abbreviated — see route files for full parameter lists)

| Area | Base route | Notes |
|---|---|---|
| Communities | `/api/communities` | CRUD, join/leave, join-request approval, moderators, analytics, `/​:id/chat` |
| Community posts | `/api/community-posts` | Posts/polls/questions, pin, vote, like, comment, report |
| Chat | `/api/chats` | List/create chats, message history, REST-fallback send, pin/star/search |
| AI | `/api/ai` | `career/:feature`, `story/:feature`, `mentor-match`, `business-recommendations`, `history`, `status` |
| Opportunities | `/api/opportunities` | CRUD, bookmark, share, filter by type/mode/location |
| Events | `/api/events` | CRUD, RSVP going/interested, feedback |
| Collaborations | `/api/collaborations` | CRUD, apply, accept/reject, close |
| Advanced search | `/api/advanced-search` | Communities/events/opportunities/collaborations/your own chat messages |

Socket events (client ↔ server): `chat:join`, `chat:leave`, `chat:message`,
`chat:typing`, `chat:seen`, `chat:delete`, `chat:message-deleted`, `chat:notification`,
`notification:new`, `presence:online`.

## Known integration notes

1. **`Notification`'s type enum and `refModel` enum were extended again** (13 new
   types: `chat_message`, `community_invite`, `event_rsvp`, etc.) — additive only, same
   pattern as Part 3. `notificationService.notify()` now also emits over the socket bus
   in real time in addition to persisting to MongoDB; this is backward compatible —
   every existing call site from Parts 2–3 works unchanged and now gets live delivery
   for free.
2. **`Like`'s `targetType` enum was extended** with `community_post`/`community_comment`
   so community post likes reuse the existing generic Like collection instead of a new
   one. **`Bookmark`'s `resourceType` enum was extended** with `collaboration`/`event` for
   the same reason — `opportunity` and `community` were already there from Part 1's
   forward-looking design.
3. **The navbar now has 13 links** at full width (Home, Feed, Mentors, Marketplace,
   Businesses, Communities, Events, Opportunities, Collaborate, Messages, AI Assistant,
   Trending, Search) plus landing anchors for logged-out visitors. Per "do not redesign
   the UI," I kept the same flat link-list pattern rather than introducing a dropdown —
   but flagging honestly that this will visually crowd on narrower desktop widths, and a
   grouped "More" menu would be the natural next design pass.
4. **Presence tracking is in-memory, single-process** (see Real-time chat section above)
   — fine for one server instance, not multi-instance-safe without adding Redis pub/sub.
5. **Advanced search is a new, separate endpoint** (`/api/advanced-search`) rather than
   extending Part 2's `/api/search`, per "don't modify completed features unless
   integration absolutely requires it." A future pass could merge them, but that would
   mean editing Part 2's `searchController.js`.

## Setup

```bash
cd server
# add to your existing .env:
#   ANTHROPIC_API_KEY=sk-ant-...      (required for the two AI-generation endpoint groups)
#   ANTHROPIC_MODEL=claude-sonnet-4-6  (optional, this is the default)
npm install     # picks up the new socket.io dependency
npm run dev

cd ../client
npm install     # picks up the new socket.io-client dependency
npm run dev
```

As with every previous part, this sandbox has no network access, so nothing could be
installed or booted here. Every new server file passed `node --check`; every new client
file passed a bracket-balance sweep; and this pass additionally grepped the entire
client tree for stray `require()` calls (a real bug I introduced and caught mid-build —
`require()` doesn't exist in a Vite/browser bundle, so it's called out here rather than
left for you to discover at runtime).
