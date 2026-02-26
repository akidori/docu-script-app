#!/bin/bash
# GCP Cloud Run にデプロイするスクリプト
set -e

SERVICE_NAME="docu-script-app"
REGION="asia-northeast1"

if ! command -v gcloud &> /dev/null; then
  echo "gcloud CLI がインストールされていません。"
  echo "https://cloud.google.com/sdk/docs/install でインストールしてください。"
  exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null || true)
if [ -z "$PROJECT_ID" ]; then
  echo "GCP プロジェクトが未設定です。先に実行してください:"
  echo "  gcloud config set project あなたのプロジェクトID"
  exit 1
fi

echo "プロジェクト: $PROJECT_ID"
echo "リージョン: $REGION"
echo "サービス名: $SERVICE_NAME"
echo "ビルド＆デプロイを開始します（数分かかります）..."
echo ""

# Gemini API キーを環境変数で渡す場合: --set-env-vars "GEMINI_API_KEY=あなたのキー"
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --platform managed

echo ""
echo "デプロイ完了。URL は上記の「Service URL」を参照してください。"
