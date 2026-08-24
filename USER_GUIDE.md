# Frameflow — User Guide

**[English](#english)** ｜ **[日本語](#日本語)**

This guide covers day-to-day use of the app (turning photos into a video). For local setup, deployment, and Ollama configuration, see [README.md](README.md).

---

<a id="english"></a>

## English

### What Frameflow does

Frameflow turns a set of photos into a short video sized for wherever you're posting it — an Instagram Reel or Story, a portrait or square feed post, or a YouTube Short — directly in your browser. Regular use never sends a photo anywhere. The only exception is [AI copy suggestions](#ai-copy-suggestions-en): two of its three options (Local Ollama and Ollama Cloud) do send the image elsewhere, while Chrome's on-device AI keeps it on your device too.

### Quick start

1. Add your photos
2. Pick a video format and quality
3. (Optional) Add a title/CTA and choose a motion style
4. (Optional) Generate AI copy for some or all photos
5. Preview, then export the video

The sections below cover each step in more detail.

### 1. Add and arrange photos

Click **"+ Add images"** or the drop zone to select JPG, PNG, WebP, HEIC, or HEIF files (multiple at once). HEIC/HEIF photos (common from iPhones) are converted to JPEG automatically — this can take a moment for large files.

Once added, each photo appears in **"Build your story"** in the order it will play. Use the ↑ / ↓ buttons to reorder, or × to remove one.

Further down, in **"Copy for every image"**, each photo also gets two composition controls:

- **Auto-enhance**: a one-tap checkbox that corrects exposure and contrast (brightens underexposed shots, calms down overly harsh ones). It's computed from that photo alone and only ever applied when the checkbox is on — it never permanently modifies the original file.
- **Focal point**: tap the small thumbnail where the subject is. Since the video crops each photo to fill the target aspect ratio, this keeps the subject in frame instead of the default center crop cutting it off. A **"Center"** button appears once you've moved it, to undo.

### 2. Choose a video format and quality

Under **"Video format"**, pick the output that matches where you're posting. Formats are grouped by platform:

| Platform | Format | Aspect ratio | Notes |
|---|---|---|---|
| Instagram | Reel | 9:16 | Standard vertical short video |
| Instagram | Story | 9:16 | Extra top/bottom margin for Instagram's own UI |
| Instagram | Portrait feed | 4:5 | Regular Instagram post |
| Instagram | Square feed | 1:1 | General-purpose social post |
| TikTok | TikTok | 9:16 | Extra bottom margin for TikTok's caption/username/sound UI |
| YouTube | Shorts | 9:16 | Extra right-side margin for YouTube's UI |
| YouTube | Video | 16:9 | Standard landscape upload |

The dashed rectangle in the preview shows the "safe area" — keep important content inside it so it isn't covered by the platform's own buttons/UI.

Below that, choose **Standard** (30fps, smaller file) or **High quality** (60fps, smoother motion, larger file). Both render 1080px wide (1920px wide for the 16:9 YouTube video format); the other dimension comes from the format you picked above.

If your total video length runs longer than what tends to work well for the selected format, a small note appears under the format picker (e.g. "This video is 90s long — 60s tends to work best for this format"). It's a guideline based on common practice, not an enforced limit — platforms revise their actual rules over time, so treat it as a nudge rather than a hard rule.

### 3. Titles, captions, and per-image text

- **Fallback title** / **Fallback CTA**: shown on any photo that doesn't have its own title/CTA set. Leave the defaults or change them.
- **Duration per image**: how long each photo is shown. The allowed range depends on how many photos you have — with more photos, the minimum rises a little (so a long video doesn't feel like it's flickering by) and the maximum comes down a little (so it can't run unexpectedly long either). The hint text under the slider always shows the current allowed range.
- **Copy for every image**: once you've added photos, this list lets you set a title, CTA, and text position (Upper / Center / Lower) individually per photo, toggle **"Show text"** on or off for that photo, or clear its copy.

### 4. Motion style

Under **"Motion style"**, pick one of twelve looks. Each has its own pacing, color grade, signature visual touch, and text treatment (alignment, capitalization, shadow style) — not just a faster or slower zoom:

- **Cinematic** — slow zoom, letterbox bars, muted color — for reflective, story-like content
- **Dynamic** — fast zoom/slide, a quick white flash on every cut, vivid color — for energetic, attention-grabbing content
- **Minimal** — quiet transitions, a soft darkened vignette, gentle color, smaller/lighter title — for clean, understated content
- **Photo album** — gentle pan, warm sepia tone with a soft frame, left-aligned title — for nostalgic, memory-style content
- **Social trend** — quick cuts, a small pulsing accent badge, bold saturated color, uppercase title — for trend-driven, social-native content
- **Noir** — dramatic zoom, grayscale, film grain texture — for moody, cinematic-mystery content
- **Neon** — pulsing zoom, scan lines, electric color, glowing title — for nightlife or high-energy content
- **Polaroid** — gentle drift, an instant-photo border (thicker at the bottom), faded tone — for casual, personal-memory content
- **VHS** — a drifting tracking-line glitch, warm retro tone, gentle drift — for nostalgic, home-video content
- **Glow** — soft bloom, dreamy warmth, floaty zoom, smaller/lighter title — for soft, poetic content
- **Comic** — halftone dot texture, bold pop color, punchy cuts, uppercase title — for playful, high-energy content
- **Editorial** — a bold color-block accent bar, sharp contrast, left-aligned title — for confident, magazine-style content

The preview updates live so you can compare before exporting. Longer per-image durations also move proportionally more than shorter ones for the same style, so an 8-second hold doesn't feel static next to a 2-second one.

### 5. Background music (optional)

Under **"Background music"**, click **"Add a music file"** to upload your own track (any audio format your browser can decode). It's automatically trimmed to match the video's length if it's longer, or looped seamlessly if it's shorter, with a short fade-out at the very end either way. Use the volume slider to adjust how loud it plays, or **"Remove"** to drop it.

Music is only included in the MP4 export — the older WebM fallback (used only by browsers without the newer WebCodecs API) stays video-only.

<a id="ai-copy-suggestions-en"></a>

### 6. AI copy suggestions (optional)

Turn on **"AI copy suggestions"** to have AI write a title and CTA for you, based on each photo.

1. **Select which photos should get AI copy.** Tap photos in the thumbnail grid (or use **Select all** / **Clear selection**). Newly added photos start unselected — this is deliberate, so AI never overwrites text you've already written unless you ask it to.
2. **Pick a provider:**
   - **Chrome on-device AI** — free and private; the image never leaves your device. Click **"Check availability and prepare automatically"** first. Only works in desktop Chrome/Edge with the on-device model available — not Safari or Firefox.
   - **Local Ollama** — free and private, using [Ollama](https://ollama.com) running on your own computer. Click **"Detect endpoint and models"** to connect. Only works when you're running the app itself locally (`npm run dev`) on that same computer — it cannot reach your computer from the publicly deployed website, by browser design. See README.md for setup.
   - **Ollama Cloud** — click **"Connect and fetch models"** to load your available models. Works from anywhere, including the deployed website, but requires the site owner to have configured it, and your images are sent to an external service.
3. Optionally pick a **copy direction** (or write a **custom request**) to steer the tone.
4. Click **"Suggest copy with AI"**. It only writes to the photos you selected in step 1 — everything else is left untouched.

If something goes wrong, the status message under the provider buttons explains why (for example, the app now specifically detects and explains the case where the public HTTPS site can't reach a local Ollama, rather than showing a generic connection error).

Below the per-image copy generator is a separate **"Post caption + hashtags"** card. This is different from the per-image title/CTA above: it's one caption for the whole post (like what you'd type into Instagram's or TikTok's own caption box), generated from your first photo and fallback title, and styled toward whichever platform your selected format belongs to (Instagram/TikTok favor a hook plus a larger hashtag block; YouTube favors a descriptive sentence plus a few targeted tags). Click **"Generate caption"**, then **"Copy to clipboard"** to grab it for pasting when you post. It uses the same provider you picked above.

### 7. Preview

The phone-shaped preview on the right plays back your video with the fade/zoom/text timing you'll get in the final export. Use the play button and scrubber to check pacing and text placement before exporting.

### 8. Export your video

Click **"Export video"**. Frameflow renders every frame in the browser and downloads an MP4 (H.264) file named after the format you picked (for example `instagram-reel.mp4`). On browsers without the newer WebCodecs API, it automatically falls back to WebM instead — either way, no upload is involved; the file is generated and downloaded locally.

Prefer stills over (or alongside) video? Click **"Export as images"** instead to download every slide as its own JPEG — useful for an Instagram carousel post or anywhere else you want images rather than a video. Each one uses the same motion style's color grade, decoration, and text, frozen at a clean, fully-opaque moment rather than mid-fade. They download one at a time, named `<format>-01.jpg`, `<format>-02.jpg`, and so on in slide order.

After a video export finishes, a **"Share to app…"** button may appear (this depends on your browser and device — it's mainly available on mobile browsers that support sharing files, like Safari on iOS or Chrome on Android). Tapping it opens your device's native share sheet with the exported video already attached, so you can pick Instagram, TikTok, YouTube, or any other installed app to post directly, instead of finding the file in your downloads first. Frameflow itself never uploads or publishes anything — this just hands the file to an app you choose.

### 9. Switching languages

Use the **EN / 日本語** switch in the top-right corner at any time — it changes the interface language immediately without losing your work.

### Tips & troubleshooting

- **A photo's text doesn't show up in the preview/export**: check that **"Show text"** is enabled for that photo in "Copy for every image".
- **The AI button won't do anything**: make sure at least one photo is selected in the AI card's thumbnail grid first.
- **"Local Ollama was not found" on the live website**: expected if you're using Local Ollama from the public HTTPS site — browsers block that connection for security reasons regardless of how Ollama is configured. Use Ollama Cloud there, or run the app locally to use Local Ollama (see README.md).
- **The site asks for a username and password**: that's an extra layer the site owner may have added (Basic Auth); ask them for the login details.
- For anything about installing/configuring Ollama, deploying to Vercel, or environment variables, see [README.md](README.md).

---

<a id="日本語"></a>

## 日本語

### Frameflowでできること

Frameflowは、手持ちの写真から投稿先に合わせたショート動画（Instagramリール／ストーリー、フィード縦型・正方形投稿、YouTube Shortsなど）をブラウザ内だけで作れるアプリです。通常の操作で画像がどこかへ送信されることはありません。唯一の例外は[AIコピー提案（任意）](#ai-copy-suggestions-ja)で、3方式のうちローカルOllamaとOllama Cloudの2つは画像を外部へ送信しますが、Chrome端末内AIは画像を端末の外に出しません。

### かんたんな流れ

1. 写真を追加する
2. 動画の用途と画質を選ぶ
3. （任意）タイトル・CTAと動画パターンを設定する
4. （任意）一部またはすべての写真にAIでコピーを生成する
5. プレビューして、動画を書き出す

以下、各ステップの詳細です。

### 1. 写真の追加・並べ替え

**「＋画像を追加」**またはドロップエリアから、JPG・PNG・WebP・HEIC・HEIFファイルを複数選択できます。HEIC/HEIF（iPhoneで多い形式）は自動でJPEGに変換されます。ファイルが大きいと少し時間がかかります。

追加した写真は**「ストーリーを組み立てる」**に再生順で並びます。↑／↓で並べ替え、×で削除できます。

さらに下の**「画像ごとのコピー一覧」**では、写真ごとに2つの構図調整もできます：

- **自動補正**：ワンタップで露出とコントラストを補正するチェックボックスです（暗すぎる写真を明るく、コントラストが強すぎる写真は落ち着かせます）。その写真単体の解析結果に基づき、チェックを入れたときだけ適用されます。元のファイルを書き換えることはありません。
- **フォーカルポイント**：小さなサムネイルの、被写体がある位置をタップします。動画は用途に合わせて各写真をクロップするため、これを設定しておくと既定の中央クロップで被写体が切れてしまうのを防げます。位置をずらすと**「中央に戻す」**ボタンが表示され、いつでも元に戻せます。

### 2. 動画の用途と画質

**「動画の用途」**で、投稿先に合った出力形式を選びます。用途はプラットフォームごとにグループ化されています。

| プラットフォーム | 用途 | 比率 | 備考 |
|---|---|---|---|
| Instagram | リール | 9:16 | 標準的な縦型ショート動画 |
| Instagram | ストーリー | 9:16 | Instagram UI分の上下余白を確保 |
| Instagram | フィード縦型 | 4:5 | 通常のInstagram投稿 |
| Instagram | フィード正方形 | 1:1 | 汎用的なSNS投稿 |
| TikTok | TikTok | 9:16 | TikTokのキャプション／ユーザー名／サウンド表示分、下部の余白を多めに確保 |
| YouTube | Shorts | 9:16 | YouTube UI分の右側余白を考慮 |
| YouTube | 動画 | 16:9 | 通常の横型アップロード用 |

プレビュー内の点線枠は「安全領域」です。ここに収まるように配置すると、各プラットフォーム自体のボタン等に隠れません。

その下で、**標準**（30fps・軽量）または**高画質**（60fps・なめらか・ファイルサイズ大）を選べます。幅は基本1080px（YouTube動画〈16:9〉は1920px）で、もう一方の辺は上で選んだ用途によって変わります。

動画の合計時間が、選んだ用途で扱いやすいとされる長さを超えると、用途選択の下に小さな注記が表示されます（例：「この動画は90秒です。この用途では60秒以内が扱いやすい目安です」）。これは一般的な傾向に基づく目安であり、厳密な制限ではありません。各プラットフォームの実際のルールは変わることがあるため、参考程度にお使いください。

### 3. タイトル・CTA・画像ごとの文字

- **共通タイトル／共通CTA**：個別のタイトル・CTAを設定していない写真に使われます。デフォルトのままでも、変更してもOKです。
- **1枚の表示時間**：写真1枚あたりの表示秒数です。選べる範囲は写真の枚数によって変わります。枚数が多いほど下限が少し上がり（切り替えが速すぎて落ち着かなくなるのを防ぐため）、上限は少し下がります（合計が想定以上に長くなりすぎないようにするため）。スライダー下のヒント文に、今選べる範囲が常に表示されます。
- **画像ごとのコピー一覧**：写真を追加すると表示され、写真ごとにタイトル・CTA・文字位置（上／中央／下）を個別設定したり、その写真の**「文字を表示」**をオン・オフしたり、コピーを削除したりできます。

### 4. 動画パターン

**「動画パターン」**から12種類の演出を選べます。それぞれ速さだけでなく、色調・視覚効果・文字の見せ方（配置・大文字化・影）まで変えているので、はっきり見た目が異なります。

- **シネマティック** — ゆっくりズーム、上下のレターボックス、落ち着いた色調。振り返るような、物語的な内容向き
- **ダイナミック** — 速いズーム・スライド、カットごとの白フラッシュ、鮮やかな色調。勢いのある、目を引く内容向き
- **ミニマル** — 静かな切り替え、柔らかい周辺減光（ビネット）、穏やかな色調、小さめで軽いタイトル。すっきりと控えめな内容向き
- **フォトアルバム** — 柔らかなパン、暖色のセピア調と柔らかいフレーム、左寄せタイトル。懐かしさや思い出を伝える内容向き
- **SNSトレンド** — 短いカット、鼓動するアクセントバッジ、鮮やかで彩度の高い色調、大文字タイトル。トレンド感のある、SNSらしい内容向き
- **フィルムノワール** — ドラマチックなズーム、モノクロ、フィルム粒子。ミステリアスで映画的な内容向き
- **ネオン** — 脈打つズーム、走査線、電飾カラー、光るタイトル。ナイトライフやハイテンションな内容向き
- **ポラロイド** — 柔らかな漂うような動き、ポラロイド風フレーム（下側が厚め）、褪せた色調。カジュアルで個人的な思い出向き
- **VHS風** — ゆっくり漂うトラッキングノイズ、暖かみのあるレトロ色調、緩やかな動き。懐かしいホームビデオ風の内容向き
- **グロウ** — 柔らかい光の滲み、夢見心地な暖かさ、漂うようなズーム、小さめで軽いタイトル。柔らかく詩的な内容向き
- **コミック** — ハーフトーンドットの質感、ポップな色調、小気味よいカット、大文字タイトル。遊び心のある、テンションの高い内容向き
- **エディトリアル** — 大胆なカラーブロックのアクセントバー、シャープなコントラスト、左寄せタイトル。自信のある、雑誌のような内容向き

プレビューはリアルタイムで更新されるので、書き出す前に見比べられます。1枚あたりの表示時間が長いほど、同じ演出でも動きの量が比例して大きくなるため、8秒の表示が2秒の表示に比べて動きが単調に感じにくくなっています。

### 5. BGM（背景音楽・任意）

**「BGM（背景音楽）」**の**「音楽ファイルを追加」**から、お好きな音楽ファイル（ブラウザが再生できる形式）をアップロードできます。動画より長い場合は自動でトリミングし、短い場合はシームレスにループして、いずれの場合も最後に短いフェードアウトが入ります。音量スライダーで大きさを調整でき、**「削除」**で解除できます。

BGMはMP4書き出し時のみ反映されます。新しいWebCodecs APIに対応していない一部ブラウザで使われる旧WebM形式では、動画のみになります。

<a id="ai-copy-suggestions-ja"></a>

### 6. AIコピー提案（任意）

**「AIコピー提案」**をオンにすると、写真の内容に合わせてAIがタイトル・CTAを考えてくれます。

1. **AIに生成してほしい写真を選ぶ**：サムネイル一覧をタップするか、**「すべて選択」**／**「選択解除」**を使います。追加直後の写真はすべて未選択の状態です。これは、すでに書いた文字をAIが勝手に上書きしないようにするためです。
2. **方式を選ぶ**：
   - **Chrome端末内AI** — 無料・プライベート。画像は端末の外に出ません。先に**「利用状況を確認して自動準備」**を押してください。デスクトップ版Chrome/Edgeで端末内モデルが利用できる場合のみ動作します（Safari・Firefoxでは利用できません）。
   - **ローカルOllama** — 無料・プライベート。自分のPC上の[Ollama](https://ollama.com)を使います。**「接続先とモデルを自動検出」**を押して接続します。**このアプリ自体をそのPCでローカル起動している場合（`npm run dev`）のみ**動作します。公開されたWebサイトからは、ブラウザの仕様上、利用者のPCへ接続できません。設定方法はREADME.mdを参照してください。
   - **Ollama Cloud** — **「接続してモデル一覧を取得」**を押して利用可能なモデルを読み込みます。公開サイトを含め、どこからでも利用できます。ただしサイト運営者側の設定が必要で、画像は外部サービスへ送信されます。
3. 必要に応じて**「コピーの方向性」**を選ぶか、**「自由記述」**でトーンを指定します。
4. **「AIにコピーを提案してもらう」**を押します。手順1で選んだ写真だけに書き込まれ、それ以外はそのままです。

うまくいかない場合、各方式ボタンの下にあるステータス表示に理由が出ます（例えば、公開HTTPSサイトからローカルOllamaへ接続できないケースは、単なる接続エラーではなく原因を明示するようになっています）。

画像ごとのコピー生成の下に、別枠で**「投稿キャプション＋ハッシュタグ」**というカードがあります。これは上の画像ごとのタイトル・CTAとは別物で、投稿全体で使う1つのキャプション（Instagramの投稿文やTikTokのキャプション欄に書くようなもの）です。最初の写真と共通タイトルをもとに生成され、選んだ用途が属するプラットフォーム向けのトーンに調整されます（Instagram／TikTokは惹きつける一文＋やや多めのハッシュタグ、YouTubeは説明的な文章＋絞り込んだハッシュタグ）。**「キャプションを生成」**を押し、**「クリップボードにコピー」**で投稿時に使えます。上で選んだAI方式がそのまま使われます。

### 7. プレビュー

右側のスマートフォン風プレビューで、実際の書き出しと同じフェード・ズーム・文字のタイミングを確認できます。再生ボタンとシークバーで、書き出し前にペース配分や文字の位置を確認しましょう。

### 8. 動画の書き出し

**「動画を書き出す」**を押すと、Frameflowがブラウザ内で全フレームを描画し、選んだ用途に合わせた名前（例：`instagram-reel.mp4`）のMP4（H.264）ファイルをダウンロードします。新しいWebCodecs APIに対応していないブラウザでは自動的にWebMにフォールバックします。いずれの場合もアップロードは発生せず、その場で生成してダウンロードするだけです。

動画ではなく（あるいは動画に加えて）静止画が欲しい場合は、代わりに**「画像として書き出す」**を押してください。各スライドをそれぞれ1枚のJPEGとしてダウンロードします。Instagramのカルーセル投稿など、動画ではなく画像が必要な場面に便利です。選んだ動画パターンと同じ色調・装飾・文字を使い、フェードの途中ではなく完全に不透明でくっきりした状態で書き出されます。`用途名-01.jpg`、`用途名-02.jpg`…という名前でスライド順に1枚ずつダウンロードされます。

動画の書き出しが終わると、**「アプリに共有…」**ボタンが表示されることがあります（お使いのブラウザ・端末に依存し、主にファイル共有に対応したモバイルブラウザ——iOSのSafariやAndroidのChromeなど——で利用できます）。タップすると、書き出した動画が添付された状態で端末標準の共有画面が開くので、Instagram・TikTok・YouTubeなど、インストール済みのアプリを選んでそのまま投稿できます。ダウンロードフォルダから探す手間が省けます。Frameflow自体が何かをアップロード・公開することはなく、選んだアプリにファイルを渡すだけです。

### 9. 言語の切り替え

右上の**EN／日本語**の切り替えはいつでも使えます。作業中の内容を失うことなく、表示言語だけを即座に切り替えます。

### よくあるつまずきポイント

- **プレビュー・書き出しに文字が出ない**：「画像ごとのコピー一覧」でその写真の**「文字を表示」**がオンになっているか確認してください。
- **AIのボタンを押しても何も起きない**：先にAIカードのサムネイル一覧で写真を1枚以上選んでください。
- **本番サイトで「ローカルOllamaが見つかりません」と出る**：公開HTTPSサイトからローカルOllamaを使おうとした場合の想定内の挙動です。Ollamaの設定に関わらず、ブラウザがセキュリティ上この接続をブロックします。公開サイトでは「Ollama Cloud」を使うか、ローカルOllamaを使いたい場合はこのアプリ自体をローカル起動してください（README.md参照）。
- **サイトを開くとユーザー名とパスワードを求められる**：サイト運営者が追加したBasic認証です。ログイン情報は運営者に確認してください。
- Ollamaのインストール・設定、Vercelへのデプロイ、環境変数については[README.md](README.md)を参照してください。
