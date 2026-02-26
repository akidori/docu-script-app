/**
 * Gemini API を使わない簡易モード用。
 * 文字起こしを5セクションに均等分割し、密着の流れテンプレートに乗せる。
 */

import { FLOW_SECTIONS } from "./structures";

export interface SimpleSection {
  id: string;
  name: string;
  content: string;
  brain?: string;
  sceneType?: string;
  durationLabel?: string;
}

const FIVE_IDS = ["intro", "current", "trigger", "origin", "future"] as const;
const FIVE_NAMES = [
  "冒頭の挨拶",
  "現在の活動",
  "活動のきっかけ",
  "活動の原点（幼少期）",
  "今後の目標",
] as const;

/** 文字起こしを5等分してセクションに */
export function splitTranscriptIntoFive(transcript: string): SimpleSection[] {
  const t = transcript.trim();
  if (!t) return FIVE_IDS.map((id, i) => ({ id, name: FIVE_NAMES[i]!, content: "" }));

  const len = t.length;
  const chunkSize = Math.ceil(len / 5);
  const sections: SimpleSection[] = [];

  for (let i = 0; i < 5; i++) {
    const start = i * chunkSize;
    const end = i === 4 ? len : (i + 1) * chunkSize;
    const content = t.slice(start, end).trim();
    sections.push({
      id: FIVE_IDS[i]!,
      name: FIVE_NAMES[i]!,
      content,
    });
  }
  return sections;
}

/** 5セクションを密着の流れテンプレートに乗せる（脳・尺・シーン種別を付与） */
export function applyFlowTemplate(sections: SimpleSection[]): SimpleSection[] {
  const template = FLOW_SECTIONS;
  return template.map((t, i) => ({
    id: t.id,
    name: t.name,
    content: sections[i]?.content ?? "",
    brain: t.brain,
    sceneType: t.sceneType,
    durationLabel: t.durationLabel,
  }));
}
