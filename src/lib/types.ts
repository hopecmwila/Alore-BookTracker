export type ShelfKind = "status" | "favourite" | "custom";

export interface Shelf {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  kind: ShelfKind;
  sort_order: number;
  created_at: string;
}

export type BookSource = "openlibrary" | "google" | "manual";

export interface Book {
  id: string;
  user_id: string;
  shelf_id: string | null;
  title: string;
  authors: string[];
  cover_url: string | null;
  page_count: number | null;
  current_page: number;
  categories: string[];
  isbn: string | null;
  source: BookSource | null;
  source_id: string | null;
  epub_available: boolean;
  epub_download_url: string | null;
  is_favourite: boolean;
  rating: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  book_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  annual_goal: number;
  avatar_color: string;
  created_at: string;
}

/** Unified shape returned by both Open Library and Google Books search. */
export interface BookSearchResult {
  id: string;
  source: BookSource;
  title: string;
  authors: string[];
  cover_url: string | null;
  page_count: number | null;
  categories: string[];
  isbn: string | null;
  epub_available: boolean;
  epub_download_url: string | null;
}

export const CATEGORY_COLORS: Record<string, string> = {
  romance: "bg-rose-100 text-rose-700",
  memoir: "bg-amber-100 text-amber-800",
  memoirs: "bg-amber-100 text-amber-800",
  "self-help": "bg-emerald-100 text-emerald-700",
  fiction: "bg-violet-100 text-violet-700",
  "non-fiction": "bg-sky-100 text-sky-700",
  fantasy: "bg-indigo-100 text-indigo-700",
  history: "bg-orange-100 text-orange-800",
  biography: "bg-teal-100 text-teal-700",
  "science-fiction": "bg-cyan-100 text-cyan-700",
  mystery: "bg-slate-200 text-slate-700",
  poetry: "bg-pink-100 text-pink-700",
};

export function categoryClasses(category: string): string {
  const key = category.trim().toLowerCase();
  return CATEGORY_COLORS[key] ?? "bg-ink-100 text-ink-700";
}
