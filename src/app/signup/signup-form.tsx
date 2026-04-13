"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    /** Use the current origin so confirm links match Vercel vs local; must be listed in Supabase → Auth → Redirect URLs. */
    const emailRedirectTo = `${window.location.origin}/auth/callback`;
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/home");
    router.refresh();
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-[#6C5CE7] hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20"
          />
          <p className="mt-1 text-xs text-gray-400">At least 8 characters.</p>
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 py-3 font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center">
          <Link
            href="/explore"
            className="text-xs text-gray-400 transition hover:text-gray-600"
          >
            Continue without signing in →
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
