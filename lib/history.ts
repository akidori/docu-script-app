/**
 * 制作履歴の保存・参照。
 * localStorage に保存し、次回以降の脚本作成時に Gemini へ自動フィードする。
 */

export interface ProjectRecord {
  id: string;
  createdAt: string;
  title: string;
  structureType: string;
  transcriptSummary: string;
  sectionNames: string[];
  sectionCount: number;
  totalChars: number;
  referenceScriptUsed: boolean;
  lessons: string;
}

const STORAGE_KEY = "docu_script_history";
const MAX_RECORDS = 50;

export function loadHistory(): ProjectRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ProjectRecord[];
  } catch {
    return [];
  }
}

export function saveProject(record: ProjectRecord): void {
  try {
    const existing = loadHistory();
    const updated = [record, ...existing.filter((r) => r.id !== record.id)].slice(0, MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function deleteProject(id: string): void {
  try {
    const existing = loadHistory();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter((r) => r.id !== id)));
  } catch { /* ignore */ }
}

export function exportHistory(): string {
  return JSON.stringify(loadHistory(), null, 2);
}

export function importHistory(json: string): number {
  const records = JSON.parse(json) as ProjectRecord[];
  if (!Array.isArray(records)) throw new Error("不正な形式です");
  const existing = loadHistory();
  const ids = new Set(existing.map((r) => r.id));
  const newOnes = records.filter((r) => !ids.has(r.id));
  const merged = [...newOnes, ...existing].slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return newOnes.length;
}

/**
 * Gemini プロンプトに含める履歴サマリ（直近5件）。
 * 過去にどんな脚本を作ったかをAIに伝え、感性を蓄積する。
 */
export function historyContextForPrompt(): string {
  const records = loadHistory().slice(0, 5);
  if (records.length === 0) return "";
  const lines = records.map((r, i) =>
    `${i + 1}. 「${r.title}」(${r.createdAt.slice(0, 10)}) — 構成:${r.structureType}, ${r.sectionCount}シーン, ${r.totalChars}文字${r.lessons ? `, 学び: ${r.lessons}` : ""}`
  );
  return `\n【過去の制作履歴（この感性・傾向を学習してください）】\n${lines.join("\n")}\n`;
}
