"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useLibrary } from "@/lib/library/LibraryProvider";

export function AvatarMenu() {
  const { user, isGuest, signOut } = useAuth();
  const { profile } = useLibrary();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const email = isGuest ? "Guest session" : (user?.email ?? "");
  const initial = (profile?.display_name || email || "?")
    .charAt(0)
    .toUpperCase();
  const color = profile?.avatar_color ?? "#E1447E";

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-ink-100 bg-white p-3 shadow-card">
          <p className="truncate px-2 py-1 text-sm font-medium text-ink-900">
            {email}
          </p>

          {isGuest && (
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg bg-sky-50 px-2 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
            >
              <UserPlus size={16} /> Sign up to sync this library
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-ink-700 hover:bg-ink-100/60"
          >
            <LogOut size={16} /> {isGuest ? "Exit guest mode" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
