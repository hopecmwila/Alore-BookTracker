"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, MailCheck } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function SignupPage() {
  const { signUp, enterGuestMode } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsEmailConfirmation) {
      setAwaitingConfirmation(true);
      return;
    }
    router.push("/dashboard");
  }

  if (awaitingConfirmation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sky-50 px-6">
        <div className="w-full max-w-sm rounded-xl2 border border-sky-100 bg-white p-8 text-center shadow-card">
          <MailCheck className="mx-auto mb-4 text-sky-700" size={32} />
          <h1 className="font-display text-xl text-ink-900">
            Check your inbox
          </h1>
          <p className="mt-2 text-sm text-ink-700">
            We sent a confirmation link to{" "}
            <span className="font-medium">{email}</span>. Follow it to activate
            your account, then log in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-bloom-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-bloom-600"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-6">
      <div className="w-full max-w-sm rounded-xl2 border border-sky-100 bg-white p-8 shadow-card">
        <Link href="/" className="mb-6 flex items-center gap-2 text-ink-900">
          <BookOpen size={20} className="text-sky-700" />
          <span className="font-display text-lg">Alore</span>
        </Link>
        <h1 className="font-display text-2xl text-ink-900">
          Create your shelf
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Free, and synced everywhere you read.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 outline-none focus:border-sky-400"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-700">
              Password
            </span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm text-ink-900 outline-none focus:border-sky-400"
            />
            <span className="mt-1 block text-xs text-ink-500">
              At least 6 characters.
            </span>
          </label>
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
            {submitting ? "Creating account…" : "Create account"}
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
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-sky-700 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
