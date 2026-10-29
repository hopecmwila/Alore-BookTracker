# Alore BookTracker

A personal reading tracker - shelves, page-by-page progress, notes, discovery,
and a year-in-review - built with Next.js (App Router), Tailwind CSS, and
Supabase.

## Key Features

- **Custom Shelf Management**: Organize books into default categories (_Currently Reading_, _Want to Read_, _Read_, _Favourites_) or create personalized shelves.
- **Progress & Goal Tracking**: Log real-time page progress with visual completion bars and keep track of annual reading targets.
- **Personalized Notes**: Save private reading notes and ratings per book.
- **Automated Book Lookup**: Instantly search titles, authors, and metadata powered by external book catalog APIs with direct EPUB access links.
- **Year in Review Analytics**: Interactive dashboard visualizing annual stats, monthly progress trends, and genre breakdowns.
- **Secure Cloud Synchronization**: Protected user authentication and real-time cross-device sync powered by Supabase.

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, go to **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates
   the `profiles`, `shelves`, `books`, `book_shelves`, and `notes` tables,
   turns on Row-Level Security so every user only ever sees their own rows,
   and installs a trigger that seeds the four default shelves (**Currently
   Reading**, **Want to Read**, **Read**, **Favourites**) the moment someone
   signs up — nothing is hard-coded in the UI.
3. In **Project Settings → API**, copy the **Project URL** and **anon public**
   key.
4. By default Supabase requires email confirmation for new accounts. That's
   fine for a real deployment; while developing, you can turn it off under
   **Authentication → Providers → Email → Confirm email** if you'd rather
   sign up and land straight in the app.

## 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in the two values from step 1.3:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run it

```bash
npm install
npm run dev
```

**Try the guest demo** to explore a pre-populated library (three books mid-way
through, a couple finished with ratings, a couple on the to-read list) that
lives entirely in your browser's local storage — nothing guest-related ever
touches Supabase.

## Project structure

```
src/
  app/
    page.tsx
    login/, signup/
    dashboard/
      layout.tsx
      shelf/[slug]/
      discover/
      wrapped/
  components/
    layout/
    books/
    ui/
  lib/
    auth/AuthProvider.tsx
    library/LibraryProvider.tsx
    bookApi.ts
    pace.ts
    guestData.ts
    types.ts
supabase/schema.sql
```

## How the pieces fit together

- **Auth** (`AuthProvider`) only tracks _identity_: a real Supabase session,
  or a `isGuest` flag persisted in `localStorage`.
- **Data** (`LibraryProvider`) is the single place that reads and writes
  shelves/books/notes. Every function checks `isGuest` and either calls
  Supabase or mutates an in-memory/localStorage copy — components never
  talk to Supabase directly, so the guest experience and the real one stay
  in lock-step.
- **Search** (`bookApi.ts`) tries Open Library first; if it errors or comes
  back with fewer than five results that have cover art, it also queries
  Google Books and merges in anything Open Library missed, de-duplicated by
  title + first author.
- **EPUB detection** uses Open Library's `ebook_access`/`ia` fields (public
  domain + an Internet Archive identifier → a direct `.epub` download) and
  Google's `accessInfo.epub` block, whichever source returned the match.

## What's simplified for now

A few of the "added value" features are shipped in a working but
intentionally lighter form, so they're easy to build on rather than
overwhelming to read:

- **Year in Review** computes real stats from your own `finished_at` dates
  and ratings (pages/month, genre mix, avg rating, shortest/longest read),
  but the "export card" is a **copy-to-clipboard text summary** rather than
  a rendered, downloadable image — swapping in something like `html-to-image`
  to export the stat cards as a PNG would be a natural next step.
- **Reading pace** uses a simple `(pages remaining) / (pages so far ÷ days
since you started)` estimate — no smoothing for days you didn't read.
- **Discover** re-uses Open Library's `/subjects/{subject}.json` endpoint
  with your top genres from Read + Favourites; it doesn't yet learn from
  books you skip.
