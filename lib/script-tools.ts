/**
 * 脚本作成に役立つアプリ・ツール（案内用）
 * 密着ドキュメンタリーの台本・文字起こし・構成に使えそうなものを掲載。
 */

export interface ScriptTool {
  name: string;
  url: string;
  description: string;
  category: "文字起こし" | "台本・メモ" | "構成・編集" | "その他";
}

export const SCRIPT_TOOLS: ScriptTool[] = [
  {
    name: "NotebookLM",
    url: "https://notebooklm.google.com",
    description: "音声・PDFをアップロードして要約・文字起こし。本アプリの文字起こし元として想定。",
    category: "文字起こし",
  },
  {
    name: "Google AI Studio",
    url: "https://aistudio.google.com",
    description: "Gemini APIキー取得。本アプリの「Geminiで構成を作成」で使用。",
    category: "その他",
  },
  {
    name: "Whisper（OpenAI）",
    url: "https://openai.com/research/whisper",
    description: "音声→テキスト。ローカルやAPIで文字起こしに利用可能。",
    category: "文字起こし",
  },
  {
    name: "Google ドキュメント",
    url: "https://docs.google.com",
    description: "台本・メモの共編集。音声入力で文字起こしも可能。",
    category: "台本・メモ",
  },
  {
    name: "Notion",
    url: "https://notion.so",
    description: "台本・構成の管理。データベースでセクション管理しやすい。",
    category: "台本・メモ",
  },
  {
    name: "Descript",
    url: "https://www.descript.com",
    description: "動画編集＋文字起こし＋台本編集を一体で。",
    category: "構成・編集",
  },
  {
    name: "Premiere Pro / DaVinci Resolve",
    url: "https://www.adobe.com/products/premiere.html",
    description: "編集時の台本・カット管理。",
    category: "構成・編集",
  },
  {
    name: "ChatGPT / Claude",
    url: "https://chat.openai.com",
    description: "台本の要約・構成案・言い回しのブラッシュアップ。",
    category: "その他",
  },
];

export const TOOLS_BY_CATEGORY = SCRIPT_TOOLS.reduce(
  (acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  },
  {} as Record<ScriptTool["category"], ScriptTool[]>
);
