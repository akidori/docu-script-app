import { NextRequest, NextResponse } from "next/server";
import {
  getStructureSections,
  type StructureType,
} from "@/lib/structures";

/**
 * 渡されたテキストを構成の各セクションに按分して「肉付け」案を返す。
 * セクションの目安文字数（charsMin〜charsMax）の比率でテキストを分割する。
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pastedText, structureType } = body as {
      pastedText?: string;
      structureType?: StructureType;
    };

    if (!pastedText || typeof pastedText !== "string") {
      return NextResponse.json(
        { error: "テキストを入力してください。" },
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

    const totalWeight = sections.reduce(
      (sum, s) => sum + (s.charsMin + s.charsMax) / 2,
      0
    );
    const text = pastedText.trim();
    const len = text.length;

    const results: { id: string; name: string; suggestedContent: string }[] = [];
    let start = 0;

    for (let i = 0; i < sections.length; i++) {
      const weight = (sections[i].charsMin + sections[i].charsMax) / 2;
      const ratio = weight / totalWeight;
      const end = i === sections.length - 1 ? len : Math.min(len, start + Math.round(len * ratio));
      const chunk = text.slice(start, end).trim();
      start = end;
      results.push({
        id: sections[i].id,
        name: sections[i].name,
        suggestedContent: chunk,
      });
    }

    return NextResponse.json({
      structureType: type,
      sections: results,
      sourceCharCount: len,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "肉付けの処理中にエラーが発生しました。";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
