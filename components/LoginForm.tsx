"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { createBrowserSupabase } from "@/lib/auth/client";

type Mode = "signin" | "signup";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "email" | "google">(null);
  const [error, setError] = useState(initialError ?? "");
  const [notice, setNotice] = useState("");

  const callbackUrl = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function onGoogle() {
    setError("");
    setLoading("google");
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
    // On success the browser is redirected to Google.
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading("email");
    const supabase = createBrowserSupabase();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error) {
        setError(error.message);
        setLoading(null);
        return;
      }
      // If email confirmation is required there is no active session yet.
      if (!data.session) {
        setNotice("Check your email to confirm your account, then sign in.");
        setMode("signin");
        setLoading(null);
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(null);
      return;
    }
    router.push(next);
    router.refresh();
  }

  const input =
    "mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/25";

  return (
    <div className="surface mx-auto w-full max-w-md p-6 sm:p-7">
      <button
        type="button"
        onClick={onGoogle}
        disabled={loading !== null}
        className="btn-secondary w-full disabled:opacity-60"
      >
        {loading === "google" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleGlyph />
        )}
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3 text-left">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={input}
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={input}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>

        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {notice}
          </p>
        ) : null}

        <button type="submit" disabled={loading !== null} className="btn-primary w-full disabled:opacity-60">
          {loading === "email" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {mode === "signup" ? "Create account" : "Sign in"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {mode === "signup" ? "Already have an account?" : "New to TabZero?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError("");
            setNotice("");
          }}
          className="font-medium text-primary hover:underline"
        >
          {mode === "signup" ? "Sign in" : "Create an account"}
        </button>
      </p>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.6-11.3-8.4l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.3 5.2C41.4 36.2 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
