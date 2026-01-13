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
const MAX_MATCHES = 51
// 最大行数（51枚の場合: 3×17=51）
const MAX_ROWS = 17

// カードサイズ（最大行数に基づいて計算）
const CARD_WIDTH = Math.floor((CANVAS_WIDTH - MARGIN * 2 - CARD_MARGIN * 2) / COLUMNS)
const CARD_HEIGHT = Math.floor((CANVAS_HEIGHT - MARGIN * 2 - CARD_MARGIN * (MAX_ROWS - 1)) / MAX_ROWS)

// JSONファイルの元のサイズ
const ORIGINAL_CANVAS_WIDTH = cardLayoutSpec.canvas.width // 659
const ORIGINAL_CANVAS_HEIGHT = cardLayoutSpec.canvas.height // 300

// スケール比
const SCALE_X = CARD_WIDTH / ORIGINAL_CANVAS_WIDTH // 340/659 ≈ 0.516
const SCALE_Y = CARD_HEIGHT / ORIGINAL_CANVAS_HEIGHT // 135/300 = 0.45

// フォント設定
const FONT_FAMILY = 'Noto Sans JP'

// カテゴリ別の色設定（淡い色合い、明度を上げ彩度を下げた背景）
const CATEGORY_COLORS = {
  venue: {
    gradientStart: '#F0F7FC', // より明るく、彩度を下げた淡い青
    gradientEnd: '#E8F2F8',   // より明るく、彩度を下げたより淡い青
    textColor: '#1565C0'      // 青系の濃い色（デフォルト）
  },
  broadcast: {
    gradientStart: '#E8F5E9', // 淡い緑
    gradientEnd: '#C8E6C9',   // より淡い緑
    textColor: '#2E7D32'       // 緑系の濃い色
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
  // フォントの読み込みを待つ（Noto Sans JP）
  await waitForFonts(FONT_FAMILY, ['400', '500', '700'])

  // 色マスタを読み込む
  await loadColorMaster()

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

  // カードを描画（縦方向優先：左上から開始し、縦方向にカードを積んでいく）
  // カード枚数に応じて行数を計算
  const totalCards = matchesToRender.length
  // 3n, 3n-1, 3n-2 のいずれかの形式で行数nを計算
  const n = Math.ceil(totalCards / 3)  // 各列の行数

  matchesToRender.forEach(({ plan, match }, index) => {
    // 縦方向優先：各列に先に縦に並べ、次の列へ進む
    // col=0に row=0 から row=n-1 まで（n枚）
    // col=1に row=0 から row=n-1 まで（n枚）
    // col=2に row=0 から row=n-1 まで（n枚）
    // 列は Math.floor(index / n)、行は index % n
    const col = Math.floor(index / n)
    const row = index % n

    const cardX = MARGIN + col * (CARD_WIDTH + CARD_MARGIN)
    const cardY = MARGIN + row * (CARD_HEIGHT + CARD_MARGIN)

    // デバッグ用ログ（開発時のみ）
    if (index < 9) {
      console.log(`[Card Layout] index=${index}: col=${col}, row=${row}, x=${cardX}, y=${cardY}`)
    }

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
