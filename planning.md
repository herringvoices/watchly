# Figma Link

[Prototype](https://www.figma.com/proto/cYFebxAZlhM4GkOVacGOEx/Untitled?node-id=1-3&p=f&t=F377H3ZghNTQQLPk-1&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A3)

[Project with edit privileges](https://www.figma.com/design/cYFebxAZlhM4GkOVacGOEx/Watchly?node-id=0-1&t=hjAP3c44LkH50jlO-1)

# \<UpdateFeed/\>

Displays a feed of `<UpdateItem/>` components—each representing an update from a user.

## \<UpdateItem/\>

**Header:**

* User’s profile picture, first and last name, and a friendly timestamp (e.g., “Just now,” “5 mins ago”), using a helper function.

* **Three-dot “Actions” popover** with context-aware options:

  * **If you *do not* have this media in your library:**
    * Option: “Add to Watchlist” → lets you choose “Currently Watching” or “Want to Watch.”

  * **If you *already have* this media in your library:**
    * Option: “Move to Watchlist” → lets you select a different watchlist (“Currently Watching,” “Want to Watch,” “Hiatus”), not showing the current one.
    * (Optional: “Remove from Watchlist” if you want users to drop it completely.)

  * **If you are the author:**
    * Additional option: “Delete Post.”
    * Additional option: “Edit Post.” (opens \<AddMediaUpdate/\> with fields filled out to match the post)

**Body:**

* Media poster thumbnail.
* Media title.
* What the user just finished watching (e.g., episode).
* User’s rating for this media.
* Optional review/description.

**Footer:**

* `<LikeButton/>` and `<CommentButton/>`, both displaying current counts.
* Clicking the title or thumbnail navigates to `<MediaDetails/>`.
* Clicking `<CommentButton/>` opens the `<UpdateComment/>` modal.

### \<UpdateComment/\> Modal

* Shows the `<UpdateItem/>` being commented on.

* Displays a list of `<CommentItem/>` components:
  * Each `<CommentItem/>` shows the commenter’s name, profile picture, and their comment.
  * `<LikeButton/>` (unless it’s your own comment).
  * Delete button (if it *is* your comment).

* Below is a `<PostComment/>` form (text input \+ post button).

---

# \<AddMediaUpdate/\>

Allows users to add a new update for the media they’re watching.

## Modal Step 1

Opens a modal to select which media to update from your lists. Displays a list of `<MediaItem/>` components:

* Each shows title, poster thumbnail, most recent watched info (if applicable), your average rating, and a “Move” button to change watchlists or remove from lists.

## Modal Step 2

After selecting media, shows a form to create the update:

* What you watched since last update.
* How long the session was (short/medium/long).
* Your rating.
* Optional description.
* Submit button saves and navigates back to `<UpdateFeed/>`.

---

# \<MediaSearch/\>

* Top: search bar.

* Toggle: TV or Movies (changes how queries hit TMDB API).

* Results as `<MediaSearchItem/>` components:
  * Poster image, title, truncated description, (optionally) sitewide rating, and an “Add” button.l
  * Clicking “Add” opens a modal to select a watchlist, then navigates to `<MediaDetails/>`.
  * Clicking anywhere else on the card also navigates to `<MediaDetails/>`.

---

# \<MediaDetails/\>

* Large poster, title, sitewide average rating, and—if it’s in your watchlist—your personal rating.
* Full description of the media.

## Watchlist Actions

* **If not in your library:** “Add to Watchlist” (choose list).
* **If in your library:** “Move to Watchlist” (pick a new list, excluding current one).
* (Optional: “Remove from Watchlist.”)

## Media-specific \<UpdateFeed/\>

Below the main details, an `<UpdateFeed/>` shows only posts from users you follow, and only for this media.

---

# \<UserSearch/\>

* Search bar for users.

* Results as `<UserSearchItem/>` components:
  * Profile picture, name, their most recent “Currently Watching” media, and a follow/unfollow button.
  * Clicking navigates to `<UserDetails/>`.

---

# \<UserDetails/\>

* Profile picture, name, bio, and a follow/unfollow button (if not your profile).

## Watchlists Accordion

Accordion for watchlists: “Currently Watching,” “Want to Watch,” and “Hiatus.”

* Expanding an accordion header reveals a list of `<MediaSearchItem/>` for that list.

## User-specific \<UpdateFeed/\>

Below the accordions: `<UpdateFeed/>` for this user’s updates.

* If viewing your own profile, an edit button (above your name) to change your info, picture, or bio.
* You also see `<MediaUpdateItem/>` elements instead of `<MediaSearchItem/>` on your own profile.

---

# \<NavBar/\>

## Small screens

* Nav bar appears at the bottom with icons:

  * Brand/logo: `<UpdateFeed/>`

  * Magnifying glass: `<MediaSearch/>`

  * Plus: `<AddMediaUpdate/>`

  * Group/users icon: `<UserSearch/>`

  * **Profile picture:**

    * Clicking opens a **popover** with:
      * **View Profile** (navigates to `<UserDetails/>`)
      * **Logout** (logs out and returns to login/landing page)

## Medium/large screens

* Navbar shifts to the top and uses text labels instead of icons.
* Profile picture still opens the same **popover** (View Profile, Logout).

# 1\. AuthController

* **POST /login**
  * **Params:** `{ username, password }(from body)`
  * **Service:** [AuthService.login](?tab=t.5l8ykv1zsy5r#heading=h.p3kzidajp8u3)
  * **Returns:** `{ user, jwt }`
* **POST /register**
  * **Params:** `{ username, email, password, ... } (from body)`
  * **Service:** [AuthService.register](?tab=t.5l8ykv1zsy5r#heading=h.p3kzidajp8u3)
  * **Returns:** `{ user, jwt }`
* **GET /me**
  * **Params:** none (gets user from auth middleware)
  * **Service:** [AuthService.getCurrentUser](?tab=t.5l8ykv1zsy5r#heading=h.p3kzidajp8u3)
  * **Returns:** `{ user }`

---

# 2\. MediaController

### **GET /media/:userId**

* **Params:** userId (current user from auth)
* **Service:** [MediaService.getMediaByUser(userId)](?tab=t.5l8ykv1zsy5r#heading=h.tuc85zibsshs)
* **Returns:** 200 OK, `[MediaItem]` (all media in that user's library, grouped by watchlist)

---

### **PUT /media/:mediaId/watchlist**

* **Params:** mediaId (route), `{ watchlist }` (body: "Currently Watching", "Want to Watch", "Hiatus")
* **Auth:** current user from middleware
* **Service:** [MediaService.moveMediaToWatchlist(mediaId, userId, watchlist)](?tab=t.5l8ykv1zsy5r#heading=h.tuc85zibsshs)
* **Returns:** 200 OK, `{ message: "Moved to watchlist." }`

---

### **POST /media**

* **Params:** `{ tmdbId, watchlist }` (body)
* **Auth:** current user
* **Service:** [MediaService.addMediaToLibrary(userId, tmdbId, watchlist)](?tab=t.5l8ykv1zsy5r#heading=h.tuc85zibsshs)
* **Returns:** 201 Created, `{ media }`

---

### **DELETE /media/:mediaId**

* **Params:** mediaId (route)
* **Auth:** current user
* **Service:** [MediaService.removeMediaFromLibrary(mediaId, userId)](?tab=t.5l8ykv1zsy5r#heading=h.tuc85zibsshs)
* **Returns:** 204 No Content

---

# 3\. MediaUpdateController

### **GET /updates**

* **Query Params (all optional):**
  * `mediaId` — Filter by specific media
  * `userId` — Filter by updates from a specific user
  * `followingOnly` — If `true`, only show updates from users the current user follows
  * `limit` — Pagination (default: 20\)
  * `offset` — Pagination (default: 0\)

* **Auth:** current user (required for `followingOnly`)

* **Service:** [MediaUpdateService.getUpdates(params, currentUserId)](?tab=t.5l8ykv1zsy5r#heading=h.qtrbxor8lfit)

* **Returns:** 200 OK, `[UpdateItem]`

**Examples:**

* `/updates?mediaId=123` — All updates for a specific media
* `/updates?userId=456` — All updates by a specific user
* `/updates?followingOnly=true` — All updates from users you follow
* `/updates?mediaId=123&followingOnly=true` — Updates for a specific media from users you follow

---

### **POST /media/:mediaId/update**

* **Params:** mediaId (route), `{ lastWatched, description, rating, watchSessionLength }` (body)
* **Auth:** current user
* **Service:** [MediaUpdateService.addUpdate(mediaId, userId, updateData)](?tab=t.5l8ykv1zsy5r#heading=h.aqqm7d52arb7)
* **Returns:** 201 Created, `{ update }`

---

### **PUT /media-update/:updateId**

* **Params:** updateId (route), `{ lastWatched, description, rating, watchSessionLength }` (body)
* **Auth:** current user
* **Service:** [MediaUpdateService.editUpdate(updateId, userId, updateData)](?tab=t.5l8ykv1zsy5r#heading=h.gw3m7o6lw866)
* **Returns:** 200 OK, `{ update }`

---

### **DELETE /media-update/:updateId**

* **Params:** updateId (route)
* **Auth:** current user
* **Service:** [MediaUpdateService.deleteUpdate(updateId, userId)](?tab=t.5l8ykv1zsy5r#heading=h.9pi3mia3i3l5)
* **Returns:** 204 No Content

---

### **POST /media-update/:updateId/like**

* **Params:** updateId (route)
* **Auth:** current user
* **Service:** [LikeService.likeUpdate(updateId, userId)](?tab=t.5l8ykv1zsy5r#heading=h.9rz0xu1kasfh)
* **Returns:** 200 OK, `{ likes: num }`

---

### **DELETE /media-update/:updateId/like**

* **Params:** updateId (route)
* **Auth:** current user
* **Service:** [LikeService.unlikeUpdate(updateId, userId)](?tab=t.5l8ykv1zsy5r#heading=h.ld4n2vfc33fm)
* **Returns:** 204 No Content

---

# 4\. MediaRatingController

(Sitewide rating, not per user)

### **GET /media-rating/:mediaApiId**

* **Params:** mediaApiId (route)
* **Service:** [MediaRatingService.getRatingForMedia(mediaApiId)](?tab=t.5l8ykv1zsy5r#heading=h.t5wa2yt2u9au)
* **Returns:** 200 OK, `{ sumOfRatings, numberOfRatings, rating }`

---

# 5\. WatchlistController

(If you want to handle "move" as a standalone endpoint for reusability.)

### **PUT /watchlist/:mediaId**

* **Params:** mediaId (route), `{ watchlist }` (body)
* **Auth:** current user
* **Service:** [WatchlistService.updateWatchlist(mediaId, userId, watchlist)](?tab=t.5l8ykv1zsy5r#heading=h.cvcn1kinfbny)
* **Returns:** 200 OK, `{ message: "Watchlist updated." }`

*We could just use the MediaController PUT for this? Idk.*

---

# 6\. CommentController

### **GET /update/:updateId/comments**

* **Params:** updateId (route)
* **Service:** [CommentService.getComments(updateId)](?tab=t.5l8ykv1zsy5r#heading=h.5fhcz6b6iblf)
* **Returns:** 200 OK, `[CommentItem]`

---

### **POST /update/:updateId/comment**

* **Params:** updateId (route), `{ text }` (body)
* **Auth:** current user
* **Service:** [CommentService.addComment(updateId, userId, text)](?tab=t.5l8ykv1zsy5r#heading=h.nblxr55rnmai)
* **Returns:** 201 Created, `{ comment }`

---

### **DELETE /comment/:commentId**

* **Params:** commentId (route)
* **Auth:** current user
* **Service:** [CommentService.deleteComment(commentId, userId)](?tab=t.5l8ykv1zsy5r#heading=h.hdjd0ytx0ix6)
* **Returns:** 204 No Content

---

### **POST /comment/:commentId/like**

* **Params:** commentId (route)
* **Auth:** current user
* **Service:** [LikeService.likeComment(commentId, userId)](?tab=t.5l8ykv1zsy5r#heading=h.vtnoq6z4rcc6)
* **Returns:** 200 OK, `{ likes: num }`

---

### **DELETE /comment/:commentId/like**

* **Params:** commentId (route)
* **Auth:** current user
* **Service:** [LikeService.unlikeComment(commentId, userId)](?tab=t.5l8ykv1zsy5r#heading=h.698vm0evtjej)
* **Returns:** 204 No Content

---

# 8\. UserController

### **GET /user/:userId**

* **Params:** userId (route)
* **Service:** [UserService.getUser(userId)](?tab=t.5l8ykv1zsy5r#heading=h.bkuj6nszqugm)
* **Returns:** 200 OK, `{ user }`

---

### **PUT /user/:userId**

* **Params:** userId (route), `{ ...profileFields }` (body)
* **Auth:** current user
* **Service:** [UserService.editProfile(userId, currentUser, profileData)](?tab=t.5l8ykv1zsy5r#heading=h.r30558eprho9)
* **Returns:** 200 OK, `{ user }`

---

### **GET /user/:userId/watchlists**

* **Params:** userId (route)
* **Service:** [UserService.getWatchlists(userId)](?tab=t.5l8ykv1zsy5r#heading=h.2utxlm9bma8i)
* **Returns:** 200 OK, `{ currentlyWatching: [], wantToWatch: [], hiatus: [] }`

---

# 9\. FollowController

### **POST /user/:userId/follow**

* **Params:** userId (route)
* **Auth:** current user
* **Service:** [FollowService.followUser(currentUser, userId)](?tab=t.5l8ykv1zsy5r#heading=h.bcx17bbuunz8)
* **Returns:** 200 OK, `{ message: "Now following." }`

---

### **DELETE /user/:userId/follow**

* **Params:** userId (route)
* **Auth:** current user
* **Service:** [FollowService.unfollowUser(currentUser, userId)](?tab=t.5l8ykv1zsy5r#heading=h.6fsss55whhnj)
* **Returns:** 204 No Content
# 1\. AuthService

* `login(username, password)` → validates credentials, returns user and JWT
* `register(username, email, password, ...)` → creates user, returns user and JWT
* `getCurrentUser(token)` → returns user for JWT

---

# 2\. MediaService

Handles user's personal media library (adding/removing/moving media).

* `addMediaToLibrary(userId, tmdbId, watchlist)`
  1. Checks if media exists in Media table for user.
  2. If not, fetches details from TMDB and inserts new Media row.
  3. Sets initial watchlist (Currently Watching, etc).
  4. Returns new media record.
* `moveMediaToWatchlist(mediaId, userId, watchlist)`
  1. Validates media belongs to user.
  2. Updates watchlist field in Media row.
  3. Returns success.
* `removeMediaFromLibrary(mediaId, userId)`
  1. Deletes Media row for user and all their related updates for that media.
  2. Triggers [**MediaUpdateService.handleMediaRemoved(mediaId, userId)**](#3.5-handlemediaremoved\(mediaid,-userid\)) to ensure MediaRating stats are updated (see below).
* `getMediaByUser(userId, [fromquery] listenum?)`
  1. Returns all Media for user, grouped by watchlist, based on query string parameter.

---

# 3\. MediaUpdateService

Handles CRUD for updates (progress/reviews on media), recalculates user's average, and **notifies MediaRatingService** when changes affect the site-wide stats. Also handles flexible querying for feed views by media, user, and following.

---

## 3.1 getUpdates(params, currentUserId)

**Purpose:** Fetches updates with optional filters for media, user, and/or only those users the requester is following.

**Parameters:**

* `params`:
  * `mediaId` (optional): Filter by specific media
  * `userId` (optional): Filter by updates from a specific user
  * `followingOnly` (optional): If true, only include users the requester follows
  * `limit` (optional): Pagination, default 20
  * `offset` (optional): Pagination, default 0

* `currentUserId`: the ID of the logged-in user (required if `followingOnly` is true)

**Process:**

1. Build a query against `MediaUpdate`, joining with `Media` and `Users` as needed.

2. If `params.mediaId` is present, filter by `mediaId`.

3. If `params.userId` is present, filter by `userId`.

4. If `params.followingOnly` is true:
   * Retrieve IDs of users followed by `currentUserId` from the `Follow` table.
   * Filter updates to only those with `userId` in that set.

5. Apply `limit` and `offset` for pagination.

6. Order results by `createdAt` descending.

7. Return the resulting array of `UpdateItem` objects (with embedded user/media info as needed).

---

## 3.2 addUpdate(mediaId, userId, updateData)

**Process:**

1. Create new `MediaUpdate` row for user/media.

2. Get all updates for `(userId, mediaId)`, recalculate user’s average rating (using weighted formula).

3. Update user's `Media` row's `Rating` field with new average.

4. **Call `MediaRatingService.updateUserRating(mediaApiId, userId, newUserRating, previousUserRating)`**

   * Find `previousUserRating`:
     * If this is user’s first update for this media, `previousUserRating` is null.
     * Else, `previousUserRating` is old calculated average.

   * Call `MediaRatingService` as described.

5. Return created Update.

---

## 3.3 editUpdate(updateId, userId, updateData)

**Process:**

1. Find update; ensure it belongs to user.
2. Save changes to the `MediaUpdate`.
3. Get all updates for `(userId, mediaId)`, recalculate user’s average rating.
4. Update `Media` row’s `Rating` field.
5. **Call `MediaRatingService.updateUserRating(mediaApiId, userId, newUserRating, previousUserRating)`** as above.

---

## 3.4 deleteUpdate(updateId, userId)

**Process:**

1. Find update; ensure it belongs to user.

2. Delete the update.

3. Get all remaining updates for `(userId, mediaId)`:
   * If **none left**: user no longer rates this media.
   * If still some left: recalculate their average as usual.

4. Update `Media` row’s `Rating` field.

5. **Call `MediaRatingService.updateUserRating(mediaApiId, userId, newUserRating, previousUserRating)`**
   * `newUserRating = null` if user has no remaining updates.
   * `previousUserRating =` old calculated average before delete.

---

## 3.5 handleMediaRemoved(mediaId, userId) {#3.5-handlemediaremoved(mediaid,-userid)}

**Process:**

1. Delete all updates for this user/media.

2. Set their personal rating for that media to null.

3. **Call `MediaRatingService.updateUserRating(mediaApiId, userId, null, previousUserRating)`**
   * Signals that this user no longer contributes to the site-wide average.

---

# 4\. MediaRatingService

Keeps site-wide stats in sync. This is the “site average” table updater.
This *should only be updated by* `MediaUpdateService` to keep everything atomic.

---

## 4.1 updateUserRating(mediaApiId, userId, newUserRating, previousUserRating)

**Process:**

* Fetch or create MediaRating row for this `mediaApiId`.
* If **previousUserRating is null** (user had no rating before):
  * If **newUserRating is not null** (user just rated for the first time):
    * Increment `NumberOfRatings` by 1\.
    * Add `newUserRating` to `SumOfRatings`.
* If **previousUserRating is not null**:
  * If **newUserRating is null** (user deleted last rating or removed media):
    * Subtract `previousUserRating` from `SumOfRatings`.
    * Decrement `NumberOfRatings` by 1\.

  * If **newUserRating is not null** (user updated their rating):
    * `SumOfRatings = SumOfRatings - previousUserRating + newUserRating`
    * `NumberOfRatings` remains the same.
* Update the calculated `Rating` field (`SumOfRatings / NumberOfRatings`)
* Save MediaRating row.

---

## 4.2 getRatingForMedia(mediaApiId)

* Returns current `SumOfRatings`, `NumberOfRatings`, and calculated `Rating`.

---

# 5\. CommentService

Handles comment stuff, obvi

---

## getComments(updateId)

**Purpose:** Retrieve all comments associated with a specific update.

**Parameters:**

* `updateId`: ID of the update.

**Process:**

1. Query the `Comment` table for all comments where `updateId` matches.
2. Optionally join user info for each comment.
3. Return an array of `CommentItem` objects.

---

## addComment(updateId, userId, text)

**Purpose:** Add a new comment to an update.

**Parameters:**

* `updateId`: ID of the update being commented on.
* `userId`: ID of the user making the comment.
* `text`: Content of the comment.

**Process:**

1. Validate that the update exists.
2. Insert a new row into the `Comment` table with the given data.
3. Return the created `CommentItem`.

---

## deleteComment(commentId, userId)

**Purpose:** Delete a comment (only if owned by the user).

**Parameters:**

* `commentId`: ID of the comment to delete.
* `userId`: ID of the user requesting deletion.

**Process:**

1. Find the comment by `commentId`.
2. Ensure the `userId` matches the comment’s owner.
3. Delete the comment.

---

## likeComment(commentId, userId)

**Purpose:** Add a like to a comment.

**Parameters:**

* `commentId`: ID of the comment.
* `userId`: ID of the user liking the comment.

**Process:**

1. Check if a like by this user already exists; if not, add one.
2. Return updated like count.

---

## unlikeComment(commentId, userId)

**Purpose:** Remove a like from a comment.

**Parameters:**

* `commentId`: ID of the comment.
* `userId`: ID of the user unliking the comment.

**Process:**

1. Remove the like entry for this user and comment if it exists.

---

# 6\. LikeService

Handles likes for updates and comments.

---

## likeUpdate(updateId, userId)

**Purpose:** Add a like to an update.

**Parameters:**

* `updateId`: ID of the update.
* `userId`: ID of the user liking the update.

**Process:**

1. Check if a like by this user already exists; if not, add one.
2. Return updated like count.

---

## unlikeUpdate(updateId, userId)

**Purpose:** Remove a like from an update.

**Parameters:**

* `updateId`: ID of the update.
* `userId`: ID of the user unliking the update.

**Process:**

1. Remove the like entry for this user and update if it exists.

---

## likeComment(commentId, userId)

**Purpose:** Add a like to a comment (mirrors CommentService).

**Parameters:**

* `commentId`: ID of the comment.
* `userId`: ID of the user liking the comment.

---

## unlikeComment(commentId, userId)

**Purpose:** Remove a like from a comment.

**Parameters:**

* `commentId`: ID of the comment.
* `userId`: ID of the user unliking the comment.

---

# 7\. UserService

Handles, like, user stuff…but not auth.

---

## getUser(userId)

**Purpose:** Retrieve user details by ID.

**Parameters:**

* `userId`: ID of the user.

**Process:**

1. Query the `User` table by `userId`.
2. Return user profile info.

---

## editProfile(userId, profileData)

**Purpose:** Edit user profile information.

**Parameters:**

* `userId`: ID of the user.
* `profileData`: Object containing fields to update.

**Process:**

1. Validate input.
2. Update user fields.
3. Return updated user info.

---

## getWatchlists(userId)

**Purpose:** Retrieve grouped lists of media by watchlist status for a user.

**Parameters:**

* `userId`: ID of the user.

**Process:**

1. Query the `Media` table for all media owned by the user.
2. Group results by watchlist: "Currently Watching", "Want to Watch", "Hiatus".
3. Return object with arrays for each group.

---

# 8\. FollowService

---

## followUser(currentUserId, userId)

**Purpose:** Start following another user.

**Parameters:**

* `currentUserId`: ID of the user sending the follow request.
* `userId`: ID of the user to follow.

**Process:**

1. Check that a follow relationship does not already exist.
2. Insert a new row in the `Follow` table.

---

## unfollowUser(currentUserId, userId)

**Purpose:** Unfollow a user.

**Parameters:**

* `currentUserId`: ID of the user unfollowing.
* `userId`: ID of the user to unfollow.

**Process:**

1. Remove the follow relationship if it exists.

---

# SearchService: Handled on front end.

# 10\. WatchlistService

## updateWatchlist(mediaId, userId, watchlist)

**Purpose:** Move a media item to a different watchlist or remove it from all watchlists.

**Parameters:**

* `mediaId`: ID of the media.
* `userId`: ID of the user performing the action.
* `watchlist`: Target watchlist ("Currently Watching", "Want to Watch", "Hiatus", or `null`/"None" for removal).

**Process:**

1. Ensure the media belongs to the user.
2. Update the `watchlist` field in the media record, or remove the media if removing from all lists.
3. Return confirmation of update.
# Ratings Flow

## When an Update is Posted

A user posts a media update with:

* a **rating** (integer, e.g., 1–5)
* the **length of their viewing session** (`Short`, `Medium`, `Long`, etc.)

#### **IF this is the first time the user has posted an update about this media:**

* The new `MediaUpdate` is posted.

* The system calculates the user’s **weighted rating** for this media (see below).

* **In a transaction** (see Transaction Note below), the `MediaRating` table for that media is updated:
  * `SumOfRatings` has the user’s weighted rating added to its total.
  * `NumberOfRatings` is incremented by 1\.

#### **IF this is NOT the first time the user has posted an update about this media:**

* The user's **current weighted rating** for this media (across all their updates) is stored in a variable called `previousRating`.

* The new `MediaUpdate` is posted.

* The system recalculates the user's **current weighted rating** for this media, now including the new update (call this `currentRating`).

* **In a transaction**, the `MediaRating` table for that media is updated:
  * `previousRating` is subtracted from `SumOfRatings`.
  * `currentRating` is added to `SumOfRatings`.
  * `NumberOfRatings` is **not** incremented (each user only counts once per media).

---

## When an Update is Deleted

* If a user deletes a media update and it was their **last remaining update** for that media:
  * Their final weighted rating is subtracted from `SumOfRatings`.
  * `NumberOfRatings` is decremented by 1\.

* If the user has other updates for this media:
  * Their **previous weighted rating** is subtracted from `SumOfRatings`.
  * Their **current weighted rating** (after deletion) is added to `SumOfRatings`.
  * `NumberOfRatings` remains unchanged.

---

## When an Update is Edited

* The edit is treated the same as posting a new update (if not the user's first update).
* The system recalculates their **weighted rating**, subtracts the old value from `SumOfRatings`, adds the new one, and leaves `NumberOfRatings` unchanged.

---

# Calculated Properties

## MediaUpdate

* No calculated properties—just stores the user's rating and session length.

---

## Media (per user, per media)

public List\<MediaUpdate\> Updates { get; set; } \= new();

public double? Rating

{

    get

    {

        if (Updates \== null || Updates.Count \== 0)

        {

            return null;

        }

        int weightedSum \= 0;

        int totalWeight \= 0;

        foreach (var update in Updates)

        {

            int weight \= (int)update.WatchSessionLength; // Short=1, Medium=2, Long=3, etc.

            weightedSum \+= update.Rating \* weight;

            totalWeight \+= weight;

        }

        return totalWeight \> 0 ? (double)weightedSum / totalWeight : (double?)null;

    }

}

* **Explanation:** Each user's rating for a media is calculated as a **weighted average** of their ratings across all their updates for that media. Example:
  * Short (weight 1), rating 4
  * Long (weight 3), rating 3 Result: `(4×1 + 3×3) / (1+3) = (4 + 9) / 4 = 3.25`

---

## MediaRating (per media, all users)

* **Calculated Property:** `Rating = SumOfRatings / NumberOfRatings`
* `SumOfRatings` is the sum of each user's current weighted rating for this media.
* `NumberOfRatings` is the number of unique users who have rated this media (i.e., have at least one update).

---

## Summary Table Example

| User Updates | Calculation Example | Weighted Rating |
| :---- | :---- | :---- |
| Short (1), rating 5 | 5 × 1 \= 5 | 5 / 1 \= 5 |
| Short (1), rating 4 \+ Long (3), rating 3 | (4×1 \+ 3×3)/(1+3) \= (4+9)/4 | 3.25 |
| Short (1), 5; Medium (2), 3; Long (3), 4 | (5×1 \+ 3×2 \+ 4×3)/(1+2+3) \= 23/6 | \~3.83 |

---

# Transaction Note

All updates to `SumOfRatings` and `NumberOfRatings` are performed **within a database transaction** to ensure data consistency. This means:

* All related changes are made together as an atomic operation—**either everything succeeds, or nothing does.**
* If any part of the transaction fails (e.g., due to a database error or a concurrent modification), the transaction is rolled back and **no changes are saved**.

For added robustness, especially in environments with potential concurrency issues, the operation may be **retried** a set number of times before finally returning an error. Example pseudocode for retry logic:

const int maxRetries \= 3;

int attempts \= 0;

bool success \= false;

while (\!success && attempts \< maxRetries)

{

    using (var transaction \= dbContext.Database.BeginTransaction())

    {

        try

        {

            // Update logic here

            dbContext.SaveChanges();

            transaction.Commit();

            success \= true;

        }

        catch

        {

            transaction.Rollback();

            attempts\++;

            // Optionally: wait before retrying

        }

    }

}

if (\!success)

{

    // Log and/or return error to user

}
# ERD
Enum MediaStatus {
  CurrentlyWatching
  WantToWatch
  Hiatus
  Watched
  Dropped
}

Enum WatchSessionLength {
  Short
  Medium
  Long
}

// Users table: stores user account details and profile information
Table Users {
  Id nvarchar [pk]
  FirstName nvarchar [not null]
  LastName nvarchar [not null]
  Username nvarchar [not null, unique]
  Email nvarchar [not null, unique]
  PasswordHash nvarchar [not null]
  ProfilePicture nvarchar
  Bio nvarchar
  CreatedAt timestamp [default: `now()`]
  UpdatedAt timestamp [default: `now()`]
}

// Follow table tracks who a user is following
Table Follow {
  Id int [pk, increment]
  SenderId nvarchar [not null, ref: > Users.Id]
  RecipientId nvarchar [not null, ref: > Users.Id]
  CreatedAt timestamp [default: `now()`]
}

// MediaRating: tracks sitewide average for each TMDB mediaId
Table MediaRating {
  Id int [pk, increment]
  MediaApiId int
  SumOfRatings double
  NumberOfRatings int
  Rating double //calculated: SumOfRatings/NumberOfRatings
  LastUpdate timestamp [default: `now()`]
}

// Media table: user-specific "library" entries
Table Media {
  Id int [pk, increment]
  MediaApiId int [ref: > MediaRating.MediaApiId] // TMDB or similar external API id
  UserId nvarchar [ref: > Users.Id]
  Title nvarchar
  Description nvarchar
  Thumbnail nvarchar
  Rating double //calculated from MediaUpdates
  MediaStatus MediaStatus // watchlist: CurrentlyWatching, WantToWatch, Hiatus, Watched, Dropped
  CreatedAt timestamp [default: `now()`]
}

// MediaUpdate: user progress updates
Table MediaUpdate {
  Id int [pk, increment]
  MediaId int [ref: > Media.Id]
  UserId nvarchar [ref: > Users.Id]
  LastWatched nvarchar // what the user watched this session
  Description nvarchar [null]
  Rating int // min 1 max 5
  WatchSessionLength WatchSessionLength
  CreatedAt timestamp [default: `now()`]
}

// Comment: comments on updates
Table Comment {
  Id int [pk, increment]
  UpdateId int [ref: > MediaUpdate.Id]
  UserId nvarchar [ref: > Users.Id]
  Text nvarchar
  CreatedAt timestamp [default: `now()`]
}

// Like: likes for updates
Table UpdateLike {
  Id int [pk, increment]
  UpdateId int [ref: > MediaUpdate.Id]
  UserId nvarchar [ref: > Users.Id]
  CreatedAt timestamp [default: `now()`]
}

// Like: likes for comments
Table CommentLike {
  Id int [pk, increment]
  CommentId int [ref: > Comment.Id]
  UserId nvarchar [ref: > Users.Id]
  CreatedAt timestamp [default: `now()`]
}

Ref: "MediaUpdate"."Description" < "MediaUpdate"."MediaId"