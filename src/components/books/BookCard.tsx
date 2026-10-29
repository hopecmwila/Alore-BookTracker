"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import type { Book } from "@/lib/types";
import { useLibrary } from "@/lib/library/LibraryProvider";
import { useBookModal } from "@/lib/library/BookModalContext";
import { useToast } from "@/components/ui/Toast";
import { CategoryBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { celebrate } from "./confetti";

export function BookCard({ book }: { book: Book }) {
  const { updateProgress, toggleFavourite } = useLibrary();
  const { openBook } = useBookModal();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const percent = book.page_count
    ? Math.min(100, Math.round((book.current_page / book.page_count) * 100))
    : 0;

  async function handleQuickAdvance(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const { justFinished } = await updateProgress(
        book.id,
        book.current_page + 10,
      );
      if (justFinished) {
        celebrate();
        showToast(`Finished "${book.title}" — nice work!`, "success");
      }
    } catch {
      showToast("Couldn't update progress. Try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleFavourite(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await toggleFavourite(book.id);
    } catch {
      showToast("Couldn't update favourites.", "error");
    }
  }

  return (
    <div
      onClick={() => openBook(book.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && openBook(book.id)}
      className="group flex cursor-pointer gap-4 rounded-xl2 border border-ink-100 bg-white p-4 shadow-card transition hover:border-sky-200 hover:shadow-lg"
    >
      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-sky-100">
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-center text-[10px] font-medium text-sky-700">
            {book.title}
          </div>
        )}
        <button
          onClick={handleFavourite}
          aria-label={
            book.is_favourite ? "Remove from favourites" : "Add to favourites"
          }
          aria-pressed={book.is_favourite}
          className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-ink-500 hover:text-bloom-500"
        >
          <Star
            size={13}
            fill={book.is_favourite ? "currentColor" : "none"}
            className={book.is_favourite ? "text-bloom-500" : ""}
          />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <p className="truncate text-sm font-semibold uppercase tracking-wide text-ink-900">
            {book.title}
          </p>
          <p className="truncate text-sm text-ink-500">
            {book.authors.join(", ") || "Unknown author"}
          </p>
          {book.categories[0] && (
            <div className="mt-1.5">
              <CategoryBadge label={book.categories[0]} />
            </div>
          )}
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-ink-700">
            Progress: {percent}%
          </p>
          <ProgressBar percent={percent} />
          {book.page_count ? (
            <button
              onClick={handleQuickAdvance}
              disabled={busy || book.current_page >= book.page_count}
              className="mt-2 rounded-full border border-sky-300 px-2.5 py-1 text-xs font-semibold text-sky-800 transition hover:bg-sky-50 disabled:cursor-default disabled:opacity-40"
            >
              +10 pages
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
