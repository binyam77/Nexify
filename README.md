# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```-

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
## Profile Page

**Files:** `src/pages/profile.tsx` + `src/hooks/useProfile.ts` + `src/hooks/usePosts.ts`
+ `src/components/ProfileHeader.tsx` + `src/components/BioSection.tsx`
+ `src/components/EditProfileModal.tsx` + `src/components/PostGrid.tsx`
+ `src/components/UploadModal.tsx`

### Features
- Cover photo & profile photo: ቀጥታ click → upload (edit modal ሳያስፈልግ)
- Edit Profile modal: name, username, bio
- Bio: truncated + "More" toggle
- Posts grid: 3-column, tabs (Posts / Videos / Likes)
- Follow toggle + view tracking (localStorage)
- Logout → `/login`

### Connect to Backend (TODO)
| Action | Current | Future |
|---|---|---|
| Save profile | localStorage | `PUT /api/profile` |
| Upload photo | base64 localStorage | `POST /api/profile/photo` (S3) |
| New post | object URL | `POST /api/posts` (multipart) |
| Delete post | localStorage | `DELETE /api/posts/:id` |

### New User from createAccount
`useProfile` hook reads `localStorage 'nexify_profile'`.
When auth is ready: initialize profile from auth context/token.



# Nexify — Single Source of Truth Refactor ማጠቃለያ

**ዓላማ:** 1 ፖስት (ቪዲዮ/ፎቶ) የትም ገፅ ላይ ቢታይ (Home, Profile, ወደፊት Search/Explore) **ተመሳሳይ engagement data** (like, comment, save, share) ማሳየት አለበት። ከዚህ በፊት 3 disconnected "እውነቶች" ነበሩ (Profile's own state, Home's per-component hooks, FeedContext's static mock data) — አሁን **1 ብቻ** ቀርቷል: `FeedContext`።

---

## 1. `FeedContext.tsx` — ማዕከላዊ ዳታ ባንክ (Single Source of Truth)

**ሚና:** ሁሉም ፖስት እና አስተያየት ዳታ የሚቀመጥበት **ብቸኛ ቦታ**። Home ይሁን Profile፣ ማንኛውም component ፖስት ማንበብ ወይም ማዘመን ሲፈልግ ወደዚህ ብቻ ነው የሚመጣው።

**ይይዛል፦**
- `posts: FeedPost[]` — ሁሉም ፖስቶች (የተጠቃሚው + ሌሎች + mock)
- `commentsMap: Record<string, CommentItem[]>` — postId → አስተያየቶች ዝርዝር

**ተግባራት (functions) ይሰጣል፦**
| Function | ምን ያደርጋል |
|---|---|
| `addPost(post)` | አዲስ ፖስት ወደ ዝርዝሩ ይጨምራል |
| `removePost(postId)` | ፖስት ያጠፋል |
| `incrementView(postId)` | እይታ ቆጣሪ ይጨምራል |
| `toggleLike(postId)` | like/unlike ያደርጋል፣ `likesCount` ያዘምናል |
| `toggleSave(postId)` | save/unsave ያደርጋል |
| `incrementShare(postId)` | ሼር ቆጣሪ ይጨምራል |
| `addComment(postId, text, username, avatar)` | አዲስ አስተያየት ይጨምራል |
| `editComment(postId, commentId, newText)` | አስተያየት ያስተካክላል |
| `deleteComment(postId, commentId)` | አስተያየት ያጠፋል |
| `toggleCommentLike(postId, commentId)` | አስተያየት like ያደርጋል |
| `addReply` / `deleteReply` | ምላሽ ይጨምራል/ያጠፋል |

**አሁን ያለው storage:** `localStorage` (temporary)። 

**Backend ስትገባ:** እነዚህ functions **body ብቻ** ይቀየራል (React state + localStorage.setItem → `fetch`/`axios` API call)። Function signatures (parameters, return types) **አይቀየሩም** — ስለዚህ ሌላ ፋይል (Home, Profile, PostCard) ምንም መንካት አያስፈልገውም። ይሄ ነው architecture ዋጋ ያለው ምክንያት።

**የሚመጣ API endpoints ምሳሌ፦**
```
GET    /api/posts              → posts state ይተካል
GET    /api/posts/:id/comments → commentsMap[postId] ይተካል
PATCH  /api/posts/:id/like     → toggleLike body ይተካል
PATCH  /api/posts/:id/save     → toggleSave body ይተካል
POST   /api/posts/:id/share    → incrementShare body ይተካል
POST   /api/posts/:id/comments → addComment body ይተካል
```

---

## 2. `types.ts` — የዳታ ቅርፅ መግለጫ (Shape Definitions)

**ሚና:** እያንዳንዱ ዳታ (ፖስት፣ አስተያየት፣ ተጠቃሚ) ምን fields እንዳሉት የሚገልጽ ብቸኛ ቦታ።

**ዋና ዋና interfaces፦**
- **`FeedPost`** — ብቸኛው ፖስት shape (Home, Profile, ViewVideo ሁሉም ይህንን ይጠቀማሉ)። Fields: `id, userId, username, userAvatar, type, mediaUrls, caption, hashtags, likesCount, commentsCount, sharesCount, savesCount, viewsCount, createdAt, liked, saved`
- **`CommentItem`** — አስተያየት shape። Fields: `id, text, username, avatar, timestamp, likesCount, liked, replies`
- **`OtherCreator`** — ሌላ ተጠቃሚ (creator) profile shape፣ `posts: FeedPost[]` ይይዛል
- **`User`** — Auth ተጠቃሚ shape

**የጠፉ (deleted) interfaces፦** `PostMeta` (Profile ብቻ ይጠቀም የነበረ የቆየ shape) — ሙሉ በሙሉ ተወግዷል፣ ሁሉም ቦታ በ `FeedPost` ተተክቷል።

**Backend ስትገባ:** ይሄ ፋይል **database schema ንድፍ ማጣቀሻ** ይሆናል። `FeedPost` fields ማለት ማለት ይቻላል `posts` table columns ናቸው (snake_case ብቻ backend ላይ)።

---

## 3. `PostCard.tsx` — Home Feed ላይ ፖስት አሳይ (Consumer, not owner)

**ሚና:** Home feed ውስጥ 1 ፖስት (ቪዲዮ/ፎቶ) የሚያሳይ component። **የራሱ ዳታ አይይዝም** — ሁሉንም ከ `FeedContext` (በ `useFeed()`) ያነባል፣ action button ሲጫን ደግሞ `FeedContext` functions ብቻ ይጠራል።

**ከዚህ በፊት የነበረው ችግር (የተስተካከለ):** `useLike`, `useSave`, `useComments` የሚባሉ **disconnected hooks** ይጠቀም ነበር፣ እነዚህ የራሳቸውን `localStorage` key ("like:123") ይይዙ ነበር — Profile ላይ ተመሳሳይ ፖስት ቢታይ የተለየ ቁጥር ያሳይ ነበር።

**አሁን፦** `post` prop (ከ `FeedContext.posts` array ውስጥ 1 element) በቀጥታ ይጠቅሳል፣ `liked`/`likesCount` ወዘተ ከ `post` object ራሱ ይነበባል፣ toggle ሲደረግ `useFeed().toggleLike(post.id)` ብቻ ይጠራል።

**Backend ስትገባ:** ምንም አይነካም። ልክ እንዳሁኑ `useFeed()` ይጠራል፣ ውስጡ ያለው logic ብቻ (FeedContext ውስጥ) API call ይሆናል።

---

## 4. `profile.tsx` — የተጠቃሚ ገፅ (Consumer, not owner)

**ሚና:** ተጠቃሚው የራሱን ፖስቶች የሚያይበት/የሚያስተዳድርበት ገፅ።

**ከዚህ በፊት የነበረው ችግር (የተስተካከለ):** የራሱ `posts` (PostMeta[]) state ነበረው፣ `localStorage["userPostsMeta"]` ውስጥ ተለይቶ ተቀምጦ ነበር — Home's FeedContext ጋር ምንም ግንኙነት አልነበረውም። Like/comment ሲደረግ **disconnected copy** ብቻ ይቀየር ነበር።

**አሁን፦**
```ts
const myPosts = feedPosts.filter(p => p.userId === user.username);
```
Profile የራሱ post array አይይዝም — FeedContext's `posts` ን **filter ብቻ** ያደርጋል። Like/Save/Comment ሁሉም `useFeed()` functions ብቻ ይጠራሉ (ልክ PostCard እንደሚያደርገው)።

**`selectedPost` (ፖስት ተከፍቶ ሲታይ) እንዴት ይሰራል፦** ቀድሞ ራሱን የቻለ snapshot object ነበር (stale ይሆን ነበር)። አሁን `selectedPostId` (string) ብቻ ይያዛል፣ ራሱ `selectedPost` object **derived value** ነው (በየ render FeedContext ላይ fresh ፍለጋ ይደረጋል) — ይሄ ማለት like ብትነካ ወዲያውኑ ይንፀባረቃል፣ stale data አይኖርም።

**Backend ስትገባ:** `myPosts` filter ምናልባት ወደ `GET /api/posts?userId=xyz` query ይቀየራል (client-side filter ፈንታ server-side query)፣ ግን structure/logic ተመሳሳይ ይቀራል።

---

## 5. `ProfileVideo.tsx` — Profile Grid Display (Presentation only)

**ሚና:** Profile ገፅ ላይ ያለውን 3-column grid (ፖስት thumbnails) ብቻ የሚያሳይ component። **ምንም ዳታ አይይዝም**፣ `filteredPosts: FeedPost[]` prop ብቻ ይቀበላል፣ ያሳያል።

**ለውጥ:** `PostMeta` shape (`post.likes`, `post.isVideo`, `post.description`) ወደ `FeedPost` shape (`post.likesCount`, `post.type === "video"`, `post.caption`) ተቀይሯል። Blob-URL management (የቆየ `mediaUrls` prop) ጠፍቷል — FeedContext ራሱ media URLs ይይዛል።

**Backend ስትገባ:** ምንም አይነካም (pure presentational component)።

---

## 6. `ViewVideo.tsx` + `Left.tsx` — Post Player Modal (Presentation only)

**ሚና:** Profile ላይ ፖስት ተጭኖ ሲከፈት የሚታየው ሙሉ-ገፅ modal (ቪዲዮ/ፎቶ + sidebar with comments)። `Left.tsx` የ sidebar ክፍል (caption, like/save/share buttons, comments list) ነው።

**ለውጥ:** Props types ሁሉም `FeedPost`/string-based IDs እንዲጠቀሙ ተቀይረዋል (ከ `PostMeta`/number-based)። `shareCounts` disconnected prop ጠፍቶ `selectedPost.sharesCount` በቀጥታ ጥቅም ላይ ይውላል።

**Backend ስትገባ:** ምንም አይነካም (pure presentational, ሁሉም ዳታ በ props ይመጣል)።

---

## 7. `ShareModal.tsx` — Share Dialog (Presentation only)

**ሚና:** ፖስት ሲጋራ (Telegram/WhatsApp/Facebook/X/LinkedIn links + copy link) የሚታይ modal።

**ለውጥ:** Props shape `{id: number, description, isVideo, thumbnail}` → `{id: string, caption, type, mediaUrls}` (FeedPost-compatible) ተቀይሯል።

**Backend ስትገባ:** `onShareIncrement` callback ወደ FeedContext's `incrementShare` ይገናኛል (already wired)፣ ምንም ተጨማሪ አይነካም።

---

## 8. `useShare.ts` + `useToast.ts` — Share Mechanism (Independent utility, ያልተነካ)

**ሚና:** Native share sheet (mobile) ወይም clipboard copy (desktop) የሚያደርግ ትንሽ hook፣ + success/failure toast ማሳያ።

**ለውጥ:** `share()` function አሁን `Promise<boolean>` ይመልሳል (ስኬት/ውድቀት ያሳውቃል) — ስለዚህ `incrementShare` **ስኬታማ ሲሆን ብቻ** ይጠራል (ቀድሞ ሁልጊዜ ይጠራ ነበር፣ cancel ቢደረግ እንኳ)።

**Backend ስትገባ:** `// TODO: POST /api/shares` የሚል comment አለበት፣ ወደፊት analytics-logging endpoint ሊጨመርበት ይችላል፣ ግን core share mechanism (native share/clipboard) አይነካም።

---

## የተወገዱ (Deleted) Dead Files

እነዚህ ፋይሎች **disconnected/duplicate state stores** ስለነበሩ ወይም **orphan (የትም import ያልተደረጉ)** ስለነበሩ ሙሉ በሙሉ ጠፍተዋል፦

| ፋይል | ለምን ጠፋ |
|---|---|
| `useLike.ts` | Own `localStorage["like:id"]` — FeedContext's `toggleLike` ተክቷል |
| `useSave.ts` | Own `localStorage["save:id"]` — FeedContext's `toggleSave` ተክቷል |
| `useComments.ts` | Own `localStorage["comments:id"]` — FeedContext's comment functions ተክተውታል |
| `VideoCard.tsx` | Orphan (የትም import ያልተደረገ)፣ `PostCard.tsx` ተክቶታል |
| `useLocalStorageState.ts` | Orphan (ከላይ 3ቱ ብቻ ይጠቀሙት ነበር) |
| `PostMeta` interface (types.ts ውስጥ) | Profile ብቻ ይጠቀም የነበረ disconnected shape፣ `FeedPost` ተክቶታል |

---

## Backend ስትገባ — አጠቃላይ የስራ ቅደም ተከተል

1. **Database schema** — `types.ts` ውስጥ ያለው `FeedPost`/`CommentItem` shape ን መሰረት አድርገህ `posts`, `comments` tables ንደፍ (snake_case column names)
2. **API endpoints** — ከላይ FeedContext ሰንጠረዥ ውስጥ የተዘረዘሩትን endpoints Express ላይ ገንባ
3. **FeedContext.tsx ብቻ ቀይር** — እያንዳንዱ function's `localStorage`/React state logic ን በ `fetch(...)` API call ተካ። Function signature (parameters/return type) አትቀይር
4. **ሌላ ፋይል (PostCard, Profile, ProfileVideo, ViewVideo, Left, ShareModal) ምንም አይነኩም** — ሁሉም `useFeed()` በኩል ብቻ ነው ከዳታ ጋር የሚገናኙት

ይሄ ነው Single Source of Truth architecture ትልቁ ጥቅም፦ **1 ፋይል ብቻ (FeedContext) ቀይረህ፣ ሙሉ app ወደ real backend ትቀይራለህ።**