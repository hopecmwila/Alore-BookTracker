"use client";

import { useMemo, useState } from "react";
import { Clipboard, ClipboardCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLibrary } from "@/lib/library/LibraryProvider";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const SLICE_COLORS = [
  "#2C4A6B",
  "#6BA3D6",
  "#E1447E",
  "#A6AEB9",
  "#8FBEE8",
  "#EC6B9B",
];

export default function WrappedPage() {
  const { books, profile } = useLibrary();
  const [copied, setCopied] = useState(false);
  const year = new Date().getFullYear();

  const finishedThisYear = useMemo(
    () =>
      books.filter(
        (b) => b.finished_at && new Date(b.finished_at).getFullYear() === year,
      ),
    [books, year],
  );

  const pagesByMonth = useMemo(() => {
    const totals = Array(12).fill(0);
    for (const b of finishedThisYear) {
      const m = new Date(b.finished_at!).getMonth();
      totals[m] += b.page_count ?? 0;
    }
    return MONTHS.map((month, i) => ({ month, pages: totals[i] }));
  }, [finishedThisYear]);

  const genreBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of finishedThisYear) {
      for (const c of b.categories.length ? b.categories : ["Uncategorised"]) {
        counts.set(c, (counts.get(c) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [finishedThisYear]);

  const rated = finishedThisYear.filter((b) => b.rating != null);
  const avgRating = rated.length
    ? rated.reduce((sum, b) => sum + (b.rating ?? 0), 0) / rated.length
    : null;

  const byLength = finishedThisYear.filter((b) => b.page_count);
  const shortest = byLength.length
    ? byLength.reduce((a, b) =>
        (a.page_count ?? 0) <= (b.page_count ?? 0) ? a : b,
      )
    : null;
  const longest = byLength.length
    ? byLength.reduce((a, b) =>
        (a.page_count ?? 0) >= (b.page_count ?? 0) ? a : b,
      )
    : null;

  const goal = profile?.annual_goal ?? 5;

  async function copySummary() {
    const lines = [
      `My ${year} in books, via Alore BookTracker`,
      `${finishedThisYear.length} of ${goal} books read`,
      genreBreakdown[0] ? `Top genre: ${genreBreakdown[0].name}` : null,
      avgRating ? `Average rating: ${avgRating.toFixed(1)} / 5` : null,
      longest
        ? `Longest read: ${longest.title} (${longest.page_count} pages)`
        : null,
      shortest
        ? `Shortest read: ${shortest.title} (${shortest.page_count} pages)`
        : null,
    ].filter(Boolean);
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink-900">
            Your {year} in Books
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            A look back at what you read this year.
          </p>
        </div>
        <button
          onClick={copySummary}
          className="flex items-center gap-2 rounded-full border border-sky-300 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50"
        >
          {copied ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
          {copied ? "Copied!" : "Copy shareable summary"}
        </button>
      </div>

      {finishedThisYear.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-ink-100 py-16 text-center text-ink-500">
          Finish a book this year and your wrapped will start filling in.
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Books read"
              value={`${finishedThisYear.length} / ${goal}`}
            />
            <StatCard
              label="Avg. rating"
              value={avgRating ? `${avgRating.toFixed(1)} ★` : "—"}
            />
            <StatCard
              label="Longest read"
              value={longest ? `${longest.page_count} pg` : "—"}
              sub={longest?.title}
            />
            <StatCard
              label="Shortest read"
              value={shortest ? `${shortest.page_count} pg` : "—"}
              sub={shortest?.title}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-card">
              <p className="mb-3 text-sm font-semibold text-ink-700">
                Pages read by month
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={pagesByMonth}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E7EAEE"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: "#66707F" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#66707F" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E7EAEE",
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="pages" fill="#2C4A6B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-card">
              <p className="mb-3 text-sm font-semibold text-ink-700">
                Genres this year
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={genreBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {genreBreakdown.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E7EAEE",
                      fontSize: 13,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {genreBreakdown.map((g, i) => (
                  <span
                    key={g.name}
                    className="flex items-center gap-1.5 text-xs text-ink-700"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length],
                      }}
                    />
                    {g.name} ({g.value})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl2 border border-ink-100 bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl text-ink-900">{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-ink-500">{sub}</p>}
    </div>
  );
}
