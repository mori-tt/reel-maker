let cached: Promise<typeof import('./video-export')> | null = null

export function loadVideoExport() {
  cached ??= import('./video-export')
  return cached
}
