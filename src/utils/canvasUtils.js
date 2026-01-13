/**
 * Canvas操作ユーティリティ
 * 画像生成に必要なCanvas操作のヘルパー関数
 */

/**
 * グラデーションを作成
 * @param {CanvasRenderingContext2D} ctx - Canvasコンテキスト
 * @param {number} x - 開始X座標
 * @param {number} y - 開始Y座標
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @param {string} color1 - 開始色（HEX形式）
 * @param {string} color2 - 終了色（HEX形式）
 * @param {number} angle - 角度（度、デフォルト: 45）
 * @returns {CanvasGradient} グラデーションオブジェクト
 */
export function createGradient(ctx, x, y, width, height, color1, color2, angle = 45) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)
  return gradient
}

/**
 * 角丸矩形を描画
 * @param {CanvasRenderingContext2D} ctx - Canvasコンテキスト
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {number} width - 幅
 * @param {number} height - 高さ
 * @param {number} radius - 角丸の半径
 */
export function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * テキストに影を付けて描画
 * @param {CanvasRenderingContext2D} ctx - Canvasコンテキスト
 * @param {string} text - 描画するテキスト
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {Object} options - オプション
 * @param {string} options.shadowColor - 影の色（デフォルト: rgba(0,0,0,0.3)）
 * @param {number} options.shadowBlur - 影のぼかし（デフォルト: 2）
 * @param {number} options.shadowOffsetX - 影のXオフセット（デフォルト: 1）
 * @param {number} options.shadowOffsetY - 影のYオフセット（デフォルト: 1）
 */
export function drawTextWithShadow(ctx, text, x, y, options = {}) {
  const {
    shadowColor = 'rgba(0,0,0,0.3)',
    shadowBlur = 2,
    shadowOffsetX = 1,
    shadowOffsetY = 1
  } = options

  // 影を描画
  ctx.save()
  ctx.shadowColor = shadowColor
  ctx.shadowBlur = shadowBlur
  ctx.shadowOffsetX = shadowOffsetX
  ctx.shadowOffsetY = shadowOffsetY
  ctx.fillText(text, x, y)
  ctx.restore()
}

/**
 * フォントが読み込まれているか確認
 * @param {string} fontFamily - フォントファミリー名
 * @param {string} weight - フォントウェイト（デフォルト: '400'）
 * @returns {boolean} 読み込まれている場合true
 */
export function isFontLoaded(fontFamily, weight = '400') {
  if (!document.fonts || !document.fonts.check) {
    return true // フォントAPIが使えない場合はtrueを返す
  }
  return document.fonts.check(`${weight} 12px "${fontFamily}"`)
}

/**
 * フォントの読み込みを待つ
 * @param {string} fontFamily - フォントファミリー名
 * @param {Array<string>} weights - フォントウェイトの配列（デフォルト: ['400', '500', '700']）
 * @returns {Promise<void>}
 */
export function waitForFonts(fontFamily, weights = ['400', '500', '700']) {
  return new Promise((resolve) => {
    if (!document.fonts || !document.fonts.ready) {
      resolve()
      return
    }

    const checkFonts = () => {
      const allLoaded = weights.every(weight => isFontLoaded(fontFamily, weight))
      if (allLoaded) {
        resolve()
      } else {
        setTimeout(checkFonts, 100)
      }
    }

    document.fonts.ready.then(() => {
      checkFonts()
    }).catch(() => {
      // エラーが発生しても続行
      resolve()
    })
  })
}

/**
 * フォントの読み込みを待つ（タイムアウト付き、iOS対策）
 * @param {string} fontFamily - フォントファミリー名
 * @param {Array<string>} weights - フォントウェイトの配列（デフォルト: ['400', '500', '700']）
 * @param {number} timeout - タイムアウト時間（ミリ秒、デフォルト: 5000）
 * @returns {Promise<void>}
 */
export function waitForFontsWithTimeout(fontFamily, weights = ['400', '500', '700'], timeout = 5000) {
  return new Promise((resolve) => {
    if (!document.fonts || !document.fonts.ready) {
      resolve()
      return
    }

    const startTime = Date.now()
    let timeoutId = null

    const checkFonts = () => {
      const elapsed = Date.now() - startTime
      if (elapsed >= timeout) {
        // タイムアウト: フォントが読み込まれていなくても続行（iOS対策）
        console.warn(`[FontLoader] フォント "${fontFamily}" の読み込みがタイムアウトしました。続行します。`)
        if (timeoutId) clearTimeout(timeoutId)
        resolve()
        return
      }

      const allLoaded = weights.every(weight => isFontLoaded(fontFamily, weight))
      if (allLoaded) {
        if (timeoutId) clearTimeout(timeoutId)
        resolve()
      } else {
        timeoutId = setTimeout(checkFonts, 100)
      }
    }

    document.fonts.ready.then(() => {
      checkFonts()
    }).catch(() => {
      // エラーが発生しても続行
      if (timeoutId) clearTimeout(timeoutId)
      resolve()
    })

    // タイムアウトのフォールバック
    setTimeout(() => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        console.warn(`[FontLoader] フォント "${fontFamily}" の読み込みがタイムアウトしました。続行します。`)
        resolve()
      }
    }, timeout)
  })
}

/**
 * フォントを事前にロードする（iOS対策）
 * @param {string} fontFamily - フォントファミリー名
 * @param {Array<string>} weights - フォントウェイトの配列（デフォルト: ['400', '500', '700']）
 * @returns {Promise<void>}
 */
export async function preloadFont(fontFamily, weights = ['400', '500', '700']) {
  if (!document.fonts) {
    return
  }

  // iOS対策: フォントを強制的に読み込むために、一時的な要素でフォントを使用
  const testElement = document.createElement('span')
  testElement.style.position = 'absolute'
  testElement.style.left = '-9999px'
  testElement.style.fontFamily = `"${fontFamily}", serif` // iOS対策: serifをフォールバックに指定
  testElement.style.visibility = 'hidden'
  testElement.textContent = 'あいうえお漢字' // 日本語文字を配置してフォントを強制的に読み込む
  document.body.appendChild(testElement)

  // iOS対策: フォントが確実に読み込まれるように少し待つ
  await new Promise(resolve => setTimeout(resolve, 100))

  // フォントが読み込まれているか確認
  let allFontsLoaded = false
  const maxAttempts = 50
  let attempts = 0

  while (!allFontsLoaded && attempts < maxAttempts) {
    allFontsLoaded = weights.every(weight => isFontLoaded(fontFamily, weight))
    if (allFontsLoaded) {
      break
    }
    await new Promise(resolve => setTimeout(resolve, 100))
    attempts++
  }

  document.body.removeChild(testElement)
  
  if (!allFontsLoaded) {
    console.warn(`[FontLoader] フォント "${fontFamily}" の事前読み込みが完了しませんでしたが、続行します。`)
  }
}

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
