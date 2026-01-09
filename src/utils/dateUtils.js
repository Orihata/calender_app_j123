import { format, parse, isValid, compareAsc, compareDesc, startOfDay, endOfDay, parseISO as parseISOFromDateFns } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * 日付操作ユーティリティ関数
 * date-fnsを使用して日付の操作を行う
 */

/**
 * 日付をフォーマットする
 * @param {Date|string} date - フォーマットする日付
 * @param {string} formatStr - フォーマット文字列（date-fns形式）
 * @returns {string} フォーマットされた日付文字列
 */
export function formatDate(date, formatStr = 'yyyy-MM-dd') {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  if (!isValid(dateObj)) {
    return ''
  }
  return format(dateObj, formatStr, { locale: ja })
}

/**
 * ISO 8601形式の文字列をDateオブジェクトに変換
 * @param {string} dateString - ISO 8601形式の日付文字列
 * @returns {Date} Dateオブジェクト
 */
export function parseISO(dateString) {
  if (!dateString) {
    return new Date(NaN)
  }
  try {
    return parseISOFromDateFns(dateString)
  } catch (error) {
    return new Date(dateString)
  }
}

/**
 * YYYY-MM-DD形式の文字列をDateオブジェクトに変換
 * @param {string} dateString - YYYY-MM-DD形式の日付文字列
 * @returns {Date} Dateオブジェクト
 */
export function parseDate(dateString) {
  if (!dateString) {
    return new Date(NaN)
  }
  return parse(dateString, 'yyyy-MM-dd', new Date())
}

/**
 * DateとKickoff時間を結合してISO 8601形式の日時文字列を生成
 * @param {string} date - 日付（YYYY-MM-DD形式）
 * @param {string} kickoff - キックオフ時間（HH:MM形式）
 * @param {string} timezone - タイムゾーン（デフォルト: +09:00）
 * @returns {string|null} ISO 8601形式の日時文字列。kickoffが「未定」の場合はnull
 */
export function combineDateTime(date, kickoff, timezone = '+09:00') {
  if (!kickoff || kickoff === '未定') {
    return null
  }

  try {
    const dateObj = parseDate(date)
    if (!isValid(dateObj)) {
      return null
    }

    const [hours, minutes] = kickoff.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) {
      return null
    }

    dateObj.setHours(hours, minutes, 0, 0)
    
    // ISO 8601形式に変換（タイムゾーン付き）
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hour = String(dateObj.getHours()).padStart(2, '0')
    const minute = String(dateObj.getMinutes()).padStart(2, '0')
    const second = String(dateObj.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day}T${hour}:${minute}:${second}${timezone}`
  } catch (error) {
    console.error('日時結合エラー:', error)
    return null
  }
}

/**
 * 日付を比較する（昇順）
 * @param {Date|string} date1 - 比較する日付1
 * @param {Date|string} date2 - 比較する日付2
 * @returns {number} 比較結果（-1: date1 < date2, 0: date1 === date2, 1: date1 > date2）
 */
export function compareDates(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
  return compareAsc(d1, d2)
}

/**
 * 日付を比較する（降順）
 * @param {Date|string} date1 - 比較する日付1
 * @param {Date|string} date2 - 比較する日付2
 * @returns {number} 比較結果
 */
export function compareDatesDesc(date1, date2) {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
  return compareDesc(d1, d2)
}

/**
 * 日付が有効かどうかをチェック
 * @param {Date|string} date - チェックする日付
 * @returns {boolean} 有効な日付の場合true
 */
export function isValidDate(date) {
  if (!date) {
    return false
  }
  const dateObj = typeof date === 'string' ? parseDate(date) : date
  return isValid(dateObj)
}

/**
 * 日付の開始時刻（00:00:00）を取得
 * @param {Date|string} date - 日付
 * @returns {Date} 開始時刻のDateオブジェクト
 */
export function getStartOfDay(date) {
  const dateObj = typeof date === 'string' ? parseDate(date) : date
  return startOfDay(dateObj)
}

/**
 * 日付の終了時刻（23:59:59）を取得
 * @param {Date|string} date - 日付
 * @returns {Date} 終了時刻のDateオブジェクト
 */
export function getEndOfDay(date) {
  const dateObj = typeof date === 'string' ? parseDate(date) : date
  return endOfDay(dateObj)
}
