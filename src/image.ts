import { heicTo } from 'heic-to'
import { isHeicFile } from './ai'

export type HeicConverter = (options: {
  blob: Blob
  type: 'image/jpeg'
  quality: number
}) => Promise<Blob>

export async function normalizeImageFile(file: File, convert: HeicConverter = heicTo): Promise<Blob> {
  if (!isHeicFile(file)) return file
  try {
    const converted = await convert({ blob: file, type: 'image/jpeg', quality: .9 })
    if (!(converted instanceof Blob) || converted.size === 0) throw new Error('変換後の画像が空です。')
    return converted
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new Error(`${file.name}のHEIC変換に失敗しました${detail ? `: ${detail}` : ''}`)
  }
}
