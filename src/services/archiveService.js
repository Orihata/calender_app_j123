import {
  getMatches,
  saveMatches,
  getAttendancePlans,
  saveAttendancePlans,
  getArchivedSeasons,
  appendArchivedSeason
} from './storage.js'
import { loadMasterData } from './masterDataService.js'
import { createMatches } from './matchService.js'
import {
  SPECIAL_SEASON_2026,
  SEASON_IDS,
  isSpecialSeason2026Date
} from '../constants/seasons.js'

/**
 * 試合の同一性キー（マスタ再取込時の重複回避用）
 */
function matchIdentityKey(match) {
  return `${match.date}|${match.homeTeam}|${match.awayTeam}`
}

/**
 * 2026特別シーズンが既にアーカイブ済みか
 */
export async function isSpecialSeason2026Archived() {
  const archives = await getArchivedSeasons()
  return archives.some((a) => a.id === SEASON_IDS.SPECIAL_2026)
}

/**
 * アーカイブ対象の件数プレビュー
 */
export async function getSpecialSeason2026ArchivePreview() {
  const matches = await getMatches()
  const plans = await getAttendancePlans()

  const targetMatches = matches.filter((m) => isSpecialSeason2026Date(m.date))
  const targetMatchIds = new Set(targetMatches.map((m) => m.id))
  const targetPlans = plans.filter((p) => targetMatchIds.has(p.matchId))

  return {
    matchCount: targetMatches.length,
    attendancePlanCount: targetPlans.length,
    alreadyArchived: await isSpecialSeason2026Archived()
  }
}

/**
 * マスタデータから未登録の試合のみ取り込む
 * @returns {Promise<number>} 追加した試合数
 */
export async function importMissingMasterMatches() {
  const existing = await getMatches()
  const existingKeys = new Set(existing.map(matchIdentityKey))
  const masterMatches = await loadMasterData()
  const toAdd = masterMatches.filter((m) => !existingKeys.has(matchIdentityKey(m)))

  if (toAdd.length > 0) {
    const result = await createMatches(toAdd)
    if (result.errors.length > 0) {
      console.warn('[ArchiveService] マスタ取込エラー:', result.errors.length, '件')
    }
    return result.success.length
  }
  return 0
}

/**
 * 2026特別シーズンのユーザーデータを非可逆的にアーカイブ
 * - 特別シーズン期間の試合・観戦予定を退避
 * - アクティブデータから削除
 * - 現行マスタの未登録試合を取り込み
 */
export async function archiveSpecialSeason2026() {
  if (await isSpecialSeason2026Archived()) {
    throw new Error('2026特別シーズンは既にアーカイブ済みです')
  }

  const allMatches = await getMatches()
  const allPlans = await getAttendancePlans()

  const archivedMatches = allMatches.filter((m) => isSpecialSeason2026Date(m.date))
  const archivedMatchIds = new Set(archivedMatches.map((m) => m.id))
  const archivedPlans = allPlans.filter((p) => archivedMatchIds.has(p.matchId))

  if (archivedMatches.length === 0 && archivedPlans.length === 0) {
    throw new Error('アーカイブ対象のデータがありません')
  }

  const archive = {
    id: SPECIAL_SEASON_2026.id,
    label: SPECIAL_SEASON_2026.label,
    period: {
      startDate: SPECIAL_SEASON_2026.startDate,
      endDate: SPECIAL_SEASON_2026.endDate
    },
    archivedAt: new Date().toISOString(),
    matchCount: archivedMatches.length,
    attendancePlanCount: archivedPlans.length,
    matches: archivedMatches,
    attendancePlans: archivedPlans
  }

  await appendArchivedSeason(archive)

  const remainingMatches = allMatches.filter((m) => !archivedMatchIds.has(m.id))
  const remainingPlans = allPlans.filter((p) => !archivedMatchIds.has(p.matchId))

  await saveMatches(remainingMatches)
  await saveAttendancePlans(remainingPlans)

  const importedCount = await importMissingMasterMatches()

  return {
    archivedMatches: archivedMatches.length,
    archivedPlans: archivedPlans.length,
    importedMatches: importedCount
  }
}
