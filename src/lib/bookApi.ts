import type { BookSearchResult } from "./types";

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  subject?: string[];
  isbn?: string[];
  ebook_access?: "no_ebook" | "printdisabled" | "borrowable" | "public";
  ia?: string[];
}

interface GoogleVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    pageCount?: number;
    categories?: string[];
    industryIdentifiers?: { type: string; identifier: string }[];
  };
  accessInfo?: {
    epub?: { isAvailable?: boolean; downloadLink?: string };
    publicDomain?: boolean;
  };
}

function mapOpenLibrary(doc: OpenLibraryDoc): BookSearchResult {
  const isPublicDomain = doc.ebook_access === "public";
  const archiveId = doc.ia?.[0];
  return {
    id: doc.key,
    source: "openlibrary",
    title: doc.title,
    authors: doc.author_name ?? [],
    cover_url: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
      : null,
    page_count: doc.number_of_pages_median ?? null,
    categories: (doc.subject ?? []).slice(0, 3),
    isbn: doc.isbn?.[0] ?? null,
    epub_available: Boolean(isPublicDomain && archiveId),
    epub_download_url:
      isPublicDomain && archiveId
        ? `https://archive.org/download/${archiveId}/${archiveId}.epub`
        : null,
  };
}

function mapGoogle(volume: GoogleVolume): BookSearchResult {
  const info = volume.volumeInfo;
  const epub = volume.accessInfo?.epub;
  return {
    id: volume.id,
    source: "google",
    title: info.title,
    authors: info.authors ?? [],
    cover_url:
      info.imageLinks?.thumbnail?.replace("http://", "https://") ??
      info.imageLinks?.smallThumbnail?.replace("http://", "https://") ??
      null,
    page_count: info.pageCount ?? null,
    categories: (info.categories ?? []).slice(0, 3),
    isbn:
      info.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier ??
      info.industryIdentifiers?.[0]?.identifier ??
      null,
    epub_available: Boolean(epub?.isAvailable),
    epub_download_url: epub?.isAvailable ? (epub.downloadLink ?? null) : null,
  };
}

async function searchOpenLibrary(query: string): Promise<BookSearchResult[]> {
  const res = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20&fields=key,title,author_name,cover_i,number_of_pages_median,subject,isbn,ebook_access,ia`,
  );
  if (!res.ok) throw new Error(`Open Library search failed: ${res.status}`);
  const data = await res.json();
  const docs: OpenLibraryDoc[] = data.docs ?? [];
  return docs.filter((d) => d.title).map(mapOpenLibrary);
}

async function searchGoogleBooks(query: string): Promise<BookSearchResult[]> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20`,
  );
  if (!res.ok) throw new Error(`Google Books search failed: ${res.status}`);
  const data = await res.json();
  const items: GoogleVolume[] = data.items ?? [];
  return items.filter((v) => v.volumeInfo?.title).map(mapGoogle);
}

/**
 * Search books: Open Library is the primary source. If it errors out or
 * returns too few usable results, fall back to Google Books and merge in
 * whatever Open Library did find.
 */
export async function searchBooks(query: string): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  let primary: BookSearchResult[] = [];
  let primaryFailed = false;

  try {
    primary = await searchOpenLibrary(trimmed);
  } catch {
    primaryFailed = true;
  }

  const withCovers = primary.filter((b) => b.cover_url);
  if (!primaryFailed && withCovers.length >= 5) {
    return primary;
  }

  try {
    const fallback = await searchGoogleBooks(trimmed);
    const seenTitles = new Set(
      primary.map(
        (b) => `${b.title.toLowerCase()}|${b.authors[0]?.toLowerCase() ?? ""}`,
      ),
    );
    const merged = [
      ...primary,
      ...fallback.filter(
        (b) =>
          !seenTitles.has(
            `${b.title.toLowerCase()}|${b.authors[0]?.toLowerCase() ?? ""}`,
          ),
      ),
    ];
    return merged;
  } catch {
    // Both sources failed (or Google failed and Open Library had partial
    // results) — return whatever we have rather than throwing.
    return primary;
  }
}

/** Open Library's subject endpoint, used to power the Discover page. */
export async function fetchBooksBySubject(
  subject: string,
  limit = 12,
): Promise<BookSearchResult[]> {
  const slug = subject.trim().toLowerCase().replace(/\s+/g, "_");
  const res = await fetch(
    `https://openlibrary.org/subjects/${encodeURIComponent(slug)}.json?limit=${limit}`,
  );
  if (!res.ok)
    throw new Error(`Open Library subject fetch failed: ${res.status}`);
  const data = await res.json();
  interface SubjectWork {
    key: string;
    title: string;
    authors?: { name: string }[];
    cover_id?: number;
    subject?: string[];
  }
  const works: SubjectWork[] = data.works ?? [];
  return works.map((w) => ({
    id: w.key,
    source: "openlibrary" as const,
    title: w.title,
    authors: w.authors?.map((a) => a.name) ?? [],
    cover_url: w.cover_id
      ? `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`
      : null,
    page_count: null,
    categories: (w.subject ?? [subject]).slice(0, 3),
    isbn: null,
    epub_available: false,
    epub_download_url: null,
  }));
}
