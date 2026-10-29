"use client";

import { Menu, Plus, Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useLibrary } from "@/lib/library/LibraryProvider";
import { useBookModal } from "@/lib/library/BookModalContext";
import { AvatarMenu } from "./AvatarMenu";

export function Header({
  onOpenMenu,
  onAddBook,
}: {
  onOpenMenu: () => void;
  onAddBook: () => void;
}) {
  const { books } = useLibrary();
  const { openBook } = useBookModal();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return books
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.authors.some((a) => a.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [books, query]);

  function selectResult(id: string) {
    openBook(id);
    setQuery("");
    setFocused(false);
    inputRef.current?.blur();
  }

  return (
    <header className="flex items-center gap-3 border-b border-ink-100 bg-white px-4 py-3 md:px-8">
      <button
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="text-ink-700 md:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder="Search for books…"
          aria-label="Search your library"
          className="w-full rounded-full border border-ink-100 bg-ink-100/40 py-2 pl-9 pr-8 text-sm text-ink-900 outline-none focus:border-sky-400 focus:bg-white"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-900"
          >
            <X size={14} />
          </button>
        )}

        {focused && query && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
            {results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ink-500">
                No books match &ldquo;{query}&rdquo;.
              </p>
            ) : (
              results.map((b) => (
                <button
                  key={b.id}
                  onMouseDown={() => selectResult(b.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-sky-50"
                >
                  <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-sky-200">
                    {b.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.cover_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink-900">
                      {b.title}
                    </span>
                    <span className="block truncate text-xs text-ink-500">
                      {b.authors.join(", ")}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <button
        onClick={onAddBook}
        className="hidden items-center gap-1.5 rounded-full bg-sky-800 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-900 sm:flex"
      >
        <Plus size={16} /> Add book
      </button>
      <button
        onClick={onAddBook}
        aria-label="Add book"
        className="flex items-center justify-center rounded-full bg-sky-800 p-2 text-white sm:hidden"
      >
        <Plus size={18} />
      </button>

      <AvatarMenu />
    </header>
  );
}
