"use client";

import { BookOpenCheck, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CategoryBadge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useLibrary } from "@/lib/library/LibraryProvider";
import { useBookModal } from "@/lib/library/BookModalContext";
import { estimateCompletion, formatEstimatedDate } from "@/lib/pace";
import { celebrate } from "./confetti";

const STATUS_SHELVES = [
  { slug: "want-to-read", label: "Want to Read" },
  { slug: "currently-reading", label: "Currently Reading" },
  { slug: "read", label: "Read" },
];

export function BookDetailModal({ bookId }: { bookId: string }) {
  const { closeBook } = useBookModal();
  const { showToast } = useToast();
  const {
    books,
    shelves,
    notesForBook,
    updateProgress,
    moveToStatusShelf,
    toggleFavourite,
    rateBook,
    deleteBook,
    addToCustomShelf,
    removeFromCustomShelf,
    addNote,
    updateNote,
    deleteNote,
  } = useLibrary();

  const book = books.find((b) => b.id === bookId);
  const [pageDraft, setPageDraft] = useState(String(book?.current_page ?? 0));
  const [noteDraft, setNoteDraft] = useState("");
  const [savingPage, setSavingPage] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const notes = notesForBook(bookId);
  const customShelves = useMemo(
    () => shelves.filter((s) => s.kind === "custom"),
    [shelves],
  );
  const currentShelf = shelves.find((s) => s.id === book?.shelf_id);
  const pace = useMemo(() => (book ? estimateCompletion(book) : null), [book]);

  if (!book) return null;

  const percent = book.page_count
    ? Math.min(100, Math.round((book.current_page / book.page_count) * 100))
    : 0;

  async function savePage() {
    const parsed = parseInt(pageDraft, 10);
    if (Number.isNaN(parsed)) return;
    setSavingPage(true);
    try {
      const { justFinished } = await updateProgress(book!.id, parsed);
      if (justFinished) {
        celebrate();
        showToast(`Finished "${book!.title}" — nice work!`, "success");
      }
    } catch {
      showToast("Couldn't save progress.", "error");
    } finally {
      setSavingPage(false);
    }
  }

  async function handleAddNote() {
    if (!noteDraft.trim()) return;
    try {
      await addNote(book!.id, noteDraft.trim());
      setNoteDraft("");
    } catch {
      showToast("Couldn't save that note.", "error");
    }
  }

  async function handleDelete() {
    try {
      await deleteBook(book!.id);
      showToast("Book removed.", "info");
      closeBook();
    } catch {
      showToast("Couldn't remove that book.", "error");
    }
  }

  return (
    <Modal title={book.title} onClose={closeBook} widthClass="max-w-2xl">
      <div className="flex gap-5">
        <div className="h-40 w-28 shrink-0 overflow-hidden rounded-lg bg-sky-100">
          {book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-500">
            {book.authors.join(", ") || "Unknown author"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {book.categories.map((c) => (
              <CategoryBadge key={c} label={c} />
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => toggleFavourite(book.id)}
              className="flex items-center gap-1 text-sm font-medium text-ink-700 hover:text-bloom-500"
            >
              <Star
                size={16}
                fill={book.is_favourite ? "currentColor" : "none"}
                className={book.is_favourite ? "text-bloom-500" : ""}
              />
              Favourite
            </button>
            {book.epub_available && book.epub_download_url && (
              <a
                href={book.epub_download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
              >
                <BookOpenCheck size={16} /> Read / Download EPUB
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Shelf + progress */}
      <div className="mt-5 border-t border-ink-100 pt-5">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {STATUS_SHELVES.map((opt) => (
            <button
              key={opt.slug}
              onClick={() => moveToStatusShelf(book.id, opt.slug)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                currentShelf?.slug === opt.slug
                  ? "bg-sky-800 text-white"
                  : "border border-sky-300 text-sky-800 hover:bg-sky-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {book.page_count ? (
          <>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-ink-700">
                Progress: {percent}%
              </span>
              <span className="text-ink-500">
                {book.current_page} / {book.page_count} pages
              </span>
            </div>
            <ProgressBar percent={percent} animate={false} />

            <div className="mt-3 flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={book.page_count}
                value={Number(pageDraft) || 0}
                onChange={(e) => setPageDraft(e.target.value)}
                onMouseUp={savePage}
                onTouchEnd={savePage}
                className="h-2 flex-1 accent-sky-800"
                aria-label="Current page"
              />
              <input
                type="number"
                min={0}
                max={book.page_count}
                value={pageDraft}
                onChange={(e) => setPageDraft(e.target.value)}
                onBlur={savePage}
                className="w-20 rounded-lg border border-ink-100 px-2 py-1 text-sm"
                disabled={savingPage}
              />
            </div>

            {pace?.hasEnoughData && percent < 100 && (
              <p className="mt-2 text-xs text-ink-500">
                At ~{pace.avgPagesPerDay} pages/day, estimated finish:{" "}
                {formatEstimatedDate(pace.estimatedDate)}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-500">
            No page count on file for this book yet.
          </p>
        )}
      </div>

      {/* Rating (only meaningful once read) */}
      {currentShelf?.slug === "read" && (
        <div className="mt-5 border-t border-ink-100 pt-5">
          <p className="mb-2 text-sm font-medium text-ink-700">Your rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => rateBook(book.id, n)}
                aria-label={`Rate ${n} stars`}
              >
                <Star
                  size={22}
                  fill={(book.rating ?? 0) >= n ? "currentColor" : "none"}
                  className={
                    (book.rating ?? 0) >= n ? "text-amber-400" : "text-ink-300"
                  }
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom shelves */}
      {customShelves.length > 0 && (
        <div className="mt-5 border-t border-ink-100 pt-5">
          <p className="mb-2 text-sm font-medium text-ink-700">
            Also on these shelves
          </p>
          <div className="flex flex-wrap gap-1.5">
            {customShelves.map((shelf) => (
              <ShelfToggle
                key={shelf.id}
                label={shelf.name}
                bookId={book.id}
                shelfId={shelf.id}
                onAdd={addToCustomShelf}
                onRemove={removeFromCustomShelf}
              />
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="mt-5 border-t border-ink-100 pt-5">
        <p className="mb-2 text-sm font-medium text-ink-700">
          Notes &amp; quotes
        </p>
        <div className="mb-3 flex gap-2">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Jot down a quote or a thought…"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-ink-100 p-2 text-sm outline-none focus:border-sky-400"
          />
          <button
            onClick={handleAddNote}
            className="self-end rounded-lg bg-sky-800 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-900"
          >
            Save
          </button>
        </div>
        {notes.length > 0 && (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li
                key={note.id}
                className="group rounded-lg bg-ink-100/40 p-3 text-sm text-ink-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <EditableNote
                    content={note.content}
                    onSave={(c) => updateNote(note.id, c)}
                  />
                  <button
                    onClick={() => deleteNote(note.id)}
                    aria-label="Delete note"
                    className="shrink-0 text-ink-300 opacity-0 hover:text-rose-600 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Danger zone */}
      <div className="mt-5 border-t border-ink-100 pt-4">
        {confirmingDelete ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-700">
              Remove this book from your library?
            </span>
            <button
              onClick={handleDelete}
              className="font-semibold text-rose-600 hover:underline"
            >
              Yes, remove
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
            className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-rose-600"
          >
            <Trash2 size={14} /> Remove book
          </button>
        )}
      </div>
    </Modal>
  );
}

function EditableNote({
  content,
  onSave,
}: {
  content: string;
  onSave: (content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  if (editing) {
    return (
      <div className="flex-1">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-sky-300 bg-white p-2 text-sm outline-none"
        />
        <div className="mt-1 flex gap-3 text-xs font-semibold">
          <button
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
            className="text-sky-800 hover:underline"
          >
            Save
          </button>
          <button
            onClick={() => {
              setDraft(content);
              setEditing(false);
            }}
            className="text-ink-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <p
      className="flex-1 cursor-text whitespace-pre-wrap"
      onClick={() => setEditing(true)}
    >
      {content}
    </p>
  );
}

function ShelfToggle({
  label,
  bookId,
  shelfId,
  onAdd,
  onRemove,
}: {
  label: string;
  bookId: string;
  shelfId: string;
  onAdd: (bookId: string, shelfId: string) => Promise<void>;
  onRemove: (bookId: string, shelfId: string) => Promise<void>;
}) {
  const { shelves, booksForShelf } = useLibrary();
  const shelf = shelves.find((s) => s.id === shelfId);
  const active = shelf
    ? booksForShelf(shelf).some((b) => b.id === bookId)
    : false;

  return (
    <button
      onClick={() =>
        active ? onRemove(bookId, shelfId) : onAdd(bookId, shelfId)
      }
      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
        active
          ? "bg-ink-900 text-white"
          : "border border-ink-200 text-ink-700 hover:bg-ink-100/60"
      }`}
    >
      {label}
    </button>
  );
}
