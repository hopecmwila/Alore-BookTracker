"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useLibrary } from "@/lib/library/LibraryProvider";
import { useToast } from "@/components/ui/Toast";
import { fetchBooksBySubject } from "@/lib/bookApi";
import type { BookSearchResult } from "@/lib/types";

function topCategories(categorised: string[][], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const cats of categorised) {
    for (const raw of cats) {
      const key = raw.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

export default function DiscoverPage() {
  const { books, shelves, addBookFromSearch } = useLibrary();
  const { showToast } = useToast();
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [subjectsUsed, setSubjectsUsed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  const readShelf = shelves.find((s) => s.slug === "read");
  const seedCategories = useMemo(() => {
    const readBooks = readShelf
      ? books.filter((b) => b.shelf_id === readShelf.id || b.is_favourite)
      : books.filter((b) => b.is_favourite);
    return topCategories(
      readBooks.map((b) => b.categories),
      3,
    );
  }, [books, readShelf]);

  const ownedTitles = useMemo(
    () => new Set(books.map((b) => b.title.toLowerCase())),
    [books],
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const subjects =
        seedCategories.length > 0
          ? seedCategories
          : ["fiction", "self-help", "fantasy"];
      try {
        const batches = await Promise.all(
          subjects.map((s) => fetchBooksBySubject(s, 8).catch(() => [])),
        );
        if (cancelled) return;
        const merged: BookSearchResult[] = [];
        const seen = new Set<string>();
        for (const batch of batches) {
          for (const item of batch) {
            const key = item.title.toLowerCase();
            if (seen.has(key) || ownedTitles.has(key)) continue;
            seen.add(key);
            merged.push(item);
          }
        }
        setResults(merged);
        setSubjectsUsed(subjects);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedCategories.join("|")]);

  async function handleAdd(result: BookSearchResult) {
    setAddingId(result.id);
    try {
      await addBookFromSearch(result, "want-to-read");
      showToast(`Added "${result.title}" to Want to Read.`, "success");
    } catch {
      showToast("Couldn't add that book.", "error");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink-900">Next Great Read</h1>
      <p className="mt-1 text-sm text-ink-500">
        {subjectsUsed.length > 0
          ? `Picked because you read a lot of ${subjectsUsed.join(", ")}.`
          : "Rate a few books as favourites and this will get more personal."}
      </p>

      {loading ? (
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-ink-500">
          <Loader2 size={16} className="animate-spin" /> Finding
          recommendations…
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((result) => (
            <div
              key={`${result.source}-${result.id}`}
              className="group relative overflow-hidden rounded-xl2 border border-ink-100 bg-white shadow-card"
            >
              <div className="aspect-[2/3] w-full bg-sky-100">
                {result.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.cover_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-3 text-center text-xs font-medium text-sky-700">
                    {result.title}
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {result.title}
                </p>
                <p className="truncate text-xs text-ink-500">
                  {result.authors.join(", ") || "Unknown"}
                </p>
              </div>
              <button
                onClick={() => handleAdd(result)}
                disabled={addingId === result.id}
                aria-label={`Add ${result.title} to Want to Read`}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sky-800 opacity-0 shadow transition group-hover:opacity-100 hover:bg-sky-50 disabled:opacity-100"
              >
                <Plus size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
