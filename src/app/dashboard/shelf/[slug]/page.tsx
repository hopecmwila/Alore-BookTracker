"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useLibrary } from "@/lib/library/LibraryProvider";
import { BookGrid } from "@/components/books/BookGrid";
import { ShelfGridSkeleton } from "@/components/ui/Skeleton";

const EMPTY_COPY: Record<string, { title: string; body: string }> = {
  "currently-reading": {
    title: "Nothing in progress",
    body: "Add a book and set it to Currently Reading to start tracking pages.",
  },
  "want-to-read": {
    title: "Your to-read list is empty",
    body: "Found something in Discover or search? Add it here first.",
  },
  read: {
    title: "No finished books yet",
    body: "Once you finish a book, it lands here automatically.",
  },
  favourites: {
    title: "No favourites yet",
    body: "Tap the star on any book to pin it here.",
  },
};

export default function ShelfPage({ params }: { params: { slug: string } }) {
  const { shelves, booksForShelf, loading, deleteCustomShelf } = useLibrary();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const shelf = shelves.find((s) => s.slug === params.slug);

  if (loading) return <ShelfGridSkeleton />;

  if (!shelf) {
    return (
      <p className="text-sm text-ink-500">
        That shelf doesn&rsquo;t exist (anymore).
      </p>
    );
  }

  const books = booksForShelf(shelf);
  const empty = EMPTY_COPY[shelf.slug] ?? {
    title: "This shelf is empty",
    body: "Open a book and add it to this shelf to see it here.",
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink-900">{shelf.name}</h1>
        {shelf.kind === "custom" &&
          (confirmingDelete ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink-700">Delete this shelf?</span>
              <button
                onClick={() => deleteCustomShelf(shelf.id)}
                className="font-semibold text-rose-600 hover:underline"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-ink-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-rose-600"
            >
              <Trash2 size={14} /> Delete shelf
            </button>
          ))}
      </div>

      <BookGrid books={books} emptyTitle={empty.title} emptyBody={empty.body} />
    </div>
  );
}
