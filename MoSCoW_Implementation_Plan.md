# Reddit-Like Platform: MoSCoW Implementation Plan

## 1. Purpose

This document turns the feature roadmap into an implementation sequence for a MERN-based Reddit-like application. It prioritizes work using the MoSCoW framework and defines the MongoDB modeling direction needed to support the features safely as usage grows.

The recommended architecture is a normalized source-of-truth model with deliberate, bounded denormalization for feed performance. High-cardinality relationships such as comments, votes, subscriptions, reports, notifications, and moderation actions remain in separate collections. Frequently read counters and small display snapshots may be denormalized and periodically reconciled.

## 2. Current Baseline

The existing project contains three Mongoose models:

- `User`: name, unique email, password value, and manually supplied `createdAt`.
- `Subreddit`: unique name, description, author reference, and manually supplied `createdAt`.
- `Thread`: title, content, author reference, subreddit reference, aggregate vote counters, and manually supplied `createdAt`.

The current `Thread` model functions as the application's post model.

Existing scripts demonstrate:

- User, community, and post creation.
- Lookups by email, name, community, and date.
- Reference loading through Mongoose population.
- Updates to user, community, post, and vote-counter fields.
- Aggregation to find the most active posting user.
- Full database deletion and fixture reseeding.

Current limitations to address:

- There is no comment or reply model.
- Aggregate vote counters cannot enforce one vote per user.
- There are no community memberships, subscriptions, moderators, reports, or bans.
- Content is physically deleted instead of being soft-deleted.
- Password fields must be stored as password hashes and excluded from normal projections.
- Referential cleanup behavior is not defined.
- Timestamps, validation, content limits, and moderation states are incomplete.

## 3. Workload and Query Patterns

### Read-heavy operations

- Home feed retrieval by ranking, newest, or trending order.
- Community feed retrieval with pagination.
- Post detail pages.
- Comment tree retrieval and branch expansion.
- User profiles and authored-content history.
- Search by title and body.
- Filtering by community, author, date, flair, score, and sort order.
- Unread notification lists.
- Moderator report queues.

### Write-heavy or bursty operations

- Post and comment creation.
- Voting and vote-direction changes.
- Subscription and save actions.
- Reports, moderation actions, bans, and mutes.
- Notification creation.
- Edit history creation.
- Mention detection and notification fan-out.

### Aggregation-heavy operations

- Karma totals.
- Community activity and growth.
- Active-user analysis.
- Moderation response times.
- Retention and engagement analytics.
- Ranking and trending calculations.

### General query rules

- Use cursor-based pagination for feeds and comments rather than large `skip` values.
- Use compound indexes that match the leading equality filters and the requested sort order.
- Keep authoritative relationships in separate collections.
- Treat counters and ranking values as derived projections that can be reconciled.
- Use soft deletion for publicly visible content and preserve moderation history.

## 4. Core Entities and Relationships

| Entity | Purpose | Main relationships |
|---|---|---|
| User | Authentication, profile, authorship, reputation | Authors posts/comments; owns votes, saves, subscriptions, reports, and notifications |
| Community | Community identity, settings, ownership, moderation | Owned by a user; contains posts; has members, moderators, bans, mutes, and flairs |
| Community membership | Role, subscription, ban, and mute state | Connects a user to a community |
| Post | Text or link discussion topic | Authored by a user; belongs to a community; has comments, votes, reports, and saves |
| Comment | Threaded discussion response | Authored by a user; belongs to a post; optionally references a parent comment |
| Vote | One user's current vote on a target | Connects a user to one post or comment |
| Save | Private bookmark | Connects a user to one post or comment |
| Flair | Community-defined post label | Belongs to a community and may be applied to posts |
| Report | Safety or policy concern | Created by a user against a post, comment, or user; resolved by moderation |
| Moderation action | Audit record for removals, locks, bans, and mutes | Performed by a moderator against a target |
| Edit history | Previous content versions | Belongs to a post or comment and records the editor |
| Notification | User-facing event | Belongs to a recipient and may reference an actor and target |
| Analytics event | Append-only activity record | Records user, community, content, and event metadata |

## 5. Must Have Implementation Plan

### M1. Account registration and login

Implement:

- User registration with normalized username and email.
- Password hashing with Argon2id or bcrypt.
- Login, logout, and session handling using secure HTTP-only cookies or a carefully managed token strategy.
- Credential-field exclusion from profile and feed queries.
- Account status values such as `active`, `suspended`, and `deleted`.
- Rate limiting for registration, login, password reset, and verification endpoints.

Required indexes:

- Unique normalized email.
- Unique normalized username.

### M2. User profiles

Implement:

- Display name, username, biography, avatar, join date, and profile settings.
- Post and comment history with pagination.
- Karma counters as derived fields.
- Privacy and account-status controls.

Required indexes:

- `{ authorId: 1, createdAt: -1 }` on posts.
- `{ authorId: 1, createdAt: -1 }` on comments.

### M3. Community creation and management

Implement:

- Community creation with unique name and slug.
- Owner and moderator roles.
- Description, rules, visibility, NSFW setting, posting restrictions, and member counters.
- Community settings and moderation permissions.

Required indexes:

- Unique normalized community name.
- Unique community slug.
- Community lookup by owner.

### M4. Post creation and editing

Implement:

- Text and link post types.
- Title, body or URL, community, author, flair, spoiler, and NSFW fields.
- Author-only edit and delete authorization.
- Locking, removal, and soft deletion.
- Edit history records.

Post fields should include:

```text
_id: ObjectId
communityId: ObjectId
authorId: ObjectId
type: String          // text or link
title: String
body: String|null
url: String|null
flairId: ObjectId|null
isSpoiler: Boolean
isNsfw: Boolean
status: String        // active, removed, deleted, archived
isLocked: Boolean
score: Number
upvoteCount: Number
downvoteCount: Number
commentCount: Number
hotScore: Number
lastActivityAt: Date
authorSnapshot: Object
communitySnapshot: Object
createdAt: Date
updatedAt: Date
deletedAt: Date|null
```

Recommended indexes:

- `{ communityId: 1, status: 1, createdAt: -1, _id: -1 }` for newest community feeds.
- `{ communityId: 1, status: 1, hotScore: -1, _id: -1 }` for hot feeds.
- `{ communityId: 1, status: 1, score: -1, _id: -1 }` for top feeds.
- `{ communityId: 1, status: 1, lastActivityAt: -1, _id: -1 }` for trending activity.
- `{ authorId: 1, createdAt: -1 }` for profiles.
- Partial indexes limited to active content where appropriate.

### M5. Threaded comments and replies

Use a separate `comments` collection rather than embedding all comments in posts. Comments can grow without bound and may be independently edited, moderated, voted on, and paginated.

Comment fields:

```text
_id: ObjectId
postId: ObjectId
communityId: ObjectId
authorId: ObjectId
parentCommentId: ObjectId|null
path: String|null
depth: Number
body: String
status: String        // active, removed, deleted
isLocked: Boolean
score: Number
upvoteCount: Number
downvoteCount: Number
replyCount: Number
createdAt: Date
updatedAt: Date
deletedAt: Date|null
authorSnapshot: Object
```

Recommended indexes:

- `{ postId: 1, parentCommentId: 1, createdAt: 1, _id: 1 }` for direct replies.
- `{ postId: 1, path: 1 }` for materialized-path traversal.
- `{ authorId: 1, createdAt: -1 }` for profile history.
- `{ communityId: 1, createdAt: -1 }` for community moderation and activity views.

Use a nullable `parentCommentId` for the root relationship. A materialized path or ancestor array may be added when efficient branch retrieval is required. Do not store an unbounded nested comment array inside the post document.

### M6. Per-user voting

Use a separate `votes` collection as the authoritative record.

Vote fields:

```text
_id: ObjectId
userId: ObjectId
targetType: String     // post or comment
targetId: ObjectId
direction: Number       // 1 or -1
createdAt: Date
updatedAt: Date
```

Required uniqueness:

```text
{ userId: 1, targetType: 1, targetId: 1 } UNIQUE
```

Use an upsert or transaction to create, remove, or switch a vote. Maintain post and comment counters using atomic `$inc` operations. Periodically reconcile counters from the vote collection if strong consistency is not required for every feed read.

For stricter collection validation and independent retention, separate `postVotes` and `commentVotes` collections may be used instead of polymorphic targets.

### M7. Home and community feeds

Begin with fan-out-on-read:

1. Read the user's subscribed community IDs.
2. Query posts using the appropriate community, status, and ranking index.
3. Merge and paginate results with a cursor.

Do not begin with a materialized feed for every user unless traffic measurements justify the write amplification and invalidation complexity.

For very large deployments, introduce a separate feed projection populated asynchronously from post and subscription events.

### M8. Search and filtering

Initial search may use MongoDB text indexes over post titles and bodies, combined with normal indexes for community, author, date, flair, and status filtering.

For production-scale relevance, stemming, typo tolerance, autocomplete, and advanced ranking, use MongoDB Atlas Search or a dedicated search service. A basic text index should not be treated as a complete search architecture.

### M9. Authorization

Authorization rules should be enforced in service-layer logic and supported by the data model:

- Authors may edit or delete their own content.
- Moderators may remove content, lock threads, and resolve reports within their communities.
- Community owners may change community settings and moderator assignments.
- Administrators may manage platform-wide suspensions and moderation.
- Banned or muted users must be checked before creating community content.

### M10. Moderation and reporting

Use separate collections for reports, moderation actions, bans, and mutes.

Report fields:

```text
_id: ObjectId
reporterId: ObjectId
targetType: String      // post, comment, user
targetId: ObjectId
communityId: ObjectId|null
reasonCode: String
details: String|null
status: String          // open, reviewing, resolved, dismissed
resolvedBy: ObjectId|null
resolutionNote: String|null
createdAt: Date
resolvedAt: Date|null
```

Recommended report indexes:

- `{ communityId: 1, status: 1, createdAt: 1 }` for moderator queues.
- `{ targetType: 1, targetId: 1, createdAt: -1 }` for target history.
- `{ reporterId: 1, createdAt: -1 }` for user report history.

Moderation actions should be append-only audit records containing actor, action type, target, reason, and timestamp.

### M11. Validation and abuse protection

Implement:

- Maximum lengths for titles, bodies, comments, descriptions, and usernames.
- Input sanitization and safe rendering of user-generated content.
- Content-type and URL validation.
- Rate limits on authentication, posting, commenting, voting, reporting, and messaging-style actions.
- Request size limits.
- Audit logging for privileged operations.
- Soft deletion and recoverability for moderated content.

## 6. Should Have Implementation Plan

### S1. Community subscriptions

Use a `communityMembers` collection:

```text
_id: ObjectId
userId: ObjectId
communityId: ObjectId
role: String            // member, moderator, owner
isSubscribed: Boolean
isBanned: Boolean
isMuted: Boolean
createdAt: Date
updatedAt: Date
```

Required unique index:

```text
{ userId: 1, communityId: 1 } UNIQUE
```

Additional indexes:

- `{ userId: 1, isSubscribed: 1, updatedAt: -1 }` for home-feed communities.
- `{ communityId: 1, role: 1 }` for moderators and owners.
- `{ communityId: 1, isBanned: 1 }` for membership moderation.

### S2. Saved posts and comments

Use a separate `saves` collection:

```text
_id: ObjectId
userId: ObjectId
targetType: String      // post or comment
targetId: ObjectId
createdAt: Date
```

Required unique index:

```text
{ userId: 1, targetType: 1, targetId: 1 } UNIQUE
```

Add `{ userId: 1, createdAt: -1 }` for saved-content history.

### S3. Notifications and mentions

Notification fields:

```text
_id: ObjectId
recipientId: ObjectId
actorId: ObjectId|null
type: String             // reply, mention, vote, moderation, post_activity
postId: ObjectId|null
commentId: ObjectId|null
communityId: ObjectId|null
payload: Object
isRead: Boolean
createdAt: Date
readAt: Date|null
```

Recommended indexes:

- `{ recipientId: 1, isRead: 1, createdAt: -1 }` for unread notifications.
- `{ recipientId: 1, createdAt: -1 }` for notification history.

Mentions may initially be parsed synchronously during content creation. At larger scale, process them through an event or job queue to avoid slowing post and comment writes.

### S4. Community flairs

Use a `flairs` collection or a bounded array inside the community document if each community has a small, enforced maximum number of flairs.

Flair fields:

```text
_id: ObjectId
communityId: ObjectId
name: String
textColor: String
backgroundColor: String
isActive: Boolean
createdAt: Date
updatedAt: Date
```

Recommended index:

- `{ communityId: 1, isActive: 1, name: 1 }`.

Posts store a `flairId` reference and may also store a small flair display snapshot for feed rendering.

### S5. Ranking

Store derived ranking fields on posts and comments:

- `score`
- `hotScore`
- `lastActivityAt`
- `commentCount`
- `upvoteCount`
- `downvoteCount`

Ranking formulas should be versioned in application code or a ranking configuration record so recalculation is possible after algorithm changes.

### S6. Edit history

Use an append-only `editHistory` collection:

```text
_id: ObjectId
contentType: String     // post or comment
contentId: ObjectId
editorId: ObjectId
previousTitle: String|null
previousBody: String|null
createdAt: Date
```

Recommended index:

- `{ contentType: 1, contentId: 1, createdAt: -1 }`.

### S7. Karma and contribution history

Maintain current karma projections on users and optionally on community membership records. Derive detailed history from post, comment, and vote records or from immutable event records.

Avoid relying on a single mutable total when auditability is required.

### S8. Notification preferences

Preferences may be embedded in the user document when they remain small and bounded:

```text
notificationPreferences: {
  replies: Boolean,
  mentions: Boolean,
  moderation: Boolean,
  postActivity: Boolean,
  emailEnabled: Boolean
}
```

Move preferences to a separate collection only when they become large, independently updated, or privacy-sensitive.

### S9. Admin analytics

Use append-only analytics events for operational measurements:

```text
_id: ObjectId
eventType: String
userId: ObjectId|null
communityId: ObjectId|null
postId: ObjectId|null
metadata: Object
createdAt: Date
```

Recommended indexes depend on dashboard queries, but common choices include:

- `{ eventType: 1, createdAt: -1 }`.
- `{ communityId: 1, eventType: 1, createdAt: -1 }`.
- `{ userId: 1, eventType: 1, createdAt: -1 }`.

Move long-term analytics to a warehouse or dedicated analytics pipeline when event volume makes operational MongoDB queries expensive.

## 7. Schema Alternative A: Fully Normalized References

### Description

Every major relationship is stored in its own collection. Posts and comments reference users and communities by ObjectId. Votes, saves, memberships, reports, notifications, moderation actions, and edit history are independent records.

### Advantages

- Strongest control over data integrity.
- Unique compound indexes directly enforce one-to-one user actions.
- Comments, votes, reports, and notifications can grow independently.
- Easier moderation, auditing, retention, and deletion policies.
- Smaller base documents and fewer document-growth risks.
- Better suited to high-cardinality and frequently changing relationships.
- Clear ownership boundaries between services or modules.

### Disadvantages

- Feed reads may require multiple queries or `$lookup` operations.
- More application code is needed to hydrate author and community information.
- More round trips can increase latency if queries are not batched.
- Counter and projection maintenance adds write complexity.
- Mongoose `populate` can become expensive if used indiscriminately.

## 8. Schema Alternative B: Hybrid Bounded Denormalization

### Description

Keep authoritative records normalized but embed small read-oriented snapshots in posts and comments. Examples include author username and avatar, community name and slug, flair labels, counters, and ranking values.

Optionally embed a strictly bounded set of shallow comment previews for a post summary. Full comment trees remain separate.

### Advantages

- Faster feed hydration.
- Fewer `$lookup` operations for common feed cards.
- Better response times for read-heavy home and community feeds.
- Useful display data remains available even if the referenced profile changes.
- Read models can be shaped around the UI instead of database normalization alone.

### Disadvantages

- Duplicate data can become stale.
- Profile and community changes require snapshot repair or asynchronous updates.
- Write operations become more complicated.
- Larger documents increase storage and update costs.
- Embedded arrays may create document-growth and 16 MB limit risks.
- Debugging inconsistent snapshots is more difficult.
- Denormalization must be carefully bounded and monitored.

## 9. Recommendation

Use Alternative A as the authoritative data model and selectively apply the safe portions of Alternative B.

Recommended boundary:

- Normalize users, communities, memberships, posts, comments, votes, saves, reports, moderation actions, notifications, edit history, and analytics events.
- Denormalize scores, vote counts, comment counts, ranking fields, and small author/community display snapshots.
- Do not embed all comments, votes, subscribers, reports, or notifications inside parent documents.
- Reconcile counters and snapshots with scheduled jobs or event-driven repair processes.
- Start home feeds with indexed fan-out-on-read queries.
- Add materialized feed projections only after profiling demonstrates the need.

This approach balances correctness and growth while still supporting the read-heavy nature of feeds and profile pages.

## 10. Implementation Sequence

### Phase 1: Foundation

1. Rename or conceptually promote `Thread` to `Post`.
2. Add schema-managed `createdAt` and `updatedAt` fields.
3. Add validation, length limits, status fields, and soft deletion.
4. Hash passwords and exclude password hashes from normal queries.
5. Normalize usernames, emails, and community names.
6. Add unique indexes and verify existing data before index creation.

### Phase 2: Core discussion

1. Implement posts with text and link types.
2. Implement comments with parent references and pagination.
3. Implement post and comment authorization.
4. Add post and comment indexes for feeds and histories.
5. Add edit history.

### Phase 3: Voting and feeds

1. Add the authoritative vote collection.
2. Add unique user-target vote indexes.
3. Implement vote creation, removal, and direction changes.
4. Maintain aggregate counters atomically.
5. Implement newest, top, hot, and trending feed queries.
6. Add cursor-based pagination.

### Phase 4: Communities and safety

1. Add community memberships and subscriptions.
2. Add owners, moderators, bans, and mutes.
3. Add reports and moderation action history.
4. Add locking, removal, and soft-delete workflows.
5. Add rate limits and abuse protection.

### Phase 5: Retention and discovery

1. Add saves.
2. Add flairs.
3. Add notifications and mentions.
4. Add notification preferences.
5. Add basic search and filtering.
6. Upgrade to Atlas Search or another search service if relevance requirements grow.

### Phase 6: Operations and optimization

1. Add analytics events and moderation metrics.
2. Add reconciliation jobs for counters and snapshots.
3. Profile feed and comment queries with realistic data volumes.
4. Add bounded read projections only where measurements justify them.
5. Move long-term analytics to an appropriate reporting pipeline.

## 11. Operational Rules

- Never expose password hashes through normal API responses.
- Never rely on application checks alone for one-vote or one-save rules; enforce them with unique indexes.
- Never embed unbounded comments, votes, subscribers, notifications, or history arrays.
- Prefer soft deletion for user-generated content.
- Use transactions for multi-document state transitions where atomicity matters.
- Use atomic increments for counters and periodically reconcile them.
- Use cursor pagination for large feeds and comment lists.
- Monitor index usage and remove indexes that do not support real query patterns.
- Test authorization separately from data validation.
- Treat denormalized snapshots as projections, not authoritative identity data.
