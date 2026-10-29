"use client";

import { BookOpenCheck, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useLibrary } from "@/lib/library/LibraryProvider";
import { searchBooks } from "@/lib/bookApi";
import type { BookSearchResult } from "@/lib/types";

const SHELF_OPTIONS = [
  { slug: "want-to-read", label: "Want to Read" },
  { slug: "currently-reading", label: "Currently Reading" },
  { slug: "read", label: "Read" },
];

export function AddBookModal({ onClose }: { onClose: () => void }) {
  const { addBookFromSearch } = useLibrary();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await searchBooks(query);
        setResults(found);
      } catch {
        showToast(
          "Search failed — check your connection and try again.",
          "error",
        );
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleAdd(result: BookSearchResult, shelfSlug: string) {
    setAddingId(result.id);
    try {
      await addBookFromSearch(result, shelfSlug);
      showToast(`Added "${result.title}".`, "success");
      onClose();
    } catch {
      showToast("Couldn't add that book. Try again.", "error");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <Modal title="Add a book" onClose={onClose} widthClass="max-w-xl">
      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or author…"
          className="w-full rounded-full border border-ink-100 bg-ink-100/40 py-2.5 pl-9 pr-4 text-sm text-ink-900 outline-none focus:border-sky-400 focus:bg-white"
        />
      </div>

      <div className="max-h-96 space-y-3 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-500">
            <Loader2 size={16} className="animate-spin" /> Searching Open
            Library…
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-500">
            No books found for &ldquo;{query}&rdquo;.
          </p>
        )}

        {!loading &&
          results.map((result) => (
            <div
              key={`${result.source}-${result.id}`}
              className="flex gap-3 rounded-lg border border-ink-100 p-3"
            >
              <div className="h-20 w-14 shrink-0 overflow-hidden rounded bg-sky-100">
                {result.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.cover_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">
                  {result.title}
                </p>
                <p className="truncate text-xs text-ink-500">
                  {result.authors.join(", ") || "Unknown author"}
                </p>
                {result.epub_available && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <BookOpenCheck size={12} /> Full text / EPUB available
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SHELF_OPTIONS.map((opt) => (
                    <button
                      key={opt.slug}
                      disabled={addingId === result.id}
                      onClick={() => handleAdd(result, opt.slug)}
                      className="rounded-full border border-sky-300 px-2.5 py-1 text-[11px] font-semibold text-sky-800 hover:bg-sky-50 disabled:opacity-50"
                    >
                      {addingId === result.id ? "Adding…" : `+ ${opt.label}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

        {!query && (
          <p className="py-8 text-center text-sm text-ink-500">
            Start typing to search Open Library, with Google Books as a
            fallback.
          </p>
        )}
      </div>
    </Modal>
  );
}
