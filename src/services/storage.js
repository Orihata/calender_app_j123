/**
 * StorageService
 * localStorageへのアクセスを抽象化するサービス
 */

const STORAGE_KEYS = {
  MATCHES: 'matches',
  ATTENDANCE_PLANS: 'attendancePlans',
  ARCHIVED_SEASONS: 'archivedSeasons'
}

/**
 * すべての試合予定を取得
 * @returns {Promise<Array>} 試合予定の配列。データが存在しない場合は空配列
 */
export async function getMatches() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MATCHES)
    if (!data) {
      return []
    }
    return JSON.parse(data)
  } catch (error) {
    console.error('試合予定の取得エラー:', error)
    throw new Error('試合予定の取得に失敗しました')
  }
}

/**
 * 試合予定の配列を保存
 * @param {Array} matches - 保存する試合予定の配列
 * @returns {Promise<void>}
 */
export async function saveMatches(matches) {
  try {
    const json = JSON.stringify(matches)
    localStorage.setItem(STORAGE_KEYS.MATCHES, json)
  } catch (error) {
    console.error('試合予定の保存エラー:', error)
    if (error.name === 'QuotaExceededError') {
      throw new Error('ストレージ容量が不足しています')
    }
    throw new Error('試合予定の保存に失敗しました')
  }
}

/**
 * すべての観戦予定を取得
 * @returns {Promise<Array>} 観戦予定の配列。データが存在しない場合は空配列
 */
export async function getAttendancePlans() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_PLANS)
    if (!data) {
      return []
    }
    return JSON.parse(data)
  } catch (error) {
    console.error('観戦予定の取得エラー:', error)
    throw new Error('観戦予定の取得に失敗しました')
  }
}

/**
 * 観戦予定の配列を保存
 * @param {Array} plans - 保存する観戦予定の配列
 * @returns {Promise<void>}
 */
export async function saveAttendancePlans(plans) {
  try {
    const json = JSON.stringify(plans)
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_PLANS, json)
  } catch (error) {
    console.error('観戦予定の保存エラー:', error)
    if (error.name === 'QuotaExceededError') {
      throw new Error('ストレージ容量が不足しています')
    }
    throw new Error('観戦予定の保存に失敗しました')
  }
}

/**
 * アーカイブ済みシーズンデータを取得
 * @returns {Promise<Array>} アーカイブの配列
 */
export async function getArchivedSeasons() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ARCHIVED_SEASONS)
    if (!data) {
      return []
    }
    return JSON.parse(data)
  } catch (error) {
    console.error('アーカイブデータの取得エラー:', error)
    throw new Error('アーカイブデータの取得に失敗しました')
  }
}

/**
 * アーカイブ済みシーズンデータを保存
 * @param {Array} archives
 * @returns {Promise<void>}
 */
export async function saveArchivedSeasons(archives) {
  try {
    localStorage.setItem(STORAGE_KEYS.ARCHIVED_SEASONS, JSON.stringify(archives))
  } catch (error) {
    console.error('アーカイブデータの保存エラー:', error)
    if (error.name === 'QuotaExceededError') {
      throw new Error('ストレージ容量が不足しています')
    }
    throw new Error('アーカイブデータの保存に失敗しました')
  }
}

/**
 * アーカイブを追加（既存アーカイブに追記）
 * @param {Object} archive
 * @returns {Promise<void>}
 */
export async function appendArchivedSeason(archive) {
  const archives = await getArchivedSeasons()
  archives.push(archive)
  await saveArchivedSeasons(archives)
}

/**
 * すべてのデータを削除
 * @returns {Promise<void>}
 */
export async function clearAll() {
  try {
    localStorage.removeItem(STORAGE_KEYS.MATCHES)
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE_PLANS)
  } catch (error) {
    console.error('データ削除エラー:', error)
    throw new Error('データの削除に失敗しました')
  }
}

/**
 * ストレージ容量をチェック
 * @returns {Object} { used: number, available: number, percentage: number }
 */
export function checkStorageCapacity() {
  try {
    let used = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length
      }
    }
    
    // localStorageの容量は通常5-10MB（ブラウザ依存）
    const total = 5 * 1024 * 1024 // 5MBを仮定
    const available = total - used
    const percentage = (used / total) * 100

    return {
      used,
      available,
      total,
      percentage: Math.min(percentage, 100)
    }
  } catch (error) {
    console.error('ストレージ容量チェックエラー:', error)
    return {
      used: 0,
      available: 0,
      total: 0,
      percentage: 0
    }
  }
}
