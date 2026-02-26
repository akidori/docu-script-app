import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  getStructureSections,
  STRUCTURE_META,
  type StructureType,
} from "@/lib/structures";

const MODEL = "gemini-2.0-flash";

type Mode = "split" | "subdivide" | "propose";

function splitPrompt(transcript: string): string {
  return `あなたは密着ドキュメンタリーの脚本編集の専門家です。

以下の文字起こしを、次の5つのセクションに分けてください。
文字起こしの順序を崩さず、該当する部分をそのまま抜き出してください。
該当しない部分は空文字で構いません。

1. intro - 冒頭の挨拶（自己紹介・挨拶・導入）
2. current - 現在の活動（今何をしているか・実績・日常）
3. trigger - 活動のきっかけ（なぜ始めたか・転機・病気や挫折）
4. origin - 活動の原点・幼少期（幼少期の体験・ルーツ）
5. future - 今後の目標（これからのビジョン・メッセージ・締め）

【文字起こし】
${transcript}

【出力形式】JSONのみ。説明やマークダウンは不要。
{
  "sections": [
    { "id": "intro",   "name": "冒頭の挨拶",   "content": "..." },
    { "id": "current", "name": "現在の活動",   "content": "..." },
    { "id": "trigger", "name": "活動のきっかけ", "content": "..." },
    { "id": "origin",  "name": "活動の原点（幼少期）", "content": "..." },
    { "id": "future",  "name": "今後の目標",   "content": "..." }
  ]
}`;
}

function subdividePrompt(
  fiveSections: { id: string; name: string; content: string }[],
  structureType: StructureType
): string {
  const label = STRUCTURE_META[structureType].label;
  const desc = STRUCTURE_META[structureType].description;
  const template = getStructureSections(structureType);
  const templateJson = JSON.stringify(
    template.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      brain: s.brain,
      sceneType: s.sceneType,
      durationLabel: s.durationLabel,
      charsMin: s.charsMin,
      charsMax: s.charsMax,
    })),
    null,
    2
  );
  const inputJson = JSON.stringify(fiveSections, null, 2);

  return `あなたは密着ドキュメンタリーの脚本編集の専門家です。

以下の5セクション（文字起こしの振り分け）を、構成テンプレート「${label}」に沿ってさらに細かいシーンに細分化してください。

■ 構成の特徴: ${desc}

■ 構成テンプレート（この順番・IDで出力してください）:
${templateJson}

■ 5セクションの内容:
${inputJson}

【ルール】
- 各シーンの「使う脳」に合った表現・テンションで原稿を書く
- ◼︎でインタビュアーの質問、その下に演者の答えの形式にする
- 文字起こしの内容をなるべく活かし、足りない箇所は補完する
- 各シーンの目安文字数（charsMin〜charsMax）を意識する

【出力形式】JSONのみ。
{
  "sections": [
    { "id": "テンプレートのID", "name": "シーン名", "content": "原稿", "brain": "使う脳", "sceneType": "種別", "durationLabel": "尺", "location": "撮影場所候補" }
  ]
}
全シーンを必ず含めてください。`;
}

function proposePrompt(
  sections: { id: string; name: string; content: string; brain?: string }[],
  referenceScript?: string
): string {
  const inputJson = JSON.stringify(sections, null, 2);
  const refBlock = referenceScript?.trim()
    ? `\n【参考脚本（このトーン・感性・言い回しを学習し同じ感性で書いてください）】\n${referenceScript.trim().slice(0, 8000)}\n`
    : "";

  return `あなたは密着ドキュメンタリーの脚本編集の専門家です。
${refBlock}
以下のシーン構成の原稿を、より視聴者を引き込む形に改善提案してください。

■ 改善のポイント:
- ◼︎でインタビュアーの質問と演者の答えを分ける形式を維持
- 各シーンの「使う脳」（brain）に合った感情表現に調整
- 視聴者が引き込まれる言い回し・間・テンポに
- 自然な会話の流れを保つ
- 具体的なエピソードや数字があれば活かす

■ 現在のシーン構成:
${inputJson}

【出力形式】JSONのみ。
{
  "sections": [
    { "id": "元のID", "name": "シーン名", "content": "改善した原稿", "reason": "改善のポイント（1〜2行）" }
  ]
}
全シーンを含めてください。contentが空のシーンはそのまま空で。`;
}

function extractJson(text: string): string {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (block) return block[1]!.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;
  if (start >= 0 && end > start) return text.slice(start, end);
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mode,
      apiKey: bodyKey,
      transcript,
      sections: inputSections,
      structureType,
      referenceScript,
      historyContext,
    } = body as {
      mode?: Mode;
      apiKey?: string;
      transcript?: string;
      sections?: { id: string; name: string; content: string; brain?: string }[];
      structureType?: StructureType;
      referenceScript?: string;
      historyContext?: string;
    };

    const apiKey =
      (typeof bodyKey === "string" && bodyKey.trim()) ||
      process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini APIキーを設定してください。" },
        { status: 503 }
      );
    }

    const historyBlock = historyContext?.trim() ? `\n${historyContext.trim()}\n` : "";

    let prompt: string;
    switch (mode) {
      case "split":
        if (!transcript?.trim()) {
          return NextResponse.json({ error: "文字起こしを入力してください。" }, { status: 400 });
        }
        prompt = splitPrompt(transcript.trim()) + historyBlock;
        break;
      case "subdivide":
        if (!inputSections?.length) {
          return NextResponse.json({ error: "セクションがありません。" }, { status: 400 });
        }
        prompt = subdividePrompt(inputSections, structureType ?? "flow") + historyBlock;
        break;
      case "propose":
        if (!inputSections?.length) {
          return NextResponse.json({ error: "セクションがありません。" }, { status: 400 });
        }
        prompt = proposePrompt(inputSections, referenceScript) + historyBlock;
        break;
      default:
        return NextResponse.json({ error: "mode を指定してください（split / subdivide / propose）。" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { temperature: 0.3, maxOutputTokens: 16384 },
    });

    const raw = response.text?.trim();
    if (!raw) {
      return NextResponse.json({ error: "Geminiから応答が空でした。" }, { status: 502 });
    }

    const parsed = JSON.parse(extractJson(raw));
    return NextResponse.json({ sections: parsed.sections ?? [], mode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gemini処理中にエラーが発生しました。";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
