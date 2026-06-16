'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * 全ページ共通のナビゲーションバー
 *
 * 使用例: app/layout.tsx の <body> 直下に <Navbar /> を配置してください。
 *
 * 前提:
 * - lib/supabase.ts でブラウザ用の Supabase クライアントが
 *   `export const supabase = ...` の形でエクスポートされていること
 * - tsconfig.json の paths に "@/*": ["./*"] のようなエイリアスが
 *   設定されていること（未設定の場合は import 文を相対パスに変更してください）
 */
export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // ログイン状態の初期取得 ＋ 変化の監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // スクロールに応じてヘッダーの背景・影を切り替える
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    closeMenu();
    router.push('/');
    router.refresh();
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200'
          : 'bg-white/70 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ロゴ */}
        <Link href="/" onClick={closeMenu} className="group flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-orange-500 transition-transform duration-300 group-hover:-translate-y-0.5"
          >
            <path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            SpotShare
          </span>
        </Link>

        {/* デスクトップ用ナビゲーション */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthLoading ? (
            <>
              <div className="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="h-9 w-32 animate-pulse rounded-full bg-slate-200" />
            </>
          ) : user ? (
            <>
              <Link
                href="/spots/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-4 w-4">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                スポットを投稿する
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              ログイン
            </Link>
          )}
        </div>

        {/* モバイル用ハンバーガーボタン */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="メニューを開く"
          aria-expanded={isMenuOpen}
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-6 w-6">
            {isMenuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {/* モバイル用ドロップダウンメニュー */}
      <div
        className={`absolute inset-x-0 top-full origin-top border-b border-slate-200 bg-white shadow-lg transition-all duration-200 md:hidden ${
          isMenuOpen ? 'scale-y-100 opacity-100' : 'pointer-events-none scale-y-95 opacity-0'
        }`}
      >
        <div className="flex flex-col gap-2 px-4 py-4">
          {isAuthLoading ? (
            <div className="h-10 w-full animate-pulse rounded-full bg-slate-200" />
          ) : user ? (
            <>
              <Link
                href="/spots/new"
                onClick={closeMenu}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
              >
                スポットを投稿する
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={closeMenu}
              className="inline-flex items-center justify-center rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
