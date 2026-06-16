import Image from "next/image";
import { supabase } from "@/lib/supabase";

// 一覧は60秒ごとに再生成（ISR）。常に最新データが必要な場合は
// 下記を `export const dynamic = "force-dynamic";` に変更してください。
export const revalidate = 60;

interface Spot {
  id: string; // id が数値(int8/serial)の場合は number に変更してください
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

async function getSpots(): Promise<{ spots: Spot[]; error: string | null }> {
  const { data, error } = await supabase
    .from("spots")
    .select("id, title, description, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[spots] fetch error:", error.message);
    return { spots: [], error: error.message };
  }

  return { spots: data ?? [], error: null };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function HomePage() {
  const { spots, error } = await getSpots();

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Spot Guide
          </p>
          <h1 className="mt-2 text-3xl font-bold text-stone-900 sm:text-4xl">
            おすすめスポット
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {spots.length > 0
              ? `${spots.length}件のスポットを掲載中`
              : "見つけたお気に入りの場所を集めています"}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="font-medium text-red-700">データの取得に失敗しました</p>
            <p className="mt-1 text-sm text-red-500">{error}</p>
          </div>
        ) : spots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-20 text-center">
            <p className="text-stone-400">まだスポットが登録されていません</p>
            <p className="mt-1 text-sm text-stone-400">
              最初の1件を追加すると、ここに表示されます
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {spots.map((spot) => (
              <li
                key={spot.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                  {spot.image_url ? (
                    <Image
                      src={spot.image_url}
                      alt={spot.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-stone-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 p-5">
                  <h2 className="line-clamp-1 text-lg font-semibold text-stone-900">
                    {spot.title}
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-stone-600">
                    {spot.description || "説明はまだありません"}
                  </p>
                  <time
                    dateTime={spot.created_at}
                    className="mt-2 inline-flex w-fit items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                  >
                    {formatDate(spot.created_at)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
