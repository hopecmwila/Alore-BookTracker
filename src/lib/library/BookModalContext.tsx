"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface BookModalContextValue {
  openBookId: string | null;
  openBook: (id: string) => void;
  closeBook: () => void;
}

const BookModalContext = createContext<BookModalContextValue | null>(null);

export function BookModalProvider({ children }: { children: React.ReactNode }) {
  const [openBookId, setOpenBookId] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      openBookId,
      openBook: (id: string) => setOpenBookId(id),
      closeBook: () => setOpenBookId(null),
    }),
    [openBookId],
  );
  return (
    <BookModalContext.Provider value={value}>
      {children}
    </BookModalContext.Provider>
  );
}

export function useBookModal(): BookModalContextValue {
  const ctx = useContext(BookModalContext);
  if (!ctx)
    throw new Error("useBookModal must be used within a BookModalProvider");
  return ctx;
}
