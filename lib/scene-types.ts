/**
 * シーン種別（スプレッドシートのルールに準拠）
 */
export type SceneTypeKey =
  | "insert"
  | "vlog"
  | "explanation"
  | "appeal"
  | "bridge";

export const SCENE_TYPES: Record<
  SceneTypeKey,
  { label: string; short: string; duration: string; description: string }
> = {
  insert: {
    label: "インサート",
    short: "インサート",
    duration: "3〜5秒",
    description: "映像のみ（場面の説明に使用する）",
  },
  vlog: {
    label: "VLOG",
    short: "VLOG",
    duration: "15〜30秒",
    description: "原稿にはない他愛もない会話（演者様の人柄を表す）",
  },
  explanation: {
    label: "解説系",
    short: "解説系",
    duration: "30秒〜1分",
    description: "動画内で伝えたいことを話す（動画の核）",
  },
  appeal: {
    label: "訴求",
    short: "訴求",
    duration: "2〜3分",
    description: "動画で最も伝えたい内容＆訴求したい商品の紹介など",
  },
  bridge: {
    label: "ブリッジ",
    short: "ブリッジ",
    duration: "5〜10秒",
    description: "次のセクションに違和感なく移動するためのシーン",
  },
};

export const SCENE_TYPE_OPTIONS: { value: SceneTypeKey; label: string }[] = [
  { value: "explanation", label: "解説系（30秒〜1分）" },
  { value: "appeal", label: "訴求（2〜3分）" },
  { value: "vlog", label: "VLOG（15〜30秒）" },
  { value: "insert", label: "インサート（3〜5秒）" },
  { value: "bridge", label: "ブリッジ（5〜10秒）" },
];

/** ルール説明（画面表示用） */
export const RULES_INTRO = `◼︎セクションの意図
　インサート：映像のみ（場面の説明に使用する）
　VLOG：原稿にはない他愛もない会話（演者様の人柄を表す）
　解説系：動画内で伝えたいことを話す（動画の核）
　訴求：動画で最も伝えたい内容＆訴求したい商品の紹介など
　ブリッジ：次のセクションに違和感なく移動するためのシーン

◼︎注意
　スプシ緑の項目は記載しない（自動生成箇所）`;
