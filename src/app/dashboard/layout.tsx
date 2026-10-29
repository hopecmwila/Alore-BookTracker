"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LibraryProvider, useLibrary } from "@/lib/library/LibraryProvider";
import {
  BookModalProvider,
  useBookModal,
} from "@/lib/library/BookModalContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { Header } from "@/components/layout/Header";
import { AddBookModal } from "@/components/books/AddBookModal";
import { BookDetailModal } from "@/components/books/BookDetailModal";

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { loading } = useLibrary();
  const { openBookId, closeBook } = useBookModal();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          onOpenMenu={() => setDrawerOpen(true)}
          onAddBook={() => setAddOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {loading ? (
            <p className="text-sm text-ink-500">Loading your library…</p>
          ) : (
            children
          )}
        </main>
      </div>

      {addOpen && <AddBookModal onClose={() => setAddOpen(false)} />}
      {openBookId && <BookDetailModal bookId={openBookId} />}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isGuest, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !isGuest) router.replace("/login");
  }, [loading, user, isGuest, router]);

  if (loading || (!user && !isGuest)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-50">
        <p className="text-sm text-ink-500">Loading…</p>
      </div>
    );
  }

  return (
    <LibraryProvider>
      <BookModalProvider>
        <DashboardChrome>{children}</DashboardChrome>
      </BookModalProvider>
    </LibraryProvider>
  );
}
