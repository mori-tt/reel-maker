# Frameflow — Local Reel Maker

画像からInstagram Reels向けの9:16動画を作るWebアプリです。画像変換と動画生成はブラウザ内で行います。

## 機能

- JPG / PNG / WebP / HEIC / HEIF画像の複数選択
- HEIC / HEIFをブラウザ内でJPEGへ変換
- 画像の並べ替え・削除
- タイトルとCTAの編集
- Ollama画像対応モデルによるタイトル・CTA提案
- フェード＋ズーム付き9:16プレビュー
- 1080×1920 WebM動画の生成・ダウンロード

## ローカル起動

```bash
npm install --include=dev
npm run dev
```

ローカル開発時のOllama接続先は `http://localhost:11434` です。

## Ollama AIモード

AIモードは画像をOllamaへ渡すため、**vision capabilityを持つ画像対応モデル**が必要です。アプリの「接続とモデルを確認」で、登録モデルと画像対応状況を確認できます。

現在このMacにある `gemma4:e2b` と `gemma4:e2b-32k` は、API上のcapabilitiesが `completion / tools / thinking` であり、visionを持ちません。そのためテキスト生成はできますが、画像を見たCTA提案には使用できません。

画像対応モデルを取得したうえで、画面のモデル欄をその名前へ変更してください。例：

```bash
ollama pull gemma3:4b
ollama serve
```

利用可能なモデルと機能は次のコマンドでも確認できます。

```bash
ollama list
curl http://localhost:11434/api/tags
```

ブラウザから接続できない場合は、開発URLを許可してOllamaを起動します。

```bash
OLLAMA_ORIGINS="http://localhost:5173,http://127.0.0.1:5173" ollama serve
```

## Vercelへのデプロイ

`vercel.json` と `/api/ollama` のサーバーレスプロキシを追加済みです。

```bash
vercel
```

Vercelプロジェクトには以下を設定します。

- `OLLAMA_BASE_URL`: Vercelから到達できるHTTPSのOllama互換エンドポイント
- `OLLAMA_API_KEY`: 接続先がBearer認証を要求する場合のみ

### 重要な制約

Vercel上のアプリから、利用者のMacにある `localhost:11434` へ直接接続することはできません。

- Vercelサーバーの `localhost` は利用者のMacではありません。
- HTTPSサイトからローカルHTTPへ接続するとMixed Contentで遮断される場合があります。
- Ollamaを直接インターネットへ無認証公開するのは危険です。

本番AIモードを使うには、次のいずれかが必要です。

1. 認証・TLS付きで外部到達可能なOllamaエンドポイントを用意し、`OLLAMA_BASE_URL` に設定
2. Ollama互換のホステッド推論サービスを利用
3. AI機能をローカル開発時だけ利用し、Vercelでは画像編集・動画生成機能のみ利用

`OLLAMA_BASE_URL` が未設定の場合、Vercel上のAI APIは503を返し、設定不足を画面に表示します。

## テストとビルド

```bash
npm test
npm run build
```

## 制約

- 動画は音声なしのWebM形式です。
- Instagram投稿用MP4への変換は未対応です。
- HEICデコーダーのため初回ロードサイズが大きめです。
- 大きなHEICを多数変換するとメモリ使用量が増えます。
- Safariでは動画書き出しに失敗する場合があり、ChromeまたはEdgeを推奨します。
