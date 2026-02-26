"use client";

import { useState, useCallback, useEffect } from "react";
import { STRUCTURE_META, type StructureType } from "@/lib/structures";
import {
  sectionsToSpreadsheetRows,
  spreadsheetRowsToCsv,
  SPREADSHEET_TEMPLATE_URL,
  getSpreadsheetIdFromUrl,
  pastedTableToSections,
} from "@/lib/spreadsheet-format";
import type { ScriptSection } from "@/lib/structures";
import {
  loadHistory,
  saveProject,
  deleteProject,
  exportHistory,
  importHistory,
  historyContextForPrompt,
  type ProjectRecord,
} from "@/lib/history";

const API_KEY_STORAGE = "docu_script_gemini_api_key";

interface WizardSection {
  id: string;
  name: string;
  content: string;
  brain?: string;
  sceneType?: string;
  durationLabel?: string;
  location?: string;
  reason?: string;
}

const STEPS = [
  { id: 1, label: "文字起こし" },
  { id: 2, label: "5セクション分割" },
  { id: 3, label: "細分化" },
  { id: 4, label: "AI提案" },
  { id: 5, label: "スプシ反映" },
] as const;

export default function ScriptBuilder() {
  const [step, setStep] = useState(1);
  const [transcript, setTranscript] = useState("");

  const [mainSections, setMainSections] = useState<WizardSection[]>([]);
  const [structureType, setStructureType] = useState<StructureType>("flow");
  const [detailedSections, setDetailedSections] = useState<WizardSection[]>([]);
  const [proposedSections, setProposedSections] = useState<WizardSection[]>([]);

  const [referenceScript, setReferenceScript] = useState("");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [pastedTable, setPastedTable] = useState("");

  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [writeStatus, setWriteStatus] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectLessons, setProjectLessons] = useState("");
  const [history, setHistory] = useState<ProjectRecord[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    try {
      const k = localStorage.getItem(API_KEY_STORAGE);
      if (k) setApiKey(k);
    } catch { /* ignore */ }
    setHistory(loadHistory());
  }, []);

  const saveApiKey = useCallback(() => {
    try {
      if (apiKey.trim()) localStorage.setItem(API_KEY_STORAGE, apiKey.trim());
      else localStorage.removeItem(API_KEY_STORAGE);
    } catch { /* ignore */ }
  }, [apiKey]);

  const getKey = useCallback((): string => {
    const k = apiKey.trim();
    if (k) return k;
    try { return localStorage.getItem(API_KEY_STORAGE) ?? ""; } catch { return ""; }
  }, [apiKey]);

  const callGemini = useCallback(async (payload: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const hCtx = historyContextForPrompt();
      const res = await fetch("/api/gemini/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, apiKey: getKey(), historyContext: hCtx }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "処理に失敗しました");
      return data.sections as WizardSection[];
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      return null;
    } finally {
      setLoading(false);
    }
  }, [getKey]);

  // Step 1 → 2: 5セクションに分割
  const handleSplit = useCallback(async () => {
    if (!transcript.trim()) { setError("文字起こしを貼ってください。"); return; }
    if (!getKey()) { setError("Gemini APIキーを設定してください。"); setSettingsOpen(true); return; }
    const result = await callGemini({ mode: "split", transcript: transcript.trim() });
    if (result) { setMainSections(result); setStep(2); }
  }, [transcript, callGemini, getKey]);

  // Step 2 → 3: 細分化
  const handleSubdivide = useCallback(async () => {
    if (!getKey()) { setError("Gemini APIキーを設定してください。"); setSettingsOpen(true); return; }
    const result = await callGemini({
      mode: "subdivide",
      sections: mainSections,
      structureType,
    });
    if (result) { setDetailedSections(result); setStep(3); }
  }, [mainSections, structureType, callGemini, getKey]);

  // Step 3 → 4: AI提案
  const handlePropose = useCallback(async () => {
    if (!getKey()) { setError("Gemini APIキーを設定してください。"); setSettingsOpen(true); return; }
    const result = await callGemini({
      mode: "propose",
      sections: detailedSections,
      referenceScript: referenceScript.trim() || undefined,
    });
    if (result) { setProposedSections(result); setStep(4); }
  }, [detailedSections, referenceScript, callGemini, getKey]);

  // Step 5: スプレッドシートに書き戻し
  const handleWriteToSheet = useCallback(async () => {
    const id = getSpreadsheetIdFromUrl(spreadsheetUrl) || spreadsheetUrl.trim();
    if (!id) { setError("スプレッドシートのURLを入力してください。"); return; }
    setLoading(true);
    setError(null);
    setWriteStatus(null);
    try {
      const finalSections = proposedSections.length ? proposedSections : detailedSections;
      const res = await fetch("/api/sheets/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetUrl, sections: finalSections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "書き込みに失敗しました");
      setWriteStatus(`スプレッドシートに反映しました（${data.rows}行）`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "書き込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [spreadsheetUrl, proposedSections, detailedSections]);

  const handleExportCsv = useCallback(() => {
    try {
      const finalSections = proposedSections.length ? proposedSections : detailedSections;
      const mapped: ScriptSection[] = finalSections.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.name,
        brain: s.brain ?? "",
        durationLabel: s.durationLabel ?? "約1分",
        charsMin: 0,
        charsMax: 2000,
        sceneType: (s.sceneType as ScriptSection["sceneType"]) ?? "explanation",
        location: s.location,
        content: s.content,
      }));
      const rows = sectionsToSpreadsheetRows(mapped);
      const csv = spreadsheetRowsToCsv(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `脚本_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "CSVエクスポートに失敗しました");
    }
  }, [proposedSections, detailedSections]);

  const handleLoadFromPaste = useCallback(() => {
    if (!pastedTable.trim()) { setError("表を貼り付けてください。"); return; }
    try {
      const secs = pastedTableToSections(pastedTable);
      if (!secs.length) { setError("ヘッダー行を含む表を貼り付けてください。"); return; }
      const mapped: WizardSection[] = secs.map((s) => ({
        id: s.id,
        name: s.name,
        content: s.content,
        brain: s.brain,
        sceneType: s.sceneType,
        location: s.location,
      }));
      setDetailedSections(mapped);
      setStep(3);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    }
  }, [pastedTable]);

  const updateSection = useCallback((idx: number, content: string) => {
    if (step === 2) setMainSections((p) => p.map((s, i) => i === idx ? { ...s, content } : s));
    if (step === 3) setDetailedSections((p) => p.map((s, i) => i === idx ? { ...s, content } : s));
    if (step === 4) setProposedSections((p) => p.map((s, i) => i === idx ? { ...s, content } : s));
  }, [step]);

  return (
    <div className="space-y-6">
      {/* ステップインジケーター */}
      <nav className="flex items-center justify-center gap-1 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (s.id <= step) setStep(s.id);
              }}
              disabled={s.id > step}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                s.id === step
                  ? "bg-[var(--accent)] text-white"
                  : s.id < step
                    ? "bg-[var(--accent-muted)] text-[var(--accent)] cursor-pointer hover:opacity-80"
                    : "bg-[var(--card-border)]/50 text-[var(--muted)] cursor-not-allowed"
              }`}
            >
              {s.id}. {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <span className="text-[var(--muted)] text-xs">→</span>
            )}
          </div>
        ))}
      </nav>

      {/* 設定（折りたたみ） */}
      <section className="card p-4">
        <button
          type="button"
          onClick={() => setSettingsOpen((o) => !o)}
          className="w-full text-left text-sm font-medium text-[var(--foreground)] flex items-center justify-between"
        >
          <span>設定（APIキー・参考脚本・スプレッドシート）</span>
          <span className="text-xs text-[var(--muted)]">{settingsOpen ? "閉じる" : "開く"}</span>
        </button>
        {settingsOpen && (
          <div className="mt-4 space-y-4">
            {/* API Key */}
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">Gemini APIキー</label>
              <div className="flex gap-2 items-center">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onBlur={saveApiKey}
                  placeholder="APIキーを入力"
                  className="input-base flex-1 px-3 py-2 text-sm"
                  autoComplete="off"
                />
                <button type="button" onClick={saveApiKey} className="btn-primary px-3 py-2 text-xs">保存</button>
              </div>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--accent)] hover:underline mt-1 inline-block"
              >
                APIキーを取得 →
              </a>
            </div>
            {/* 参考脚本 */}
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">参考脚本（任意・トーンを学習）</label>
              <textarea
                value={referenceScript}
                onChange={(e) => setReferenceScript(e.target.value)}
                placeholder="好きな脚本・過去作を貼ると、AIがその感性で提案します"
                rows={3}
                className="input-base w-full px-3 py-2 text-sm resize-y"
              />
            </div>
            {/* スプレッドシートURL */}
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1">スプレッドシートURL（最後のステップで使用）</label>
              <input
                type="url"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="input-base w-full px-3 py-2 text-sm"
              />
              <a
                href={SPREADSHEET_TEMPLATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--accent)] hover:underline mt-1 inline-block"
              >
                テンプレートを開く →
              </a>
            </div>
          </div>
        )}
      </section>

      {/* エラー表示 */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ===== Step 1: 文字起こしを貼る ===== */}
      {step === 1 && (
        <section className="card-elevated p-6 border-[var(--accent)]/30 border">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">
            1. 文字起こしを貼り付ける
          </h2>
          <p className="text-sm text-[var(--muted)] mb-3">
            インタビューの文字起こしを貼ると、Geminiが5つのセクションに自動で分割します。
          </p>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="文字起こしをここに貼り付け…"
            rows={14}
            className="input-base w-full px-3 py-2.5 text-sm resize-y"
          />
          {transcript.length > 0 && (
            <p className="text-xs text-[var(--muted)] mt-1">{transcript.length}文字</p>
          )}
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={handleSplit}
              disabled={loading || !transcript.trim()}
              className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? "分割中…" : "Geminiで5セクションに分割 →"}
            </button>
          </div>

          {/* スプレッドシートからの貼り付け読み込み */}
          <div className="border-t border-[var(--card-border)] pt-4 mt-6">
            <p className="text-xs font-medium text-[var(--muted)] mb-1">
              または：スプレッドシートの表を貼り付けて読み込む
            </p>
            <textarea
              value={pastedTable}
              onChange={(e) => { setPastedTable(e.target.value); setError(null); }}
              placeholder="スプレッドシートの表をコピー＆ペースト（ヘッダー行付き）"
              rows={3}
              className="input-base w-full px-3 py-2 text-sm resize-y mb-2"
            />
            <button
              type="button"
              onClick={handleLoadFromPaste}
              disabled={!pastedTable.trim()}
              className="btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
            >
              貼り付けた表を読み込む（Step3へ）
            </button>
          </div>
        </section>
      )}

      {/* ===== Step 2: 5セクション分割 → 修正 ===== */}
      {step === 2 && (
        <section className="card-elevated p-6 border-[var(--accent)]/30 border">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">
            2. 5セクションに分割されました — 修正してください
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            各セクションの内容を確認・修正し、OKなら次の「細分化」に進みます。
          </p>
          <div className="space-y-4">
            {mainSections.map((sec, i) => (
              <div key={sec.id} className="rounded-lg p-4 bg-[var(--card-border)]/20 border border-[var(--card-border)]">
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                  {i + 1}. {sec.name}
                </p>
                <textarea
                  value={sec.content}
                  onChange={(e) => updateSection(i, e.target.value)}
                  rows={6}
                  className="input-base w-full px-3 py-2 text-sm resize-y"
                />
                <p className="text-xs text-[var(--muted)] mt-1">{sec.content.length}文字</p>
              </div>
            ))}
          </div>

          {/* 構成を選ぶ */}
          <div className="mt-6 border-t border-[var(--card-border)] pt-4">
            <p className="text-sm font-medium text-[var(--foreground)] mb-2">
              細分化する構成を選ぶ
            </p>
            <div className="flex flex-wrap gap-2">
              {(["flow", "campbell", "cinderella"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStructureType(t)}
                  className={`px-4 py-2.5 rounded-lg border text-left text-sm transition-all ${
                    structureType === t
                      ? "border-[var(--accent)] bg-[var(--accent-muted)]/50 text-[var(--accent)]"
                      : "border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--muted)]/50"
                  }`}
                >
                  <span className="font-medium block">{STRUCTURE_META[t].label}</span>
                  <span className="text-xs text-[var(--muted)] block mt-0.5">{STRUCTURE_META[t].description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              ← 戻る
            </button>
            <button
              type="button"
              onClick={handleSubdivide}
              disabled={loading}
              className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? "細分化中…" : "修正OK → Geminiで細分化 →"}
            </button>
          </div>
        </section>
      )}

      {/* ===== Step 3: 細分化 → 修正 ===== */}
      {step === 3 && (
        <section className="card-elevated p-6 border-[var(--accent)]/30 border">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">
            3. 脳科学で細分化されました — 修正してください
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            各シーンの「使う脳」「シーン種別」「尺」を参考に原稿を確認・修正し、次の「AI提案」に進みます。
          </p>
          <div className="space-y-4">
            {detailedSections.map((sec, i) => (
              <div key={sec.id} className="rounded-lg p-4 bg-[var(--card-border)]/20 border border-[var(--card-border)]">
                <div className="flex flex-wrap items-baseline gap-2 mb-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {i + 1}. {sec.name}
                  </span>
                  {sec.brain && (
                    <span className="text-xs text-[var(--accent)]">🧠 {sec.brain}</span>
                  )}
                  {sec.sceneType && (
                    <span className="text-xs text-[var(--muted)]">{sec.sceneType}</span>
                  )}
                  {sec.durationLabel && (
                    <span className="text-xs text-[var(--muted)]">尺: {sec.durationLabel}</span>
                  )}
                  {sec.location && (
                    <span className="text-xs text-[var(--muted)]">📍 {sec.location}</span>
                  )}
                </div>
                <textarea
                  value={sec.content}
                  onChange={(e) => updateSection(i, e.target.value)}
                  rows={5}
                  className="input-base w-full px-3 py-2 text-sm resize-y"
                />
                <p className="text-xs text-[var(--muted)] mt-1">{sec.content.length}文字</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              ← 戻る
            </button>
            <button
              type="button"
              onClick={handlePropose}
              disabled={loading}
              className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? "提案中…" : "修正OK → AIに提案してもらう →"}
            </button>
            <button
              type="button"
              onClick={() => { setProposedSections([]); setStep(5); }}
              className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              提案をスキップして反映へ →
            </button>
          </div>
        </section>
      )}

      {/* ===== Step 4: AI提案 → 修正 ===== */}
      {step === 4 && (
        <section className="card-elevated p-6 border-[var(--accent)]/30 border">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">
            4. AIからの提案 — 修正してください
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            AIが改善した原稿です。確認・修正してOKならスプレッドシートに反映します。
          </p>
          <div className="space-y-4">
            {proposedSections.map((sec, i) => (
              <div key={sec.id} className="rounded-lg p-4 bg-[var(--card-border)]/20 border border-[var(--card-border)]">
                <div className="flex flex-wrap items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {i + 1}. {sec.name}
                  </span>
                  {sec.brain && (
                    <span className="text-xs text-[var(--accent)]">🧠 {sec.brain}</span>
                  )}
                </div>
                {sec.reason && (
                  <p className="text-xs text-[var(--success)] mb-2 p-2 rounded bg-[var(--success)]/10">
                    改善: {sec.reason}
                  </p>
                )}
                <textarea
                  value={sec.content}
                  onChange={(e) => updateSection(i, e.target.value)}
                  rows={5}
                  className="input-base w-full px-3 py-2 text-sm resize-y"
                />
                <p className="text-xs text-[var(--muted)] mt-1">{sec.content.length}文字</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              ← 戻る
            </button>
            <button
              type="button"
              onClick={handlePropose}
              disabled={loading}
              className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              {loading ? "再提案中…" : "もう一度提案してもらう"}
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="btn-success px-5 py-2.5 text-sm"
            >
              修正OK → スプレッドシートに反映 →
            </button>
          </div>
        </section>
      )}

      {/* ===== Step 5: スプレッドシートに反映 ===== */}
      {step === 5 && (
        <section className="card-elevated p-6 border-[var(--success)]/30 border">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-2">
            5. スプレッドシートに反映
          </h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            完成した脚本をスプレッドシートに書き戻すか、CSVでダウンロードできます。
          </p>

          {/* プレビュー */}
          <div className="mb-4 p-3 rounded-lg bg-[var(--card-border)]/20 border border-[var(--card-border)] max-h-60 overflow-y-auto">
            <p className="text-xs font-medium text-[var(--muted)] mb-2">
              {(proposedSections.length ? proposedSections : detailedSections).length}シーン
            </p>
            {(proposedSections.length ? proposedSections : detailedSections).map((s, i) => (
              <div key={s.id} className="text-xs text-[var(--foreground)] mb-1">
                <span className="text-[var(--muted)]">{i + 1}.</span> {s.name}
                {s.content ? ` (${s.content.length}文字)` : " (空)"}
              </div>
            ))}
          </div>

          {/* スプレッドシートURL */}
          <div className="mb-3">
            <label className="block text-xs text-[var(--muted)] mb-1">スプレッドシートURL</label>
            <input
              type="url"
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="input-base w-full px-3 py-2.5 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={handleWriteToSheet}
              disabled={loading || !spreadsheetUrl.trim()}
              className="btn-success px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {loading ? "書き込み中…" : "OK → スプレッドシートに反映"}
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn-primary px-4 py-2.5 text-sm"
            >
              CSVダウンロード
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              ← 戻る
            </button>
          </div>

          {writeStatus && (
            <p className="mt-3 text-sm text-[var(--success)]">{writeStatus}</p>
          )}

          {/* 履歴に保存 */}
          <div className="border-t border-[var(--card-border)] pt-4 mt-4">
            <p className="text-sm font-medium text-[var(--foreground)] mb-2">
              この制作を履歴に保存（次回以降の脚本に反映されます）
            </p>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="プロジェクト名（例: ちゃおさん密着）"
              className="input-base w-full px-3 py-2 text-sm mb-2"
            />
            <textarea
              value={projectLessons}
              onChange={(e) => setProjectLessons(e.target.value)}
              placeholder="今回の学び・次回に活かすこと（任意）"
              rows={2}
              className="input-base w-full px-3 py-2 text-sm resize-y mb-2"
            />
            <button
              type="button"
              onClick={() => {
                const finalSecs = proposedSections.length ? proposedSections : detailedSections;
                const record: ProjectRecord = {
                  id: `proj-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                  title: projectTitle.trim() || `脚本 ${new Date().toLocaleDateString("ja-JP")}`,
                  structureType,
                  transcriptSummary: transcript.slice(0, 200),
                  sectionNames: finalSecs.map((s) => s.name),
                  sectionCount: finalSecs.length,
                  totalChars: finalSecs.reduce((a, s) => a + s.content.length, 0),
                  referenceScriptUsed: !!referenceScript.trim(),
                  lessons: projectLessons.trim(),
                };
                saveProject(record);
                setHistory(loadHistory());
                setWriteStatus((prev) => (prev ? prev + " 履歴にも保存しました。" : "履歴に保存しました。"));
              }}
              className="btn-primary px-4 py-2 text-sm"
            >
              履歴に保存
            </button>
          </div>

          <p className="text-xs text-[var(--muted)] mt-4">
            API未設定の場合は「CSVダウンロード」→ スプレッドシートに「ファイル→インポート」で取り込めます。
            <br />
            <a
              href={SPREADSHEET_TEMPLATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              テンプレートを開く →
            </a>
          </p>
        </section>
      )}

      {/* ===== 制作履歴 ===== */}
      <section className="card p-4">
        <button
          type="button"
          onClick={() => setHistoryOpen((o) => !o)}
          className="w-full text-left text-sm font-medium text-[var(--foreground)] flex items-center justify-between"
        >
          <span>制作履歴（{history.length}件 — 次回のAIに自動反映）</span>
          <span className="text-xs text-[var(--muted)]">{historyOpen ? "閉じる" : "開く"}</span>
        </button>
        {historyOpen && (
          <div className="mt-3 space-y-3">
            {history.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">まだ履歴がありません。Step5で保存すると蓄積されます。</p>
            ) : (
              history.map((rec) => (
                <div key={rec.id} className="p-3 rounded-lg bg-[var(--card-border)]/20 border border-[var(--card-border)] text-xs">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="font-medium text-[var(--foreground)]">{rec.title}</span>
                    <span className="text-[var(--muted)]">{rec.createdAt.slice(0, 10)}</span>
                  </div>
                  <p className="text-[var(--muted)]">
                    構成: {rec.structureType} / {rec.sectionCount}シーン / {rec.totalChars}文字
                  </p>
                  {rec.lessons && (
                    <p className="text-[var(--accent)] mt-1">学び: {rec.lessons}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => { deleteProject(rec.id); setHistory(loadHistory()); }}
                    className="text-red-400 hover:text-red-500 mt-1"
                  >
                    削除
                  </button>
                </div>
              ))
            )}
            <div className="flex gap-2 flex-wrap pt-2 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={() => {
                  const json = exportHistory();
                  const blob = new Blob([json], { type: "application/json" });
                  const u = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = u;
                  a.download = `脚本履歴_${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(u);
                }}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                履歴をエクスポート（JSON）
              </button>
              <label className="text-xs text-[var(--accent)] hover:underline cursor-pointer">
                履歴をインポート
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      try {
                        const count = importHistory(reader.result as string);
                        setHistory(loadHistory());
                        setError(null);
                        setWriteStatus(`${count}件の履歴をインポートしました。`);
                      } catch {
                        setError("履歴のインポートに失敗しました。");
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
