"use client";

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type SubmitPhase = "idle" | "uploading" | "saving";

export default function NewSpotPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [phase, setPhase] = useState<SubmitPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const submitting = phase !== "idle";

  // 未ログインなら /login へ即リダイレクト
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setSession(data.session);
      setCheckingAuth(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        router.replace("/login");
      } else {
        setSession(nextSession);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // ローカルプレビュー用のObject URLを解放
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileSelect(selected: File | null) {
    setFileError(null);

    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFileError("JPEG, PNG, WEBP, GIF形式の画像を選択してください");
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setFileError("ファイルサイズは2MBまでです");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function clearFile() {
    setFile(null);
    setPreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!submitting) setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (submitting) return;
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    try {
      let imageUrl: string | null = null;

      if (file) {
        setPhase("uploading");

        // ファイル名の空白を整理し、Date.nowで一意なパスにする
        const safeName = file.name.replace(/\s+/g, "_");
        const filePath = `spots/${Date.now()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("spot-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          setError(`画像のアップロードに失敗しました: ${uploadError.message}`);
          setPhase("idle");
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("spot-images")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      setPhase("saving");

      const { error: insertError } = await supabase.from("spots").insert({
        title: title.trim(),
        description: description.trim() || null,
        image_url: imageUrl,
        user_id: currentUser.id,
      });

      if (insertError) {
        setError(insertError.message);
        setPhase("idle");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("予期しないエラーが発生しました。もう一度お試しください。");
      setPhase("idle");
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="flex items-center gap-2 text-stone-400">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
          <span className="text-sm">確認中...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          Spot Guide
        </p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900 sm:text-3xl">
          新しいスポットを投稿
        </h1>
        <p className="mt-2 text-sm text-stone-500">{session?.user.email} としてログイン中</p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200"
        >
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-stone-700">
              タイトル
            </label>
            <input
              id="title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              placeholder="例：瀬戸内海が見える展望台"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 disabled:bg-stone-100"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-stone-700">
              説明文
            </label>
            <textarea
              id="description"
              rows={4}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              placeholder="どんな場所か、おすすめポイントを書いてください"
              className="mt-1 w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 disabled:bg-stone-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">画像</label>

            <div
              onClick={() => !submitting && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-1 flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
                isDragging
                  ? "border-amber-500 bg-amber-50"
                  : "border-stone-300 bg-stone-50 hover:border-stone-400"
              } ${submitting ? "pointer-events-none opacity-60" : ""}`}
            >
              {previewUrl ? (
                <div className="relative h-full w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="プレビュー"
                    className="h-full w-full object-cover"
                  />
                  {!submitting && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      aria-label="画像を削除"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900/70 text-white hover:bg-stone-900"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <div className="px-4 text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-stone-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 7.5L12 3m0 0L7.5 7.5M12 3v13.5"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-stone-500">
                    クリックまたはドラッグして画像を選択
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    JPEG, PNG, WEBP, GIF（2MBまで）
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              disabled={submitting}
              className="hidden"
            />

            {fileError && <p className="mt-2 text-xs text-red-500">{fileError}</p>}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
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
            {phase === "uploading"
              ? "画像をアップロード中..."
              : phase === "saving"
              ? "投稿中..."
              : "投稿する"}
          </button>
        </form>
      </div>
    </main>
  );
}
