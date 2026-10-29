"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import {
  GUEST_BOOKS,
  GUEST_NOTES,
  GUEST_PROFILE,
  GUEST_SHELVES,
  GUEST_USER_ID,
} from "@/lib/guestData";
import type { Book, BookSearchResult, Note, Profile, Shelf } from "@/lib/types";

const GUEST_STORAGE_KEY = "alore_guest_library";

interface BookShelfLink {
  book_id: string;
  shelf_id: string;
}

interface GuestLibrarySnapshot {
  profile: Profile;
  shelves: Shelf[];
  books: Book[];
  notes: Note[];
  links: BookShelfLink[];
}

function loadGuestSnapshot(): GuestLibrarySnapshot {
  if (typeof window === "undefined") {
    return {
      profile: GUEST_PROFILE,
      shelves: GUEST_SHELVES,
      books: GUEST_BOOKS,
      notes: GUEST_NOTES,
      links: [],
    };
  }
  const raw = localStorage.getItem(GUEST_STORAGE_KEY);
  if (!raw) {
    const fresh: GuestLibrarySnapshot = {
      profile: GUEST_PROFILE,
      shelves: GUEST_SHELVES,
      books: GUEST_BOOKS,
      notes: GUEST_NOTES,
      links: [],
    };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    return JSON.parse(raw) as GuestLibrarySnapshot;
  } catch {
    return {
      profile: GUEST_PROFILE,
      shelves: GUEST_SHELVES,
      books: GUEST_BOOKS,
      notes: GUEST_NOTES,
      links: [],
    };
  }
}

function saveGuestSnapshot(snapshot: GuestLibrarySnapshot) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(snapshot));
}

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `shelf-${Date.now()}`
  );
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface LibraryContextValue {
  loading: boolean;
  profile: Profile | null;
  shelves: Shelf[];
  books: Book[];
  notes: Note[];
  isGuest: boolean;
  booksForShelf: (shelf: Shelf) => Book[];
  notesForBook: (bookId: string) => Note[];
  addBookFromSearch: (
    result: BookSearchResult,
    shelfSlug: string,
  ) => Promise<void>;
  updateProgress: (
    bookId: string,
    currentPage: number,
  ) => Promise<{ justFinished: boolean }>;
  moveToStatusShelf: (bookId: string, shelfSlug: string) => Promise<void>;
  toggleFavourite: (bookId: string) => Promise<void>;
  rateBook: (bookId: string, rating: number) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  addCustomShelf: (name: string) => Promise<Shelf>;
  deleteCustomShelf: (shelfId: string) => Promise<void>;
  addToCustomShelf: (bookId: string, shelfId: string) => Promise<void>;
  removeFromCustomShelf: (bookId: string, shelfId: string) => Promise<void>;
  addNote: (bookId: string, content: string) => Promise<void>;
  updateNote: (noteId: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  setAnnualGoal: (goal: number) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { user, isGuest } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [links, setLinks] = useState<BookShelfLink[]>([]);

  // ---- load ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (isGuest) {
        const snap = loadGuestSnapshot();
        if (!cancelled) {
          setProfile(snap.profile);
          setShelves(snap.shelves);
          setBooks(snap.books);
          setNotes(snap.notes);
          setLinks(snap.links);
          setLoading(false);
        }
        return;
      }

      if (!user) {
        if (!cancelled) {
          setProfile(null);
          setShelves([]);
          setBooks([]);
          setNotes([]);
          setLinks([]);
          setLoading(false);
        }
        return;
      }

      const [profileRes, shelvesRes, booksRes, notesRes, linksRes] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase
            .from("shelves")
            .select("*")
            .eq("user_id", user.id)
            .order("sort_order"),
          supabase
            .from("books")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("notes")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("book_shelves")
            .select("book_id, shelf_id")
            .eq("user_id", user.id),
        ]);

      if (cancelled) return;
      setProfile(profileRes.data ?? null);
      setShelves(shelvesRes.data ?? []);
      setBooks(booksRes.data ?? []);
      setNotes(notesRes.data ?? []);
      setLinks(linksRes.data ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user, isGuest]);

  // ---- guest persistence ----
  const persistGuest = useCallback(
    (next: Partial<GuestLibrarySnapshot>) => {
      if (!isGuest) return;
      const snapshot: GuestLibrarySnapshot = {
        profile: next.profile ?? profile ?? GUEST_PROFILE,
        shelves: next.shelves ?? shelves,
        books: next.books ?? books,
        notes: next.notes ?? notes,
        links: next.links ?? links,
      };
      saveGuestSnapshot(snapshot);
    },
    [isGuest, profile, shelves, books, notes, links],
  );

  // ---- derived ----
  const booksForShelf = useCallback(
    (shelf: Shelf): Book[] => {
      if (shelf.kind === "favourite")
        return books.filter((b) => b.is_favourite);
      if (shelf.kind === "custom") {
        const ids = new Set(
          links.filter((l) => l.shelf_id === shelf.id).map((l) => l.book_id),
        );
        return books.filter((b) => ids.has(b.id));
      }
      return books.filter((b) => b.shelf_id === shelf.id);
    },
    [books, links],
  );

  const notesForBook = useCallback(
    (bookId: string) => notes.filter((n) => n.book_id === bookId),
    [notes],
  );

  // ---- mutations ----
  const addBookFromSearch = useCallback(
    async (result: BookSearchResult, shelfSlug: string) => {
      const shelf = shelves.find((s) => s.slug === shelfSlug);
      const base: Omit<Book, "id" | "created_at" | "updated_at"> = {
        user_id: isGuest ? GUEST_USER_ID : user!.id,
        shelf_id: shelf?.id ?? null,
        title: result.title,
        authors: result.authors,
        cover_url: result.cover_url,
        page_count: result.page_count,
        current_page: shelfSlug === "read" ? (result.page_count ?? 0) : 0,
        categories: result.categories,
        isbn: result.isbn,
        source: result.source,
        source_id: result.id,
        epub_available: result.epub_available,
        epub_download_url: result.epub_download_url,
        is_favourite: false,
        rating: null,
        started_at:
          shelfSlug === "currently-reading" || shelfSlug === "read"
            ? today()
            : null,
        finished_at: shelfSlug === "read" ? today() : null,
      };

      if (isGuest) {
        const book: Book = {
          ...base,
          id: newId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const next = [book, ...books];
        setBooks(next);
        persistGuest({ books: next });
        return;
      }

      const { data, error } = await supabase
        .from("books")
        .insert(base)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setBooks((prev) => [data as Book, ...prev]);
    },
    [shelves, isGuest, user, books, persistGuest],
  );

  const updateProgress = useCallback(
    async (bookId: string, currentPage: number) => {
      const book = books.find((b) => b.id === bookId);
      if (!book) return { justFinished: false };

      const clamped = book.page_count
        ? Math.min(Math.max(0, currentPage), book.page_count)
        : Math.max(0, currentPage);
      const alreadyFinished = Boolean(book.finished_at);
      const willFinish =
        Boolean(book.page_count) && clamped >= (book.page_count ?? Infinity);

      const readShelf = shelves.find((s) => s.slug === "read");
      const readingShelf = shelves.find((s) => s.slug === "currently-reading");

      const patch: Partial<Book> = {
        current_page: clamped,
        started_at: book.started_at ?? (clamped > 0 ? today() : null),
      };
      if (willFinish && !alreadyFinished) {
        patch.finished_at = today();
        if (readShelf) patch.shelf_id = readShelf.id;
      } else if (
        !willFinish &&
        clamped > 0 &&
        book.shelf_id !== readShelf?.id &&
        readingShelf &&
        book.shelf_id !== readingShelf.id
      ) {
        // Started reading a "want to read" book — move it into Currently Reading.
        patch.shelf_id = readingShelf.id;
      }

      if (isGuest) {
        const next = books.map((b) =>
          b.id === bookId
            ? { ...b, ...patch, updated_at: new Date().toISOString() }
            : b,
        );
        setBooks(next);
        persistGuest({ books: next });
        return { justFinished: willFinish && !alreadyFinished };
      }

      const { data, error } = await supabase
        .from("books")
        .update(patch)
        .eq("id", bookId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? (data as Book) : b)),
      );
      return { justFinished: willFinish && !alreadyFinished };
    },
    [books, shelves, isGuest, persistGuest],
  );

  const moveToStatusShelf = useCallback(
    async (bookId: string, shelfSlug: string) => {
      const shelf = shelves.find((s) => s.slug === shelfSlug);
      if (!shelf) return;
      const patch: Partial<Book> = { shelf_id: shelf.id };
      if (shelfSlug === "read") {
        const book = books.find((b) => b.id === bookId);
        patch.finished_at = today();
        patch.current_page = book?.page_count ?? book?.current_page ?? 0;
      }

      if (isGuest) {
        const next = books.map((b) =>
          b.id === bookId
            ? { ...b, ...patch, updated_at: new Date().toISOString() }
            : b,
        );
        setBooks(next);
        persistGuest({ books: next });
        return;
      }
      const { data, error } = await supabase
        .from("books")
        .update(patch)
        .eq("id", bookId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? (data as Book) : b)),
      );
    },
    [shelves, books, isGuest, persistGuest],
  );

  const toggleFavourite = useCallback(
    async (bookId: string) => {
      const book = books.find((b) => b.id === bookId);
      if (!book) return;
      const patch = { is_favourite: !book.is_favourite };

      if (isGuest) {
        const next = books.map((b) =>
          b.id === bookId ? { ...b, ...patch } : b,
        );
        setBooks(next);
        persistGuest({ books: next });
        return;
      }
      const { data, error } = await supabase
        .from("books")
        .update(patch)
        .eq("id", bookId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? (data as Book) : b)),
      );
    },
    [books, isGuest, persistGuest],
  );

  const rateBook = useCallback(
    async (bookId: string, rating: number) => {
      if (isGuest) {
        const next = books.map((b) => (b.id === bookId ? { ...b, rating } : b));
        setBooks(next);
        persistGuest({ books: next });
        return;
      }
      const { data, error } = await supabase
        .from("books")
        .update({ rating })
        .eq("id", bookId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? (data as Book) : b)),
      );
    },
    [books, isGuest, persistGuest],
  );

  const deleteBook = useCallback(
    async (bookId: string) => {
      if (isGuest) {
        const next = books.filter((b) => b.id !== bookId);
        const nextNotes = notes.filter((n) => n.book_id !== bookId);
        const nextLinks = links.filter((l) => l.book_id !== bookId);
        setBooks(next);
        setNotes(nextNotes);
        setLinks(nextLinks);
        persistGuest({ books: next, notes: nextNotes, links: nextLinks });
        return;
      }
      const { error } = await supabase.from("books").delete().eq("id", bookId);
      if (error) throw new Error(error.message);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      setNotes((prev) => prev.filter((n) => n.book_id !== bookId));
      setLinks((prev) => prev.filter((l) => l.book_id !== bookId));
    },
    [books, notes, links, isGuest, persistGuest],
  );

  const addCustomShelf = useCallback(
    async (name: string) => {
      const slug = slugify(name);
      const sort_order = shelves.length;

      if (isGuest) {
        const shelf: Shelf = {
          id: newId(),
          user_id: GUEST_USER_ID,
          name,
          slug,
          kind: "custom",
          sort_order,
          created_at: new Date().toISOString(),
        };
        const next = [...shelves, shelf];
        setShelves(next);
        persistGuest({ shelves: next });
        return shelf;
      }
      const { data, error } = await supabase
        .from("shelves")
        .insert({ user_id: user!.id, name, slug, kind: "custom", sort_order })
        .select()
        .single();
      if (error) throw new Error(error.message);
      setShelves((prev) => [...prev, data as Shelf]);
      return data as Shelf;
    },
    [shelves, isGuest, user, persistGuest],
  );

  const deleteCustomShelf = useCallback(
    async (shelfId: string) => {
      if (isGuest) {
        const nextShelves = shelves.filter((s) => s.id !== shelfId);
        const nextLinks = links.filter((l) => l.shelf_id !== shelfId);
        setShelves(nextShelves);
        setLinks(nextLinks);
        persistGuest({ shelves: nextShelves, links: nextLinks });
        return;
      }
      const { error } = await supabase
        .from("shelves")
        .delete()
        .eq("id", shelfId);
      if (error) throw new Error(error.message);
      setShelves((prev) => prev.filter((s) => s.id !== shelfId));
      setLinks((prev) => prev.filter((l) => l.shelf_id !== shelfId));
    },
    [shelves, links, isGuest, persistGuest],
  );

  const addToCustomShelf = useCallback(
    async (bookId: string, shelfId: string) => {
      if (isGuest) {
        const next = [...links, { book_id: bookId, shelf_id: shelfId }];
        setLinks(next);
        persistGuest({ links: next });
        return;
      }
      const { error } = await supabase
        .from("book_shelves")
        .insert({ book_id: bookId, shelf_id: shelfId, user_id: user!.id });
      if (error) throw new Error(error.message);
      setLinks((prev) => [...prev, { book_id: bookId, shelf_id: shelfId }]);
    },
    [links, isGuest, user, persistGuest],
  );

  const removeFromCustomShelf = useCallback(
    async (bookId: string, shelfId: string) => {
      if (isGuest) {
        const next = links.filter(
          (l) => !(l.book_id === bookId && l.shelf_id === shelfId),
        );
        setLinks(next);
        persistGuest({ links: next });
        return;
      }
      const { error } = await supabase
        .from("book_shelves")
        .delete()
        .eq("book_id", bookId)
        .eq("shelf_id", shelfId);
      if (error) throw new Error(error.message);
      setLinks((prev) =>
        prev.filter((l) => !(l.book_id === bookId && l.shelf_id === shelfId)),
      );
    },
    [links, isGuest, persistGuest],
  );

  const addNote = useCallback(
    async (bookId: string, content: string) => {
      if (isGuest) {
        const note: Note = {
          id: newId(),
          user_id: GUEST_USER_ID,
          book_id: bookId,
          content,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const next = [note, ...notes];
        setNotes(next);
        persistGuest({ notes: next });
        return;
      }
      const { data, error } = await supabase
        .from("notes")
        .insert({ book_id: bookId, content, user_id: user!.id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      setNotes((prev) => [data as Note, ...prev]);
    },
    [notes, isGuest, user, persistGuest],
  );

  const updateNote = useCallback(
    async (noteId: string, content: string) => {
      if (isGuest) {
        const next = notes.map((n) =>
          n.id === noteId
            ? { ...n, content, updated_at: new Date().toISOString() }
            : n,
        );
        setNotes(next);
        persistGuest({ notes: next });
        return;
      }
      const { data, error } = await supabase
        .from("notes")
        .update({ content })
        .eq("id", noteId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? (data as Note) : n)),
      );
    },
    [notes, isGuest, persistGuest],
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (isGuest) {
        const next = notes.filter((n) => n.id !== noteId);
        setNotes(next);
        persistGuest({ notes: next });
        return;
      }
      const { error } = await supabase.from("notes").delete().eq("id", noteId);
      if (error) throw new Error(error.message);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    },
    [notes, isGuest, persistGuest],
  );

  const setAnnualGoal = useCallback(
    async (goal: number) => {
      if (isGuest) {
        const next = { ...(profile ?? GUEST_PROFILE), annual_goal: goal };
        setProfile(next);
        persistGuest({ profile: next });
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .update({ annual_goal: goal })
        .eq("id", user!.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setProfile(data as Profile);
    },
    [profile, isGuest, user, persistGuest],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      loading,
      profile,
      shelves,
      books,
      notes,
      isGuest,
      booksForShelf,
      notesForBook,
      addBookFromSearch,
      updateProgress,
      moveToStatusShelf,
      toggleFavourite,
      rateBook,
      deleteBook,
      addCustomShelf,
      deleteCustomShelf,
      addToCustomShelf,
      removeFromCustomShelf,
      addNote,
      updateNote,
      deleteNote,
      setAnnualGoal,
    }),
    [
      loading,
      profile,
      shelves,
      books,
      notes,
      isGuest,
      booksForShelf,
      notesForBook,
      addBookFromSearch,
      updateProgress,
      moveToStatusShelf,
      toggleFavourite,
      rateBook,
      deleteBook,
      addCustomShelf,
      deleteCustomShelf,
      addToCustomShelf,
      removeFromCustomShelf,
      addNote,
      updateNote,
      deleteNote,
      setAnnualGoal,
    ],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within a LibraryProvider");
  return ctx;
}
