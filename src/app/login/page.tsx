"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function LoginPage() {
  const { signIn, enterGuestMode } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-6">
      <div className="w-full max-w-sm rounded-xl2 border border-sky-100 bg-white p-8 shadow-card">
        <Link href="/" className="mb-6 flex items-center gap-2 text-ink-900">
          <BookOpen size={20} className="text-sky-700" />
          <span className="font-display text-lg">Alore</span>
        </Link>
        <h1 className="font-display text-2xl text-ink-900">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">
          Log in to pick up where you left off.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-bloom-500 py-2.5 text-sm font-semibold text-white transition hover:bg-bloom-600 disabled:opacity-60"
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-3 text-xs text-ink-300">
          <div className="h-px flex-1 bg-ink-100" />
          or
          <div className="h-px flex-1 bg-ink-100" />
        </div>

        <button
          onClick={() => {
            enterGuestMode();
            router.push("/dashboard");
          }}
          className="mt-5 w-full rounded-full border border-sky-300 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-sky-100"
        >
          Continue as guest
        </button>

        <p className="mt-6 text-center text-sm text-ink-500">
          New to Alore?{" "}
          <Link
            href="/signup"
            className="font-semibold text-sky-700 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-700">
        {label}
      </span>
      <input
        type={type}
        required
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 outline-none focus:border-sky-400"
      />
    </label>
  );
}
