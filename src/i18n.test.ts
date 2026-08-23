import { describe, expect, it } from 'vitest'
import { DEFAULT_LANGUAGE, getInitialLanguage, isLanguage, translate } from './i18n'

describe('language settings', () => {
  it('uses English by default and restores a valid saved language', () => {
    expect(DEFAULT_LANGUAGE).toBe('en')
    expect(getInitialLanguage(null)).toBe('en')
    expect(getInitialLanguage('ja')).toBe('ja')
    expect(getInitialLanguage('fr')).toBe('en')
  })

  it('validates supported language values', () => {
    expect(isLanguage('en')).toBe(true)
    expect(isLanguage('ja')).toBe(true)
    expect(isLanguage(null)).toBe(false)
  })

  it('returns translated UI labels and safe default copy', () => {
    expect(translate('en', 'addImages')).toBe('Add images')
    expect(translate('ja', 'addImages')).toBe('画像を追加')
    expect(translate('en', 'defaultCtaValue')).toBe('See the full story')
    expect(translate('ja', 'defaultCtaValue')).toBe('続きを見る')
    expect(translate('ja', 'defaultCtaValue')).not.toContain('次の休日')
  })

  it('provides copy editing and Ollama troubleshooting labels in both languages', () => {
    for (const language of ['en', 'ja'] as const) {
      expect(translate(language, 'clearCopy')).toBeTruthy()
      expect(translate(language, 'installedModels')).toBeTruthy()
      expect(translate(language, 'ollamaHelpTitle')).toBeTruthy()
      expect(translate(language, 'ollamaBrowserLimit')).toBeTruthy()
    }
  })
})
