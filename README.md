# 密着ドキュメンタリー脚本アプリ

文字起こしを5セクションに分割→脳科学で細分化→AI提案→スプレッドシート反映までを行うWebアプリ（Next.js + Gemini + Vercel）。

---

## コードを更新したら（どこにプッシュするか）

**プッシュ先 = このリポジトリ（GitHub: akidori/docu-script-app）**

1. ターミナルでプロジェクトフォルダへ:
   ```bash
   cd /Users/aki/Desktop/docu-script-app
   ```
2. 変更を GitHub に送る:
   ```bash
   git add -A
   git commit -m "修正内容を一言で"
   git push
   ```
3. **push すると、連携している Vercel が自動でデプロイします。**  
   数分後に https://docu-script-app.vercel.app が最新版になります。

---

## デプロイのリスクと対策

| 気にすること | リスク | 対策 |
|-------------|--------|------|
| **ソースコード** | リポジトリが公開なら誰でもコードを見られる | 秘密（APIキー等）はコードに書かず、Vercel の環境変数やアプリ内入力のみ（いまの構成でOK） |
| **APIキー** | 漏れると悪用される | ブラウザ入力分は端末の localStorage のみ。Vercel に置くキーは環境変数で設定し、リポジトリには含めない |
| **URLが知られる** | アプリのURLを知っている人が使える | 無料公開が目的なら問題なし。限定したい場合は Vercel のパスワード保護やリポジトリを非公開に |
| **利用料** | Gemini / Vercel の無料枠を超える | 使用量に応じて課金。各サービスの料金ページで確認 |

**まとめ:** APIキーをコードに書かず、GitHub に秘密を上げていなければ、一般的なリスクは抑えられています。

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
