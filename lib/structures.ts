import { CHARS_30_SEC, CHARS_PER_MINUTE } from "./constants";
import type { SceneTypeKey } from "./scene-types";

export type StructureType = "campbell" | "cinderella" | "flow";

export interface ScriptSection {
  id: string;
  name: string;
  description: string;
  brain: string;
  durationLabel: string; // "1〜3分", "20〜40秒" など
  durationSecMin?: number;
  durationSecMax?: number;
  /** 目安文字数（最小） */
  charsMin: number;
  /** 目安文字数（最大） */
  charsMax: number;
  point?: string;
  /** シーン種別（インサート/VLOG/解説系/訴求/ブリッジ） */
  sceneType: SceneTypeKey;
  /** 撮影場所・シーン（任意） */
  location?: string;
  /** ユーザーが入力する脚本メモ・肉付け */
  content: string;
}

function secToChars(sec: number): number {
  return Math.round((sec / 60) * CHARS_PER_MINUTE);
}

/** キャンベル構造（ヒーローズジャーニー） */
export const CAMPBELL_SECTIONS: Omit<ScriptSection, "content">[] = [
  {
    id: "campbell-1",
    name: "日常世界",
    sceneType: "explanation",
    description: "まだ変化のない日常",
    brain: "共感（ミラーニューロン）",
    durationLabel: "1〜3分",
    durationSecMin: 60,
    durationSecMax: 180,
    charsMin: secToChars(60),
    charsMax: secToChars(180),
    point: "安心ゾーン。ここが長くてもOK",
  },
  {
    id: "campbell-2",
    name: "冒険の呼びかけ",
    description: "違和感・事件が起きる",
    brain: "ドーパミン＋軽い扁桃体",
    durationLabel: "20〜40秒",
    durationSecMin: 20,
    durationSecMax: 40,
    charsMin: secToChars(20),
    charsMax: secToChars(40),
    sceneType: "explanation",
  },
  {
    id: "campbell-3",
    name: "冒険の拒否",
    description: "怖い・無理・できない",
    brain: "共感（ミラーニューロン）",
    durationLabel: "1〜2分",
    durationSecMin: 60,
    durationSecMax: 120,
    charsMin: secToChars(60),
    charsMax: secToChars(120),
    sceneType: "explanation",
  },
  {
    id: "campbell-4",
    name: "師との出会い",
    description: "考え方・ヒントを得る",
    brain: "前頭前野（軽）",
    durationLabel: "30〜60秒",
    durationSecMin: 30,
    durationSecMax: 60,
    charsMin: secToChars(30),
    charsMax: secToChars(60),
    sceneType: "explanation",
  },
  {
    id: "campbell-5",
    name: "試練と停滞",
    description: "失敗・迷い・感情の上下",
    brain: "共感＋扁桃体",
    durationLabel: "2〜4分",
    durationSecMin: 120,
    durationSecMax: 240,
    charsMin: secToChars(120),
    charsMax: secToChars(240),
    sceneType: "appeal",
  },
  {
    id: "campbell-6",
    name: "最大の試練",
    description: "戻れない選択・喪失の可能性",
    brain: "扁桃体（強）",
    durationLabel: "20〜40秒",
    durationSecMin: 20,
    durationSecMax: 40,
    charsMin: secToChars(20),
    charsMax: secToChars(40),
    sceneType: "appeal",
  },
  {
    id: "campbell-7",
    name: "報酬・理解",
    description: "変化に気づく",
    brain: "ドーパミン＋前頭前野",
    durationLabel: "40〜90秒",
    durationSecMin: 40,
    durationSecMax: 90,
    charsMin: secToChars(40),
    charsMax: secToChars(90),
    sceneType: "appeal",
  },
  {
    id: "campbell-8",
    name: "帰還・余韻",
    description: "変わった日常に戻る",
    brain: "海馬",
    durationLabel: "20〜40秒",
    durationSecMin: 20,
    durationSecMax: 40,
    charsMin: secToChars(20),
    charsMax: secToChars(40),
    point: "「達成」より「安心・余韻」を優先すると記憶に残る",
    sceneType: "bridge",
  },
];

/** シンデレラ構造 */
export const CINDERELLA_SECTIONS: Omit<ScriptSection, "content">[] = [
  {
    id: "cinderella-1",
    name: "評価されない日常",
    description: "まだ変化のない日常",
    brain: "共感の脳",
    durationLabel: "1〜3分",
    durationSecMin: 60,
    durationSecMax: 180,
    charsMin: secToChars(60),
    charsMax: secToChars(180),
    point: "ここが長くてもOK。安心ゾーン",
    sceneType: "explanation",
  },
  {
    id: "cinderella-2",
    name: "理不尽・抑圧",
    description: "理不尽な扱い",
    brain: "扁桃体（怒り）",
    durationLabel: "30秒〜1分",
    durationSecMin: 30,
    durationSecMax: 60,
    charsMin: secToChars(30),
    charsMax: secToChars(60),
    point: "怒りは短く強く",
    sceneType: "explanation",
  },
  {
    id: "cinderella-3",
    name: "可能性の提示",
    description: "未来をチラ見せ",
    brain: "ドーパミン",
    durationLabel: "30秒",
    durationSecMin: 30,
    durationSecMax: 30,
    charsMin: CHARS_30_SEC,
    charsMax: CHARS_30_SEC,
    point: "未来をチラ見せするだけ",
    sceneType: "explanation",
  },
  {
    id: "cinderella-4",
    name: "行けない理由",
    description: "共感を深める",
    brain: "共感の脳",
    durationLabel: "1〜2分",
    durationSecMin: 60,
    durationSecMax: 120,
    charsMin: secToChars(60),
    charsMax: secToChars(120),
    point: "共感を深める最重要パート",
    sceneType: "explanation",
  },
  {
    id: "cinderella-5",
    name: "視点の変化（魔法）",
    description: "考え方・ヒント",
    brain: "前頭前野＋ドーパミン",
    durationLabel: "30秒〜1分",
    durationSecMin: 30,
    durationSecMax: 60,
    charsMin: secToChars(30),
    charsMax: secToChars(60),
    point: "教えない・断定しない",
    sceneType: "appeal",
  },
  {
    id: "cinderella-6",
    name: "失う不安",
    description: "緊張・扁桃体",
    brain: "扁桃体",
    durationLabel: "30秒〜1分",
    durationSecMin: 30,
    durationSecMax: 60,
    charsMin: secToChars(30),
    charsMax: secToChars(60),
    sceneType: "appeal",
  },
  {
    id: "cinderella-7",
    name: "ラスト（回復）",
    description: "本来の自分が見つかる",
    brain: "海馬",
    durationLabel: "30秒〜1分",
    durationSecMin: 30,
    durationSecMax: 60,
    charsMin: secToChars(30),
    charsMax: secToChars(60),
    point: "成功より「安心」で終わる",
    sceneType: "bridge",
  },
];

/** 密着の流れ（5セクション）— 各セクション内で脳科学の構造に分けていく */
export const FLOW_SECTIONS: Omit<ScriptSection, "content">[] = [
  {
    id: "flow-1",
    name: "冒頭の挨拶",
    description: "挨拶・自己紹介で興味を引く",
    brain: "ドーパミン＋扁桃体（軽）",
    durationLabel: "20〜60秒",
    durationSecMin: 20,
    durationSecMax: 60,
    charsMin: secToChars(20),
    charsMax: secToChars(60),
    point: "軽く引きつけ、自分ごと化の入口に",
    sceneType: "explanation",
  },
  {
    id: "flow-2",
    name: "現在の活動",
    description: "今何をしているか・実績・日常",
    brain: "扁桃体＋共感",
    durationLabel: "1〜3分",
    durationSecMin: 60,
    durationSecMax: 180,
    charsMin: secToChars(60),
    charsMax: secToChars(180),
    point: "重要度と共感で「この人」を伝える",
    sceneType: "explanation",
  },
  {
    id: "flow-3",
    name: "活動のきっかけ",
    description: "なぜこの活動を始めたか・転機",
    brain: "共感（ミラーニューロン）",
    durationLabel: "1〜2分",
    durationSecMin: 60,
    durationSecMax: 120,
    charsMin: secToChars(60),
    charsMax: secToChars(120),
    point: "感情の動きで共感を深める",
    sceneType: "appeal",
  },
  {
    id: "flow-4",
    name: "活動を始めるにあたっての原点（幼少期）",
    description: "ルーツ・幼少期・土台になった経験",
    brain: "共感＋前頭前野",
    durationLabel: "1〜2分",
    durationSecMin: 60,
    durationSecMax: 120,
    charsMin: secToChars(60),
    charsMax: secToChars(120),
    point: "意味づけと共感で「なぜ今の自分か」を",
    sceneType: "explanation",
  },
  {
    id: "flow-5",
    name: "今後の目標",
    description: "これから目指すこと・メッセージ",
    brain: "海馬",
    durationLabel: "30秒〜1分",
    durationSecMin: 30,
    durationSecMax: 60,
    charsMin: secToChars(30),
    charsMax: secToChars(60),
    point: "記憶に残る締め・安心で終わる",
    sceneType: "bridge",
  },
];

export function getStructureSections(type: StructureType): ScriptSection[] {
  const base =
    type === "campbell"
      ? CAMPBELL_SECTIONS
      : type === "cinderella"
        ? CINDERELLA_SECTIONS
        : FLOW_SECTIONS;
  return base.map((s) => ({ ...s, content: "" }));
}

export const STRUCTURE_META = {
  flow: {
    label: "密着の流れ（5セクション）",
    description: "冒頭挨拶→現在の活動→きっかけ→原点（幼少期）→今後の目標。各セクション内で脳科学の構造に分けていく。",
  },
  campbell: {
    label: "キャンベル（ヒーローズジャーニー）",
    description: "成長・挑戦・ビジネス・男性向け密着。危機・戦略の脳が主役。",
  },
  cinderella: {
    label: "シンデレラストーリー",
    description: "自己理解・ライフスタイル・美容・キャリア・女性向け密着。共感・記憶の脳が主役。",
  },
} as const;
