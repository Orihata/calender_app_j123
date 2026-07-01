import { getMatches, saveMatches } from './storage.js'
import { getAttendancePlans, saveAttendancePlans } from './storage.js'
import { Match } from '../models/Match.js'
import { validateMatch } from '../utils/validation.js'
import { compareDates } from '../utils/dateUtils.js'

/**
 * MatchService
 * 試合予定の管理を行うサービス
 */

/**
 * すべての試合予定を取得
 * @returns {Promise<Array<Match>>} 試合予定の配列
 */
export async function getAllMatches() {
  const data = await getMatches()
  return data.map(match => Match.fromJSON(match))
}

/**
 * IDで試合予定を取得
 * @param {string} id - 試合予定のID
 * @returns {Promise<Match|null>} 試合予定。見つからない場合はnull
 */
export async function getMatchById(id) {
  const matches = await getAllMatches()
  const match = matches.find(m => m.id === id)
  return match || null
}

/**
 * 日付で試合予定を取得
 * @param {string} date - 日付（YYYY-MM-DD形式）
 * @returns {Promise<Array<Match>>} 該当日付の試合予定の配列
 */
export async function getMatchesByDate(date) {
  const matches = await getAllMatches()
  return matches.filter(match => match.date === date)
}

/**
 * 日付範囲で試合予定を取得
 * @param {string} startDate - 開始日（YYYY-MM-DD形式）
 * @param {string} endDate - 終了日（YYYY-MM-DD形式）
 * @returns {Promise<Array<Match>>} 該当日付範囲の試合予定の配列
 */
export async function getMatchesByDateRange(startDate, endDate) {
  const matches = await getAllMatches()
  return matches.filter(match => {
    return match.date >= startDate && match.date <= endDate
  })
}

/**
 * 試合予定を作成
 * @param {Object} matchData - 試合予定データ
 * @returns {Promise<Match>} 作成された試合予定
 */
export async function createMatch(matchData) {
  // バリデーション
  const validation = validateMatch(matchData)
  if (!validation.valid) {
    throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`)
  }

  // 既存の試合予定を取得
  const matches = await getAllMatches()
  
  // 重複チェック（同じIDが既に存在する場合）
  const existingMatch = matches.find(m => m.id === matchData.id)
  if (existingMatch) {
    throw new Error('同じIDの試合予定が既に存在します')
  }

  // Matchオブジェクトを作成
  const match = new Match(matchData)
  
  // 保存
  matches.push(match)
  await saveMatches(matches.map(m => m.toJSON()))

  return match
}

/**
 * 複数の試合予定を一括作成
 * @param {Array<Object>} matchesData - 試合予定データの配列
 * @returns {Promise<{success: Array<Match>, errors: Array<Object>}>} 作成結果
 */
export async function createMatches(matchesData) {
  const success = []
  const errors = []

  for (const matchData of matchesData) {
    try {
      const match = await createMatch(matchData)
      success.push(match)
    } catch (error) {
      errors.push({
        data: matchData,
        error: error.message
      })
    }
  }

  return { success, errors }
}

/**
 * 試合予定を一括取り込み（1回の保存で反映）
 * @param {Array<Object>} matchesData
 * @returns {Promise<{success: number, errors: Array<Object>}>}
 */
export async function importMatchesBulk(matchesData) {
  const existing = await getAllMatches()
  const existingIds = new Set(existing.map((m) => m.id))
  const existingKeys = new Set(
    existing.map((m) => `${m.date}|${m.homeTeam}|${m.awayTeam}`)
  )

  const toImport = []
  const errors = []

  for (const matchData of matchesData) {
    const identityKey = `${matchData.date}|${matchData.homeTeam}|${matchData.awayTeam}`
    if (existingIds.has(matchData.id) || existingKeys.has(identityKey)) {
      continue
    }

    const validation = validateMatch(matchData)
    if (!validation.valid) {
      errors.push({ data: matchData, error: validation.errors.join(', ') })
      continue
    }

    toImport.push(new Match(matchData))
    existingIds.add(matchData.id)
    existingKeys.add(identityKey)
  }

  if (toImport.length > 0) {
    const merged = [...existing, ...toImport]
    await saveMatches(merged.map((m) => m.toJSON()))
  }

  return { success: toImport.length, errors }
}

/**
 * 試合予定を更新
 * @param {string} id - 試合予定のID
 * @param {Object} updateData - 更新データ
 * @returns {Promise<Match>} 更新された試合予定
 */
export async function updateMatch(id, updateData) {
  const matches = await getAllMatches()
  const index = matches.findIndex(m => m.id === id)
  
  if (index === -1) {
    throw new Error('試合予定が見つかりません')
  }

  // 更新データをマージ
  const updatedMatch = {
    ...matches[index].toJSON(),
    ...updateData,
    id, // IDは変更不可
    updatedAt: new Date().toISOString()
  }

  // バリデーション
  const validation = validateMatch(updatedMatch)
  if (!validation.valid) {
    throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`)
  }

  // Matchオブジェクトを作成して保存
  const match = new Match(updatedMatch)
  matches[index] = match
  await saveMatches(matches.map(m => m.toJSON()))

  return match
}

/**
 * 試合予定を削除
 * @param {string} id - 試合予定のID
 * @returns {Promise<void>}
 */
export async function deleteMatch(id) {
  const matches = await getAllMatches()
  const filteredMatches = matches.filter(m => m.id !== id)
  
  if (filteredMatches.length === matches.length) {
    throw new Error('試合予定が見つかりません')
  }

  // 関連する観戦予定も削除（参照整合性の維持）
  const attendancePlans = await getAttendancePlans()
  const filteredPlans = attendancePlans.filter(plan => plan.matchId !== id)
  
  await saveMatches(filteredMatches.map(m => m.toJSON()))
  await saveAttendancePlans(filteredPlans)
}

/**
 * 複数の試合予定を一括削除
 * @param {Array<string>} ids - 削除する試合予定のID配列
 * @returns {Promise<{success: number, errors: Array<Object>}>} 削除結果
 */
export async function deleteMatches(ids) {
  const success = []
  const errors = []

  for (const id of ids) {
    try {
      await deleteMatch(id)
      success.push(id)
    } catch (error) {
      errors.push({
        id,
        error: error.message
      })
    }
  }

  return { success: success.length, errors }
}

/**
 * すべての試合予定を削除
 * @returns {Promise<void>}
 */
export async function deleteAllMatches() {
  await saveMatches([])
  // 観戦予定もすべて削除（参照整合性の維持）
  await saveAttendancePlans([])
}

/**
 * 試合予定を日付順にソート
 * @param {Array<Match>} matches - ソートする試合予定の配列
 * @param {boolean} ascending - 昇順の場合true（デフォルト: true）
 * @returns {Array<Match>} ソートされた試合予定の配列
 */
export function sortMatchesByDate(matches, ascending = true) {
  return [...matches].sort((a, b) => {
    if (ascending) {
      return compareDates(a.date, b.date)
    } else {
      return compareDates(b.date, a.date)
    }
  })
}

/**
 * 日付をキーとしたインデックスを構築
 * @param {Array<Match>} matches - インデックス化する試合予定の配列
 * @returns {Object} 日付をキーとしたインデックスオブジェクト
 */
export function buildDateIndex(matches) {
  const index = {}
  for (const match of matches) {
    if (!index[match.date]) {
      index[match.date] = []
    }
    index[match.date].push(match)
  }
  return index
}
