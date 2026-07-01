/**
 * 当日予定表のレイアウト計算
 * 時間軸: 10:00〜22:00（12時間）、各試合はキックオフから2時間
 */

export const TIMELINE_START_HOUR = 10
export const TIMELINE_END_HOUR = 22
export const MATCH_DURATION_MINUTES = 120
export const MAX_PARALLEL_COLUMNS = 4

const TIMELINE_START_MINUTES = TIMELINE_START_HOUR * 60
const TIMELINE_END_MINUTES = TIMELINE_END_HOUR * 60
const TIMELINE_TOTAL_MINUTES = TIMELINE_END_MINUTES - TIMELINE_START_MINUTES

/**
 * キックオフ文字列を分（0時起算）に変換
 * @param {string} kickoff - HH:MM 形式
 * @returns {number|null}
 */
export function kickoffToMinutes(kickoff) {
  if (!kickoff || kickoff === '未定') {
    return null
  }
  const [hours, minutes] = kickoff.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) {
    return null
  }
  return hours * 60 + minutes
}

/**
 * 分を HH:MM 表示用に変換
 * @param {number} minutes
 * @returns {string}
 */
export function minutesToTimeLabel(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * 2つの時間帯が重なるか
 */
function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA
}

/**
 * 観戦予定から当日予定表用ブロックを生成
 * @param {Array<{plan: Object, match: Object}>} plansWithMatches
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {{ visible: Array, hiddenCount: number }}
 */
export function buildDailyScheduleBlocks(plansWithMatches, dateStr) {
  const events = plansWithMatches
    .filter(({ match }) => match.date === dateStr)
    .map(({ plan, match }) => {
      const startMinutes = kickoffToMinutes(match.kickoff)
      if (startMinutes === null) {
        return null
      }
      const endMinutes = startMinutes + MATCH_DURATION_MINUTES
      // 10:00〜22:00 と重なるもののみ対象
      if (endMinutes <= TIMELINE_START_MINUTES || startMinutes >= TIMELINE_END_MINUTES) {
        return null
      }
      return {
        id: `${plan.id}-${plan.category}`,
        plan,
        match,
        category: plan.category,
        startMinutes,
        endMinutes
      }
    })
    .filter(Boolean)

  // 現地観戦を優先し、同カテゴリ内は開始時刻順
  events.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category === 'venue' ? -1 : 1
    }
    return a.startMinutes - b.startMinutes
  })

  /** @type {Array<Array<{startMinutes: number, endMinutes: number}>>} */
  const columns = Array.from({ length: MAX_PARALLEL_COLUMNS }, () => [])
  const visible = []
  let hiddenCount = 0

  for (const event of events) {
    let placed = false
    for (let col = 0; col < MAX_PARALLEL_COLUMNS; col++) {
      const hasOverlap = columns[col].some((placedEvent) =>
        intervalsOverlap(
          event.startMinutes,
          event.endMinutes,
          placedEvent.startMinutes,
          placedEvent.endMinutes
        )
      )
      if (!hasOverlap) {
        columns[col].push(event)
        visible.push({
          ...event,
          column: col,
          columnCount: 1 // 後で更新
        })
        placed = true
        break
      }
    }
    if (!placed) {
      hiddenCount++
    }
  }

  // 各ブロックの表示位置・幅を計算し、同時刻帯の並列数を反映
  return {
    visible: visible.map((block) => {
      const displayStart = Math.max(block.startMinutes, TIMELINE_START_MINUTES)
      const displayEnd = Math.min(block.endMinutes, TIMELINE_END_MINUTES)
      const topPercent =
        ((displayStart - TIMELINE_START_MINUTES) / TIMELINE_TOTAL_MINUTES) * 100
      const heightPercent =
        ((displayEnd - displayStart) / TIMELINE_TOTAL_MINUTES) * 100

      // このブロックと重なる可視ブロックの最大列数+1
      const overlapping = visible.filter((other) =>
        intervalsOverlap(
          block.startMinutes,
          block.endMinutes,
          other.startMinutes,
          other.endMinutes
        )
      )
      const maxColumn = Math.max(...overlapping.map((o) => o.column))
      const parallelCount = maxColumn + 1

      return {
        ...block,
        topPercent,
        heightPercent,
        parallelCount,
        widthPercent: 100 / parallelCount,
        leftPercent: (block.column / parallelCount) * 100
      }
    }),
    hiddenCount
  }
}

/**
 * 時間軸ラベル（2時間刻み）
 * @returns {Array<{minutes: number, label: string, topPercent: number}>}
 */
export function buildTimeAxisLabels() {
  const labels = []
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h += 2) {
    const minutes = h * 60
    labels.push({
      minutes,
      label: `${String(h).padStart(2, '0')}:00`,
      topPercent: ((minutes - TIMELINE_START_MINUTES) / TIMELINE_TOTAL_MINUTES) * 100
    })
  }
  return labels
}
