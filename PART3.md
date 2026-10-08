# PrernaNode — Part 3: Skill Sharing, Mentorship, Marketplace & Business Directory

Extends the existing PrernaNode codebase (auth/profiles, social network) with the
non-payment economic layer: mentors, mentorship requests, entrepreneur/business
profiles, a product marketplace with inquiries instead of checkout, polymorphic
reviews, saved collections, and role-specific dashboards.

**Nothing in Part 1 or Part 2 was rewritten.** Every file below is new, except for the
small, additive integration touches called out at the bottom — same discipline as Part 2.

## New MongoDB collections

`Skill`, `MentorRequest`, `Business`, `Product`, `Inquiry`, `Review` (polymorphic —
covers mentors/businesses/products in one collection), `SavedCollection`.

## New backend modules

```
server/
  models/       Skill.js, MentorRequest.js, Business.js, Product.js, Inquiry.js,
                Review.js, SavedCollection.js
  controllers/  skillController, mentorRequestController, businessController,
                productController, inquiryController, reviewController,
                savedCollectionController, dashboardController
  routes/       skillRoutes, mentorRequestRoutes, businessRoutes, productRoutes,
                inquiryRoutes, reviewRoutes, collectionRoutes, dashboardRoutes
  middleware/   part3Upload.js (one Cloudinary storage, branches by fieldname across
                skill/business/product/review uploads — images, video, resume/portfolio
                as raw PDFs)
  services/     ratingService.js (recalculates averageRating/reviewsCount from real
                Review documents after every create/edit/delete/report-hide)
  validators/   part3Validators.js
```

## New frontend modules

```
client/src/
  components/  StarRating, SaveButton, ReviewsSection
  services/    skills.js, mentorRequests.js, business.js, products.js, inquiries.js,
               reviews.js, collections.js, dashboard.js
  pages/       Skills, SkillDetails, CreateSkill, MentorRequests, Marketplace,
               ProductDetails, CreateProduct, BusinessDirectory, BusinessProfile,
               CreateBusiness, SavedCollections, Inquiries, MentorDashboard,
               EntrepreneurDashboard
```

`CreateSkill`, `CreateProduct`, `CreateBusiness`, and `Inquiries` weren't in the page
list the brief gave, but they're the forms/inbox needed for "users can create a
listing" and "negotiate through chat" to actually work — without them the feature
would be read-only.

## API reference (new)

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/skills?skillName=&category=&experienceLevel=&minRating=&language=&teachingMode=&city=&country=&sort=` | Public | Discovery with every filter/sort in the spec |
| POST | `/api/skills` | Private | Become a mentor (multipart: resume, portfolio, certificates[], demoImages[], demoVideo) |
| GET/PATCH/DELETE | `/api/skills/:id` | Public/Owner | View (increments profile views) / edit / delete |
| GET | `/api/skills/mentor/:userId` | Public | A mentor's listings |
| POST | `/api/mentor-requests` | Private | Send a request (optional resume attach) |
| GET | `/api/mentor-requests?role=student\|mentor&status=` | Private | Upcoming/completed/cancelled/history, either side |
| PATCH | `/api/mentor-requests/:id/accept\|reject\|suggest-time\|complete\|cancel` | Private | Full lifecycle |
| GET | `/api/businesses?category=&city=&country=&q=` | Public | Directory browse/search/filter |
| POST/PATCH/DELETE | `/api/businesses/:id` | Private/Owner | Create/edit/delete (logo, cover, gallery) |
| POST/DELETE | `/api/businesses/:id/follow` | Private | Follow/unfollow a business page |
| GET | `/api/products?category=&q=&condition=&featured=` | Public | Marketplace browse |
| POST/PATCH/DELETE | `/api/products/:id` | Private/Owner | Create/edit/delete listing |
| PATCH | `/api/products/:id/hide\|sold` | Private/Owner | Hide/unhide, mark sold/available |
| POST | `/api/products/:id/report\|share` | Private | Report / share |
| POST | `/api/products/:productId/inquiries` | Private | Contact seller |
| GET | `/api/inquiries?role=buyer\|seller&status=` | Private | Your inquiry threads |
| POST/PATCH | `/api/inquiries/:id/reply\|accept\|reject\|reserve\|cancel` | Private | Negotiate & resolve |
| POST | `/api/reviews` | Private | Review a mentor/business/product (one per user per target, enforced) |
| GET | `/api/reviews?targetType=&targetId=` | Public | Paginated reviews for a target |
| GET | `/api/reviews/mine` | Private | Reviews you've written |
| POST | `/api/reviews/:id/helpful\|report` | Private | Helpful vote toggle / report (auto-hides at 5 reports) |
| GET/POST | `/api/collections` | Private | List / create named collections |
| POST | `/api/collections/save` | Private | Save a mentor/business/product (defaults to a "Saved" collection) |
| GET/PATCH/DELETE | `/api/collections/:id` | Private | View items / rename / delete |
| GET | `/api/dashboard/mentor` \| `/business` \| `/marketplace` | Private | Real aggregated stats, no placeholders |
| GET | `/api/dashboard/mentor/analytics` \| `/business/analytics` | Private | Monthly request/inquiry trends, rating trend, per-listing performance |

## Design decisions worth knowing about

- **No payments, as specified.** `priceLabel` on `Skill` is a display-only `Free`/`Paid`
  tag; the whole mentorship and marketplace flow is request/inquiry-based, matching the
  brief's "Instead of payments" and "Instead of checkout" framing.
- **Reviews are one polymorphic collection**, not three separate ones — `targetType:
  'skill'|'business'|'product'` with a compound unique index (one review per user per
  target). The spec's "services" reviews land under `product` or `skill` depending on
  what's actually being reviewed, since there's no separate Service model — noting this
  rather than inventing a fourth model to look more complete.
- **Business follow is a simple embedded array** on `Business.followers`, deliberately
  not routed through Part 2's `Follow` collection — that collection's mutuals/suggestions
  machinery is for user-to-user follows and doesn't fit a one-directional page follow.
- **Ratings are always recalculated from real `Review` documents** (`ratingService.js`),
  never stored as a manually-set number — every average you see is a live aggregation.
- **Analytics are real aggregations** (`$group` by month, per-listing view/save counts,
  rating history) — not mocked chart data. They're intentionally simple (bar-style
  monthly counts, not full time-series dashboards with comparisons) to stay honest about
  what's implemented versus what a dedicated analytics part could add.
- **Entrepreneur Dashboard and Business Dashboard are the same endpoint**
  (`/api/dashboard/business`), since one `Business` model backs both concepts in this
  app. Listed as a consolidation, not two separate half-built features.

## Known integration notes

1. **Part 3 resources aren't in the Part 2 global search yet** (`/api/search` still only
   covers users/stories/hashtags/skills-as-user-field). Extending it to also search
   `Skill`/`Business`/`Product` would touch Part 2's `searchController.js` — flagged
   rather than done silently, per the "don't modify completed features unless
   integration absolutely requires it" instruction. Each of those has its own
   discovery/search within its own page in the meantime.
2. **Notification model's type enum was extended** (13 new values, e.g.
   `mentor_request`, `product_inquiry`, `new_review`) and given two new optional fields
   (`refModel`, `refId`) so one notification schema can point at a mentor request,
   product, business, inquiry, or review. This was a required, additive change — no
   existing notification types or fields were removed, and `notify()`'s signature stayed
   backward compatible (Part 2 call sites still work unchanged).
3. **Resume/portfolio uploads use Cloudinary's `resource_type: 'raw'`** for PDF/Word
   files — fine for typical resumes, not virus-scanned or content-validated beyond MIME
   type, since that's outside what Cloudinary itself offers.

## Setup

No new environment variables or dependencies were required — Part 3 reuses the
Cloudinary, MongoDB, and JWT configuration already in `server/.env`. Run the same way as
Parts 1 and 2 (`npm run dev` in both `server/` and `client/`). As before, this sandbox
has no network access, so nothing could be installed or booted here — every new server
file passed `node --check` and every new client file passed a bracket-balance sweep,
same verification rigor as the previous two parts.
