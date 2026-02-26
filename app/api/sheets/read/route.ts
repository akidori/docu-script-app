import { NextRequest, NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/sheets-auth";
import {
  getSpreadsheetIdFromUrl,
  parseSpreadsheetValues,
  spreadsheetRowsToSections,
} from "@/lib/spreadsheet-format";

/** テンプレート準拠: ヘッダー行10、データは11行目〜。列 A=時間,B=シーン,C=内容,D=シーン種別,E=秒数,F=所要時間,G=文字数,H=原稿 */
const DEFAULT_RANGE = "A10:H200";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spreadsheetUrl, spreadsheetId: bodyId } = body as {
      spreadsheetUrl?: string;
      spreadsheetId?: string;
    };
    const id = bodyId ?? getSpreadsheetIdFromUrl(spreadsheetUrl ?? "");
    if (!id) {
      return NextResponse.json(
        { error: "スプレッドシートのURLまたはIDを指定してください。" },
        { status: 400 }
      );
    }

    const client = await getSheetsClient();
    if (!client) {
      return NextResponse.json(
        {
          error:
            "スプレッドシート連携にはサーバー側で GOOGLE_SERVICE_ACCOUNT_JSON の設定が必要です。未設定の場合はスプレッドシートで表をコピーし、このアプリに貼り付けて増幅してください。",
        },
        { status: 503 }
      );
    }

    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: DEFAULT_RANGE,
    });
    const values = (res.data.values ?? []) as string[][];
    const rows = parseSpreadsheetValues(values);
    const sections = spreadsheetRowsToSections(rows);

    return NextResponse.json({
      rows,
      sections,
      clientEmail: client.clientEmail,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "スプレッドシートの読み込みに失敗しました。";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
