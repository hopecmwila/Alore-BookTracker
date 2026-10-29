"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useLibrary } from "@/lib/library/LibraryProvider";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function GoalWidget() {
  const { profile, shelves, booksForShelf, setAnnualGoal } = useLibrary();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(profile?.annual_goal ?? 5));

  const readShelf = shelves.find((s) => s.slug === "read");
  const readCount = readShelf ? booksForShelf(readShelf).length : 0;
  const goal = profile?.annual_goal ?? 5;
  const percent = goal > 0 ? (readCount / goal) * 100 : 0;

  async function save() {
    const parsed = Math.max(1, parseInt(draft, 10) || goal);
    await setAnnualGoal(parsed);
    setEditing(false);
  }

  return (
    <div className="mt-4 rounded-xl bg-white/50 p-4">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-700">
          Annual Reading Goal
        </p>
        <button
          onClick={() => setEditing((v) => !v)}
          aria-label="Edit annual reading goal"
          className="text-ink-700 hover:text-ink-900"
        >
          <Pencil size={13} />
        </button>
      </div>

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="number"
            min={1}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-16 rounded-md border border-sky-400/60 bg-white px-2 py-1 text-sm text-ink-900 outline-none"
          />
          <button
            type="submit"
            className="text-xs font-semibold text-sky-800 hover:underline"
          >
            Save
          </button>
        </form>
      ) : (
        <>
          <p className="mb-2 text-sm font-medium text-ink-900">
            {readCount} / {goal} books
          </p>
          <ProgressBar
            percent={percent}
            trackClassName="bg-white/70"
            fillClassName="bg-sky-800"
          />
        </>
      )}
    </div>
  );
}
