/**
 * シーズン定義
 * 日付は YYYY-MM-DD 形式（境界日を含む）
 */

export const SEASON_IDS = {
  SPECIAL_2026: 'special-2026',
  J2026_27: 'j2026-27'
}

/** 2026特別シーズン（100年リーグ等）: 2026年2月〜6月 */
export const SPECIAL_SEASON_2026 = {
  id: SEASON_IDS.SPECIAL_2026,
  label: '2026特別シーズン',
  startDate: '2026-02-01',
  endDate: '2026-06-30'
}

/** 2026/2027シーズン: 2026年8月〜2027年6月 */
export const SEASON_J2026_27 = {
  id: SEASON_IDS.J2026_27,
  label: '2026/2027シーズン',
  startDate: '2026-08-01',
  endDate: '2027-06-30'
}

/**
 * 試合日が指定シーズンに属するか
 * @param {string} date - YYYY-MM-DD
 * @param {{ startDate: string, endDate: string }} season
 */
export function isDateInSeason(date, season) {
  if (!date) return false
  return date >= season.startDate && date <= season.endDate
}

export function isSpecialSeason2026Date(date) {
  return isDateInSeason(date, SPECIAL_SEASON_2026)
}

export function isCurrentSeasonDate(date) {
  return isDateInSeason(date, SEASON_J2026_27)
}
