import Link from "next/link";
import { CHARS_30_SEC, CHARS_PER_MINUTE, CHARS_180_SEC } from "@/lib/constants";
import {
  CAMPBELL_SECTIONS,
  CINDERELLA_SECTIONS,
  FLOW_SECTIONS,
} from "@/lib/structures";

export const metadata = {
  title: "フレームワーク参照 | 密着ドキュメンタリー脚本アプリ",
  description: "脳科学に基づくナラティブ編集のフレームワーク（30秒ルール・キャンベル・シンデレラ）参照。",
};

export default function FrameworkPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            ← トップ
          </Link>
          <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            フレームワーク参照
          </h1>
          <Link
            href="/builder"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            脚本ビルダー
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-5 py-8">
        <p className="text-sm text-[var(--muted)] mb-8 leading-relaxed">
          密着ドキュメンタリー脚本の設計に使う「脳の取り扱い説明書」の要点です。
        </p>

        <section className="card p-6 mb-8">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">
            密着の流れ（5セクション）
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            文字起こしをこの流れに分け、その上で各セクション内を脳科学の構造（ドーパミン→扁桃体→共感→前頭前野→海馬）に分けていきます。
          </p>
          <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--card-border)] mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--card-border)]/30">
                  <th className="p-3 text-left text-[var(--foreground)]">流れ</th>
                  <th className="p-3 text-left text-[var(--foreground)]">内容</th>
                  <th className="p-3 text-left text-[var(--foreground)]">使う脳</th>
                  <th className="p-3 text-left text-[var(--foreground)]">尺</th>
                </tr>
              </thead>
              <tbody>
                {FLOW_SECTIONS.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--card-border)]">
                    <td className="p-3 font-medium text-[var(--foreground)]">{s.name}</td>
                    <td className="p-3 text-[var(--muted)]">{s.description}</td>
                    <td className="p-3 text-[var(--muted)]">{s.brain}</td>
                    <td className="p-3 text-[var(--muted)]">{s.durationLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-6 mb-8">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">
            30秒の定義（文字数）
          </h2>
          <p className="text-sm text-[var(--muted)] mb-3">
            基準: 1分＝{CHARS_PER_MINUTE}文字（標準ナレーション速度）
          </p>
          <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--card-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--card-border)]/30">
                  <th className="p-3 text-left text-[var(--foreground)]">尺</th>
                  <th className="p-3 text-left text-[var(--foreground)]">文字数</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--card-border)]">
                  <td className="p-3 text-[var(--foreground)]">30秒</td>
                  <td className="p-3 font-medium text-[var(--foreground)]">{CHARS_30_SEC}文字</td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className="p-3 text-[var(--foreground)]">1分</td>
                  <td className="p-3 text-[var(--foreground)]">{CHARS_PER_MINUTE}文字</td>
                </tr>
                <tr className="border-t border-[var(--card-border)]">
                  <td className="p-3 text-[var(--foreground)]">180秒（3分）</td>
                  <td className="p-3 font-medium text-[var(--foreground)]">{CHARS_180_SEC}文字</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="text-sm mt-3 space-y-1 list-disc pl-5 text-[var(--muted)]">
            <li>約30秒に1回 → 約{CHARS_30_SEC}文字ごとに「新しい情報が来た」と感じる刺激を入れる</li>
            <li>約180秒に1回 → 約{CHARS_180_SEC}文字ごとに「驚き」で脳を再起動する</li>
          </ul>
        </section>

        <section className="card p-6 mb-8">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">
            キャンベル構造（ヒーローズジャーニー）
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            成長・挑戦・ビジネス・男性向け密着向き。脳が最後までついて来やすい順番。
          </p>
          <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--card-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--card-border)]/30">
                  <th className="p-3 text-left text-[var(--foreground)]">セクション</th>
                  <th className="p-3 text-left text-[var(--foreground)]">内容</th>
                  <th className="p-3 text-left text-[var(--foreground)]">使う脳</th>
                  <th className="p-3 text-left text-[var(--foreground)]">尺</th>
                </tr>
              </thead>
              <tbody>
                {CAMPBELL_SECTIONS.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--card-border)]">
                    <td className="p-3 font-medium text-[var(--foreground)]">{s.name}</td>
                    <td className="p-3 text-[var(--muted)]">{s.description}</td>
                    <td className="p-3 text-[var(--muted)]">{s.brain}</td>
                    <td className="p-3 text-[var(--muted)]">{s.durationLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-6 mb-8">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">
            シンデレラストーリー
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            自己理解・ライフスタイル・美容・キャリア・女性向け密着向き。共感・記憶の脳が主役。「本来の自分を取り戻す物語」。
          </p>
          <div className="overflow-x-auto rounded-[var(--radius)] border border-[var(--card-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--card-border)]/30">
                  <th className="p-3 text-left text-[var(--foreground)]">セクション</th>
                  <th className="p-3 text-left text-[var(--foreground)]">主な脳</th>
                  <th className="p-3 text-left text-[var(--foreground)]">目安の尺</th>
                  <th className="p-3 text-left text-[var(--foreground)]">ポイント</th>
                </tr>
              </thead>
              <tbody>
                {CINDERELLA_SECTIONS.map((s) => (
                  <tr key={s.id} className="border-t border-[var(--card-border)]">
                    <td className="p-3 font-medium text-[var(--foreground)]">{s.name}</td>
                    <td className="p-3 text-[var(--muted)]">{s.brain}</td>
                    <td className="p-3 text-[var(--muted)]">{s.durationLabel}</td>
                    <td className="p-3 text-[var(--muted)]">{s.point ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">
            編集の判断
          </h2>
          <ul className="text-sm space-y-2 list-disc pl-5 text-[var(--muted)] leading-relaxed">
            <li>構成＝話の順番ではなく「どの脳をどの順で使うか」の設計図</li>
            <li>軽い脳 → 重い脳の順を守る。同じ脳を長く使いすぎると離脱する</li>
            <li>視聴維持率が落ちる主因は「飽き」や「情報の質」より「同じ脳を長く使いすぎた」こと</li>
            <li>編集とは脳が「ここまでなら使っていい」と納得できる体験を設計すること</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
