# Frameflow — Reel Maker

**[English](#english)** ｜ **[日本語](#日本語)**

---

<a id="english"></a>

## English

Frameflow turns a set of photos into a polished short video sized for wherever you're posting it — Instagram (Reel / Story / feed), TikTok, or YouTube (Shorts or standard 16:9 video). Regular use — adding photos, converting HEIC, picking a motion style, exporting — happens entirely in your browser; no photo is sent anywhere for that. A photo only leaves your device if you turn on AI copy suggestions and use Local Ollama or Ollama Cloud (Chrome's on-device AI never sends the image off your device either); see [AI copy suggestions](#ai-copy-suggestions) below for which is which.

Frameflow doesn't publish or upload directly to Instagram, TikTok, or YouTube — that would require each platform's own developer registration, OAuth, and (for most of them) business/app review, which is a different kind of project from a client-side tool like this. Instead, it focuses on what a browser-only app can do well: correct formats and safe areas for each platform, a ready-to-copy caption + hashtags, and (where the browser/device supports it) handing the finished file straight to that platform's own app via the OS share sheet.

This README covers setup, deployment, and configuration. For a walkthrough of using the app itself (adding photos, motion styles, AI copy, exporting), see [USER_GUIDE.md](USER_GUIDE.md).

### Features

- Multi-select JPG / PNG / WebP / HEIC / HEIF images
- In-browser HEIC/HEIF → JPEG conversion
- Reorder / remove images
- Per-image title, CTA, visibility, and text position
- Per-image auto-enhance: an optional, one-tap exposure/contrast correction (histogram-based, entirely local)
- Per-image focal point: tap where the subject is so cropping to the target aspect ratio keeps it in frame, or let AI locate the main subject for you (see [Chrome/Ollama AI beyond copywriting](#chromeollama-ai-beyond-copywriting))
- Per-image style override: give any single photo its own motion/color pattern instead of the project-wide default - useful when one photo in the batch needs to stand out, and it carries through to that photo's still-image export too
- A dedicated "Export image" button per photo, for grabbing just one slide (at its own style) without exporting the whole batch
- Background music: upload your own track, or pick one of 4 built-in generated moods (Calm, Uplifting, Cinematic, Playful) - either way it's trimmed/looped to the video's length with a fade-in at the start and a fade-out at the end (MP4 export only). The built-in tracks are synthesized live from a chord progression right in your browser (see [Where the background music comes from](#where-the-background-music-comes-from)) - not sampled from anywhere, so there's no licensing to think about
- Export every slide as a set of still images (e.g. an Instagram carousel post) in addition to video, using the same color grade/decoration/text as the chosen motion style
- AI copy suggestions via Chrome on-device AI, Local Ollama, or Ollama Cloud, plus a non-copywriting use of the same vision models for focal-point detection (see [Chrome/Ollama AI beyond copywriting](#chromeollama-ai-beyond-copywriting))
- English / Japanese UI (English by default)
- Export quality presets: Standard (30fps, 16 Mbps), High quality (60fps, 42 Mbps), and Ultra HD (60fps, 80 Mbps, 2x resolution - true 4K on formats based on a 1080p canvas) — Standard/High render at the format's base resolution (e.g. 1080x1920 for a 9:16 format); Ultra HD doubles both dimensions
- 12 motion styles, each with its own color grade, signature decoration, and text treatment (alignment/case/shadow) — not just a faster/slower pan-zoom:
  - **Cinematic** — slow zoom + letterbox bars + muted grade
  - **Dynamic** — fast zoom/slide + a white flash on every cut + punchy grade
  - **Minimal** — quiet cuts + soft vignette + smaller, lighter title
  - **Photo album** — gentle pan + warm sepia grade and vignette + left-aligned title
  - **Social trend** — quick cuts + a pulsing accent badge + bold grade + uppercase title
  - **Noir** — dramatic zoom + grayscale + film grain
  - **Neon** — pulsing zoom + scan lines + electric color + glowing title
  - **Polaroid** — gentle drift + instant-photo border + faded tone
  - **VHS** — tracking-line glitch + warm retro tone + gentle drift
  - **Glow** — soft bloom + dreamy warmth + floaty zoom + smaller, lighter title
  - **Comic** — halftone dots + bold pop color + punchy cuts + uppercase title
  - **Editorial** — bold color-block accent bar + sharp contrast + left-aligned title
- Motion amount (zoom/pan/rotation) scales with the actual per-image duration, so an 8s hold moves proportionally more than a 2s one instead of both using the same fixed range
- Duration per image automatically adjusts with photo count — the minimum rises and the maximum comes down as you add more, so a large batch neither flickers by nor runs unexpectedly long
- Constant-bitrate encoding, so export quality never dips below the selected preset regardless of how visually complex the photos are
- Output formats grouped by platform, each with format-aware safe areas so text/decoration stays clear of that platform's own UI:
  - **Instagram** — Reel, Story, portrait feed (4:5), square feed (1:1), landscape feed (1.91:1)
  - **TikTok** — 9:16 (with extra bottom clearance for TikTok's caption/username/sound UI), or square (1:1)
  - **YouTube** — Shorts (9:16), standard long-form video (16:9 landscape), or square (1:1)
- A soft duration hint (not a hard limit) when your video runs longer than what tends to work well for the selected format/platform — platform limits change over time, so this is guidance, not an enforced cutoff
- An AI-generated whole-post caption + hashtags (distinct from the per-image on-screen title/CTA), styled toward the selected platform's conventions, with a one-click copy-to-clipboard button for pasting into the platform's own post composer
- A native "Share to app…" button after export (on browsers/devices that support the Web Share API with files, mainly mobile) to hand the exported video straight to the Instagram/TikTok/YouTube app's share sheet
- MP4 (H.264) export at the resolution of the chosen format; automatically falls back to WebM on browsers without WebCodecs

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

<a id="where-the-background-music-comes-from"></a>

### Where the background music comes from

Frameflow doesn't ship any bundled/downloaded audio files, and doesn't scrape or link into third-party "free music" sites automatically - verifying the actual copyright status and license terms (attribution requirements, commercial-use restrictions, etc.) of content pulled from an arbitrary external site isn't something this app can do reliably, and getting it wrong would put that risk on whoever posts the video. Instead, the 4 built-in moods (`src/generated-music.ts`) are synthesized entirely client-side from oscillators (a chord progression per mood, run through a `OfflineAudioContext`, encoded to WAV) - original by construction, so there's no license to check.

For real produced/licensed music instead, download a track yourself from a source whose terms you're comfortable with and use the existing **"Add a music file"** upload button - a few well-known starting points (not affiliated with this project; check each one's current terms before use):

- [YouTube Audio Library](https://studio.youtube.com/) (inside YouTube Studio's left sidebar)
- [Pixabay Music](https://pixabay.com/music/)
- [Free Music Archive](https://freemusicarchive.org/)
- [Incompetech](https://incompetech.com/) (Kevin MacLeod)

<a id="chromeollama-ai-beyond-copywriting"></a>

### Chrome/Ollama AI beyond copywriting

The same on-device/Ollama vision models used for per-image title/CTA and the whole-post caption (see below) are also used for one non-copywriting task: **focal-point detection**. Instead of asking the model to write text, `buildFocalPointPrompt` (`src/ai.ts`) asks it to place the photo's main subject on a 3x3 grid (top-left, top-center, ..., bottom-right), and the app sets the manual focal point to that cell automatically.

A grid was chosen deliberately over asking for continuous `x`/`y` coordinates directly: testing against a small on-device model (`gemma3:4b`) showed it reliably collapsed free-form coordinates to `{"x":0.5,"y":0.5}` (dead center) regardless of where the subject actually was, but reasoned much more sensibly about which third of the frame something was in. This is a real, current limitation of small vision-language models at precise spatial localization, not a bug in the prompt/parsing - a stronger model (e.g. `qwen2.5vl`, which is specifically known for better visual grounding) may do noticeably better with the exact same code path. Either way, the UI treats every detection as a starting point to review, not a final answer - the same dot you'd place manually is shown for adjustment afterward.

There's no equivalent "beyond copywriting" use for actual pixel generation/editing: Chrome's Prompt API and Ollama's vision models can *understand* an image and respond with text (a title, a caption, a grid cell), but none of them can output new pixels - that would be a fundamentally different kind of model (image generation/inpainting), which isn't what's available on-device today.

<a id="ai-copy-suggestions"></a>

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

画像から、投稿先に合わせたショート動画を作るWebアプリです。Instagram（リール／ストーリー／フィード）、TikTok、YouTube（Shorts、または16:9の通常動画）に対応しています。通常の操作（画像の追加・HEIC変換・動画パターンの選択・書き出しなど）はすべてブラウザ内だけで完結し、画像はどこにも送信されません。画像が端末の外へ送信されるのは、「AIコピー提案」機能でローカルOllamaまたはOllama Cloudを使ったときだけです（Chrome端末内AIも画像を端末の外に出しません）。どの方式がどう違うかは下記[AIコピー提案](#aiコピー提案)を参照してください。

FrameflowはInstagram・TikTok・YouTubeへの直接投稿・アップロードには対応していません。それには各プラットフォームでの開発者登録・OAuth認証、多くの場合ビジネス確認やアプリ審査が必要で、本アプリのようなクライアントサイドのツールとは別種のプロジェクトになります。代わりに、ブラウザ完結のアプリとして得意なこと——各プラットフォームに合った用途・安全領域、コピペしやすいキャプション＋ハッシュタグの生成、対応ブラウザ・端末であればOSの共有シートを通じて完成ファイルをそのアプリへ直接渡すこと——に注力しています。

このREADMEはセットアップ・デプロイ・設定についての内容です。アプリの使い方（写真の追加、動画パターン、AIコピー、書き出しなど）は[USER_GUIDE.md](USER_GUIDE.md)を参照してください。

### 機能

- JPG / PNG / WebP / HEIC / HEIFの複数選択
- HEIC / HEIFをブラウザ内でJPEGへ変換
- 画像の並べ替え・削除
- 画像ごとのタイトル・CTA・表示有無・差し込み位置の編集
- 画像ごとの自動補正：ワンタップの露出・コントラスト補正（ヒストグラム解析、完全にローカル処理）
- 画像ごとのフォーカルポイント：被写体の位置をタップすると、用途に合わせてクロップしても被写体が枠内に残る。またAIに主な被写体の位置を検出してもらうことも可能（詳しくは[Chrome/OllamaのAI活用：コピー生成以外の使い方](#chromeollamaのai活用コピー生成以外の使い方)）
- 画像ごとのスタイル上書き：プロジェクト全体の既定パターンとは別に、1枚だけ違う動き・色調を指定可能。その画像だけ目立たせたいときに便利で、その画像の静止画書き出しにも反映されます
- 画像ごとの「この画像を書き出す」ボタン：バッチ全体を書き出さずに、その画像（＋そのスタイル）だけを1枚取得できます
- BGM（背景音楽）：お好きな音楽ファイルをアップロードするか、内蔵の生成ムード（カーム／アップリフティング／シネマティック／プレイフルの4種類）から選べます。いずれも動画の長さに合わせて自動でトリミングまたはループし、開始時にフェードイン、終了時にフェードアウトします（MP4書き出し時のみ）。内蔵ムードはブラウザ内でその場で音を合成したものです（詳しくは[BGMの音源について](#bgmの音源について)）
- 動画に加えて、各画像を静止画セット（Instagramカルーセル投稿など）としても書き出し可能。選んだ動画パターンと同じ色調・装飾・文字を反映
- Chrome端末内AI、ローカルOllama、Ollama Cloudによる画像別タイトル・CTA提案。同じ画像認識モデルを使ったコピー生成以外の用途（フォーカルポイント検出）もあります
- 英語／日本語UI切替（初回は英語）
- 書き出しプリセット：標準（30fps・16Mbps）／高画質（60fps・42Mbps）／最高画質（60fps・80Mbps・2倍解像度、1080pベースの用途では実質4K）。標準・高画質は用途の基本解像度（例：9:16用途なら1080×1920）で書き出し、最高画質は縦横ともに2倍になります
- 12種類の動画演出。単にパン・ズームの速さを変えるだけでなく、色調・装飾・文字の見せ方（配置・大文字化・影）まで演出ごとに変えて見た目を差別化：
  - **シネマティック** — 遅いズーム＋レターボックス＋落ち着いた色調
  - **ダイナミック** — 速いズーム／スライド＋カットごとの白フラッシュ＋鮮やかな色調
  - **ミニマル** — 静かな切り替え＋柔らかいビネット＋小さめで軽いタイトル
  - **フォトアルバム** — 柔らかなパン＋暖色セピア調＋暖色ビネット＋左寄せタイトル
  - **SNSトレンド** — 短いカット＋鼓動するアクセントバッジ＋ポップな色調＋大文字タイトル
  - **フィルムノワール** — ドラマチックなズーム＋モノクロ＋フィルム粒子
  - **ネオン** — 脈打つズーム＋走査線＋電飾カラー＋光るタイトル
  - **ポラロイド** — 柔らかな漂うような動き＋ポラロイド風フレーム＋褪せた色調
  - **VHS風** — トラッキングノイズ＋暖かみのあるレトロ色調＋緩やかな動き
  - **グロウ** — 柔らかい光の滲み＋夢見心地な暖かさ＋漂うようなズーム＋小さめで軽いタイトル
  - **コミック** — ハーフトーンドット＋ポップな色調＋小気味よいカット＋大文字タイトル
  - **エディトリアル** — 大胆なカラーブロックのアクセントバー＋シャープなコントラスト＋左寄せタイトル
- 動きの量（ズーム・パン・回転）が1枚あたりの表示時間に応じて調整され、8秒の表示は2秒の表示より比例して大きく動く（固定量ではない）
- 写真の枚数に応じて1枚あたりの表示時間の下限・上限が自動的に調整され、枚数が多くても切り替えが速すぎたり、逆に合計が長くなりすぎたりしない
- 固定ビットレートでエンコードするため、写真の内容が複雑でも選んだプリセットの画質を下回らない
- 出力用途はプラットフォームごとにグループ化。それぞれのUIと干渉しないよう安全領域を最適化：
  - **Instagram** — リール、ストーリー、フィード縦型（4:5）、フィード正方形（1:1）、フィード横型（1.91:1）
  - **TikTok** — 9:16（TikTokのキャプション／ユーザー名／サウンド表示分、下部の余白を多めに確保）、またはスクエア（1:1）
  - **YouTube** — Shorts（9:16）、通常動画（16:9・横型）、またはスクエア（1:1）
- この用途では何秒くらいが扱いやすいかのソフトな目安表示（厳密な上限ではありません）。各プラットフォームの制限は変わることがあるため、あくまで目安です
- 投稿全体で1つのキャプション＋ハッシュタグをAIで生成（画像内のタイトル・CTAとは別物）。選んだプラットフォーム向けのトーンに調整され、ワンクリックでクリップボードにコピーして各アプリの投稿欄に貼り付け可能
- 書き出し後に表示される「アプリに共有…」ボタン（Web Share APIのファイル共有に対応したブラウザ・端末、主にスマートフォン向け）。書き出した動画をInstagram・TikTok・YouTubeアプリの共有画面へそのまま渡せます
- 選んだ用途の解像度でMP4（H.264）書き出し。WebCodecs非対応ブラウザでは自動的にWebMへフォールバック

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

<a id="bgmの音源について"></a>

### BGMの音源について

Frameflowは音声ファイルを同梱・ダウンロードしたり、いわゆる「無料音楽」サイトへ自動的にリンク・スクレイピングしたりはしません。外部サイトから取得したコンテンツの実際の著作権状況やライセンス条件（クレジット表記の要否、商用利用の可否など）を本アプリ側で確実に検証する方法がなく、そこを誤ると動画を投稿する方にそのリスクが及んでしまうためです。代わりに、内蔵の4種類のムード（`src/generated-music.ts`）はブラウザ内で発振器から完全に合成しています（ムードごとのコード進行を`OfflineAudioContext`で処理し、WAVにエンコード）。構造上オリジナルなので、確認すべきライセンスがありません。

本格的に作られた・許諾された音楽を使いたい場合は、ご自身が納得できる利用条件のサイトから音源をダウンロードし、既存の**「音楽ファイルを追加」**ボタンからアップロードしてください。よく知られた候補をいくつか挙げます（本プロジェクトとは提携関係はありません。利用前に各サイトの最新の利用条件をご確認ください）：

- [YouTube Audio Library](https://studio.youtube.com/)（YouTube Studioの左サイドバー内）
- [Pixabay Music](https://pixabay.com/music/)
- [Free Music Archive](https://freemusicarchive.org/)
- [Incompetech](https://incompetech.com/)（Kevin MacLeod）

<a id="chromeollamaのai活用コピー生成以外の使い方"></a>

### Chrome/OllamaのAI活用：コピー生成以外の使い方

画像別タイトル・CTAや投稿キャプション（後述）に使っているのと同じChrome端末内AI／Ollamaの画像認識モデルは、コピー生成以外の用途にも1つ使われています：**フォーカルポイント検出**です。モデルに文章を書かせる代わりに、`buildFocalPointPrompt`（`src/ai.ts`）は写真の主な被写体が3×3グリッド（top-left, top-center, ... , bottom-right）のどこにあるかを答えさせ、そのマスに合わせてフォーカルポイントを自動設定します。

連続的な`x`/`y`座標を直接聞く方式ではなく、あえてグリッド方式を採用しています。小型の端末内モデル（`gemma3:4b`）で検証したところ、自由形式の座標を聞くと被写体の実際の位置に関わらず`{"x":0.5,"y":0.5}`（中央固定）に収束してしまう一方、画面のどの三分割エリアにあるかという問いにはずっと妥当に答えられることが分かりました。これは小型の画像言語モデルが持つ、精密な空間位置特定における現時点での実際の限界であり、プロンプトやパース処理側の不具合ではありません——より高性能なモデル（例えば視覚的グラウンディングに強いとされる`qwen2.5vl`など）を使えば、同じコードのまま明らかに良い結果が得られる可能性があります。いずれにしても、UI上はどの検出結果も「最終回答」ではなく「確認・調整の出発点」として扱っており、手動で置くのと同じドットが後から調整できる形で表示されます。

画像そのものの生成・編集については、「コピー生成以外」に相当する使い道は今のところありません。Chrome Prompt APIやOllamaの画像認識モデルは画像を理解して文章（タイトル・キャプション・グリッドのマスなど）で答えることはできますが、新しいピクセルを出力することはできません。それには画像生成・インペインティングという根本的に別種のモデルが必要で、現時点で端末内で使えるものではないためです。

<a id="aiコピー提案"></a>

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
