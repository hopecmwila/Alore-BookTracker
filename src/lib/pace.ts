import type { Book } from "./types";

export interface PaceEstimate {
  avgPagesPerDay: number;
  daysRemaining: number | null;
  estimatedDate: Date | null;
  hasEnoughData: boolean;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Estimates when a book will be finished from the pace set since it was
 * started: (total pages - current page) / average pages per day so far.
 */
export function estimateCompletion(book: Book): PaceEstimate {
  const fallback: PaceEstimate = {
    avgPagesPerDay: 0,
    daysRemaining: null,
    estimatedDate: null,
    hasEnoughData: false,
  };

  if (!book.started_at || !book.page_count || book.page_count <= 0) {
    return fallback;
  }

  const started = new Date(book.started_at).getTime();
  const daysElapsed = Math.max(
    1,
    Math.round((Date.now() - started) / MS_PER_DAY),
  );
  const avgPagesPerDay = book.current_page / daysElapsed;

  if (avgPagesPerDay <= 0) return fallback;

  const pagesRemaining = Math.max(0, book.page_count - book.current_page);
  const daysRemaining = Math.ceil(pagesRemaining / avgPagesPerDay);
  const estimatedDate = new Date(Date.now() + daysRemaining * MS_PER_DAY);

  return {
    avgPagesPerDay: Math.round(avgPagesPerDay * 10) / 10,
    daysRemaining,
    estimatedDate,
    hasEnoughData: true,
  };
}

export function formatEstimatedDate(date: Date | null): string {
  if (!date) return "Not enough data yet";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
