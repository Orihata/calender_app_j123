/**
 * ImageExportService
 * 待受画面画像の生成を行うサービス（Canvas API直接描画）
 * card_layout_sample.jsonをSSOTとして実装
 */

import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createGradient, drawRoundedRect, drawTextWithShadow, waitForFonts } from '../utils/canvasUtils.js'

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
    { id: 'date', type: 'text', content: '12/16', x: 30, y: 95, fontSize: 110, fontWeight: 500 },
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
const ROWS = 17
const MAX_MATCHES = 51

// カードサイズ
const CARD_WIDTH = Math.floor((CANVAS_WIDTH - MARGIN * 2 - CARD_MARGIN * 2) / COLUMNS)
const CARD_HEIGHT = Math.floor((CANVAS_HEIGHT - MARGIN * 2 - CARD_MARGIN * (ROWS - 1)) / ROWS)

// JSONファイルの元のサイズ
const ORIGINAL_CANVAS_WIDTH = cardLayoutSpec.canvas.width // 659
const ORIGINAL_CANVAS_HEIGHT = cardLayoutSpec.canvas.height // 300

// スケール比
const SCALE_X = CARD_WIDTH / ORIGINAL_CANVAS_WIDTH // 340/659 ≈ 0.516
const SCALE_Y = CARD_HEIGHT / ORIGINAL_CANVAS_HEIGHT // 135/300 = 0.45

// フォント設定
const FONT_FAMILY = 'Noto Sans JP'

// カテゴリ別の色設定（淡い色合い）
const CATEGORY_COLORS = {
  venue: {
    gradientStart: '#E3F2FD', // 淡い青
    gradientEnd: '#BBDEFB',   // より淡い青
    textColor: '#1565C0'      // 青系の濃い色
  },
  broadcast: {
    gradientStart: '#E8F5E9', // 淡い緑
    gradientEnd: '#C8E6C9',   // より淡い緑
    textColor: '#2E7D32'       // 緑系の濃い色
  }
}

/**
 * 観戦予定データから画像を生成
 * @param {Array} plansWithMatches - 観戦予定と試合データの配列 [{plan, match}, ...]
 * @param {string} backgroundColor - 背景色（HEX形式、デフォルト: #FFFFFF）
 * @returns {Promise<Blob>} 生成された画像のBlob
 */
export async function generateWallpaperImage(plansWithMatches, backgroundColor = '#FFFFFF') {
  // フォントの読み込みを待つ（Noto Sans JP）
  await waitForFonts(FONT_FAMILY, ['400', '500', '700'])

  // 現地観戦のみフィルタリング（初回実装）
  const filteredPlans = plansWithMatches.filter(({ plan }) => plan.category === 'venue')

  // 最大51試合まで
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

  // カードを描画（列優先、縦方向）
  matchesToRender.forEach(({ plan, match }, index) => {
    const col = index % COLUMNS
    const row = Math.floor(index / COLUMNS)

    const cardX = MARGIN + col * (CARD_WIDTH + CARD_MARGIN)
    const cardY = MARGIN + row * (CARD_HEIGHT + CARD_MARGIN)

    drawCard(ctx, cardX, cardY, plan, match)
  })

  // 51試合超の警告メッセージを描画（必要に応じて）
  if (hasMoreMatches) {
    drawWarningMessage(ctx, filteredPlans.length)
  }

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
    ctx.font = `${fontWeight} ${scaledFontSize}px ${FONT_FAMILY}`
    // 背景色に合わせた文字色を使用
    ctx.fillStyle = colors.textColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    // テキストを描画（淡い背景のため影は不要）
    ctx.fillText(textContent, scaledX, scaledY)
    ctx.restore()
  })
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

/**
 * 警告メッセージを描画
 * @param {CanvasRenderingContext2D} ctx - Canvasコンテキスト
 * @param {number} totalMatches - 総試合数
 */
function drawWarningMessage(ctx, totalMatches) {
  const message = '51試合を超える観戦予定があります。最初の51試合のみ表示します。'
  ctx.save()
  ctx.font = `400 16px ${FONT_FAMILY}`
  ctx.fillStyle = '#FF6B6B'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20)
  ctx.restore()
}
