# Frameflow — Reel Maker

**[English](#english)** ｜ **[日本語](#日本語)**

---

<a id="english"></a>

## English

Frameflow turns a set of photos into a polished 9:16 short video (Instagram Reel / Story, YouTube Shorts, feed posts). Everything — image conversion and video rendering — happens in the browser; nothing is uploaded unless you explicitly choose an external AI provider.

This README covers setup, deployment, and configuration. For a walkthrough of using the app itself (adding photos, motion styles, AI copy, exporting), see [USER_GUIDE.md](USER_GUIDE.md).

### Features

- Multi-select JPG / PNG / WebP / HEIC / HEIF images
- In-browser HEIC/HEIF → JPEG conversion
- Reorder / remove images
- Per-image title, CTA, visibility, and text position
- AI copy suggestions via Chrome on-device AI, Local Ollama, or Ollama Cloud
- English / Japanese UI (English by default)
- 1080p export presets: Standard (30fps) and High quality (60fps, 42 Mbps)
- 5 motion styles, each with its own color grade and signature decoration — not just a faster/slower pan-zoom:
  - **Cinematic** — slow zoom + letterbox bars + muted grade
  - **Dynamic** — fast zoom/slide + a white flash on every cut + punchy grade
  - **Minimal** — quiet cuts + soft vignette
  - **Photo album** — gentle pan + warm sepia grade and vignette
  - **Social trend** — quick cuts + a pulsing accent badge + bold grade
- The minimum duration per image automatically rises as you add more photos, so a large batch never feels like it's flickering by
- Output formats: Instagram Reel / Story, portrait/square feed, YouTube Shorts, each with format-aware safe areas
- 1080×1920 MP4 (H.264) export; automatically falls back to WebM on browsers without WebCodecs

### Getting started

```bash
npm install --include=dev
npm run dev
```

During local development, Ollama is expected at `http://localhost:11434`. Clicking **"Detect endpoint and models"** in the app checks `localhost:11434` and `127.0.0.1:11434` in order, and shows the connected URL, the full model list, and which ones support vision. A vision-capable model is preferred automatically if one is installed.

A browser page can never start the Ollama process itself — that's a deliberate browser/OS restriction against letting web pages launch arbitrary local programs. If detection fails, open **"If local Ollama cannot be detected"** in the app for the same steps as the [Ollama](#ollama) section below.

### Video export

Export prefers WebCodecs (`VideoEncoder`) through [mediabunny](https://mediabunny.dev/). Each frame is drawn to a canvas and encoded with an explicit timestamp, independent of real time, so a slow device just makes the export take longer — it can never drop or duplicate a frame. (The older `canvas.captureStream` + `MediaRecorder` approach is a real-time capture: if a single frame's draw call takes too long, that frame is gone.) As a side effect the container is also the far more portable MP4 (H.264), which plays back correctly on Safari 16.4+ too.

On browsers without WebCodecs support (older Firefox, for example), export automatically falls back to the `canvas.captureStream` + `MediaRecorder` WebM path.

### AI copy suggestions

Tap the photos you want AI copy for in the AI card's thumbnail grid (or use the checkboxes in "Copy for every image") **before** generating — AI only writes title/CTA for the images you've selected and leaves the rest untouched. Newly added photos start unselected. Trying to generate with nothing selected disables nothing outright; it just shows a notice asking you to pick at least one photo first.

Three providers are available:

- **Chrome on-device AI** — uses Chrome's Prompt API with image input; everything runs on-device. Requires a supported Chrome version, device requirements, and the built-in model to be ready. Being a browser API, it can't be proxied from a server. **This is a Chrome/Edge-only feature today — Safari and Firefox don't implement this API at all**, so pick one of the Ollama options below on those browsers.
- **Local Ollama** — connects directly to Ollama running on your own machine. Requires a vision-capable model.
- **Ollama Cloud** — goes through a Vercel serverless proxy using server-side credentials. Images are sent to an external service; pricing, free tier, and available models depend on your account.

#### Ollama

Because Ollama receives the image directly, it needs a **vision-capable model**. Use "Detect endpoint and models" in the app to see which installed models support vision — many general-purpose/text models don't (check the `capabilities` field via `ollama list` or `curl http://localhost:11434/api/tags` if you're unsure).

Install a vision model and point the app's model field at it, for example:

```bash
ollama pull gemma3:4b
ollama serve
```

You can also check available models and their capabilities directly:

```bash
ollama list
curl http://localhost:11434/api/tags
```

If the browser can't connect, work through this checklist:

1. Make sure Ollama is running: `ollama serve`
2. Confirm the API responds: `curl http://localhost:11434/api/tags`
3. Check `ollama list` for a vision-capable model; if there isn't one, `ollama pull gemma3:4b`
4. If the browser blocks the request (CORS), restart Ollama with the app's dev URL allow-listed:

```bash
OLLAMA_ORIGINS="http://localhost:5173,http://127.0.0.1:5173" ollama serve
```

5. Click "Detect endpoint and models" again in the app

**If Ollama runs as a persistent background service** (for example, installed via Homebrew and managed by `brew services`), the one-off `OLLAMA_ORIGINS="..." ollama serve` command above won't help — it just starts a second, temporary instance while the background service (without the allow-list) keeps answering on port 11434. Instead, set `OLLAMA_ORIGINS` on the service itself and restart it:

```bash
brew services list | grep ollama   # confirms it's a launchd-managed service
```

Add an `OLLAMA_ORIGINS` entry to that service's `EnvironmentVariables` dict in `~/Library/LaunchAgents/homebrew.mxcl.ollama.plist` (create the key if it's missing):

```xml
<key>OLLAMA_ORIGINS</key>
<string>http://localhost:5173,http://127.0.0.1:5173</string>
```

```bash
brew services restart ollama
```

If you open the app from a `https://` public URL, the browser may block the local `http://localhost:11434` request under Mixed Content or Private Network Access rules. In that case, run this repo locally instead, or put a properly authenticated/TLS-terminated proxy in front of Ollama. Never expose an unauthenticated Ollama instance to the internet.

### Deploying to Vercel

`vercel.json` and the `/api/ollama` serverless proxy are already included.

```bash
vercel
```

For Ollama Cloud, set on the Vercel project:

- `OLLAMA_CLOUD_API_KEY` — your Ollama Cloud API key
- `OLLAMA_CLOUD_BASE_URL` — only if you need a non-default Cloud API base URL (defaults to `https://ollama.com`)

For a self-hosted Ollama-compatible proxy instead, set `OLLAMA_BASE_URL` and, if needed, `OLLAMA_API_KEY`. API keys are never stored in the frontend or in `localStorage`.

#### Important constraint

The deployed app on Vercel can never reach `localhost:11434` on your own machine directly:

- Vercel's server-side `localhost` is not your machine.
- An HTTPS site calling local HTTP can be blocked as Mixed Content.
- Exposing Ollama directly to the internet without authentication is dangerous.

To use AI features in production, do one of the following:

1. Stand up an authenticated, TLS-terminated, externally reachable Ollama endpoint and set `OLLAMA_BASE_URL`
2. Use an Ollama-compatible hosted inference service
3. Only use the AI features during local development, and use the deployed app just for image editing and video export

If `OLLAMA_BASE_URL` isn't set, the production AI API returns 503 and the app surfaces that as a clear message.

#### Basic Auth (protecting the whole site)

`middleware.ts` (Vercel Edge Middleware) can gate the entire deployment — the static app and `/api/*` — behind HTTP Basic Auth. This works on every Vercel plan, including the free Hobby tier (Vercel's native Password Protection is a paid Pro/Enterprise feature, which is why this project uses middleware instead).

Set these in the Vercel project's Settings → Environment Variables to enable it:

- `BASIC_AUTH_USER` — login username
- `BASIC_AUTH_PASSWORD` — login password

If neither is set, the whole app returns 500 (fails closed, so a missing config can't accidentally leave the site wide open). If only one is set, or the credentials don't match, the browser shows its native Basic Auth prompt (401). Credentials are never stored in code or `localStorage`. Redeploy after changing them.

### Testing and building

```bash
npm test
npm run build
```

### Known limitations

- Video has no audio track.
- Browsers without WebCodecs support (e.g. older Firefox) fall back to WebM export.
- Initial load is on the larger side because of the HEIC decoder.
- Converting many large HEIC files at once increases memory usage.

---

<a id="日本語"></a>

## 日本語

画像からInstagram Reels向けの9:16動画を作るWebアプリです。画像変換と動画生成はブラウザ内で行い、外部AIプロバイダーを明示的に選ばない限り画像はどこにも送信されません。

このREADMEはセットアップ・デプロイ・設定についての内容です。アプリの使い方（写真の追加、動画パターン、AIコピー、書き出しなど）は[USER_GUIDE.md](USER_GUIDE.md)を参照してください。

### 機能

- JPG / PNG / WebP / HEIC / HEIFの複数選択
- HEIC / HEIFをブラウザ内でJPEGへ変換
- 画像の並べ替え・削除
- 画像ごとのタイトル・CTA・表示有無・差し込み位置の編集
- Chrome端末内AI、ローカルOllama、Ollama Cloudによる画像別タイトル・CTA提案
- 英語／日本語UI切替（初回は英語）
- 書き出しプリセット：標準（30fps）／高画質（60fps・42Mbps）、いずれも1080p
- 5種類の動画演出。単にパン・ズームの速さを変えるだけでなく、色調と装飾も演出ごとに変えて見た目を差別化：
  - **シネマティック** — 遅いズーム＋レターボックス＋落ち着いた色調
  - **ダイナミック** — 速いズーム／スライド＋カットごとの白フラッシュ＋鮮やかな色調
  - **ミニマル** — 静かな切り替え＋柔らかいビネット
  - **フォトアルバム** — 柔らかなパン＋暖色セピア調＋暖色ビネット
  - **SNSトレンド** — 短いカット＋鼓動するアクセントバッジ＋ポップな色調
- 写真の枚数に応じて1枚あたりの表示時間の下限が自動的に上がり、枚数が多くても切り替えが速すぎない
- 出力用途：Instagramリール／ストーリー、フィード縦型・正方形、YouTube Shorts。それぞれ用途別の安全領域を最適化
- 1080×1920 MP4（H.264）で書き出し。WebCodecs非対応ブラウザでは自動的にWebMへフォールバック

### ローカル起動

```bash
npm install --include=dev
npm run dev
```

ローカル開発時のOllama接続先は `http://localhost:11434` です。アプリの**「接続先とモデルを自動検出」**を押すと、`localhost:11434` と `127.0.0.1:11434` を順番に確認し、接続できたURL、取得した全モデル、画像対応状況を画面に表示します。画像対応モデルがあれば優先選択します。

ブラウザからOllamaプロセス自体を起動することはできません。Webページにローカルプログラムを任意起動させないブラウザ／OSのセキュリティ制約によるものです。未起動・接続失敗時は、アプリ内の**「ローカルOllamaを検出できない場合」**を開くと、下記[Ollama](#ollama-1)の手順を確認できます。

### 動画書き出し

書き出しは [mediabunny](https://mediabunny.dev/) 経由のWebCodecs（`VideoEncoder`）を優先して使います。画像1枚ごとにcanvasへ描画し、実時間とは無関係に明示的なタイムスタンプでエンコードするため、端末が重くてもフレームが欠落・重複しません（描画に時間がかかるほど書き出しが遅くなるだけです）。従来の`canvas.captureStream` + `MediaRecorder`によるリアルタイム録画は、1フレームの描画が時間内に間に合わないとその場でコマ落ちします。副次的に、コンテナも汎用性の高いMP4（H.264）になり、Safari 16.4以降でも正しく再生できます。

WebCodecsが使えないブラウザ（古いFirefoxなど）では、従来どおり`canvas.captureStream` + `MediaRecorder`によるWebM書き出しに自動フォールバックします。

### AIコピー提案

生成する**前に**、AIカードのサムネイル一覧（または「画像ごとのコピー一覧」のチェックボックス）で、コピーを入れたい画像をタップして選んでください。AIは選んだ画像だけにタイトル・CTAを書き込み、それ以外には触れません。画像を追加した直後はどれも未選択の状態です。何も選ばずに生成しようとしても止まるだけでなく、先に1枚選んでほしい旨の案内が表示されます。

画面で次の3方式を選択できます。

- **Chrome端末内AI** — Chrome Prompt APIの画像入力を使い、画像・タイトル・CTAを端末内で処理します。対応Chrome、端末要件、組み込みモデルの準備が必要です。ブラウザAPIのためサーバー側で代行実行はできません。**現時点ではデスクトップ版Chrome/Edge限定の機能で、SafariやFirefoxにはこのAPI自体が存在しないため利用できません。** それらのブラウザでは下記のOllama方式のいずれかを選んでください。
- **ローカルOllama** — 利用者のMac上のOllamaへ直接接続します。画像対応モデルが必要です。
- **Ollama Cloud** — Vercel APIを経由し、サーバー環境変数の認証情報で接続します。画像は外部サービスへ送信され、料金・無料枠・利用可能モデルはアカウント側の状態に依存します。

#### Ollama

Ollama方式は画像をOllamaへ直接渡すため、**vision capabilityを持つ画像対応モデル**が必要です。アプリの「接続先とモデルを自動検出」で、登録モデルと画像対応状況を確認できます。一般的なテキスト特化モデルの多くはvisionを持ちません（`ollama list`や`curl http://localhost:11434/api/tags`の`capabilities`欄で確認できます）。

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

**Ollamaが常駐バックグラウンドサービス（Homebrewの`brew services`管理など）として動いている場合**、上記の`OLLAMA_ORIGINS="..." ollama serve`を単発実行しても効果がありません。それは別の一時プロセスをもう1つ起動するだけで、常駐サービス（OLLAMA_ORIGINS未設定）が引き続きポート11434で応答し続けるためです。代わりに、サービス自体の環境変数にOLLAMA_ORIGINSを設定して再起動してください。

```bash
brew services list | grep ollama   # launchdで管理されているか確認
```

`~/Library/LaunchAgents/homebrew.mxcl.ollama.plist`の`EnvironmentVariables`に以下のキーを追加します（なければ新規作成）。

```xml
<key>OLLAMA_ORIGINS</key>
<string>http://localhost:5173,http://127.0.0.1:5173</string>
```

```bash
brew services restart ollama
```

アプリを `https://` の公開サイトから開いている場合、ブラウザがローカルの `http://localhost:11434` をMixed ContentまたはPrivate Network Accessの制約で遮断することがあります。その場合はこのリポジトリをローカル起動して利用するか、認証・TLS付きの安全なプロキシを用意してください。Ollamaを無認証のままインターネットへ公開しないでください。

### Vercelへのデプロイ

`vercel.json` と `/api/ollama` のサーバーレスプロキシを追加済みです。

```bash
vercel
```

VercelプロジェクトにはOllama Cloud用として以下を設定します。

- `OLLAMA_CLOUD_API_KEY` — Ollama CloudのAPIキー
- `OLLAMA_CLOUD_BASE_URL` — 必要な場合のみCloud APIのベースURL（未設定時は `https://ollama.com`）

従来の任意Ollamaプロキシを使う場合は、`OLLAMA_BASE_URL` と必要に応じて `OLLAMA_API_KEY` を設定します。APIキーをフロントエンドやlocalStorageへ保存しない設計です。

#### 重要な制約

Vercel上のアプリから、利用者のMacにある `localhost:11434` へ直接接続することはできません。

- Vercelサーバーの `localhost` は利用者のMacではありません。
- HTTPSサイトからローカルHTTPへ接続するとMixed Contentで遮断される場合があります。
- Ollamaを直接インターネットへ無認証公開するのは危険です。

本番AIモードを使うには、次のいずれかが必要です。

1. 認証・TLS付きで外部到達可能なOllamaエンドポイントを用意し、`OLLAMA_BASE_URL` に設定
2. Ollama互換のホステッド推論サービスを利用
3. AI機能をローカル開発時だけ利用し、Vercelでは画像編集・動画生成機能のみ利用

`OLLAMA_BASE_URL` が未設定の場合、Vercel上のAI APIは503を返し、設定不足を画面に表示します。

#### Basic認証（サイト全体を保護）

`middleware.ts`（Vercel Edge Middleware）でサイト全体（静的アプリ＋`/api/*`）にHTTP Basic認証をかけられます。Vercelの無料プランを含む全プランで動作する方式です（Password ProtectionはPro/Enterprise向けの有料機能のため、こちらを採用しています）。

Vercelプロジェクトの Settings → Environment Variables で以下を設定すると有効になります。

- `BASIC_AUTH_USER` — ログインユーザー名
- `BASIC_AUTH_PASSWORD` — ログインパスワード

両方とも未設定の場合はアプリ全体が500エラーになり（設定漏れで無防備に公開されるのを防ぐフェールクローズ）、片方だけ・不一致の場合は401でブラウザの認証ダイアログが表示されます。環境変数はコードにもlocalStorageにも保存されません。設定変更後は再デプロイが必要です。

### テストとビルド

```bash
npm test
npm run build
```

### 制約

- 動画は音声なしです。
- WebCodecs非対応ブラウザ（例：古いFirefox）ではWebM書き出しにフォールバックします。
- HEICデコーダーのため初回ロードサイズが大きめです。
- 大きなHEICを多数変換するとメモリ使用量が増えます。
