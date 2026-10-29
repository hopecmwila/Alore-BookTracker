import { BookOpen } from "lucide-react";
import type { Book } from "@/lib/types";
import { BookCard } from "./BookCard";

export function BookGrid({
  books,
  emptyTitle = "Nothing here yet",
  emptyBody = "Add a book to get started.",
}: {
  books: Book[];
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-ink-100 py-20 text-center">
        <BookOpen size={28} className="mb-3 text-ink-300" />
        <p className="font-display text-lg text-ink-900">{emptyTitle}</p>
        <p className="mt-1 max-w-xs text-sm text-ink-500">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
