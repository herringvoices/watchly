## Title
UpdateFeed component

### Description
Implements the feed UI that lists user media updates (global, user-specific, or media-specific). Serves authenticated users to browse recent activity from followed users or all users depending on filters. Provides infinite/paginated loading, empty/ loading/ error states, and interaction entry points (like, comment, navigate to media/user profiles).

### Requirements
- Display a vertical list of UpdateItem components (virtualization optional MVP: simple paginated list with Load More button).
- Accept props: mode: 'global' | 'user' | 'media'; userId?; mediaId?; followingOnly? boolean (default true for global); pageSize (default 20).
- Fetch endpoint: GET /updates with query params: mediaId?, userId?, offset, followingOnly?. Offset increments by pageSize.
- Loading state: skeleton lines or spinner (ARIA role="status" with accessible label). Error state: retry button; Empty state: contextual message ("No updates yet").
- Support manual refresh (pull-to-refresh on mobile or Refresh button on desktop).
- Append new pages without losing scroll position; ensure focus management when errors appear.
- Keyboard navigation: tab through items; preserve focus after pagination append.
- Each UpdateItem click areas (title/poster) bubble to navigation; like/comment buttons isolated (stopPropagation).
- Handle race conditions: prevent duplicate fetch while one in flight.
- Abort fetch on unmount.
- Auth required: if 401 returned, emit onAuthExpired() callback prop.
- Accessibility: list container has role="feed"; each UpdateItem as article with aria-posinset / aria-setsize if feasible (or omit setsize for infinite list).
- Responsive: mobile first (single column), wide screens maintain readable max-width (~720px) centered.
- Error handling: map 5xx to generic message; 429 subtle backoff (disable Load More 2s then retry allowed).

### Acceptance Criteria
- [ ] Initial load shows loading state then first page of up to 20 UpdateItem entries from /updates with correct query assembly.
- [ ] Scrolling / clicking Load More fetches next offset and appends without duplicates.
- [ ] Empty state message appears when API returns 200 with empty array on first page.
- [ ] 401 response triggers onAuthExpired callback; feed shows signed-out prompt.
- [ ] Keyboard tab sequence reaches like/comment buttons inside each item in DOM order.
- [ ] Error state after simulated 500 shows retry and recovers on success.
- [ ] ARIA role="feed" present; each child has role="article".

### Notes
- Alternative to offset pagination: cursor-based; deferred to future (documented out-of-scope).
- Virtualization (react-window) optional future optimization.
- followingOnly default true for global feed; can be toggled later; not in MVP UI.

### Labels
`area:frontend`, `type:ui`, `domain:updates`

### Effort
L

### Priority
P1

---
## Title
UpdateItem component

### Description
Represents a single user media update with header (user info + timestamp + actions), body (media info, rating, description), and footer (like/comment buttons with counts). Provides contextual action menu for watchlist operations, edit/delete (if owner), and add/move actions depending on library state.

### Requirements
- Props: update { id, user {id,name,avatarUrl}, media {id, tmdbId, title, posterUrl, watchlist?, userRating?, lastWatched?}, rating (number), lastWatched (string), description?, createdAt ISO, likeCount, commentCount, likedByMe boolean, isOwner boolean, inLibrary boolean, currentWatchlist? }.
- Display friendly timestamp via helper (friendlyTimestamp(createdAt)).
- Action menu (three dots) logic:
	- If !inLibrary: show "Add to Watchlist" -> submenu with Currently Watching / Want to Watch / Hiatus.
	- If inLibrary and not owner of media? (media is always owned by user in library context) show "Move to Watchlist" listing other lists.
	- If isOwner: show Edit Post, Delete Post (confirm dialog), plus Move to Watchlist if applicable.
- Click title/poster triggers onNavigateMedia(media.id or tmdbId).
- Click user avatar/name triggers onNavigateUser(user.id).
- Like button toggles via POST/DELETE /media-update/:id/like; optimistic update; rollback on error.
- Comment button triggers onOpenComments(update.id).
- Expose onDeleted(updateId) after successful delete (DELETE /media-update/:id) with confirm prompt.
- Editing loads existing data into AddMediaUpdate Step 2 form via callback onEdit(update).
- Accessibility: action menu button has aria-haspopup="menu" and proper focus trap in menu.
- Responsive layout: poster thumbnail left (stack above on <400px width). Text truncation for long titles (ellipsis, max 2 lines).

### Acceptance Criteria
- [ ] Renders all core fields and matches design: avatar, name, timestamp, media title, lastWatched text, rating, optional description.
- [ ] Action menu options vary correctly for ownership and library state (owner sees Edit/Delete; non-owner sees Add or Move as described).
- [ ] Deleting calls DELETE endpoint and removes item from list via onDeleted.
- [ ] Liking toggles count and icon state; network failure reverts and shows error toast.
- [ ] Keyboard users can open action menu with Enter/Space and navigate items with Arrow keys.
- [ ] Poster/title click navigations fire correct callbacks.

### Notes
- Future: Add "Remove from Watchlist" option; deferred.
- Confirmation dialog minimal (native confirm acceptable MVP); can replace with styled modal later.

### Labels
`area:frontend`, `type:ui`, `domain:updates`

### Effort
M

### Priority
P1

---
## Title
UpdateComment modal

### Description
Modal that displays an UpdateItem plus threaded comments list and a form to add a new comment. Supports pagination if comments grow large (MVP may load all). Handles like/unlike on comments and delete own comments.

### Requirements
- Props: updateId (required), isOpen, onClose().
- Fetch comments via GET /update/:updateId/comments on open; show loading spinner (role="status").
- Render UpdateItem summary (compact variant) at top (reuse component or simplified layout).
- Comment list of CommentItem components; order by createdAt ascending.
- PostComment form at bottom (textarea + Post button). Disabled while posting; empty input trimmed; reject empty submissions.
- POST /update/:updateId/comment returns new comment; append to list; scroll to it; manage focus.
- Delete comment: DELETE /comment/:commentId; remove element with fade-out optional.
- Like/unlike comment: POST/DELETE /comment/:commentId/like; update like count optimistically.
- Error states: loading failure offers retry; posting failure shows inline error; deletion failure restores item.
- Accessibility: modal has aria-modal="true" role="dialog" with labelled title, focus trap, ESC close, close button.
- Responsive: fullscreen on small screens, centered panel on desktop.

### Acceptance Criteria
- [ ] Opening modal triggers fetch; loading indicator visible until comments loaded.
- [ ] Adding a comment clears input, appends new comment with correct user metadata.
- [ ] Deleting own comment removes it; non-owners see no delete button.
- [ ] Liking a comment updates count; second click (or unlike) decrements.
- [ ] Keyboard focus returns to previously focused element after close.
- [ ] 401 on post shows auth error message and disables form.

### Notes
- Pagination (offset) deferred; all comments loaded for MVP; note potential performance issue >200 comments.
- Future: real-time updates (WebSocket) out-of-scope.

### Labels
`area:frontend`, `type:ui`, `domain:comments`

### Effort
M

### Priority
P2

---
## Title
CommentItem component

### Description
Displays a single comment with commenter avatar, name, text, timestamp, like button (if not author), delete (if author), and like count.

### Requirements
- Props: comment { id, user {id,name,avatarUrl}, text, createdAt, likeCount, likedByMe, isOwner }.
- Show friendly timestamp via helper.
- Like button hidden if isOwner; clicking toggles via POST/DELETE /comment/:id/like.
- Delete button only if isOwner; calls DELETE /comment/:id with confirm.
- Emits onDelete(id) after success; onLikeToggle(updatedComment) after like/unlike.
- Accessible: container role="article", buttons have aria-pressed when active.
- Provide fallback avatar initials when no avatarUrl.

### Acceptance Criteria
- [ ] Owner sees delete button; non-owner doesn't.
- [ ] Like toggles state and count; rollback on error.
- [ ] Timestamp matches helper output format (e.g., "5 mins ago").
- [ ] Keyboard navigation: Tab to like/delete; Enter activates.

### Notes
- Reaction types (emoji) out-of-scope.

### Labels
`area:frontend`, `type:ui`, `domain:comments`

### Effort
S

### Priority
P2

---
## Title
PostComment form

### Description
Standalone controlled form to submit a new comment for an update, used inside UpdateComment modal.

### Requirements
- Props: updateId, onPosted(comment), disabled? boolean.
- Elements: textarea (min 2 rows, max length 2k chars), Post button disabled if empty/whitespace or submitting.
- Submit: POST /update/:updateId/comment { text }.
- Show char counter (remaining) if > 180 chars left hidden after 180 threshold.
- Enter+Ctrl (or Cmd) submits; simple Enter adds newline.
- Handle 401 (invoke onAuthRequired callback prop) and show inline message.
- Clear textarea on success and return focus there.
- Accessibility: textarea labelled; announce errors via aria-live polite.

### Acceptance Criteria
- [ ] Whitespace-only input blocked with inline message.
- [ ] Successful submission fires onPosted with returned comment JSON.
- [ ] 401 response triggers auth callback; form disabled afterward.
- [ ] char counter appears after typing first char and shows correct remaining when near limit.

### Notes
- Rate limiting (anti-spam) out-of-scope.

### Labels
`area:frontend`, `type:ui`, `domain:comments`

### Effort
XS

### Priority
P3

---
## Title
AddMediaUpdate flow — Step 1 modal

### Description
Modal listing user's media library entries to choose which media to post an update about. Provides watchlist filtering and move/remove actions.

### Requirements
- Fetch user media: GET /media/:userId (current user via /me or stored id) returns grouped by watchlist.
- Props: isOpen, onSelect(media), onClose().
- Display sections (accordion or tabs) for watchlists: Currently Watching, Want to Watch, Hiatus.
- Each MediaItem row: title, poster thumb, latest watched info (if any), user average rating.
- Move button triggers watchlist action menu helper to move or remove (DELETE /media/:mediaId) with confirmation.
- Search/filter input (client-side) to filter list by title substring.
- Loading skeleton; empty states per watchlist.
- Accessibility: modal semantics; list items focusable; keyboard up/down navigation (optional); ESC closes.
- Error handling: fetch failure retry; if 401 invoke auth expired callback.

### Acceptance Criteria
- [ ] Opening modal triggers fetch and shows grouped media lists.
- [ ] Selecting a media calls onSelect with object and closes modal.
- [ ] Moving media updates UI group without refetch.
- [ ] Removing media removes from list entirely.
- [ ] Empty watchlist displays appropriate placeholder message.

### Notes
- Server-side filtering/pagination out-of-scope (client filtering only).

### Labels
`area:frontend`, `type:ui`, `domain:updates`

### Effort
M

### Priority
P2

---
## Title
AddMediaUpdate flow — Step 2 form

### Description
Form to compose a new media update after selecting media: includes progress (what watched), session length, rating, optional description. On submit creates new update and returns to feed.

### Requirements
- Props: media { id, title, posterUrl, existingUpdates? }, onSubmitted(update), onCancel().
- Fields: lastWatched (text or episode selector placeholder), watchSessionLength (Short/Medium/Long radio), rating (1–5 stars), description (textarea optional, max 2000 chars).
- Submit: POST /media/:mediaId/update with { lastWatched, watchSessionLength, rating, description? }.
- Validate rating required 1–5, watchSessionLength required, lastWatched optional? (planning implies "what you watched since last update" required - treat as required non-empty).
- Disable submit while pending; optimistic UI allowed but rollback on error.
- Show success toast; call onSubmitted and reset form.
- Accessibility: labelled inputs, star rating keyboard accessible (arrow keys), error messages aria-live.
- Handle 401 error via callback, 422 validation errors displayed inline, 500 generic message.

### Acceptance Criteria
- [ ] Required fields enforce client validation before request.
- [ ] Successful submission sends correct payload and receives 201 with update displayed in feed (mock injection via callback).
- [ ] Validation error (simulate rating missing) returns 422 and shows inline error.
- [ ] Keyboard can adjust star rating and submit via Enter on submit button.

### Notes
- Editing existing update reuse same component prefilled (triggered by UpdateItem Edit) - out-of-scope for initial; design for reuse.

### Labels
`area:frontend`, `type:ui`, `domain:updates`

### Effort
M

### Priority
P2

---
## Title
MediaSearch page

### Description
Search interface for movies/TV via backend proxy; allows adding media to watchlist and navigating to MediaDetails.

### Requirements
- UI: search input (debounced 300ms), toggle (Movies | TV). Default Movies.
- Hitting backend: GET /external-media/search?type=movie|tv&query=... (proxy; no direct TMDB key on client).
- Display grid/list of MediaSearchItem components with poster, title, truncated overview, (optional sitewide rating via GET /media-rating/:mediaApiId per item or batched later - MVP defer rating until details page to reduce calls).
- Add button on card opens watchlist selection modal (Currently Watching, Want to Watch, Hiatus) -> POST /media with { tmdbId, watchlist } then navigate to MediaDetails.
- Clicking card (not Add button) navigates to MediaDetails.
- Loading state: skeleton cards; empty: "No results" for non-empty query; initial idle state shows prompt.
- Error: show retry and message; 429 implement exponential backoff (1s,2s,4s) up to 3 tries per search request.
- Accessibility: search input has label, toggle implemented as radiogroup, cards focusable; Add button has aria-label including media title.
- Responsive: single column on narrow (<480px), multi-column grid beyond.

### Acceptance Criteria
- [ ] Typing triggers debounced search; network calls not more frequent than every 300ms.
- [ ] Add button flow creates media (201) and navigates upon success.
- [ ] 429 throttling test waits and eventually succeeds or surfaces error after 3 retries.
- [ ] No API key visible in network tab besides our backend call.
- [ ] Keyboard navigation allows focusing each card and activating Add.

### Notes
- Sitewide rating call per item deferred to reduce N+1; could batch later.

### Labels
`area:frontend`, `type:ui`, `domain:media`

### Effort
L

### Priority
P1

---
## Title
MediaSearchItem component

### Description
Card/list item representing a media search result with Add capability and navigation.

### Requirements
- Props: media { tmdbId, title, posterUrl, overview, rating? }, onAdd(tmdbId), onNavigate(tmdbId).
- Add button opens watchlist selection (emit onAdd -> parent handles modal) notifies selection; disable if already in local library (prop inLibrary boolean).
- Truncate overview to ~120 chars with ellipsis.
- Entire card clickable except Add button stops propagation.
- Accessibility: role="button" on card with key activation; Add button labelled.
- Loading skeleton variant.

### Acceptance Criteria
- [ ] Overview truncates correctly without cutting mid-codepoint.
- [ ] Add button disabled when inLibrary true.
- [ ] Card click triggers onNavigate; Add triggers onAdd without navigation.

### Notes
- Could show site-wide rating; deferred until batching solution.

### Labels
`area:frontend`, `type:ui`, `domain:media`

### Effort
S

### Priority
P2

---
## Title
MediaDetails page

### Description
Displays full media details, poster, title, sitewide rating, user's personal rating (if any), watchlist actions, and a media-specific UpdateFeed limited to followed users (if followingOnly flag used) or all (MVP: followed only if logged in). Allows adding/moving/removing media.

### Requirements
- Fetch details via GET /external-media/details/:tmdbId (backend proxy) and sitewide rating via GET /media-rating/:mediaApiId.
- Fetch user's library entry to know watchlist & personal rating: GET /media/:userId or dedicated endpoint (reuse list filtering client-side to find match).
- Display watchlist action button(s): Add to Watchlist if not in library (dropdown of lists). If in library: Move to Watchlist (lists excluding current) and optional Remove.
- Remove uses DELETE /media/:mediaId; Move uses PUT /media/:mediaId/watchlist with { watchlist }.
- Show personal rating (weighted average from Media table) and site average rating.
- Below details embed UpdateFeed in media mode (prop mediaId, followingOnly true by default). Provide Load More.
- Loading states for each section; error states with retry; parallel fetch allowed.
- Accessibility: headings structured (h1 title), poster has alt text; action menus keyboard accessible.
- Responsive: poster left text right (desktop), stacked mobile.

### Acceptance Criteria
- [ ] Shows Add or Move/Remove buttons appropriate to library state.
- [ ] Moving changes displayed watchlist label without full page reload.
- [ ] Removing reverts UI to Add state and feed remains.
- [ ] Site average rating matches /media-rating response (rounded to 2 decimals display).
- [ ] UpdateFeed filters by mediaId (network request includes mediaId param).

### Notes
- Personal rating recalculated server-side; no client recompute logic.
- Remove option can be toggled off in MVP; if omitted document in UI; include in Notes.

### Labels
`area:frontend`, `type:ui`, `domain:media`

### Effort
L

### Priority
P1

---
## Title
UserSearch page

### Description
Page to search for users, display results, and allow follow/unfollow actions.

### Requirements
- Search input debounced 300ms; endpoint (assumed) GET /user/search?query=... (Not in planning.md -> MVP assumption) OR fallback: reuse existing user listing (TBD). Since not specified, implement placeholder that filters cached results until endpoint added.
- Display list of UserSearchItem components.
- Each item shows avatar, name, latest Currently Watching media (if available) (requires additional call or precomputed field - MVP: omit if not easily available; note in Notes).
- Follow/unfollow button issues POST /user/:userId/follow or DELETE /user/:userId/follow accordingly.
- Loading, empty, error states; 429 backoff like MediaSearch.
- Accessibility: list role="list"; items role="listitem"; follow buttons labelled with action.

### Acceptance Criteria
- [ ] Follow toggles to Unfollow after success and persists on refresh (simulate by refetch).
- [ ] Unfollow removes following state.
- [ ] Empty state message appears for no results.
- [ ] Debounce prevents >1 request per 300ms during rapid typing (if endpoint implemented).

### Notes
- Actual search endpoint unspecified; create backend ticket dependency linking to UserController expansion.
- Latest Currently Watching media display deferred until endpoint supplies it.

### Labels
`area:frontend`, `type:ui`, `domain:users`

### Effort
M

### Priority
P2

---
## Title
UserSearchItem component

### Description
Represents a single user in search results with avatar, name, optional latest media snippet, and follow/unfollow action.

### Requirements
- Props: user { id, name, avatarUrl, isFollowedByMe, latestCurrentlyWatching? }, onNavigate(id), onToggleFollow(id, newState).
- Follow button updates optimistically; rollback on API failure.
- Entire card clickable except follow button.
- Accessibility: follow button has aria-pressed when following.
- Show placeholder avatar if none.

### Acceptance Criteria
- [ ] Follow changes state and button label to Unfollow.
- [ ] Navigation callback fires on card click.
- [ ] aria-pressed reflects follow state.

### Notes
- Loading shimmer variant for skeleton lists.

### Labels
`area:frontend`, `type:ui`, `domain:users`

### Effort
S

### Priority
P3

---
## Title
UserDetails page

### Description
Displays a user's profile (avatar, name, bio), follow/unfollow (if not self), watchlists accordion, and a user-specific UpdateFeed for their updates.

### Requirements
- Fetch user details: GET /user/:userId. If viewing self, show edit button (opens profile edit modal - modal implementation out-of-scope, placeholder callback).
- Fetch watchlists: GET /user/:userId/watchlists; display accordion: Currently Watching, Want to Watch, Hiatus; each expands to list of MediaSearchItem or MediaUpdateItem (if self) components.
- If self: show MediaUpdateItem variant (includes Move button and average rating editing not required) else plain MediaSearchItem (no Add buttons).
- Embed UpdateFeed with userId filter.
- Follow/unfollow via POST/DELETE endpoints.
- Loading skeleton for profile header + accordions; each pane lazy-load on expand (optional; MVP can load all at once).
- Accessibility: accordions use button elements with aria-expanded, aria-controls.
- Responsive: stacked mobile; side-by-side feed & watchlists desktop (optional; MVP vertical stack).

### Acceptance Criteria
- [ ] Profile loads and shows correct follow state for other users.
- [ ] Expanding a watchlist reveals media items; collapsing hides them via aria-hidden.
- [ ] UpdateFeed request includes userId param.
- [ ] Self-view shows edit button; others do not.

### Notes
- Bio editing implementation separate issue TBD.
- Lazy loading of watchlists can be future optimization.

### Labels
`area:frontend`, `type:ui`, `domain:users`

### Effort
L

### Priority
P2

---
## Title
NavBar component

### Description
Responsive navigation bar: bottom bar with icons on small screens; top bar with text labels on larger screens; includes profile picture popover (view profile, logout) and quick access to core sections.

### Requirements
- Detect screen width breakpoint (e.g., 768px) to switch layout.
- Icons: Feed, Search Media, Add Update, User Search, Profile. Desktop: text labels except profile avatar remains.
- Active route highlighted (aria-current="page").
- Profile avatar click opens popover with View Profile & Logout (and maybe Settings future).
- Add Update triggers AddMediaUpdate Step 1 modal.
- Accessibility: nav element with role="navigation" and labelled; items are buttons/links; popover focus trap; ESC closes.
- Mobile bottom nav fixed; ensure safe-area padding (env(safe-area-inset-bottom)).

### Acceptance Criteria
- [ ] Layout switches when resizing across breakpoint.
- [ ] Popover opens and closes via click/ESC and traps focus.
- [ ] Active nav item correctly corresponds to current route.
- [ ] Keyboard navigation cycles through icons; Enter triggers navigation.

### Notes
- Future: notification badge; deferred.

### Labels
`area:frontend`, `type:ui`, `domain:users`

### Effort
M

### Priority
P2

---
## Title
LikeButton component

### Description
Reusable like/unlike toggle button showing icon and count for updates or comments.

### Requirements
- Props: entityType: 'update'|'comment'; entityId; liked boolean; count number; onChange(newState, newCount).
- API endpoints: POST /media-update/:id/like, DELETE /media-update/:id/like (updates); POST /comment/:id/like, DELETE /comment/:id/like (comments).
- Optimistic update; rollback on error with toast.
- Accessibility: aria-pressed; label describes action (Like / Unlike). Count has sr-only description.
- Debounce rapid re-clicks while request in flight.

### Acceptance Criteria
- [ ] Clicking toggles visual state and count.
- [ ] Error simulation reverts state and shows error.
- [ ] aria-pressed reflects liked state.

### Notes
- Future animation (burst) optional.

### Labels
`area:frontend`, `type:ui`, `domain:likes`

### Effort
S

### Priority
P3

---
## Title
CommentButton component

### Description
Button displaying comment icon and count, opens comments modal.

### Requirements
- Props: count number; onClick().
- Accessible label includes count.
- Style consistent with LikeButton.

### Acceptance Criteria
- [ ] Clicking triggers onClick exactly once per activation.
- [ ] Screen reader announces label with count.

### Notes
- Pure presentational; logic external.

### Labels
`area:frontend`, `type:ui`, `domain:comments`

### Effort
XS

### Priority
P3

---
## Title
MediaItem component

### Description
Represents a media entity in user's library lists (used in AddMediaUpdate Step 1). Shows title, poster, recent watched info, average user rating, and Move button.

### Requirements
- Props: media { id, tmdbId, title, posterUrl, lastWatched?, userRating?, watchlist } , onSelect(id), onMove(media), onRemove(id).
- Move button opens watchlist action menu helper; Remove may be included if decided.
- Entire row selectable; selected state highlight.
- Accessibility: listitem semantics; button labels.

### Acceptance Criteria
- [ ] Clicking body triggers onSelect.
- [ ] Move displays other watchlists excluding current.
- [ ] Removing (if enabled) emits onRemove and disappears.

### Notes
- Could display aggregated number of updates; out-of-scope.

### Labels
`area:frontend`, `type:ui`, `domain:watchlist`

### Effort
S

### Priority
P2

---
## Title
MediaUpdateItem component

### Description
Variant of MediaItem for use on user's own profile watchlists, optionally showing additional controls relevant to updates.

### Requirements
- Extends MediaItem; additional props: updateCount, lastUpdateTimestamp.
- Shows quick action to add new update (opens AddMediaUpdate with preselected media).
- Accessibility: action button labelled "Add update for <title>".

### Acceptance Criteria
- [ ] Add Update button triggers flow with correct media context.
- [ ] Base MediaItem functionality retained.

### Notes
- Could merge with MediaItem using variant prop; implement variant="profile".

### Labels
`area:frontend`, `type:ui`, `domain:updates`

### Effort
S

### Priority
P3

---
## Title
Helper: Friendly timestamp formatter

### Description
Utility to convert ISO timestamps to human-friendly relative strings ("Just now", "5 mins ago", "Yesterday", fallback to date).

### Requirements
- Input: Date | string; Output: string.
- Rules: <60s => "Just now"; <3600s => "X mins ago"; <86400s => "X hrs ago"; <48h => "Yesterday"; <7d => weekday name; else locale date (YYYY-MM-DD or locale).
- Handle future timestamps (treated as "Just now").
- Unit tests for boundary conditions.

### Acceptance Criteria
- [ ] Unit tests pass for defined intervals.
- [ ] No exceptions on invalid date string (returns empty or original string?). Use fallback "" for invalid.

### Notes
- Library (date-fns) optional; MVP implement lightweight.

### Labels
`area:frontend`, `type:helper`, `domain:updates`

### Effort
XS

### Priority
P3

---
## Title
Helper: Watchlist action menu

### Description
Reusable menu logic to present watchlist move/add/remove options depending on current state and ownership.

### Requirements
- API: showMenu({ inLibrary, currentWatchlist, isOwner }) -> returns actions array.
- Actions: Add to Watchlist (lists), Move to Watchlist (excluding current), Remove from Watchlist (optional feature flag), Delete Post (only if invoked from UpdateItem + isOwner), Edit Post (if isOwner from UpdateItem context).
- Pure function testable; UI adapter receives actions to render.
- Unit tests verifying permutations.

### Acceptance Criteria
- [ ] Tests cover at least: not in library, in library CW, in library Want to Watch, owner vs non-owner.
- [ ] No action duplicates, current list excluded from move choices.

### Notes
- Future: accept custom watchlists dynamic.

### Labels
`area:frontend`, `type:helper`, `domain:watchlist`

### Effort
S

### Priority
P3

---
## Title
AuthController

### Description
Implements authentication endpoints: login, register, me. Returns user object and JWT for session management.

### Requirements
- POST /login body { username, password } -> 200 { user, jwt }. Errors: 400 (missing), 401 (invalid credentials), 429 (too many attempts optional), 500.
- POST /register body { username, email, password, ... } -> 201 { user, jwt }. Errors: 400 validation, 409 (username/email taken), 500.
- GET /me (auth required) -> 200 { user }. Errors: 401 (missing/invalid/expired), 500.
- Input validation: username 3-30 chars alphanumeric+_-, password min 8, email RFC basic.
- Password hashing (bcrypt 10+ rounds). JWT signed with HS256 secret from env; exp (e.g., 24h) documented.
- Rate limit login attempts (optional; note if omitted).
- Responses exclude password hash.
- On register, auto-create default data not specified (none for MVP).

### Acceptance Criteria
- [ ] Successful login returns 200 with jwt field and sanitized user.
- [ ] Invalid password returns 401 without revealing which field failed.
- [ ] Duplicate username returns 409.
- [ ] GET /me with valid Authorization: Bearer <token> returns same user id.
- [ ] Expired/invalid token returns 401.

### Notes
- Refresh tokens out-of-scope.
- Consider lockout after N failed attempts future.

### Labels
`area:backend`, `type:controller`, `domain:auth`

### Effort
M

### Priority
P1

---
## Title
MediaController

### Description
Handles user library operations: add media, move between watchlists, delete media, list media grouped by watchlist.

### Requirements
- GET /media/:userId (auth required if requesting own or private? MVP public) returns 200 [MediaItem] grouped or raw array (spec says grouped by watchlist). Response shape: { currentlyWatching:[], wantToWatch:[], hiatus:[] } or flat? Choose grouped; note alternative.
- POST /media body { tmdbId, watchlist } -> 201 { media } validates watchlist in set.
- PUT /media/:mediaId/watchlist body { watchlist } -> 200 { message } ensure ownership.
- DELETE /media/:mediaId -> 204 ensure ownership; cascades delete of user updates and triggers rating adjustments via service.
- Errors: 400 invalid watchlist, 401 unauthorized, 403 forbidden (not owner), 404 not found, 409 duplicate add, 500.
- Auth: all write endpoints require user token; GET for others maybe allowed limited fields (MVP allow only own or followed? simplify: allow any—document).

### Acceptance Criteria
- [ ] Adding new media returns 201 with id and watchlist fields.
- [ ] Duplicate add same tmdbId for user returns 409.
- [ ] Move updates watchlist and returns message.
- [ ] Delete returns 204 and subsequent GET no longer lists item.
- [ ] Unauthorized request without token returns 401.

### Notes
- Alternative: combine watchlist move under WatchlistController; kept here but separate issue exists.
- GET could support ?list=listName filter; out-of-scope.

### Labels
`area:backend`, `type:controller`, `domain:media`

### Effort
M

### Priority
P1

---
## Title
MediaUpdateController

### Description
Provides CRUD and like endpoints for media updates plus feed queries with filters for media, user, following.

### Requirements
- GET /updates query: mediaId?, userId?, followingOnly?(bool), offset? (default 0). Returns 200 [UpdateItem]. Ordered by createdAt desc. Limit default 20 (document). Auth required only if followingOnly=true.
- POST /media/:mediaId/update body { lastWatched, description?, rating, watchSessionLength } -> 201 { update } ownership of media validated.
- PUT /media-update/:updateId body {...same fields...} -> 200 { update } ensure owner.
- DELETE /media-update/:updateId -> 204 ensure owner.
- POST /media-update/:updateId/like -> 200 { likes } duplicates idempotent.
- DELETE /media-update/:updateId/like -> 204.
- Errors: 400 validation, 401 auth, 403 forbidden, 404 not found, 409 duplicate like, 500.
- Rating impacts delegated to MediaUpdateService including recalculations & MediaRatingService updates in transactions.

### Acceptance Criteria
- [ ] GET /updates returns updates sorted desc by createdAt.
- [ ] followingOnly without auth returns 401.
- [ ] Creating update persists and appears in feed top.
- [ ] Editing changes rating and triggers new average for user media (verified via subsequent media fetch).
- [ ] Deleting removes from feed and updates counts.

### Notes
- Pagination uses offset param; cursor optional future.
- watchSessionLength accepted values: Short, Medium, Long (validate enumeration).

### Labels
`area:backend`, `type:controller`, `domain:updates`

### Effort
L

### Priority
P1

---
## Title
MediaRatingController

### Description
Exposes sitewide rating stats for a media item.

### Requirements
- GET /media-rating/:mediaApiId -> 200 { sumOfRatings, numberOfRatings, rating }.
- Errors: 404 if no record? (MVP return zeros with implicit create). 500 on server error.
- Validation: mediaApiId numeric/integer.
- Cache-control: short (e.g., 30s) optional; out-of-scope.

### Acceptance Criteria
- [ ] Existing rated media returns correct aggregate fields.
- [ ] Unrated media returns zeros (no 404).
- [ ] Invalid id (non-numeric) returns 400.

### Notes
- Could accept query for batch retrieval later.

### Labels
`area:backend`, `type:controller`, `domain:ratings`

### Effort
S

### Priority
P1

---
## Title
WatchlistController (optional)

### Description
Optional separate endpoint to update watchlist state, mirroring MediaController PUT; may be merged but included for numbering.

### Requirements
- PUT /watchlist/:mediaId body { watchlist } -> 200 { message }. Validate ownership.
- Errors: 400 invalid watchlist, 401, 403, 404.
- If merged, endpoint may proxy to MediaController logic.

### Acceptance Criteria
- [ ] Moving watchlist via this endpoint updates record and returning message.
- [ ] Invalid watchlist returns 400.

### Notes
- Document that duplication with MediaController exists; consider alias route.

### Labels
`area:backend`, `type:controller`, `domain:watchlist`

### Effort
XS

### Priority
P3

---
## Title
CommentController

### Description
CRUD-like endpoints for comments tied to updates plus likes on comments.

### Requirements
- GET /update/:updateId/comments -> 200 [CommentItem]. 404 if update not found.
- POST /update/:updateId/comment body { text } -> 201 { comment } owner of update not required.
- DELETE /comment/:commentId -> 204 ensure comment owner.
- POST /comment/:commentId/like -> 200 { likes } idempotent.
- DELETE /comment/:commentId/like -> 204.
- Errors: 400 validation (empty text), 401, 403, 404, 409 duplicate like, 500.
- Text length limit 2000 chars; trim.

### Acceptance Criteria
- [ ] Adding comment returns 201 with id and text.
- [ ] Deleting non-owned comment returns 403.
- [ ] Liking increments likes; duplicate like does not add extra.
- [ ] Unliking returns 204 and decrements count.

### Notes
- Pagination of comments future.

### Labels
`area:backend`, `type:controller`, `domain:comments`

### Effort
M

### Priority
P2

---
## Title
UserController

### Description
Handles user profile retrieval, editing, and watchlists grouping.

### Requirements
- GET /user/:userId -> 200 { user } fields: id, username, name?, bio?, avatarUrl?. 404 if not found.
- PUT /user/:userId body { name?, bio?, avatarUrl? } -> 200 { user } requires auth & ownership.
- GET /user/:userId/watchlists -> 200 { currentlyWatching:[], wantToWatch:[], hiatus:[] } each item includes media id, tmdbId, title, posterUrl, rating?
- Errors: 400 invalid fields, 401, 403, 404, 500.

### Acceptance Criteria
- [ ] Editing own profile updates fields; editing others returns 403.
- [ ] Watchlists grouped correctly; each media appears only once.
- [ ] Missing user returns 404.

### Notes
- Search endpoint not specified; will be separate.

### Labels
`area:backend`, `type:controller`, `domain:users`

### Effort
M

### Priority
P2

---
## Title
FollowController

### Description
Endpoints to follow/unfollow users.

### Requirements
- POST /user/:userId/follow -> 200 { message: "Now following." } cannot follow self -> 400.
- DELETE /user/:userId/follow -> 204.
- Errors: 400 invalid (self), 401, 404 target not found, 409 already following, 500.
- Idempotent unfollow (unfollowing when not following returns 204 with no effect).

### Acceptance Criteria
- [ ] Following new user returns 200 message.
- [ ] Re-following same user returns 409.
- [ ] Unfollow returns 204 then second unfollow also 204.
- [ ] Self follow attempt returns 400.

### Notes
- Future: list followers/following endpoints.

### Labels
`area:backend`, `type:controller`, `domain:social`

### Effort
S

### Priority
P2

---
## Title
ExternalMediaApiController

### Description
Backend proxy for external media (TMDB) search & details to avoid exposing API key to clients and to normalize data.

### Requirements
- GET /external-media/search query { type=movie|tv, query, page? } -> 200 { results:[{ tmdbId,title,posterUrl,overview,mediaType }] }.
- GET /external-media/details/:tmdbId?type=movie|tv -> 200 { tmdbId,title,posterUrl,overview,genres[],releaseDate?, runtime?, siteRating? (optional) }.
- Validation: query min length 2; type enum.
- Error mapping: 400 invalid params, 404 external not found, 429 bubble up with generic message after 3 internal retries (backoff 500ms, 1s, 2s), 500 on persistent failure.
- Caching: in-memory LRU/TTL (search 30s, details 5m) implemented in service.
- Do not return raw external API fields or keys.

### Acceptance Criteria
- [ ] Search with query returns normalized results without extraneous fields.
- [ ] Invalid type returns 400.
- [ ] External 404 returns 404.
- [ ] Repeated details call within TTL served faster (logically from cache) (simulate by timing or instrumentation flag).

### Notes
- Pagination beyond first page optional; include page pass-through support.

### Labels
`area:backend`, `type:controller`, `domain:media`

### Effort
M

### Priority
P1

---
## Title
AuthService

### Description
Service layer for auth: credential validation, registration, current user retrieval by token.

### Requirements
- Methods: login(username,password) -> { user, jwt }; register(username,email,password,...) -> { user, jwt }; getCurrentUser(token) -> user.
- Hashing & compare; throw standardized errors (AuthError, ValidationError, ConflictError).
- JWT signing with secret env JWT_SECRET; includes sub=userId, exp (24h), iat.
- Input validation identical to controller.
- On register ensure unique username/email (case-insensitive compare).

### Acceptance Criteria
- [ ] login with correct credentials returns jwt.
- [ ] Wrong password throws AuthError.
- [ ] Duplicate registration throws ConflictError.
- [ ] getCurrentUser with invalid token throws AuthError.

### Notes
- No refresh tokens.

### Labels
`area:backend`, `type:service`, `domain:auth`

### Effort
M

### Priority
P1

---
## Title
MediaService

### Description
Service managing user's media library: add, move, remove, list. Ensures integrity and cascades update deletions.

### Requirements
- addMediaToLibrary(userId, tmdbId, watchlist) -> media. Checks not exists; create record.
- moveMediaToWatchlist(mediaId, userId, watchlist) -> success message.
- removeMediaFromLibrary(mediaId, userId) -> void; deletes media row, related updates, triggers MediaUpdateService.handleMediaRemoved.
- getMediaByUser(userId, listEnum?) -> grouped object.
- Validation: watchlist enumeration; ownership checks; cascade handled transactionally.
- Throws NotFoundError, ForbiddenError, ConflictError.

### Acceptance Criteria
- [ ] Adding duplicate throws ConflictError.
- [ ] Moving to same watchlist no-ops or returns early (decide: return success without change) documented.
- [ ] Removing triggers handleMediaRemoved (verify call in test via mock).
- [ ] Listing groups items correctly.

### Notes
- Future custom watchlists out-of-scope.

### Labels
`area:backend`, `type:service`, `domain:media`

### Effort
M

### Priority
P1

---
## Title
MediaUpdateService

### Description
Handles CRUD & rating recalculations for updates, feed queries with filters, and integration with MediaRatingService for sitewide stats.

### Requirements
- getUpdates(params, currentUserId) filter logic (mediaId, userId, followingOnly) with pagination limit & offset; returns array.
- addUpdate(mediaId, userId, data) -> update; create, recalc user's weighted rating over updates, update Media row, call MediaRatingService.updateUserRating(mediaApiId,userId,newUserRating,previousUserRating) inside transaction.
- editUpdate(updateId, userId, data) -> update; similar recalculation.
- deleteUpdate(updateId, userId) -> void; recalc or null if none remain; update Media row; call MediaRatingService with newUserRating (or null).
- handleMediaRemoved(mediaId,userId) -> void; remove all updates, set rating null, call MediaRatingService update.
- Weighted rating formula: sum(rating_i * weight(sessionLength_i)) / sum(weight). Weights: Short=1, Medium=2, Long=3 (Medium absent in planning—assumed; document).
- Transactions ensure consistency with MediaRatingService; retry up to 3 times on deadlock.

### Acceptance Criteria
- [ ] Adding first update increments MediaRating NumberOfRatings by 1 and adds value to SumOfRatings.
- [ ] Adding subsequent update replaces previous user contribution (SumOfRatings updated difference only, count unchanged).
- [ ] Deleting last update decrements NumberOfRatings and subtracts user rating.
- [ ] Editing update changes SumOfRatings reflect diff.
- [ ] FollowingOnly filter restricts results to followed IDs.

### Notes
- Medium weight not specified; chosen 2 to maintain linear progression.

### Labels
`area:backend`, `type:service`, `domain:updates`

### Effort
L

### Priority
P1

---
## Title
MediaRatingService

### Description
Maintains sitewide aggregate ratings stats per media; updates on user rating changes and provides read access.

### Requirements
- updateUserRating(mediaApiId, userId, newUserRating, previousUserRating): fetch/create MediaRating row, adjust SumOfRatings and NumberOfRatings per rules: previous null -> add new; previous not null and new not null -> Sum += new - previous; previous not null and new null -> Sum -= previous; previous null and new null -> no-op. Recompute Rating = Sum / Count (or null if count 0). Transaction & optimistic concurrency (retry up to 3).
- getRatingForMedia(mediaApiId) -> { sumOfRatings, numberOfRatings, rating } create row with zeros if missing (idempotent read or just return zeros w/o creation).
- Ensure numeric precision (store sums as double, maybe scaled integers—MVP double).

### Acceptance Criteria
- [ ] First user rating sets Sum=rating, Count=1.
- [ ] Second user rating updates Sum and Count=2.
- [ ] Editing rating adjusts Sum difference only.
- [ ] Removing last rating sets Count=0 and Rating null (or 0? choose null) documented.

### Notes
- Null rating vs 0: choose null to differentiate absence.

### Labels
`area:backend`, `type:service`, `domain:ratings`

### Effort
M

### Priority
P1

---
## Title
CommentService

### Description
Domain logic for comments including ownership checks and like delegation (or integrated with LikeService for separation).

### Requirements
- getComments(updateId) -> list joining commenter info.
- addComment(updateId,userId,text) validates update exists & text length; returns comment.
- deleteComment(commentId,userId) ensures ownership then deletes.
- likeComment(commentId,userId) / unlikeComment(commentId,userId) may delegate to LikeService or implement directly.
- Validation: non-empty trimmed text <=2000 chars.

### Acceptance Criteria
- [ ] Adding, listing shows new comment.
- [ ] Deleting non-owned throws ForbiddenError.
- [ ] Like increments like count; unlike decrements.

### Notes
- For DRY, likes might fully centralize in LikeService; choose integration approach there.

### Labels
`area:backend`, `type:service`, `domain:comments`

### Effort
S

### Priority
P2

---
## Title
LikeService

### Description
Handles like/unlike for updates and comments ensuring idempotency and accurate counts.

### Requirements
- likeUpdate(updateId,userId) -> newCount; creates UpdateLike if absent.
- unlikeUpdate(updateId,userId) -> void (idempotent).
- likeComment(commentId,userId) / unlikeComment similar for CommentLike.
- Prevent duplicates (unique index on (userId,updateId)/(userId,commentId)).
- Return updated counts via count queries or maintained counters.

### Acceptance Criteria
- [ ] Double like attempt returns same count (no duplicate row).
- [ ] Unlike then Like increments again properly.
- [ ] Separate domains (update/comment) unaffected by each other.

### Notes
- Consider caching counts later.

### Labels
`area:backend`, `type:service`, `domain:likes`

### Effort
S

### Priority
P2

---
## Title
UserService

### Description
User profile operations excluding auth: retrieval, edit, watchlists grouping.

### Requirements
- getUser(userId) -> user or NotFound.
- editProfile(userId,currentUser,profileData) ownership check; update permitted fields.
- getWatchlists(userId) -> grouped arrays of media.
- Validation: field length limits (bio <= 500 chars).

### Acceptance Criteria
- [ ] Editing bio longer than 500 rejected.
- [ ] getWatchlists returns exactly three keys.
- [ ] getUser invalid id throws NotFoundError.

### Notes
- Avatar upload pipeline out-of-scope.

### Labels
`area:backend`, `type:service`, `domain:users`

### Effort
S

### Priority
P2

---
## Title
FollowService

### Description
Manages follow relationships with uniqueness and self-follow prevention.

### Requirements
- followUser(currentUserId, targetUserId) ensures not self, not already following; creates row.
- unfollowUser(currentUserId, targetUserId) idempotent delete.
- Provide listFollowers/listFollowing (optional future; not implemented now).

### Acceptance Criteria
- [ ] Following self throws ValidationError.
- [ ] Duplicate follow prevented.
- [ ] Unfollow idempotent.

### Notes
- Could trigger events/notifications later.

### Labels
`area:backend`, `type:service`, `domain:social`

### Effort
XS

### Priority
P2

---
## Title
WatchlistService

### Description
Abstraction for moving media between watchlists or removing it.

### Requirements
- updateWatchlist(mediaId,userId,watchlist|null) -> message; if null remove media; else update field.
- Validate ownership; allowed lists enumerated.
- If removing, cascade like MediaService remove path including rating adjustments.

### Acceptance Criteria
- [ ] Moving updates watchlist field.
- [ ] Passing null removes media and cascades updates removal.

### Notes
- Might delegate to MediaService; if so becomes thin wrapper.

### Labels
`area:backend`, `type:service`, `domain:watchlist`

### Effort
XS

### Priority
P3

---
## Title
ExternalMediaApiService

### Description
Server-side integration with external media API (TMDB) performing search & details, normalization, caching, retries, and rate-limit handling.

### Requirements
- search(type,query,page) -> normalized results; validates inputs; calls external /search endpoint.
- getDetails(type,tmdbId) -> normalized detail object.
- Normalization fields: tmdbId (numeric id), title, posterUrl (full URL), overview, genres[], releaseDate?, runtime?, mediaType.
- Caching: in-memory maps with TTLs (search 30s keyed by type+query+page; details 5m keyed by type+id). LRU eviction optional.
- Retries: up to 3 attempts for network/429 with exponential backoff (500ms,1s,2s). 429 final failure surfaces 429.
- Errors: wrap external errors into standardized Internal/NotFound/RateLimited errors.

### Acceptance Criteria
- [ ] Consecutive identical details calls within TTL hit cache (verify via mock HTTP call count).
- [ ] 429 triggers retries with backoff timings.
- [ ] Invalid type throws ValidationError.

### Notes
- Production scaling may require persistent cache (Redis); deferred.

### Labels
`area:backend`, `type:service`, `domain:media`

### Effort
M

### Priority
P1

---
## Title
Secrets & config for external media API key

### Description
Establish secure configuration management for external API key (TMDB) and related auth secrets.

### Requirements
- Environment variables: TMDB_API_KEY, JWT_SECRET, (optional) RATE_LIMIT_WINDOW. Document in README.
- Fail fast on server start if required vars missing (throw and exit with clear log message).
- Provide example .env.example (without real keys).
- Do not expose TMDB_API_KEY to frontend responses.
- Configuration module centralizes access and validates schema (e.g., using zod or manual checks).
- Unit test ensuring missing TMDB_API_KEY causes initialization failure.

### Acceptance Criteria
- [ ] Starting server without TMDB_API_KEY logs error and exits non-zero.
- [ ] Frontend network traces show no API key strings.
- [ ] .env.example lists required variables with placeholder values.

### Notes
- Secret rotation automation future.

### Labels
`area:infra`, `type:security`, `domain:media`

### Effort
S

### Priority
P1

---
## Title
Frontend refactor to use backend proxy for media search/details

### Description
Ensure all media search & details UI calls use backend ExternalMediaApiController endpoints, removing any direct external API usage.

### Requirements
- Replace direct fetches (if any) to TMDB with /external-media/search and /external-media/details endpoints.
- Centralize API client module for these calls with error handling (429 retry, generic errors).
- Remove any API key references or environment variables from frontend build.
- Add integration test stub verifying request path prefix /external-media present.

### Acceptance Criteria
- [ ] Search page only calls /external-media/* endpoints.
- [ ] Build artifacts contain no TMDB_API_KEY substring (grep test).
- [ ] 429 response triggers retry logic up to 3 times then surfaces message.

### Notes
- If no legacy direct calls existed, just add assertion tests.

### Labels
`area:frontend`, `type:integration`, `domain:media`

### Effort
S

### Priority
P1

---
## Title
Database/ERD alignment

### Description
Implement database schema reflecting planning ERD: Users, Follow, MediaRating, Media, MediaUpdate, Comment, UpdateLike, CommentLike with necessary fields, constraints, and indexes.

### Requirements
- Define tables with fields: Id PKs (increment int except Users Id nvarchar), CreatedAt/UpdatedAt timestamps default now().
- Foreign keys:
	- Media.userId -> Users.Id
	- MediaUpdate.mediaId -> Media.Id, MediaUpdate.userId -> Users.Id
	- Comment.updateId -> MediaUpdate.Id, Comment.userId -> Users.Id
	- UpdateLike.updateId -> MediaUpdate.Id, UpdateLike.userId -> Users.Id unique (userId,updateId)
	- CommentLike.commentId -> Comment.Id, CommentLike.userId -> Users.Id unique (userId,commentId)
	- Follow.followerId, Follow.followedId unique pair, prevent self-follow.
- MediaRating keyed by external mediaApiId (consider unique index).
- Indexes: Media(userId, watchlist), MediaUpdate(mediaId, createdAt desc), MediaUpdate(userId, createdAt desc), Follow(followerId), Follow(followedId), Comment(updateId, createdAt), Likes tables for counting.
- Nullable rating fields as per planning (personal rating in Media, aggregated in MediaRating).
- Migration scripts and rollback.
- Ensure deletion cascades: deleting Media deletes its updates, then comments/likes via cascade or manual.

### Acceptance Criteria
- [ ] Migrations apply cleanly on empty DB.
- [ ] Foreign key cascade tested: deleting Media removes its updates and related comments/likes.
- [ ] Unique constraints prevent duplicate follows & likes.
- [ ] Query plan review shows indexes used for feed fetch (explain analyze placeholder acceptable).

### Notes
- Users.Id as nvarchar per planning; consider UUID future.

### Labels
`area:infra`, `type:integration`, `domain:media`

### Effort
L

### Priority
P1

---
## Title
Transactions & retries for ratings updates

### Description
Implements transactional and retry logic for operations that adjust MediaRating aggregates when updates are added/edited/deleted or media removed.

### Requirements
- Wrap sequences: user weighted rating recompute + Media row update + MediaRatingService.updateUserRating in single DB transaction.
- Retry up to 3 attempts on deadlock/serialization failures with exponential backoff (100ms, 200ms, 400ms).
- Log attempt number and success/failure metrics.
- Provide configuration for maxRetries (default 3) & backoff strategy.
- Ensure idempotency: if retry due to conflict, stale previous values not double-applied.
- Unit/integration tests simulate concurrent edits (use transactional mocks or manual locking) verifying correctness of SumOfRatings and NumberOfRatings.

### Acceptance Criteria
- [ ] Simulated concurrent add/update operations produce correct final aggregates.
- [ ] Deadlock simulation triggers retries (log shows attempts) and eventually succeeds.
- [ ] After last user rating removed Count=0 and Rating null.
- [ ] Failure after max retries surfaces error to caller.

### Notes
- Could later adopt optimistic concurrency version columns; deferred.

### Labels
`area:infra`, `type:integration`, `domain:ratings`

### Effort
M

### Priority
P1

