import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAX_TEXT_LENGTH = 50000; // 取得するテキストの最大文字数

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URLを指定してください。" },
        { status: 400 }
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "有効なURLを入力してください。" },
        { status: 400 }
      );
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json(
        { error: "http または https のURLのみ対応しています。" },
        { status: 400 }
      );
    }

    const res = await fetch(parsed.href, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DocuScriptBot/1.0; +https://docu-script-app)",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `ページの取得に失敗しました（${res.status}）。` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // script, style, nav, footer を除去
    $("script, style, nav, footer, iframe, noscript").remove();

    // main, article, [role=main] があればそれを優先、なければ body
    const contentEl =
      $("main").first().length
        ? $("main").first()
        : $("article").first().length
          ? $("article").first()
          : $("[role='main']").first().length
            ? $("[role='main']").first()
            : $("body");

    let text = contentEl.text().replace(/\s+/g, " ").trim();
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH) + "\n\n…（省略）";
    }

    const title =
      $("title").text().trim() ||
      $("h1").first().text().replace(/\s+/g, " ").trim() ||
      "";

    return NextResponse.json({
      url: parsed.href,
      title: title || undefined,
      text,
      charCount: text.length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "URLの取得中にエラーが発生しました。";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
