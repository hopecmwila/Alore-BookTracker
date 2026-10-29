"use client";

import { X } from "lucide-react";
import { SidebarContent } from "./Sidebar";

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-72 bg-sky-300 shadow-card">
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-3 top-3 rounded-full p-1.5 text-ink-800 hover:bg-white/40"
        >
          <X size={18} />
        </button>
        <SidebarContent onNavigate={onClose} />
      </div>
    </div>
  );
}
