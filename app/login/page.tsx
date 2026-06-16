"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  function switchMode(next: AuthMode) {
    if (next === mode || loading) return;
    setMode(next);
    setError(null);
    setInfoMessage(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(translateError(signInError.message));
          return;
        }

        router.push("/");
        router.refresh();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setError(translateError(signUpError.message));
          return;
        }

        if (data.session) {
          // メール確認不要の設定（自動ログイン）の場合
          router.push("/");
          router.refresh();
        } else {
          // メール確認が必要な設定の場合
          setInfoMessage(
            "確認メールを送信しました。メール内のリンクから登録を完了してください。"
          );
        }
      }
    } catch {
      setError("予期しないエラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Spot Guide
          </p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">
            {mode === "signin" ? "ログイン" : "新規登録"}
          </h1>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
          {/* タブ切り替え */}
          <div className="mb-6 flex rounded-full bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                mode === "signin"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 disabled:bg-stone-100"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="6文字以上"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 disabled:bg-stone-100"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {infoMessage && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {infoMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              )}
              {loading ? "処理中..." : mode === "signin" ? "ログイン" : "登録する"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function translateError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "メールアドレスまたはパスワードが正しくありません",
    "User already registered": "このメールアドレスは既に登録されています",
    "Email not confirmed": "メールアドレスの確認が完了していません",
  };
  return map[message] ?? message;
}
