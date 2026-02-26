import ScriptBuilder from "@/components/ScriptBuilder";
import Link from "next/link";

export const metadata = {
  title: "脚本ビルダー | 密着ドキュメンタリー脚本アプリ",
  description: "脳科学に基づく構成で、密着ドキュメンタリーの脚本を作成します。",
};

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            ← トップ
          </Link>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            脚本ビルダー
          </h1>
          <Link
            href="/framework"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            フレームワーク
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 py-8">
        <ScriptBuilder />
      </main>
    </div>
  );
}
