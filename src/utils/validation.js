import { isValidDate, parseDate } from './dateUtils.js'

/**
 * バリデーション関数
 * データの妥当性を検証する
 */

/**
 * 日付形式を検証（YYYY-MM-DD）
 * @param {string} dateString - 検証する日付文字列
 * @returns {boolean} 有効な日付形式の場合true
 */
export function isValidDateFormat(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return false
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    return false
  }

  return isValidDate(dateString)
}

/**
 * 時間形式を検証（HH:MM）
 * @param {string} timeString - 検証する時間文字列
 * @returns {boolean} 有効な時間形式または「未定」の場合true
 */
export function isValidTimeFormat(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return false
  }

  // 「未定」は有効な値
  if (timeString === '未定') {
    return true
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  return timeRegex.test(timeString)
}

/**
 * ISO 8601形式の日時文字列を検証
 * @param {string} dateTimeString - 検証する日時文字列
 * @returns {boolean} 有効な日時形式の場合true
 */
export function isValidDateTimeFormat(dateTimeString) {
  if (!dateTimeString || dateTimeString === '') {
    return false
  }

  try {
    const date = new Date(dateTimeString)
    return !isNaN(date.getTime())
  } catch (error) {
    return false
  }
}

/**
 * 必須フィールドが存在し、空でないことを検証
 * @param {any} value - 検証する値
 * @returns {boolean} 値が存在し、空でない場合true
 */
export function isRequired(value) {
  if (value === null || value === undefined) {
    return false
  }
  if (typeof value === 'string' && value.trim() === '') {
    return false
  }
  return true
}

/**
 * Matchオブジェクトのバリデーション
 * @param {Object} match - 検証するMatchオブジェクト
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateMatch(match) {
  const errors = []

  // 必須フィールドチェック
  if (!isRequired(match.id)) {
    errors.push('idは必須です')
  }
  if (!isRequired(match.date)) {
    errors.push('dateは必須です')
  }
  if (!isRequired(match.kickoff)) {
    errors.push('kickoffは必須です')
  }
  if (!isRequired(match.homeTeam)) {
    errors.push('homeTeamは必須です')
  }
  if (!isRequired(match.awayTeam)) {
    errors.push('awayTeamは必須です')
  }
  if (!isRequired(match.createdAt)) {
    errors.push('createdAtは必須です')
  }
  if (!isRequired(match.updatedAt)) {
    errors.push('updatedAtは必須です')
  }

  // 日付形式チェック
  if (match.date && !isValidDateFormat(match.date)) {
    errors.push('dateは有効な日付形式（YYYY-MM-DD）である必要があります')
  }

  // キックオフ時間チェック
  if (match.kickoff && !isValidTimeFormat(match.kickoff)) {
    errors.push('kickoffは有効な時間形式（HH:MM）または「未定」である必要があります')
  }

  // 日時形式チェック
  if (match.kickoff && match.kickoff !== '未定') {
    if (match.dateTime && !isValidDateTimeFormat(match.dateTime)) {
      errors.push('dateTimeは有効なISO 8601形式である必要があります')
    }
  } else {
    // キックオフが「未定」の場合、dateTimeはnullまたは空文字列でなければならない
    if (match.dateTime !== null && match.dateTime !== '') {
      errors.push('kickoffが「未定」の場合、dateTimeはnullまたは空文字列である必要があります')
    }
  }

  // 文字列長チェック
  if (match.homeTeam && match.homeTeam.trim() === '') {
    errors.push('homeTeamは空文字列であってはなりません')
  }
  if (match.awayTeam && match.awayTeam.trim() === '') {
    errors.push('awayTeamは空文字列であってはなりません')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * AttendancePlanオブジェクトのバリデーション
 * @param {Object} attendancePlan - 検証するAttendancePlanオブジェクト
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateAttendancePlan(attendancePlan) {
  const errors = []

  // 必須フィールドチェック
  if (!isRequired(attendancePlan.id)) {
    errors.push('idは必須です')
  }
  if (!isRequired(attendancePlan.matchId)) {
    errors.push('matchIdは必須です')
  }
  if (!isRequired(attendancePlan.category)) {
    errors.push('categoryは必須です')
  }
  if (!isRequired(attendancePlan.createdAt)) {
    errors.push('createdAtは必須です')
  }
  if (!isRequired(attendancePlan.updatedAt)) {
    errors.push('updatedAtは必須です')
  }

  // カテゴリの検証
  if (attendancePlan.category && attendancePlan.category !== 'venue' && attendancePlan.category !== 'broadcast') {
    errors.push('categoryは "venue" または "broadcast" である必要があります')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * UUID形式を検証（簡易版）
 * @param {string} uuid - 検証するUUID文字列
 * @returns {boolean} 有効なUUID形式の場合true
 */
export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return false
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
