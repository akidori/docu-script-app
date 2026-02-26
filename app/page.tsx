import Link from "next/link";

export const metadata = {
  title: "密着ドキュメンタリー脚本アプリ | 日本一の密着ドキュメの脚本を",
  description: "脳科学に基づく構成（キャンベル・シンデレラ）で、密着ドキュメンタリーの脚本を作成。関連URLから肉付けできます。",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-5">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            密着ドキュメンタリー脚本アプリ
          </h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            日本一の密着ドキュメの脚本を、脳の取り扱い説明書で作る
          </p>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto px-5 py-10 w-full">
        <div className="space-y-5">
          <section className="card p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">
              脚本ビルダー
            </h2>
            <p className="text-sm text-[var(--muted)] mb-4 leading-relaxed">
              キャンベル（ヒーローズジャーニー）かシンデレラストーリーの構成を選び、各セクションに台本・メモを書けます。文字起こしを貼ってGeminiで構成を作成できます。
            </p>
            <Link
              href="/builder"
              className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              脚本を作る
              <span className="opacity-80">→</span>
            </Link>
          </section>
          <section className="card p-6">
            <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">
              フレームワーク参照
            </h2>
            <p className="text-sm text-[var(--muted)] mb-4 leading-relaxed">
              30秒ルール（175文字）、キャンベル・シンデレラのセクション一覧と「使う脳」「尺」の目安を確認できます。
            </p>
            <Link
              href="/framework"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm rounded-[var(--radius)] border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--card-border)]/30 transition-colors"
            >
              参照を見る
              <span className="opacity-80">→</span>
            </Link>
          </section>
        </div>
        <p className="mt-10 text-xs text-[var(--muted)] text-center">
          構成と尺の設計は「ナラティブ編集力」の考え方に基づいています。
        </p>
      </main>
    </div>
  );
}
