import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/sheets-auth";
import {
  getSpreadsheetIdFromUrl,
  sectionsToSpreadsheetRows,
  spreadsheetRowsToValues,
} from "@/lib/spreadsheet-format";

/** データは11行目から。ヘッダーは触らない */
const DATA_START_ROW = 11;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spreadsheetUrl, spreadsheetId: bodyId, sections } = body as {
      spreadsheetUrl?: string;
      spreadsheetId?: string;
      sections?: Array<{
        id: string;
        name: string;
        description?: string;
        content?: string;
        sceneType?: string;
        location?: string;
        durationSecMin?: number;
      }>;
    };
    const id = bodyId ?? getSpreadsheetIdFromUrl(spreadsheetUrl ?? "");
    if (!id) {
      return NextResponse.json(
        { error: "スプレッドシートのURLまたはIDを指定してください。" },
        { status: 400 }
      );
    }
    if (!Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json(
        { error: "書き戻すセクションがありません。" },
        { status: 400 }
      );
    }

    const client = await getSheetsClient();
    if (!client) {
      return NextResponse.json(
        {
          error:
            "スプレッドシート連携にはサーバー側で GOOGLE_SERVICE_ACCOUNT_JSON の設定が必要です。未設定の場合は「スプレッドシート用にエクスポート（CSV）」でダウンロードし、スプレッドシートに貼り付けてください。",
        },
        { status: 503 }
      );
    }

    const rows = sectionsToSpreadsheetRows(sections as Parameters<typeof sectionsToSpreadsheetRows>[0]);
    const values = spreadsheetRowsToValues(rows);
    const range = `A${DATA_START_ROW}:H${DATA_START_ROW + values.length - 1}`;

    await client.sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return NextResponse.json({ ok: true, range, rows: values.length });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "スプレッドシートへの書き込みに失敗しました。";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
