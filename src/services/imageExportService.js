/**
 * ImageExportService
 * 待受画面画像の生成を行うサービス（Canvas API直接描画）
 * card_layout_sample.jsonをSSOTとして実装
 */

import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createGradient, drawRoundedRect, drawTextWithShadow, waitForFontsWithTimeout, preloadFont } from '../utils/canvasUtils.js'

// card_layout_sample.jsonをSSOTとして読み込み
// JSONファイルの内容（docs/card_layout_sample.json）
const cardLayoutSpec = {
  canvas: {
    width: 659,
    height: 300,
    background: '#ffffff'
  },
  elements: [
    { id: 'competition', type: 'text', content: 'EAST', x: 30, y: 35, fontSize: 28, fontWeight: 500 },
    { id: 'round', type: 'text', content: '第10節', x: 140, y: 35, fontSize: 28, fontWeight: 500 },
    { id: 'date', type: 'text', content: '12/16', x: 30, y: 85, fontSize: 110, fontWeight: 500 },
    { id: 'dow', type: 'text', content: '金', x: 270, y: 170, fontSize: 32, fontWeight: 500 },
    { id: 'kickoff', type: 'text', content: '19:00', x: 30, y: 235, fontSize: 32, fontWeight: 400 },
    { id: 'venue', type: 'text', content: '日産ス', x: 260, y: 235, fontSize: 32, fontWeight: 500 },
    { id: 'home', type: 'text', content: '横浜FM', x: 420, y: 110, fontSize: 60, fontWeight: 700 },
    { id: 'away', type: 'text', content: '町田', x: 420, y: 195, fontSize: 60, fontWeight: 400 }
  ]
}

// キャンバスサイズ
const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 2400

// マージン
const MARGIN = 20
const CARD_MARGIN = 10

// 配置
const COLUMNS = 3
const MAX_MATCHES = 39
// 最大行数（39枚の場合: 3×13=39）
const MAX_ROWS = 13

// カードサイズ（17行・メモなし時の高さに固定）
const CARD_WIDTH = Math.floor((CANVAS_WIDTH - MARGIN * 2 - CARD_MARGIN * 2) / COLUMNS)
// 17行時のカード高さを基準とする（メモなし時）
const BASE_ROWS = 17
const CARD_HEIGHT = Math.floor((CANVAS_HEIGHT - MARGIN * 2 - CARD_MARGIN * (BASE_ROWS - 1)) / BASE_ROWS)
// メモエリアの高さ（固定）
const MEMO_AREA_HEIGHT = 20
// メモを含むカードの高さ（すべてのカードで統一）
const CARD_HEIGHT_WITH_MEMO = CARD_HEIGHT + MEMO_AREA_HEIGHT

// JSONファイルの元のサイズ
const ORIGINAL_CANVAS_WIDTH = cardLayoutSpec.canvas.width // 659
const ORIGINAL_CANVAS_HEIGHT = cardLayoutSpec.canvas.height // 300

// スケール比
const SCALE_X = CARD_WIDTH / ORIGINAL_CANVAS_WIDTH // 340/659 ≈ 0.516
const SCALE_Y = CARD_HEIGHT / ORIGINAL_CANVAS_HEIGHT // 135/300 = 0.45

// フォント設定
const FONT_FAMILY = 'Noto Serif JP'

// メモエリアの統一背景色（紺色、現地観戦・放送視聴共通）
const MEMO_BACKGROUND_COLOR = '#2A456F' // 紺色（明度を下げた濃い青）
// メモテキストの統一文字色（白抜き、現地観戦・放送視聴共通）
const MEMO_TEXT_COLOR = '#FFFFFF' // 白

// カテゴリ別の色設定（淡い色合い、明度を上げ彩度を下げた背景）
const CATEGORY_COLORS = {
  venue: {
    gradientStart: '#F0F7FC', // より明るく、彩度を下げた淡い青
    gradientEnd: '#E8F2F8',   // より明るく、彩度を下げたより淡い青
    textColor: '#1565C0',     // 青系の濃い色（デフォルト）
    memoBackground: MEMO_BACKGROUND_COLOR // メモエリアの背景色（統一）
  },
  broadcast: {
    gradientStart: '#E8F5E9', // 淡い緑
    gradientEnd: '#C8E6C9',   // より淡い緑
    textColor: '#2E7D32',     // 緑系の濃い色
    memoBackground: MEMO_BACKGROUND_COLOR // メモエリアの背景色（統一）
  }
}

// 色マスタを読み込む
let colorMaster = null

/**
 * 色マスタを読み込む
 * @returns {Promise<Object>} 色マスタオブジェクト
 */
async function loadColorMaster() {
  if (colorMaster) {
    return colorMaster
  }

  try {
    const basePath = import.meta.env.BASE_URL
    const colorMasterPath = `${basePath}data/color-master.json`
    const response = await fetch(colorMasterPath)
    if (!response.ok) {
      console.warn('[ImageExportService] 色マスタの読み込みに失敗しました')
      return null
    }
    const data = await response.json()
    colorMaster = data
    return data
  } catch (error) {
    console.error('[ImageExportService] 色マスタ読み込みエラー:', error)
    return null
  }
}

/**
 * チーム名から文字色を取得
 * @param {string} teamName - チーム名
 * @returns {string} 文字色（HEX形式）
 */
function getTeamTextColor(teamName) {
  if (!colorMaster || !teamName) {
    return null // nullの場合はデフォルト色を使用
  }

  const teamColors = colorMaster.colors[teamName]
  if (!teamColors) {
    return null
  }

  return teamColors.text || null
}

/**
 * 観戦予定データから画像を生成
 * @param {Array} plansWithMatches - 観戦予定と試合データの配列 [{plan, match}, ...]
 * @param {string} backgroundColor - 背景色（HEX形式、デフォルト: #FFFFFF）
 * @returns {Promise<Blob>} 生成された画像のBlob
 */
export async function generateWallpaperImage(plansWithMatches, backgroundColor = '#FFFFFF') {
  // フォントを事前にロード（iOS対策）
  await preloadFont(FONT_FAMILY, ['400', '500', '700'])
  
  // フォントの読み込みを待つ（Noto Serif JP、iOS対応のためタイムアウト付き）
  await waitForFontsWithTimeout(FONT_FAMILY, ['400', '500', '700'], 5000)

  // 色マスタを読み込む
  await loadColorMaster()

  // 現地観戦のみフィルタリング（初回実装）
  const filteredPlans = plansWithMatches.filter(({ plan }) => plan.category === 'venue')

  // 最大39試合まで
  const matchesToRender = filteredPlans.slice(0, MAX_MATCHES)
  const hasMoreMatches = filteredPlans.length > MAX_MATCHES

  // Canvasを作成
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')

  // 背景を描画
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // カードを描画（縦方向優先：下端固定、上端はカード数による）
  // カード枚数に応じて行数を計算
  const totalCards = matchesToRender.length
  // 3n, 3n-1, 3n-2 のいずれかの形式で行数nを計算
  const n = Math.ceil(totalCards / 3)  // 各列の行数

  // カード行列の下端を画像下部から335pxの位置に固定
  const BOTTOM_MARGIN = 335
  // 最下行（row = n-1）のカードの下端位置
  const bottomY = CANVAS_HEIGHT - BOTTOM_MARGIN
  // 最下行のカードの上端位置（これが基準）
  const lastRowTopY = bottomY - CARD_HEIGHT_WITH_MEMO

  matchesToRender.forEach(({ plan, match }, index) => {
    // 縦方向優先：各列に先に縦に並べ、次の列へ進む
    // col=0に row=0 から row=n-1 まで（n枚）
    // col=1に row=0 から row=n-1 まで（n枚）
    // col=2に row=0 から row=n-1 まで（n枚）
    // 列は Math.floor(index / n)、行は index % n
    const col = Math.floor(index / n)
    const row = index % n

    // カードのX座標
    const cardX = MARGIN + col * (CARD_WIDTH + CARD_MARGIN)
    // カードのY座標：下端固定から逆算（最下行から上に向かって配置）
    const cardY = lastRowTopY - (n - 1 - row) * (CARD_HEIGHT_WITH_MEMO + CARD_MARGIN)

    // デバッグ用ログ（開発時のみ）
    if (index < 9) {
      console.log(`[Card Layout] index=${index}: col=${col}, row=${row}, x=${cardX}, y=${cardY}`)
    }

    drawCard(ctx, cardX, cardY, plan, match)
  })

  // CanvasをBlobに変換
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/png')
  })
}

/**
 * カードを描画（card_layout_sample.json準拠）
 * @param {CanvasRenderingContext2D} ctx - Canvasコンテキスト
 * @param {number} cardX - カードのX座標
 * @param {number} cardY - カードのY座標
 * @param {Object} plan - 観戦予定データ
 * @param {Object} match - 試合データ
 */
function drawCard(ctx, cardX, cardY, plan, match) {
  const category = plan.category
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.venue

  // カード背景（グラデーション）
  ctx.save()
  drawRoundedRect(ctx, cardX, cardY, CARD_WIDTH, CARD_HEIGHT, 8)
  const gradient = createGradient(ctx, cardX, cardY, CARD_WIDTH, CARD_HEIGHT, colors.gradientStart, colors.gradientEnd, 45)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.restore()

  // カード影
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.15)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 2
  drawRoundedRect(ctx, cardX, cardY, CARD_WIDTH, CARD_HEIGHT, 8)
  ctx.fillStyle = 'transparent'
  ctx.fill()
  ctx.restore()

  // JSONファイルのelementsを順に描画
  cardLayoutSpec.elements.forEach(element => {
    const scaledX = cardX + element.x * SCALE_X
    const scaledY = cardY + element.y * SCALE_Y
    const scaledFontSize = element.fontSize * SCALE_X // X軸基準でスケーリング

    // テキスト内容を取得
    let textContent = getElementText(element.id, match)
    if (!textContent) return // テキストが取得できない場合はスキップ

    // フォントを設定
    const fontWeight = element.fontWeight === 700 ? '700' : element.fontWeight === 500 ? '500' : '400'
    ctx.save()
    ctx.font = `${fontWeight} ${scaledFontSize}px "${FONT_FAMILY}", serif`
    
    // HomeとAwayの場合は、それぞれのチームのtextカラーを使用
    let textColor = colors.textColor // デフォルト色
    if (element.id === 'home') {
      const homeTextColor = getTeamTextColor(match.homeTeam)
      if (homeTextColor) {
        textColor = homeTextColor
      }
    } else if (element.id === 'away') {
      const awayTextColor = getTeamTextColor(match.awayTeam)
      if (awayTextColor) {
        textColor = awayTextColor
      }
    }
    
    ctx.fillStyle = textColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    // テキストを描画（淡い背景のため影は不要）
    ctx.fillText(textContent, scaledX, scaledY)
    ctx.restore()
  })

  // メモエリアを描画
  drawMemoArea(ctx, cardX, cardY, plan, colors)
}

/**
 * メモエリアを描画
 * @param {CanvasRenderingContext2D} ctx - Canvasコンテキスト
 * @param {number} cardX - カードのX座標
 * @param {number} cardY - カードのY座標
 * @param {Object} plan - 観戦予定データ
 * @param {Object} colors - カテゴリ別の色設定
 */
function drawMemoArea(ctx, cardX, cardY, plan, colors) {
  const memo = plan.memo
  const memoY = cardY + CARD_HEIGHT // カード本体の下に配置
  
  // メモエリアの背景色を統一（メモの有無に関わらず常に統一色を使用）
  const memoBackgroundColor = MEMO_BACKGROUND_COLOR
  
  // メモエリアの背景を描画（下部のみ角丸）- すべてのカードで常に表示
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cardX, memoY) // 左上（角丸なし）
  ctx.lineTo(cardX + CARD_WIDTH, memoY) // 右上（角丸なし）
  ctx.lineTo(cardX + CARD_WIDTH, memoY + MEMO_AREA_HEIGHT - 8) // 右下
  ctx.quadraticCurveTo(cardX + CARD_WIDTH, memoY + MEMO_AREA_HEIGHT, cardX + CARD_WIDTH - 8, memoY + MEMO_AREA_HEIGHT)
  ctx.lineTo(cardX + 8, memoY + MEMO_AREA_HEIGHT)
  ctx.quadraticCurveTo(cardX, memoY + MEMO_AREA_HEIGHT, cardX, memoY + MEMO_AREA_HEIGHT - 8)
  ctx.closePath()
  ctx.fillStyle = memoBackgroundColor
  ctx.fill()
  ctx.restore()

  // メモテキストを描画（メモがない場合は何も表示しないが、文字色は常に統一色を使用）
  // フォント設定（会場と同じ: 32px → 16px）
  const memoFontSize = 32 * SCALE_X // 約16px
  const memoFontWeight = 500
  
  // メモがある場合のみテキストを描画
  if (memo && memo.trim()) {
    ctx.save()
    ctx.font = `${memoFontWeight} ${memoFontSize}px "${FONT_FAMILY}", serif`
    ctx.fillStyle = MEMO_TEXT_COLOR // 統一文字色（現地観戦・放送視聴共通）
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    
    // テキストの位置（左マージン15px、上下中央）
    const memoX = cardX + 15
    const memoTextY = memoY + MEMO_AREA_HEIGHT / 2
    
    // テキストの最大幅（カード幅 - 左マージン - 右マージン）
    const maxWidth = CARD_WIDTH - 15 - 15
    
    // テキストをtruncateして描画
    let memoText = memo.trim()
    const metrics = ctx.measureText(memoText)
    
    // テキストが長すぎる場合はtruncate
    if (metrics.width > maxWidth) {
      const ellipsis = '...'
      const ellipsisWidth = ctx.measureText(ellipsis).width
      let truncatedText = memoText
      
      while (ctx.measureText(truncatedText + ellipsis).width > maxWidth && truncatedText.length > 0) {
        truncatedText = truncatedText.slice(0, -1)
      }
      memoText = truncatedText + ellipsis
    }
    
    ctx.fillText(memoText, memoX, memoTextY)
    ctx.restore()
  }
  // メモがない場合: テキストは表示しないが、将来的に表示する場合は MEMO_TEXT_COLOR を使用
}

/**
 * 要素IDに対応するテキストを取得
 * @param {string} elementId - 要素ID
 * @param {Object} match - 試合データ
 * @returns {string|null} テキスト内容
 */
function getElementText(elementId, match) {
  switch (elementId) {
    case 'competition':
      return match.group || null
    case 'round':
      return match.round ? `第${match.round}節` : null
    case 'date':
      if (match.dateTime) {
        return format(parseISO(match.dateTime), 'M/d', { locale: ja })
      } else {
        const dateObj = parseISO(`${match.date}T00:00:00+09:00`)
        return format(dateObj, 'M/d', { locale: ja })
      }
    case 'dow':
      if (match.dateTime) {
        return format(parseISO(match.dateTime), 'E', { locale: ja })
      } else {
        const dateObj = parseISO(`${match.date}T00:00:00+09:00`)
        return format(dateObj, 'E', { locale: ja })
      }
    case 'kickoff':
      return match.kickoff === '未定' ? '未定' : match.kickoff
    case 'venue':
      return match.venue || null
    case 'home':
      return match.homeTeam
    case 'away':
      return match.awayTeam
    default:
      return null
  }
}

