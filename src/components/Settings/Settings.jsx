import React, { useState } from 'react'
import { clearAll } from '../../services/storage.js'
import { deleteAllMatches } from '../../services/matchService.js'
import { deleteAllAttendancePlans } from '../../services/attendanceService.js'
import { checkStorageCapacity } from '../../services/storage.js'
import {
  archiveSpecialSeason2026,
  getSpecialSeason2026ArchivePreview
} from '../../services/archiveService.js'
import './Settings.css'

/**
 * Settingsコンポーネント
 * アプリの設定とデータ管理
 */
function Settings() {
  const [storageInfo, setStorageInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [archivePreview, setArchivePreview] = useState(null)

  // ストレージ情報・アーカイブプレビューを取得
  React.useEffect(() => {
    const info = checkStorageCapacity()
    setStorageInfo(info)
    loadArchivePreview()
  }, [])

  const loadArchivePreview = async () => {
    try {
      const preview = await getSpecialSeason2026ArchivePreview()
      setArchivePreview(preview)
    } catch (error) {
      console.error('アーカイブプレビューの取得エラー:', error)
    }
  }

  /**
   * 2026特別シーズンのデータをアーカイブ
   */
  const handleArchiveSpecialSeason = async () => {
    if (!archivePreview || archivePreview.alreadyArchived) {
      return
    }

    const message = [
      '2026特別シーズン（2026年2月〜6月）のデータをアーカイブします。',
      '',
      `対象: 試合 ${archivePreview.matchCount}件 / 観戦予定 ${archivePreview.attendancePlanCount}件`,
      '',
      '・アーカイブ後はカレンダー・観戦予定・画像出力から前シーズンの情報は表示されません',
      '・この操作は取り消せません（アプリ内からの復元は現時点ではできません）',
      '・2026/2027シーズンのマスタデータで不足分を自動取り込みします',
      '',
      '実行しますか？'
    ].join('\n')

    if (!confirm(message)) {
      return
    }

    try {
      setLoading(true)
      const result = await archiveSpecialSeason2026()
      alert(
        [
          'アーカイブが完了しました。',
          `試合: ${result.archivedMatches}件`,
          `観戦予定: ${result.archivedPlans}件`,
          `マスタ取込: ${result.importedMatches}件`,
          '',
          'ページをリロードしてください。'
        ].join('\n')
      )
      await loadArchivePreview()
      const info = checkStorageCapacity()
      setStorageInfo(info)
    } catch (error) {
      alert(`アーカイブに失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * すべてのデータを削除
   */
  const handleClearAll = async () => {
    if (!confirm('すべてのデータ（試合予定と観戦予定）を削除しますか？\nこの操作は取り消せません。')) {
      return
    }

    try {
      setLoading(true)
      await clearAll()
      alert('すべてのデータを削除しました。ページをリロードしてください。')
      // ストレージ情報を更新
      const info = checkStorageCapacity()
      setStorageInfo(info)
    } catch (error) {
      alert(`データの削除に失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 試合予定のみを削除
   */
  const handleClearMatches = async () => {
    if (!confirm('すべての試合予定を削除しますか？\n観戦予定も一緒に削除されます。\nこの操作は取り消せません。')) {
      return
    }

    try {
      setLoading(true)
      await deleteAllMatches()
      alert('すべての試合予定を削除しました。ページをリロードしてください。')
      // ストレージ情報を更新
      const info = checkStorageCapacity()
      setStorageInfo(info)
    } catch (error) {
      alert(`試合予定の削除に失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 観戦予定のみを削除
   */
  const handleClearAttendancePlans = async () => {
    if (!confirm('すべての観戦予定を削除しますか？\nこの操作は取り消せません。')) {
      return
    }

    try {
      setLoading(true)
      await deleteAllAttendancePlans()
      alert('すべての観戦予定を削除しました。')
      // ストレージ情報を更新
      const info = checkStorageCapacity()
      setStorageInfo(info)
    } catch (error) {
      alert(`観戦予定の削除に失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings">
      <h2>設定</h2>

      {/* ストレージ情報 */}
      {storageInfo && (
        <div className="storage-info">
          <h3>ストレージ使用状況</h3>
          <div className="storage-bar">
            <div 
              className="storage-bar-fill" 
              style={{ width: `${storageInfo.percentage}%` }}
            />
          </div>
          <div className="storage-details">
            <span>使用量: {(storageInfo.used / 1024).toFixed(2)} KB</span>
            <span>使用率: {storageInfo.percentage.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* シーズンアーカイブ */}
      <div className="season-archive">
        <h3>シーズンアーカイブ</h3>
        <p className="archive-description">
          v1.x で使用していた「2026特別シーズン」（2026年2月〜6月）の試合・観戦予定を退避し、
          2026/2027シーズン（2026年8月〜）の利用に切り替えます。
        </p>

        {archivePreview && (
          <div className="archive-preview">
            {archivePreview.alreadyArchived ? (
              <p className="archive-status archived">2026特別シーズンはアーカイブ済みです</p>
            ) : (
              <>
                <p className="archive-status pending">アーカイブ待ちのデータがあります</p>
                <ul className="archive-counts">
                  <li>試合: {archivePreview.matchCount}件</li>
                  <li>観戦予定: {archivePreview.attendancePlanCount}件</li>
                </ul>
                <button
                  className="btn btn-archive"
                  onClick={handleArchiveSpecialSeason}
                  disabled={loading || (archivePreview.matchCount === 0 && archivePreview.attendancePlanCount === 0)}
                >
                  {loading ? '処理中...' : '2026特別シーズンをアーカイブ'}
                </button>
              </>
            )}
          </div>
        )}

        <p className="archive-note">
          アーカイブデータは端末内に保存されます。現時点ではアプリ内での閲覧・復元はできません。
        </p>
      </div>

      {/* データ管理 */}
      <div className="data-management">
        <h3>データ管理</h3>
        <p className="warning-text">
          ⚠️ データを削除すると、元に戻すことはできません。
        </p>

        <div className="data-actions">
          <button
            className="btn btn-danger"
            onClick={handleClearMatches}
            disabled={loading}
          >
            {loading ? '削除中...' : 'すべての試合予定を削除'}
          </button>

          <button
            className="btn btn-danger"
            onClick={handleClearAttendancePlans}
            disabled={loading}
          >
            {loading ? '削除中...' : 'すべての観戦予定を削除'}
          </button>

          <button
            className="btn btn-danger btn-clear-all"
            onClick={handleClearAll}
            disabled={loading}
          >
            {loading ? '削除中...' : 'すべてのデータを削除'}
          </button>
        </div>
      </div>

      {/* 使い方 */}
      <div className="usage-info">
        <h3>使い方</h3>
        <ul>
          <li>アプリ起動時にマスタデータが自動的に読み込まれます</li>
          <li>既にデータがある場合は、自動読み込みはスキップされます</li>
          <li>CSVインポート機能で手動でデータを追加することもできます</li>
          <li>データを削除した後は、ページをリロードしてください</li>
        </ul>
      </div>
    </div>
  )
}

export default Settings
