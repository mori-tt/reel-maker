export type Language = 'en' | 'ja'
export const DEFAULT_LANGUAGE: Language = 'en'

const translations = {
  en: {
    language: 'Language', english: 'English', japanese: '日本語', addImages: 'Add images', buildStory: 'Build your story', converting: 'Converting images…', selectPhotos: 'Select photos',
    videoUse: 'Video format', optimizeSafeArea: 'Optimized ratio and safe areas', defaultTitle: 'Fallback title', defaultCta: 'Fallback CTA', defaultTitleValue: 'A moment worth remembering', defaultCtaValue: 'See the full story', duration: 'Duration per image', seconds: 'sec',
    videoPattern: 'Motion style', patternDescription: 'Motion and copy direction work together', aiCopy: 'AI copy suggestions', aiCopyDescription: 'Suggest copy for each image',
    checkChrome: 'Check availability and prepare automatically', chromeHint: 'On supported Chrome versions, the model is prepared automatically.', localEndpoint: 'Local endpoint', visionModel: 'Vision model',
    detectOllama: 'Detect endpoint and models', fetchModels: 'Connect and fetch models', ollamaHint: 'Checks localhost and 127.0.0.1, then prioritizes an installed vision model.',
    perSlideHint: 'All image copies appear here. Edit the title and CTA, move the text, hide it, or clear the copy.', copyDirection: 'Copy direction', customRequest: 'Custom request',
    generateCopy: 'Suggest copy with AI', generating: 'AI is generating…', preview: 'Preview', emptyPreview: 'Add photos to preview your video', exportVideo: 'Export video', exporting: 'Rendering video…',
    slideCopy: 'Copy for every image', showText: 'Show text', textPosition: 'Text position', lower: 'Lower', center: 'Center', upper: 'Upper', clearCopy: 'Clear copy', copyEmpty: 'No copy yet',
    connectionChecking: 'Checking Ollama connection…', connectionSuccess: 'Connected', notRunning: 'Local Ollama was not found.', connectedEndpoint: 'Connected endpoint', installedModels: 'Installed models', visionReady: 'Vision ready', visionUnknown: 'Vision not confirmed', noModels: 'No models found',
    ollamaHelpTitle: 'If local Ollama cannot be detected', ollamaHelp1: '1. Install Ollama and start it with: ollama serve', ollamaHelp2: '2. Install a vision model: ollama pull gemma3:4b', ollamaHelp3: '3. If the browser blocks access, restart Ollama with OLLAMA_ORIGINS set for this app URL.', ollamaHelp4: '4. Verify the API: curl http://localhost:11434/api/tags', ollamaBrowserLimit: 'A browser app can detect Ollama and list models, but cannot start the Ollama process itself.',
    privacy: 'Images are sent only when you select an external AI provider.', commonFallback: 'Used only when an image has no individual copy.', auto: 'Match motion style', engagement: 'Engagement', storytelling: 'Storytelling', product: 'Product / service',
    chromeProvider: 'Chrome on-device AI', localOllama: 'Local Ollama', ollamaCloud: 'Ollama Cloud', aiApplied: 'Copy was applied to every image. Review and edit it in the list above.', aiWorking: 'Generating copy for every image…', clearConfirm: 'Clears this image’s title and CTA and hides its text.',
    formatTitle: 'Video format', motionTitle: 'Motion style', emptyPreviewLong: 'Add photos to see the preview here', previewAlt: 'Video preview', imageReadError: 'Could not read this image.', imageConvertError: 'Image conversion failed.', chromeChecking: 'Checking Chrome AI and preparing the model…', chromePreparing: 'Preparing Chrome AI model…', chromePrepareError: 'Could not prepare Chrome AI.', aiError: 'AI processing failed.', cloudHint: 'Uses the OLLAMA_CLOUD_API_KEY server environment variable.',
  },
  ja: {
    language: '言語', english: 'English', japanese: '日本語', addImages: '画像を追加', buildStory: 'ストーリーを組み立てる', converting: '画像を変換中…', selectPhotos: '写真を選択',
    videoUse: '動画の用途', optimizeSafeArea: '比率と安全領域を最適化', defaultTitle: '共通タイトル', defaultCta: '共通CTA', defaultTitleValue: '心に残るひととき', defaultCtaValue: '続きを見る', duration: '1枚の表示時間', seconds: '秒',
    videoPattern: '動画パターン', patternDescription: '演出とコピー方向性を連動', aiCopy: 'AIコピー提案', aiCopyDescription: '画像ごとの文字内容を提案',
    checkChrome: '利用状況を確認して自動準備', chromeHint: '対応Chromeでは、確認時にモデル準備まで自動で進めます。', localEndpoint: 'ローカル接続先', visionModel: '画像対応モデル',
    detectOllama: '接続先とモデルを自動検出', fetchModels: '接続してモデル一覧を取得', ollamaHint: 'localhostと127.0.0.1を探索し、画像対応モデルを優先選択します。',
    perSlideHint: '全画像分のコピーをここに表示します。タイトル・CTA・位置を編集し、非表示または削除できます。', copyDirection: 'コピーの方向性', customRequest: '自由記述',
    generateCopy: 'AIにコピーを提案してもらう', generating: 'AIが考えています…', preview: 'プレビュー', emptyPreview: '写真を追加するとプレビューされます', exportVideo: '動画を書き出す', exporting: '動画を生成中…',
    slideCopy: '画像ごとのコピー一覧', showText: '文字を表示', textPosition: '文字の位置', lower: '下', center: '中央', upper: '上', clearCopy: 'コピーを削除', copyEmpty: 'コピー未設定',
    connectionChecking: 'Ollamaの接続を確認しています…', connectionSuccess: '接続成功', notRunning: 'ローカルOllamaが見つかりません。', connectedEndpoint: '接続先', installedModels: '取得したモデル', visionReady: '画像対応', visionUnknown: '画像対応未確認', noModels: 'モデルがありません',
    ollamaHelpTitle: 'ローカルOllamaを検出できない場合', ollamaHelp1: '1. Ollamaをインストールし、ollama serve で起動します。', ollamaHelp2: '2. 画像対応モデルを取得します：ollama pull gemma3:4b', ollamaHelp3: '3. ブラウザで遮断される場合は、このアプリのURLをOLLAMA_ORIGINSに指定してOllamaを再起動します。', ollamaHelp4: '4. curl http://localhost:11434/api/tags でAPIを確認します。', ollamaBrowserLimit: 'WebアプリはOllamaの検出とモデル取得はできますが、Ollamaプロセス自体を起動することはできません。',
    privacy: '外部AIを選択した場合のみ画像を送信します。', commonFallback: '画像に個別コピーがない場合だけ使われます。', auto: '動画パターンに合わせる', engagement: 'エンゲージメント重視', storytelling: 'ストーリー重視', product: '商品・サービス訴求',
    chromeProvider: 'Chrome端末内AI', localOllama: 'ローカルOllama', ollamaCloud: 'Ollama Cloud', aiApplied: '全画像にコピーを反映しました。上の一覧で確認・編集できます。', aiWorking: '画像ごとのコピーを生成しています…', clearConfirm: 'この画像のタイトルとCTAを削除し、文字を非表示にします。',
    formatTitle: '動画の用途', motionTitle: '動画パターン', emptyPreviewLong: '写真を追加すると、ここにプレビューされます', previewAlt: '動画プレビュー', imageReadError: 'この画像を読み込めませんでした。', imageConvertError: '画像の変換に失敗しました。', chromeChecking: 'Chrome AIを確認し、必要なモデルを準備しています…', chromePreparing: 'Chrome AIモデルを準備中…', chromePrepareError: 'Chrome AIを準備できませんでした。', aiError: 'AI処理でエラーが発生しました。', cloudHint: 'サーバー環境変数 OLLAMA_CLOUD_API_KEY を使用します。',
  },
} as const

export type TranslationKey = keyof typeof translations.en
export function isLanguage(value: string | null): value is Language { return value === 'en' || value === 'ja' }
export function getInitialLanguage(saved: string | null): Language { return isLanguage(saved) ? saved : DEFAULT_LANGUAGE }
export function translate(language: Language, key: TranslationKey): string { return translations[language][key] }
