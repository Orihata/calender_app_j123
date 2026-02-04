/**
 * 色変換・生成ユーティリティ
 * クラブカラーの自動生成に使用
 */

/**
 * HEXカラーをRGBに変換
 * @param {string} hex - HEX形式の色（例: #4A90E2）
 * @returns {Object} {r, g, b}
 */
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * RGBをHEXに変換
 * @param {number} r - 赤 (0-255)
 * @param {number} g - 緑 (0-255)
 * @param {number} b - 青 (0-255)
 * @returns {string} HEX形式の色（例: #4A90E2）
 */
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * RGBをHSLに変換
 * @param {number} r - 赤 (0-255)
 * @param {number} g - 緑 (0-255)
 * @param {number} b - 青 (0-255)
 * @returns {Object} {h, s, l} (h: 0-360, s: 0-1, l: 0-1)
 */
export function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0 // 無彩色
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: h * 360,
    s: s,
    l: l
  }
}

/**
 * HSLをRGBに変換
 * @param {number} h - 色相 (0-360)
 * @param {number} s - 彩度 (0-1)
 * @param {number} l - 明度 (0-1)
 * @returns {Object} {r, g, b} (0-255)
 */
export function hslToRgb(h, s, l) {
  h /= 360
  let r, g, b

  if (s === 0) {
    r = g = b = l // 無彩色
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

/**
 * HSLをHEXに変換
 * @param {number} h - 色相 (0-360)
 * @param {number} s - 彩度 (0-1)
 * @param {number} l - 明度 (0-1)
 * @returns {string} HEX形式の色
 */
export function hslToHex(h, s, l) {
  const rgb = hslToRgb(h, s, l)
  return rgbToHex(rgb.r, rgb.g, rgb.b)
}

/**
 * originalカラーから全色情報を自動生成
 * @param {string} originalHex - originalカラー（HEX形式、例: #c7000d）
 * @returns {Object} 全色情報オブジェクト
 */
export function generateTeamColors(originalHex) {
  // HEXをRGBに変換
  const rgb = hexToRgb(originalHex)
  if (!rgb) {
    throw new Error(`Invalid hex color: ${originalHex}`)
  }

  // RGBをHSLに変換
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  // background1: 明度0.85、彩度50%
  const background1 = hslToHex(hsl.h, 0.5, 0.85)

  // background2: 明度0.90、彩度35%
  const background2 = hslToHex(hsl.h, 0.35, 0.90)

  // text: 明度を下げて濃く、読みやすく（明度0.3-0.4程度）
  // 元の明度が低い場合は0.3、高い場合は0.4を使用
  const textLightness = hsl.l < 0.5 ? 0.3 : 0.4
  const text = hslToHex(hsl.h, Math.min(hsl.s * 1.2, 1.0), textLightness)

  // gradientStart: 明度0.85-0.90、彩度30-40%の淡い色
  const gradientStart = hslToHex(hsl.h, 0.35, 0.87)

  // gradientEnd: 明度0.90-0.95、彩度20-30%のより淡い色
  const gradientEnd = hslToHex(hsl.h, 0.25, 0.92)

  return {
    original: originalHex,
    background1,
    background2,
    text,
    gradientStart,
    gradientEnd
  }
}
