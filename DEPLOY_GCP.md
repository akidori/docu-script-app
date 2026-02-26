# GCP（Cloud Run）へのデプロイ手順

## いま入っているもの

- **Dockerfile** … Next.js をビルドしてコンテナ化
- **.dockerignore** … ビルドに不要なファイルを除外
- **deploy-gcp.sh** … 1コマンドで Cloud Run にデプロイするスクリプト
- **next.config.mjs** … `output: "standalone"` で軽い本番ビルド

---

## 1. コードを GitHub に送る（まだの場合）

Cursor の「ソース管理」で **コミット** → **プッシュ** するか、ターミナルで:

```bash
cd /Users/aki/Desktop/docu-script-app
git add .
git commit -m "Gemini APIキー項目削除・簡易モード・GCP Cloud Runデプロイ対応"
git push origin main
```

※ GitHub へのログイン（または SSH 設定）が必要です。

---

## 2. GCP の準備（初回だけ）

### 2-1. Google Cloud SDK（gcloud）のインストール

- **Mac（Homebrew）**: `brew install google-cloud-sdk`
- それ以外: https://cloud.google.com/sdk/docs/install を参照

### 2-2. ログインとプロジェクト設定

```bash
gcloud auth login
gcloud config set project あなたのプロジェクトID
```

※ プロジェクトは [Google Cloud Console](https://console.cloud.google.com/) で作成し、請求を有効にしてください。

### 2-3. 必要な API の有効化

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

---

## 3. デプロイ実行

```bash
cd /Users/aki/Desktop/docu-script-app
./deploy-gcp.sh
```

初回はビルドに 5〜10 分かかることがあります。完了すると **Service URL** が表示されます。

---

## 4. Gemini API キー（任意）

簡易モード以外で Gemini を使う場合は、Cloud Run のサービスに環境変数を設定します。

**方法 A: デプロイ時に指定**

```bash
gcloud run deploy docu-script-app --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "GEMINI_API_KEY=あなたのAPIキー"
```

**方法 B: コンソールで後から設定**

1. [Cloud Run](https://console.cloud.google.com/run) を開く
2. サービス `docu-script-app` をクリック
3. 「編集と新しいリビジョンをデプロイ」→「変数とシークレット」で `GEMINI_API_KEY` を追加

---

## まとめ

| やること | コマンド／操作 |
|----------|----------------|
| コードを GitHub に送る | 上記 1 の push |
| gcloud 入れる | `brew install google-cloud-sdk` など |
| ログイン・プロジェクト指定 | `gcloud auth login` / `gcloud config set project ...` |
| デプロイ | `./deploy-gcp.sh` |

これで GCP の Cloud Run にデプロイできます。
