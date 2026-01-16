import { getAttendancePlans, saveAttendancePlans } from './storage.js'
import { AttendancePlan } from '../models/AttendancePlan.js'
import { validateAttendancePlan } from '../utils/validation.js'
import { getMatchById } from './matchService.js'

/**
 * AttendanceService
 * 観戦予定の管理を行うサービス
 */

/**
 * すべての観戦予定を取得
 * @returns {Promise<Array<AttendancePlan>>} 観戦予定の配列
 */
export async function getAllAttendancePlans() {
  const data = await getAttendancePlans()
  return data.map(plan => AttendancePlan.fromJSON(plan))
}

/**
 * IDで観戦予定を取得
 * @param {string} id - 観戦予定のID
 * @returns {Promise<AttendancePlan|null>} 観戦予定。見つからない場合はnull
 */
export async function getAttendancePlanById(id) {
  const plans = await getAllAttendancePlans()
  const plan = plans.find(p => p.id === id)
  return plan || null
}

/**
 * matchIdで観戦予定を取得（最初に見つかったものを返す）
 * @param {string} matchId - 試合予定のID
 * @returns {Promise<AttendancePlan|null>} 観戦予定。見つからない場合はnull
 */
export async function getAttendancePlanByMatchId(matchId) {
  const plans = await getAllAttendancePlans()
  const plan = plans.find(p => p.matchId === matchId)
  return plan || null
}

/**
 * matchIdとcategoryで観戦予定を取得
 * @param {string} matchId - 試合予定のID
 * @param {string} category - カテゴリ ('venue' | 'broadcast')
 * @returns {Promise<AttendancePlan|null>} 観戦予定。見つからない場合はnull
 */
export async function getAttendancePlanByMatchIdAndCategory(matchId, category) {
  const plans = await getAllAttendancePlans()
  const plan = plans.find(p => p.matchId === matchId && p.category === category)
  return plan || null
}

/**
 * matchIdで観戦予定をすべて取得（カテゴリ別）
 * @param {string} matchId - 試合予定のID
 * @returns {Promise<Array<AttendancePlan>>} 観戦予定の配列
 */
export async function getAttendancePlansByMatchId(matchId) {
  const plans = await getAllAttendancePlans()
  return plans.filter(p => p.matchId === matchId)
}

/**
 * 観戦予定を作成
 * @param {string} matchId - 試合予定のID
 * @param {string} category - カテゴリ ('venue' | 'broadcast')
 * @returns {Promise<AttendancePlan>} 作成された観戦予定
 */
export async function createAttendancePlan(matchId, category = 'venue') {
  // カテゴリの検証
  if (category !== 'venue' && category !== 'broadcast') {
    throw new Error('カテゴリは "venue" または "broadcast" である必要があります')
  }

  // 参照整合性チェック：試合予定が存在するか確認
  const match = await getMatchById(matchId)
  if (!match) {
    throw new Error('指定された試合予定が見つかりません')
  }

  // 重複チェック：同じmatchIdとcategoryの観戦予定が既に存在する場合
  const existingPlan = await getAttendancePlanByMatchIdAndCategory(matchId, category)
  if (existingPlan) {
    const categoryLabel = category === 'venue' ? '現地観戦予定' : '放送視聴予定'
    throw new Error(`この試合は既に${categoryLabel}として登録されています`)
  }

  // 観戦予定データを作成
  const now = new Date().toISOString()
  const planData = {
    id: generateUUID(),
    matchId,
    category,
    createdAt: now,
    updatedAt: now
  }

  // バリデーション
  const validation = validateAttendancePlan(planData)
  if (!validation.valid) {
    throw new Error(`バリデーションエラー: ${validation.errors.join(', ')}`)
  }

  // AttendancePlanオブジェクトを作成
  const plan = new AttendancePlan(planData)
  
  // 保存
  const plans = await getAllAttendancePlans()
  plans.push(plan)
  await saveAttendancePlans(plans.map(p => p.toJSON()))

  return plan
}

/**
 * 観戦予定を更新
 * @param {string} id - 観戦予定のID
 * @param {Object} updates - 更新するフィールド
 * @param {string|null} [updates.memo] - ひとことメモ
 * @param {string|null} [updates.supportingTeam] - 応援クラブ ('home' | 'away' | null)
 * @returns {Promise<AttendancePlan>} 更新された観戦予定
 */
export async function updateAttendancePlan(id, updates) {
  const plans = await getAllAttendancePlans()
  const planIndex = plans.findIndex(p => p.id === id)
  
  if (planIndex === -1) {
    throw new Error('観戦予定が見つかりません')
  }

  const plan = plans[planIndex]
  
  // 更新フィールドを適用
  if (updates.memo !== undefined) {
    plan.memo = updates.memo && updates.memo.trim() ? updates.memo.trim() : null
  }
  
  if (updates.supportingTeam !== undefined) {
    // supportingTeamは 'home' | 'away' | null のみ許可
    if (updates.supportingTeam !== null && updates.supportingTeam !== 'home' && updates.supportingTeam !== 'away') {
      throw new Error('supportingTeamは "home"、"away"、または null である必要があります')
    }
    plan.supportingTeam = updates.supportingTeam
  }
  
  // updatedAtを更新
  plan.updatedAt = new Date().toISOString()

  // バリデーション
  const validation = validateAttendancePlan(plan.toJSON())
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }

  plans[planIndex] = plan
  await saveAttendancePlans(plans.map(p => p.toJSON()))

  return plan
}

/**
 * 観戦予定を削除
 * @param {string} id - 観戦予定のID
 * @returns {Promise<void>}
 */
export async function deleteAttendancePlan(id) {
  const plans = await getAllAttendancePlans()
  const filteredPlans = plans.filter(p => p.id !== id)
  
  if (filteredPlans.length === plans.length) {
    throw new Error('観戦予定が見つかりません')
  }

  await saveAttendancePlans(filteredPlans.map(p => p.toJSON()))
}

/**
 * matchIdで観戦予定を削除（最初に見つかったものを削除）
 * @param {string} matchId - 試合予定のID
 * @returns {Promise<void>}
 */
export async function deleteAttendancePlanByMatchId(matchId) {
  const plan = await getAttendancePlanByMatchId(matchId)
  if (plan) {
    await deleteAttendancePlan(plan.id)
  }
}

/**
 * matchIdとcategoryで観戦予定を削除
 * @param {string} matchId - 試合予定のID
 * @param {string} category - カテゴリ ('venue' | 'broadcast')
 * @returns {Promise<void>}
 */
export async function deleteAttendancePlanByMatchIdAndCategory(matchId, category) {
  const plan = await getAttendancePlanByMatchIdAndCategory(matchId, category)
  if (plan) {
    await deleteAttendancePlan(plan.id)
  }
}

/**
 * すべての観戦予定を削除
 * @returns {Promise<void>}
 */
export async function deleteAllAttendancePlans() {
  await saveAttendancePlans([])
}

/**
 * 観戦予定と関連する試合予定を取得
 * @param {string} planId - 観戦予定のID
 * @returns {Promise<{plan: AttendancePlan, match: Match}|null>} 観戦予定と試合予定。見つからない場合はnull
 */
export async function getAttendancePlanWithMatch(planId) {
  const plan = await getAttendancePlanById(planId)
  if (!plan) {
    return null
  }

  const match = await getMatchById(plan.matchId)
  if (!match) {
    return null
  }

  return { plan, match }
}

/**
 * すべての観戦予定と関連する試合予定を取得
 * @returns {Promise<Array<{plan: AttendancePlan, match: Match}>>} 観戦予定と試合予定の配列
 */
export async function getAllAttendancePlansWithMatches() {
  const plans = await getAllAttendancePlans()
  const results = []

  for (const plan of plans) {
    const match = await getMatchById(plan.matchId)
    if (match) {
      results.push({ plan, match })
    }
  }

  return results
}

/**
 * 観戦予定をJSON形式でエクスポート
 * @returns {Promise<string>} JSON形式の文字列
 */
export async function exportAttendancePlansToJSON() {
  const plansWithMatches = await getAllAttendancePlansWithMatches()
  const exportData = plansWithMatches.map(({ plan, match }) => ({
    ...plan.toJSON(),
    match: match.toJSON()
  }))
  return JSON.stringify(exportData, null, 2)
}

/**
 * 観戦予定をCSV形式でエクスポート
 * @returns {Promise<string>} CSV形式の文字列
 */
export async function exportAttendancePlansToCSV() {
  const plansWithMatches = await getAllAttendancePlansWithMatches()
  
  // CSVヘッダー
  const headers = [
    'ID',
    '日付',
    'キックオフ',
    'ホームチーム',
    'アウェイチーム',
    '会場',
    'グループ',
    'ラウンド',
    '放送局'
  ]

  // CSVデータ行
  const rows = plansWithMatches.map(({ match }) => {
    return [
      match.id,
      match.date,
      match.kickoff,
      match.homeTeam,
      match.awayTeam,
      match.venue || '',
      match.group || '',
      match.round || '',
      match.broadcast || ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * UUIDを生成（簡易版）
 * @returns {string} UUID文字列
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
