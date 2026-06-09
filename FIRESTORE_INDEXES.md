# Firestore Indexes

This document enumerates every Firestore index the project depends on, the
exact query that hits it, and the page/feature that consumes the result. If you
add a new query that combines a `where()` with an `orderBy()` on a different
field, or adds a second `where()` to an existing query, **add the index here
first** and create it in the Firebase console before shipping the code.

The Firestore emulator prints the required composite index in its log and the
production client throws a link you can click to create one automatically — but
neither is a substitute for documenting the index up front.

---

## Quick reference

| # | Index                                            | Purpose                       | Backed by query              |
|---|--------------------------------------------------|-------------------------------|------------------------------|
| 1 | `categoryId ASC, updatedAt DESC`                 | Category page                 | `getWallpapersByCategoryServer` / `subscribeToWallpapersByCategory` |
| 2 | `categoryId ASC, visible ASC, downloads DESC, __name__ DESC` | Related wallpapers on detail page | `getRelatedWallpapersServer` / `getRelatedWallpapersFromFirestore` |
| 3 | `featured ASC, updatedAt DESC`                   | Featured rail                 | `getFeaturedWallpapersServer` / `getFeaturedWallpapersFromFirestore` |
| 4 | `trending ASC, updatedAt DESC`                   | Trending rail                 | `getTrendingWallpapersServer` / `getTrendingWallpapersFromFirestore` |
| 5 | `tags ARRAY, updatedAt DESC`                    | Tag page                      | `getWallpapersByTagServer` / `subscribeToWallpapersByTag` |
| 6 | `visible ASC, updatedAt DESC`                    | Sitemap / published + drafts  | `getPublishedWallpapersServer` / `getDraftsServer` |
| 7 | `titleLower ASC, titleLower ASC`                 | Search                        | `searchWallpapersServer` (range) |
| 8 | `categories: name ASC` *(single-field)*          | Category sidebar              | `listCategoriesServer` |
| 9 | `tags: name ASC` *(single-field)*                | Tag sidebar                   | `listTagsServer` |
| 10 | `roles.{role} ASC, displayName ASC`             | Admin team page               | `getAdminsFromFirestore` / `getModeratorsFromFirestore` |
| 11 | `views DESC` *(single-field)*                   | Most-viewed rail              | `getMostViewedWallpapersServer` / `getMostViewedWallpapersFromFirestore` |
| 12 | `downloads DESC` *(single-field)*               | Popular / most-downloaded rail| `getPopularWallpapersServer` / `getPopularWallpapersFromFirestore` |
| 13 | `updatedAt DESC` *(single-field)*               | Recent wallpapers rail        | `getRecentWallpapersServer` / `getRecentWallpapersFromFirestore` |
| 14 | `editedAt DESC` *(collection-group)*            | Recent edits panel            | `getRecentEditsFromFirestore` |

Indexes 1–7 and 10 are **composite** and must be created manually. 8, 9, 11–14
Firestore creates automatically (single-field, no composite needed).

---

## Composite indexes

Create these in **Firestore Database → Indexes → Add index** (or use the URL
Firebase prints in the error log).

### 1. `categoryId ASC, updatedAt DESC`

- **Collection:** `wallpapers`
- **Query shape:**
  ```ts
  query(collection(db, "wallpapers"),
    where("categoryId", "==", categoryId),
    orderBy("updatedAt", "desc"))
  ```
- **Used by:**
  - `app/categories/[categoryId]/page.tsx` (server, SEO)
  - `app/components/CategoryPageContent.tsx` (client realtime)
  - `lib/wallpaper-store.ts:subscribeToWallpapersByCategory`
- **Why both `where` and `orderBy`:** category filters always render in
  newest-first order. Filtering on the client after a `collection.get()` would
  download every wallpaper; the composite index keeps the read bounded.

### 2. `categoryId ASC, visible ASC, downloads DESC, __name__ DESC`

- **Collection:** `wallpapers`
- **Query shape:**
  ```ts
  query(collection(db, "wallpapers"),
    where("categoryId", "==", categoryId),
    where("visible", "!=", false),
    orderBy("downloads", "desc"))
  ```
- **Self-exclusion:** Firestore allows at most one `!=` per query (Standard
  edition), so excluding the current wallpaper is done client-side after
  the fetch. The query asks for `pageSize + 1` documents to make up for
  the one we drop.
- **Used by:**
  - `lib/wallpaper-store-server.ts:getRelatedWallpapersServer`
  - `lib/wallpaper-store.ts:getRelatedWallpapersFromFirestore`
  - `app/wallpaper/[slug]/page.tsx` — "More in this category" rail.
- **Why these fields:** we need the same category, hide drafts, and order
  by most-downloaded within the category. The `!=` filter plus the
  `orderBy("downloads")` plus the `__name__` tiebreaker require this
  exact composite; missing any field throws `FAILED_PRECONDITION` at
  runtime.
- **Substitute for missing `!=` support:** Firestore has no
  `not-in`/multi-`!=` composite, but a `!="<sentinel>"` clause can be expressed
  as long as the field is the last one in the index and is `ASC`/single-valued
  — which is what we do here.

### 3. `featured ASC, updatedAt DESC`

- **Collection:** `wallpapers`
- **Query shape:**
  ```ts
  query(collection(db, "wallpapers"),
    where("featured", "==", true),
    orderBy("updatedAt", "desc"))
  ```
- **Used by:**
  - `lib/wallpaper-store-server.ts:getFeaturedWallpapersServer`
  - `lib/wallpaper-store.ts:getFeaturedWallpapersFromFirestore`
  - `app/featured/page.tsx`, homepage featured rail.

### 4. `trending ASC, updatedAt DESC`

- **Collection:** `wallpapers`
- **Query shape:**
  ```ts
  query(collection(db, "wallpapers"),
    where("trending", "==", true),
    orderBy("updatedAt", "desc"))
  ```
- **Used by:**
  - `lib/wallpaper-store-server.ts:getTrendingWallpapersServer`
  - `lib/wallpaper-store.ts:getTrendingWallpapersFromFirestore`
  - `app/popular/page.tsx` "Trending this week" section.

### 5. `tags ARRAY, updatedAt DESC`

- **Collection:** `wallpapers`
- **Query shape:**
  ```ts
  query(collection(db, "wallpapers"),
    where("tags", "array-contains", tag),
    orderBy("updatedAt", "desc"))
  ```
- **Used by:**
  - `lib/wallpaper-store-server.ts:getWallpapersByTagServer`
  - `lib/wallpaper-store-server.ts:searchWallpapersServer` (when `tag` filter set)
  - `lib/wallpaper-store.ts:subscribeToWallpapersByTag`
  - `app/tag/[tagId]/page.tsx`, search page with tag filter.

### 6. `visible ASC, updatedAt DESC`

- **Collection:** `wallpapers`
- **Query shape:**
  ```ts
  query(collection(db, "wallpapers"),
    where("visible", "==", true),        // published
    orderBy("updatedAt", "desc"))

  query(collection(db, "wallpapers"),
    where("visible", "==", false),       // drafts
    orderBy("updatedAt", "desc"))
  ```
- **Used by:**
  - `lib/wallpaper-store-server.ts:getPublishedWallpapersServer`
  - `lib/wallpaper-store-server.ts:getDraftsServer`
  - `lib/wallpaper-store.ts:getPublishedWallpapersFromFirestore`
  - `lib/wallpaper-store.ts:getDraftsFromFirestore`
  - `app/sitemap.xml/route.ts` (sitemap only renders `visible == true` rows)
  - `app/admin/AdminContent.tsx` — Drafts tab consumes the `== false` variant.
- **Why a single index serves both:** equality on the leading field + range on
  the second is the textbook composite shape. Equality (`==`) on `visible`
  filters down to either published or draft docs; `orderBy("updatedAt", "desc")`
  gives a stable, bounded read.

### 7. `titleLower ASC, titleLower ASC` (range)

- **Collection:** `wallpapers`
- **Query shape:**
  ```ts
  query(collection(db, "wallpapers"),
    where("titleLower", ">=", lower),
    where("titleLower", "<", lower + "\uf8ff"),
    orderBy("titleLower", "asc"))
  ```
- **Used by:** `lib/wallpaper-store-server.ts:searchWallpapersServer`.
- **Why we add the index manually even though it's "just two equal fields":**
  Firestore's auto-index covers a single range. Two range clauses on the same
  field still need a composite with that field listed twice (once `ASC`). The
  `\uf8ff` trick is the standard prefix-search trick (a private-use code point
  that sorts after every standard character).

---

## Single-field indexes (automatic)

Firestore creates these for you the first time the query runs, but they are
listed here for completeness because every read in the codebase assumes they
exist.

| # | Field        | Used by                                       |
|---|--------------|-----------------------------------------------|
| 8 | `categories.name ASC` | `listCategoriesServer` (category sidebar) |
| 9 | `tags.name ASC`       | `listTagsServer` (tag sidebar)            |
| 11| `views DESC`         | `getMostViewedWallpapersServer` (Most-viewed rail on `/popular`) |
| 12| `downloads DESC`     | `getPopularWallpapersServer` (Most-downloaded rail on `/popular`) |
| 13| `updatedAt DESC`     | `getRecentWallpapersServer` (`/recent` page) |
| 14| `wallpaperEdits.editedAt DESC` (collection group) | `getRecentEditsFromFirestore` (admin dashboard) |

> **Why `views` and `downloads` are denormalized onto the wallpaper doc:**
> we previously tried to sort by `wallpaperStats/{id}.downloads` but that
> required a cross-collection join or a Cloud Function that re-aggregated on
> every increment. Mirroring the counter onto the wallpaper doc costs one
> extra `FieldValue.increment` write per view/download but turns the
> "most downloaded" query into a single-field `orderBy` that Firestore
> indexes automatically. Source of truth remains `wallpaperStats/{id}` for
> analytics; the wallpaper doc is the read-optimized projection.

### 10. `roles.{role} ASC, displayName ASC`

- **Collection:** `users`
- **Query shape:**
  ```ts
  query(collection(db, "users"),
    where(`roles.${role}`, "==", true),     // role ∈ {"admin", "moderator"}
    orderBy("displayName", "asc"))
  ```
- **Used by:**
  - `lib/users.ts:getAdminsFromFirestore` / `getModeratorsFromFirestore`
  - `lib/users-server.ts:getAdminsServer` / `getModeratorsServer`
  - `app/admin/AdminContent.tsx` — Team tab.
- **Why we have to declare it:** Firestore's map-field queries
  (`roles.admin == true`) need the dotted path as the leading field of a
  composite. The path is dynamic (`roles.admin` vs `roles.moderator`), so we
  need **two** composite indexes — one per role:
  - `roles.admin ASC, displayName ASC`
  - `roles.moderator ASC, displayName ASC`

---

## Field maintenance rules

These rules exist so the indexes above keep working. They live as code paths
in the codebase, not in Firestore rules, because the denormalization must run
on every write.

1. **`titleLower` is maintained on every title write.**
   `applyWallpaperEdit` in `lib/wallpaper-store.ts` re-computes
   `titleLower: title.toLowerCase()` whenever the title is in the edit diff.
   The upload form pre-fills the same value.

2. **`visible` defaults to `true` on every new wallpaper.**
   `lib/wallpaper-store-server.ts:normalizeWallpaper` and the matching client
   normalizer set `visible: true` when the field is missing. The Drafts tab
   uses `visible === false` to filter.

3. **`views`, `downloads`, `likes`, `favorites` are denormalized counters.**
   `lib/firestore.ts` writes both `wallpaperStats/{id}` and `wallpapers/{id}`
   in the same `writeBatch` using `FieldValue.increment`. Never read the
   counter from `wallpaperStats/{id}` for ranking — always read from the
   wallpaper doc. The `wallpaperStats` collection is for analytics only.

4. **`updatedAt` is bumped on every edit.**
   `applyWallpaperEdit` writes `updatedAt: serverTimestamp()` for every diff
   so the published/drafts/category/tag orderings stay correct.

5. **Slug is the doc ID and is intentionally not editable.**
   Renaming the doc would orphan every `/wallpaper/[slug]` URL and every
   `wallpaperEdits/{slug}/...` sub-collection. The admin modal exposes a
   read-only slug field.

---

## How to add a new index

1. Write the query in code first (server + client both).
2. Run the query against the Firestore emulator. It will print a link like
   `https://console.firebase.google.com/v1/r/project/.../indexes?create_composite=...`.
3. Open the link, review the proposed index, click **Create**.
4. Add a row to the table in the **Composite indexes** section above and
   describe which page/feature uses the query.
5. Commit `FIRESTORE_INDEXES.md` in the same PR as the code change.

If the query is server-side only and you cannot run the emulator, hand-write
the index spec and add it via the Firebase console directly — the format is
`<collection> <field1 direction> <field2 direction>`.

---

## Troubleshooting

- **`FAILED_PRECONDITION: The query requires an index.`**
  The error message contains a `create_composite` link. Click it, confirm, wait
  ~1 min, retry.

- **Reads are slow / costing more than expected.**
  Check the Firebase console's **Usage** tab. If a query is doing a full
  collection scan, it will show up as `documents_read: <huge>`. Add the
  composite index for that query.

- **Index already exists with a different shape.**
  Firestore does not auto-replace. Delete the old index, then create the new
  one. Index builds are non-blocking but can take a few minutes on large
  collections.
