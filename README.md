# Frameflow — Local Reel Maker

画像からInstagram Reels向けの9:16動画を作るWebアプリです。画像変換と動画生成はブラウザ内で行います。

## 機能

- JPG / PNG / WebP / HEIC / HEIF画像の複数選択
- HEIC / HEIFをブラウザ内でJPEGへ変換
- 画像の並べ替え・削除
- 画像ごとのタイトル・CTA・表示有無・差し込み位置の編集
- Chrome端末内AI、ローカルOllama、Ollama Cloudによる画像別タイトル・CTA提案
- 英語／日本語UI切替（初回は英語）
- 1080p・60fps・42Mbpsの高画質書き出しプリセット
- シネマティック／ダイナミック／ミニマル／フォトアルバム／SNSトレンドの5種類の動画演出
- Instagramリール／ストーリー／フィード縦型・正方形／YouTube Shortsの用途別出力
- 標準30fps／高画質60fpsと、用途・演出連動のコピー方向性・自由記述
- フェード＋ズーム付き9:16プレビュー
- 1080×1920 WebM動画の生成・ダウンロード

## ローカル起動

```bash
npm install --include=dev
npm run dev
```

ローカル開発時のOllama接続先は `http://localhost:11434` です。アプリの「接続先とモデルを自動検出」を押すと、`localhost:11434` と `127.0.0.1:11434` を順番に確認し、接続できたURL、取得した全モデル、画像対応状況を画面に表示します。画像対応モデルがあれば優先選択します。

ブラウザからOllamaプロセス自体を起動することはできません。Webページにローカルプログラムを任意起動させないブラウザ／OSのセキュリティ制約によるものです。未起動・接続失敗時は、アプリ内の「ローカルOllamaを検出できない場合」を開くと、次の手順も確認できます。

## AIコピー提案

画面で次の3方式を選択できます。

- **Chrome端末内AI**: Chrome Prompt APIの画像入力を使い、画像・タイトル・CTAを端末内で処理します。対応Chrome、端末要件、組み込みモデルの準備が必要です。ブラウザAPIのためVercelサーバー側で代行実行はできません。**現時点ではデスクトップ版Chrome/Edge限定の機能で、SafariやFirefoxにはこのAPI自体が存在しないため利用できません。** Safari等では下記のOllama方式のいずれかを選んでください。
- **ローカルOllama**: 利用者のMac上のOllamaへ直接接続します。画像対応モデルが必要です。
- **Ollama Cloud**: Vercel APIを経由し、サーバー環境変数の認証情報で接続します。画像は外部サービスへ送信され、料金・無料枠・利用可能モデルはアカウント側の状態に依存します。

### Ollama

Ollama方式は画像をOllamaへ渡すため、**vision capabilityを持つ画像対応モデル**が必要です。アプリの「接続とモデルを確認」で、登録モデルと画像対応状況を確認できます。

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

ブラウザから接続できない場合は、次の順番で確認します。

1. `ollama serve` を実行し、Ollamaを起動する
2. `curl http://localhost:11434/api/tags` でAPI応答が返ることを確認する
3. `ollama list` でモデルを確認し、画像対応モデルがなければ `ollama pull gemma3:4b` を実行する
4. CORSで遮断される場合は、開発URLを許可してOllamaを再起動する

```bash
OLLAMA_ORIGINS="http://localhost:5173,http://127.0.0.1:5173" ollama serve
```

5. アプリで「接続先とモデルを自動検出」をもう一度押す

アプリを `https://` の公開サイトから開いている場合、ブラウザがローカルの `http://localhost:11434` をMixed ContentまたはPrivate Network Accessの制約で遮断することがあります。その場合はこのリポジトリをローカル起動して利用するか、認証・TLS付きの安全なプロキシを用意してください。Ollamaを無認証のままインターネットへ公開しないでください。

## Vercelへのデプロイ

`vercel.json` と `/api/ollama` のサーバーレスプロキシを追加済みです。

```bash
vercel
```

VercelプロジェクトにはOllama Cloud用として以下を設定します。

- `OLLAMA_CLOUD_API_KEY`: Ollama CloudのAPIキー
- `OLLAMA_CLOUD_BASE_URL`: 必要な場合のみCloud APIのベースURL（未設定時は `https://ollama.com`）

従来の任意Ollamaプロキシを使う場合は、`OLLAMA_BASE_URL` と必要に応じて `OLLAMA_API_KEY` を設定します。APIキーをフロントエンドやlocalStorageへ保存しない設計です。

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

### Basic認証（サイト全体を保護）

`middleware.ts`（Vercel Edge Middleware）でサイト全体（静的アプリ＋`/api/*`）にHTTP Basic認証をかけられます。Vercelの無料プランを含む全プランで動作する方式です（Password ProtectionはPro/Enterprise向けの有料機能のため、こちらを採用しています）。

Vercelプロジェクトの Settings → Environment Variables で以下を設定すると有効になります。

- `BASIC_AUTH_USER`: ログインユーザー名
- `BASIC_AUTH_PASSWORD`: ログインパスワード

両方とも未設定の場合はアプリ全体が500エラーになり（設定漏れで無防備に公開されるのを防ぐフェールクローズ）、片方だけ・不一致の場合は401でブラウザの認証ダイアログが表示されます。環境変数はコードにもlocalStorageにも保存されません。設定変更後は再デプロイが必要です。

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
