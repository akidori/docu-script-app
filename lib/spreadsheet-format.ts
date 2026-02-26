import type { ScriptSection } from "./structures";
import { SCENE_TYPES, type SceneTypeKey } from "./scene-types";
import { CHARS_PER_MINUTE } from "./constants";

/**
 * スプレッドシート形式の1行（[スタジアム様]ちゃおさん構成 に準拠）
 * https://docs.google.com/spreadsheets/d/1DC0zpxJ2Qi-p2iiKA9mYoTLDbLn47PjLDbbuS569sSw/edit?usp=sharing
 */
export interface SpreadsheetRow {
  時間: string; // "5:30", "7:00" など
  シーン: string; // 撮影場所・シーン
  内容: string; // セクション内容の説明
  シーン種別: string; // "解説系（30秒~1分）" など
  秒数: number;
  所要時間: string; // "1分16秒" など
  文字数: number;
  原稿: string;
}

/** 文字数から所要時間の表記（例: 378文字 → "1分16秒"） */
function charsToDurationLabel(chars: number): string {
  if (chars <= 0) return "0秒";
  const totalSec = Math.round((chars / CHARS_PER_MINUTE) * 60);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0 && sec > 0) return `${min}分${sec}秒`;
  if (min > 0) return `${min}分`;
  return `${sec}秒`;
}

/** 分:秒 形式（例: 76 → "1:16"） */
function formatTimeFromSeconds(totalSeconds: number): string {
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/**
 * 脚本セクション一覧をスプレッドシート行に変換する。
 * 時間は累積で計算（開始0:00、各セクションの所要時間を足す）。
 */
export function sectionsToSpreadsheetRows(
  sections: ScriptSection[],
  startTimeMinutes = 5,
  startTimeSeconds = 30
): SpreadsheetRow[] {
  let cumulativeSec = startTimeMinutes * 60 + startTimeSeconds;
  const rows: SpreadsheetRow[] = [];

  for (const sec of sections) {
    const chars = sec.content?.length ?? 0;
    const durationSec =
      chars > 0
        ? Math.round((chars / CHARS_PER_MINUTE) * 60)
        : (sec.durationSecMin ?? 60);
    const durationLabel = charsToDurationLabel(chars);
    const sceneTypeInfo = SCENE_TYPES[sec.sceneType];
    const sceneTypeLabel = sceneTypeInfo
      ? `${sceneTypeInfo.short}（${sceneTypeInfo.duration}）`
      : sec.sceneType;

    rows.push({
      時間: formatTimeFromSeconds(cumulativeSec),
      シーン: sec.location?.trim() || sec.name,
      内容: sec.description || sec.name,
      シーン種別: sceneTypeLabel,
      秒数: durationSec,
      所要時間: durationLabel,
      文字数: chars,
      原稿: sec.content ?? "",
    });

    cumulativeSec += durationSec;
  }

  return rows;
}

/** CSVの1フィールドをエスケープ（ダブルクォート・改行対応） */
function escapeCsvField(value: string): string {
  const s = String(value ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** スプレッドシート行をCSV文字列に（BOM付き・UTF-8でGoogleスプレッドシートに貼り付け可能） */
export function spreadsheetRowsToCsv(rows: SpreadsheetRow[]): string {
  const header = "時間,シーン,内容,シーン種別,秒数,所要時間,文字数,原稿";
  const body = rows
    .map(
      (r) =>
        [
          escapeCsvField(r.時間),
          escapeCsvField(r.シーン),
          escapeCsvField(r.内容),
          escapeCsvField(r.シーン種別),
          r.秒数,
          escapeCsvField(r.所要時間),
          r.文字数,
          escapeCsvField(r.原稿),
        ].join(",")
    )
    .join("\n");
  const BOM = "\uFEFF";
  return BOM + header + "\n" + body;
}

export const SPREADSHEET_TEMPLATE_URL =
  "https://docs.google.com/spreadsheets/d/1DC0zpxJ2Qi-p2iiKA9mYoTLDbLn47PjLDbbuS569sSw/edit?usp=sharing";

/** URLからスプレッドシートIDを抽出 */
export function getSpreadsheetIdFromUrl(url: string): string | null {
  const trimmed = (url || "").trim();
  const m = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1]! : null;
}

/** シーン種別ラベル（例: "解説系（30秒~1分）"）からキーを推測 */
function sceneTypeLabelToKey(label: string): SceneTypeKey {
  const s = (label || "").trim();
  if (/インサート|insert/i.test(s)) return "insert";
  if (/VLOG|vlog/i.test(s)) return "vlog";
  if (/訴求|appeal/i.test(s)) return "appeal";
  if (/ブリッジ|bridge/i.test(s)) return "bridge";
  return "explanation";
}

/**
 * 貼り付けたテキスト（CSVまたはタブ区切り）を2次元配列に。
 * スプレッドシートでコピーするとタブ区切りになることが多い。
 */
export function parsePastedTableToValues(text: string): string[][] {
  const raw = text.replace(/\uFEFF/g, "").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  const hasTab = lines.some((l) => l.includes("\t"));
  const sep = hasTab ? "\t" : ",";
  return lines.map((line) => {
    const parts: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        let end = i + 1;
        const buf: string[] = [];
        while (end < line.length) {
          if (line[end] === '"') {
            if (line[end + 1] === '"') {
              buf.push('"');
              end += 2;
              continue;
            }
            end++;
            break;
          }
          buf.push(line[end]);
          end++;
        }
        parts.push(buf.join(""));
        i = end;
        if (line[i] === sep) i++;
        continue;
      }
      const j = line.indexOf(sep, i);
      if (j < 0) {
        parts.push(line.slice(i).trim());
        break;
      }
      parts.push(line.slice(i, j).trim());
      i = j + 1;
    }
    return parts;
  });
}

/**
 * 貼り付けた表（CSVまたはタブ区切り）をセクションに変換。
 * 1行目はヘッダー想定。
 */
export function pastedTableToSections(pastedText: string): ScriptSection[] {
  const values = parsePastedTableToValues(pastedText);
  const rows = parseSpreadsheetValues(values);
  return spreadsheetRowsToSections(rows);
}

/**
 * API/CSVから取得した2次元配列を SpreadsheetRow にパース。
 * 1行目はヘッダー想定（列順: 時間,シーン,内容,シーン種別,秒数,所要時間,文字数,原稿）
 */
export function parseSpreadsheetValues(values: string[][]): SpreadsheetRow[] {
  if (!values?.length) return [];
  const rows: SpreadsheetRow[] = [];
  const header = values[0]?.map((c) => String(c ?? "").trim()) ?? [];
  const col = (key: keyof SpreadsheetRow) => {
    const i = header.indexOf(key);
    return i >= 0 ? i : -1;
  };
  const idxTime = col("時間") >= 0 ? col("時間") : 0;
  const idxScene = col("シーン") >= 0 ? col("シーン") : 1;
  const idxContent = col("内容") >= 0 ? col("内容") : 2;
  const idxType = col("シーン種別") >= 0 ? col("シーン種別") : 3;
  const idxSec = col("秒数") >= 0 ? col("秒数") : 4;
  const idxDuration = col("所要時間") >= 0 ? col("所要時間") : 5;
  const idxChars = col("文字数") >= 0 ? col("文字数") : 6;
  const idxScript = col("原稿") >= 0 ? col("原稿") : 7;
  for (let i = 1; i < values.length; i++) {
    const row = values[i] ?? [];
    const get = (j: number) => (j >= 0 && row[j] !== undefined ? String(row[j] ?? "").trim() : "");
    const secNum = idxSec >= 0 && row[idxSec] !== undefined ? Number(row[idxSec]) : 0;
    const charsNum = idxChars >= 0 && row[idxChars] !== undefined ? Number(row[idxChars]) : 0;
    rows.push({
      時間: get(idxTime),
      シーン: get(idxScene),
      内容: get(idxContent),
      シーン種別: get(idxType),
      秒数: Number.isNaN(secNum) ? 0 : secNum,
      所要時間: get(idxDuration),
      文字数: Number.isNaN(charsNum) ? 0 : charsNum,
      原稿: get(idxScript),
    });
  }
  return rows;
}

/**
 * スプレッドシート行を ScriptSection に変換（読み込み用）。
 * brain/charsMin/charsMax はデフォルトで補う。
 */
export function spreadsheetRowsToSections(rows: SpreadsheetRow[]): ScriptSection[] {
  const defaultBrain = "共感・前頭前野";
  const defaultCharsMin = 0;
  const defaultCharsMax = 2000;
  return rows.map((r, i) => ({
    id: `sheet-${i + 1}`,
    name: r.内容 || r.シーン || `セクション${i + 1}`,
    description: r.内容 || "",
    brain: defaultBrain,
    durationLabel: r.所要時間 || "約1分",
    durationSecMin: r.秒数 || 60,
    charsMin: defaultCharsMin,
    charsMax: defaultCharsMax,
    sceneType: sceneTypeLabelToKey(r.シーン種別),
    location: r.シーン || undefined,
    content: r.原稿 || "",
  }));
}

/** SpreadsheetRow を Sheets API 用の values 行（文字列配列）に */
export function spreadsheetRowsToValues(rows: SpreadsheetRow[]): string[][] {
  return rows.map((r) => [
    r.時間,
    r.シーン,
    r.内容,
    r.シーン種別,
    String(r.秒数),
    r.所要時間,
    String(r.文字数),
    r.原稿,
  ]);
}
