"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, Bookmark, Check, Sparkles, Star } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function LandingPage() {
  const { user, isGuest, loading, enterGuestMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (user || isGuest)) router.replace("/dashboard");
  }, [loading, user, isGuest, router]);

  function tryGuestDemo() {
    enterGuestMode();
    router.push("/dashboard");
  }

  return (
    <main className="bg-sky-50">
      {/* ---------------- Hero ---------------- */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 py-20 md:grid-cols-[1.1fr,0.9fr] md:py-28">
        <div>
          <h1 className="font-display text-5xl leading-[1.08] text-ink-900 md:text-6xl">
            The reading habit you keep,
            <br />
            not the app you abandon.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-700">
            Alore keeps every shelf, page count, and stray thought about a book
            in one calm place - then turns a year of reading into a story worth
            looking back on.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-bloom-500 px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-bloom-600"
            >
              Get started free
            </Link>
            <button
              onClick={tryGuestDemo}
              className="rounded-full border border-sky-300 bg-white px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-sky-100"
            >
              Try the guest demo
            </button>
          </div>
          <p className="mt-4 text-sm text-ink-500">
            No account needed for the demo - three sample books, already
            mid-story.
          </p>
        </div>

        {/* A real preview of the product, not a decorative illustration */}
        <div className="relative">
          <div
            className="absolute -inset-6 -z-10 rounded-[2rem] bg-sky-200/70 blur-2xl"
            aria-hidden
          />
          <div className="rounded-xl2 border border-sky-100 bg-white p-4 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg text-ink-900">
                Currently Reading
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bloom-500 text-sm font-semibold text-white">
                B
              </span>
            </div>
            <PreviewCard
              title="Twisted Lies"
              author="Ana Huang"
              category="Romance"
              percent={48}
            />
            <PreviewCard
              title="Atomic Habits"
              author="James Clear"
              category="Self-Help"
              percent={18}
            />
            <PreviewCard
              title="Born a Crime"
              author="Trevor Noah"
              category="Memoir"
              percent={98}
            />
          </div>
        </div>
      </section>

      {/* ---------------- Feature strip ---------------- */}
      <section className="border-y border-sky-100 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-3">
          <Feature
            icon={<BookOpen className="text-sky-700" size={22} />}
            title="Shelves that match how you actually read"
            body="Currently Reading, Want to Read, Read, and Favourites out of the box — plus custom shelves for a book club or a genre kick."
          />
          <Feature
            icon={<Sparkles className="text-bloom-500" size={22} />}
            title="A next read, already found"
            body="Discover pulls from the categories you already love, so the next pick isn't another half hour of scrolling."
          />
          <Feature
            icon={<Star className="text-ink-700" size={22} />}
            title="Your year, reflected back"
            body="Pages read by month, genres you leaned on, and the books that earned five stars — wrapped up at year's end."
          />
        </div>
      </section>

      {/* ---------------- Closing CTA ---------------- */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <Bookmark className="mx-auto mb-5 text-sky-700" size={28} />
        <h2 className="font-display text-3xl text-ink-900">
          Start your shelf today
        </h2>
        <p className="mx-auto mt-3 max-w-md text-ink-700">
          It takes less time to add your first book than it did to read this
          sentence.
        </p>
        <Link
          href="/signup"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-bloom-500 px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-bloom-600"
        >
          <Check size={16} /> Create your free account
        </Link>
      </section>
    </main>
  );
}

function PreviewCard({
  title,
  author,
  category,
  percent,
}: {
  title: string;
  author: string;
  category: string;
  percent: number;
}) {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-lg border border-ink-100 p-3 last:mb-0">
      <div
        className="h-14 w-10 shrink-0 rounded bg-gradient-to-br from-sky-300 to-sky-500"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{title}</p>
        <p className="truncate text-xs text-ink-500">{author}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-sky-800">
            {category}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-sky-800"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="mb-3">{icon}</div>
      <h3 className="font-display text-lg text-ink-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">{body}</p>
    </div>
  );
}
