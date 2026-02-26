import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  getStructureSections,
  type StructureType,
} from "@/lib/structures";

const GEMINI_MODEL = "gemini-2.0-flash";

function buildPrompt(
  structureType: StructureType,
  sectionInfos: { id: string; name: string; description: string; brain: string; durationLabel: string; charsMin: number; charsMax: number }[],
  transcript: string,
  referenceScript?: string
): string {
  const structureLabel =
    structureType === "flow"
      ? "密着の流れ（冒頭挨拶→現在の活動→きっかけ→原点→今後の目標）"
      : structureType === "campbell"
        ? "キャンベル（ヒーローズジャーニー）"
        : "シンデレラストーリー";
  const sectionsJson = JSON.stringify(
    sectionInfos.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      brain: s.brain,
      durationLabel: s.durationLabel,
      charsMin: s.charsMin,
      charsMax: s.charsMax,
    })),
    null,
    2
  );

  const referenceBlock =
    referenceScript?.trim()
      ? `

【参考脚本（感性・トーンを学習してください）】
以下の脚本のトーン・構成・言い回し・テンションを参考にし、同じ「感性」で振り分けた原稿を書いてください。◼︎はインタビュアーの質問、その下が演者の答えなど、形式も参考にしてください。

${referenceScript.trim().slice(0, 8000)}
`
      : "";

  return `あなたは密着ドキュメンタリーの脚本編集の専門家です。
${referenceBlock}

【依頼】
以下の「文字起こし」を、構成「${structureLabel}」の各セクションに振り分けてください。
各セクションの「意図」「使う脳」「目安文字数」を踏まえ、文字起こしの該当部分を適切なセクションに割り当ててください。
文字起こしの順序を大きく崩さず、なるべく前から順に割り当ててください。足りないセクションは空文字で構いません。
原稿はそのまま抜き出しまたは要約し、必要なら「◼︎」で質問と答えを分けるなど、参考脚本に近い形式にしてください。

【構成のセクション一覧】
${sectionsJson}

【文字起こし】
${transcript}

【出力形式】
以下のJSONのみを出力してください。説明やマークダウンは不要です。
{
  "sections": [
    { "id": "セクションID", "name": "セクション名", "suggestedContent": "振り分けた原稿テキスト" }
  ]
}
セクションは上記のid・nameの順で、必ず全件含めてください。suggestedContentは文字起こしの該当部分をそのまま抜き出したり要約して入れてください。`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pastedText, structureType, apiKey: bodyApiKey, referenceScript } = body as {
      pastedText?: string;
      structureType?: StructureType;
      apiKey?: string;
      referenceScript?: string;
    };

    const apiKey =
      typeof bodyApiKey === "string" && bodyApiKey.trim() !== ""
        ? bodyApiKey.trim()
        : process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini APIキーを入力するか、.env.local に GEMINI_API_KEY を設定してください。取得は https://aistudio.google.com/apikey で可能です。",
        },
        { status: 503 }
      );
    }

    if (!pastedText || typeof pastedText !== "string") {
      return NextResponse.json(
        { error: "文字起こしを入力してください。" },
        { status: 400 }
      );
    }

    const type: StructureType =
      structureType === "flow"
        ? "flow"
        : structureType === "cinderella"
          ? "cinderella"
          : "campbell";
    const sections = getStructureSections(type);
    const sectionInfos = sections.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      brain: s.brain,
      durationLabel: s.durationLabel,
      charsMin: s.charsMin,
      charsMax: s.charsMax,
    }));

    const prompt = buildPrompt(
      type,
      sectionInfos,
      pastedText.trim(),
      typeof referenceScript === "string" ? referenceScript : undefined
    );

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return NextResponse.json(
        { error: "Geminiから応答が空でした。もう一度お試しください。" },
        { status: 502 }
      );
    }

    // JSON を抽出（```json ... ``` や前後の説明を除去）
    let jsonStr = text;
    const jsonBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlock) {
      jsonStr = jsonBlock[1].trim();
    } else {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}") + 1;
      if (start >= 0 && end > start) {
        jsonStr = text.slice(start, end);
      }
    }

    const parsed = JSON.parse(jsonStr) as {
      sections?: Array<{ id: string; name: string; suggestedContent: string }>;
    };

    const sectionsOut = parsed.sections ?? [];
    if (!Array.isArray(sectionsOut)) {
      return NextResponse.json(
        { error: "Geminiの応答形式が不正でした。" },
        { status: 502 }
      );
    }

    // 元のセクション順・id に揃える
    const byId = new Map(
      sectionsOut.map((s: { id: string; name: string; suggestedContent: string }) => [
        s.id,
        { id: s.id, name: s.name, suggestedContent: s.suggestedContent ?? "" },
      ])
    );
    const results = sections.map((s) => ({
      id: s.id,
      name: s.name,
      suggestedContent: byId.get(s.id)?.suggestedContent ?? "",
    }));

    return NextResponse.json({
      structureType: type,
      sections: results,
      sourceCharCount: pastedText.trim().length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Geminiでの処理中にエラーが発生しました。";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
