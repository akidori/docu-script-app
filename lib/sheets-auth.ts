import { google } from "googleapis";

/** サービスアカウントで Google Sheets API クライアントを取得。未設定時は null */
export async function getSheetsClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json?.trim()) return null;
  try {
    const credentials = JSON.parse(json) as {
      client_email?: string;
      private_key?: string;
    };
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
    });
    const sheets = google.sheets({ version: "v4", auth });
    return { sheets, clientEmail: credentials.client_email ?? null };
  } catch {
    return null;
  }
}
