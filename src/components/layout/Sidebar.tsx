"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Bookmark,
  Check,
  Compass,
  Layers,
  Plus,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useLibrary } from "@/lib/library/LibraryProvider";
import { GoalWidget } from "./GoalWidget";
import type { Shelf } from "@/lib/types";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "currently-reading": <BookOpen size={18} />,
  "want-to-read": <Bookmark size={18} />,
  read: <Check size={18} />,
};

function iconFor(shelf: Shelf) {
  if (shelf.kind === "favourite") return <Star size={18} />;
  if (shelf.kind === "custom") return <Layers size={18} />;
  return STATUS_ICONS[shelf.slug] ?? <BookOpen size={18} />;
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { shelves, booksForShelf, addCustomShelf } = useLibrary();
  const pathname = usePathname();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const sorted = [...shelves].sort((a, b) => a.sort_order - b.sort_order);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const shelf = await addCustomShelf(name.trim());
    setName("");
    setAdding(false);
    onNavigate?.();
    window.location.assign(`/dashboard/shelf/${shelf.slug}`);
  }

  return (
    <div className="flex h-full flex-col px-5 py-6">
      <Link href="/dashboard" onClick={onNavigate} className="mb-8 block">
        <p className="font-display text-3xl leading-none text-ink-900">Alore</p>
        <p className="font-display text-base text-ink-700">BookTracker</p>
      </Link>

      <nav aria-label="Shelves" className="flex-1 space-y-1 overflow-y-auto">
        {sorted.map((shelf) => {
          const href = `/dashboard/shelf/${shelf.slug}`;
          const active = pathname === href;
          return (
            <Link
              key={shelf.id}
              href={href}
              onClick={onNavigate}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-white/70 text-ink-900"
                  : "text-ink-800 hover:bg-white/40"
              }`}
            >
              <span className="flex items-center gap-2.5">
                {iconFor(shelf)}
                {shelf.name}
              </span>
              <span className={active ? "text-ink-900" : "text-ink-700"}>
                {booksForShelf(shelf).length}
              </span>
            </Link>
          );
        })}

        <Link
          href="/dashboard/discover"
          onClick={onNavigate}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname === "/dashboard/discover"
              ? "bg-white/70 text-ink-900"
              : "text-ink-800 hover:bg-white/40"
          }`}
        >
          <Compass size={18} /> Discover
        </Link>
        <Link
          href="/dashboard/wrapped"
          onClick={onNavigate}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname === "/dashboard/wrapped"
              ? "bg-white/70 text-ink-900"
              : "text-ink-800 hover:bg-white/40"
          }`}
        >
          <Sparkles size={18} /> Year in Review
        </Link>

        {adding ? (
          <form
            onSubmit={handleAdd}
            className="flex items-center gap-1 px-1 pt-1"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Shelf name"
              className="w-full rounded-md border border-sky-400/60 bg-white/70 px-2 py-1.5 text-sm text-ink-900 outline-none placeholder:text-ink-500"
            />
            <button
              type="button"
              onClick={() => setAdding(false)}
              aria-label="Cancel new shelf"
              className="p-1.5 text-ink-700 hover:text-ink-900"
            >
              <X size={16} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-white/40"
          >
            <Plus size={18} /> New shelf
          </button>
        )}
      </nav>

      <GoalWidget />
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 bg-sky-300 md:block">
      <SidebarContent />
    </aside>
  );
}
