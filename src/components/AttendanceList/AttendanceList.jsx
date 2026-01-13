import React, { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getAllAttendancePlansWithMatches, deleteAttendancePlan } from '../../services/attendanceService.js'
import WallpaperGenerator from '../common/WallpaperGenerator.jsx'
import './AttendanceList.css'

/**
 * AttendanceListコンポーネント
 * 観戦予定の一覧を表示
 */
function AttendanceList() {
  const [attendancePlans, setAttendancePlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState({})
  const [selectedCategories, setSelectedCategories] = useState(['venue', 'broadcast']) // 初期値は両方選択
  const [infoModal, setInfoModal] = useState(null) // { matchId, content }
  const [isEditMode, setIsEditMode] = useState(false) // 閲覧モード/編集モード
  const [showWallpaperGenerator, setShowWallpaperGenerator] = useState(false) // 画像生成モーダル

  // 観戦予定を読み込む
  useEffect(() => {
    loadAttendancePlans()
  }, [])

  /**
   * 観戦予定を読み込む
   */
  const loadAttendancePlans = async () => {
    try {
      setLoading(true)
      const plans = await getAllAttendancePlansWithMatches()
      // 日時順にソート（dateTimeがnullの場合は最後に）
      const sorted = plans.sort((a, b) => {
        if (!a.match.dateTime && !b.match.dateTime) return 0
        if (!a.match.dateTime) return 1
        if (!b.match.dateTime) return -1
        return new Date(a.match.dateTime) - new Date(b.match.dateTime)
      })
      setAttendancePlans(sorted)
    } catch (error) {
      console.error('観戦予定の読み込みエラー:', error)
      alert(`観戦予定の読み込みに失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 観戦予定を削除
   */
  const handleDelete = async (planId) => {
    if (!confirm('この観戦予定を削除しますか？')) {
      return
    }

    try {
      setDeleting(prev => ({ ...prev, [planId]: true }))
      await deleteAttendancePlan(planId)
      await loadAttendancePlans() // 一覧を再読み込み
    } catch (error) {
      alert(`観戦予定の削除に失敗しました: ${error.message}`)
    } finally {
      setDeleting(prev => ({ ...prev, [planId]: false }))
    }
  }

  /**
   * カテゴリボタンのトグル
   */
  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // 選択解除（ただし、両方解除されることはないようにする）
        const newCategories = prev.filter(c => c !== category)
        return newCategories.length > 0 ? newCategories : prev
      } else {
        // 選択追加
        return [...prev, category]
      }
    })
  }

  // フィルタリングされた観戦予定を取得
  const filteredPlans = attendancePlans.filter(({ plan }) => 
    selectedCategories.includes(plan.category)
  )

  // カテゴリ別の件数を計算
  const venueCount = attendancePlans.filter(({ plan }) => plan.category === 'venue').length
  const broadcastCount = attendancePlans.filter(({ plan }) => plan.category === 'broadcast').length

  if (loading) {
    return (
      <div className="attendance-list-loading">
        <p>読み込み中...</p>
      </div>
    )
  }

  if (attendancePlans.length === 0) {
    return (
      <div className="attendance-list-empty">
        <h2>観戦予定一覧</h2>
        <p>観戦予定が登録されていません</p>
        <p className="empty-hint">カレンダーから試合を選択して「観戦予定に追加」をクリックしてください</p>
      </div>
    )
  }

  return (
    <div className="attendance-list">
      <h2>観戦予定一覧</h2>
      
      {/* フィルターと編集モードトグル */}
      <div className="attendance-controls">
        <div className="attendance-filters">
          <button
            className={`category-button ${selectedCategories.includes('venue') ? 'active venue' : ''}`}
            onClick={() => toggleCategory('venue')}
            type="button"
          >
            現地観戦 ({venueCount})
          </button>
          <button
            className={`category-button ${selectedCategories.includes('broadcast') ? 'active broadcast' : ''}`}
            onClick={() => toggleCategory('broadcast')}
            type="button"
          >
            放送観戦 ({broadcastCount})
          </button>
        </div>

        <div className="attendance-controls-right">
          {/* 画像出力ボタン（現地観戦予定がある場合のみ表示） */}
          {venueCount > 0 && (
            <button
              className="wallpaper-button"
              onClick={() => setShowWallpaperGenerator(true)}
              type="button"
            >
              画像出力
            </button>
          )}

          {/* 閲覧/編集モードボタン */}
          <button
            className={`edit-mode-button ${isEditMode ? 'active' : ''}`}
            onClick={() => setIsEditMode(!isEditMode)}
            type="button"
          >
            {isEditMode ? '編集' : '閲覧'}
          </button>
        </div>
      </div>

      <div className="attendance-count">
        {filteredPlans.length > 0 
          ? `表示中: ${filteredPlans.length}件の観戦予定`
          : '該当する観戦予定がありません'}
      </div>

      {filteredPlans.length === 0 ? (
        <div className="attendance-list-empty">
          <p>該当する観戦予定がありません</p>
        </div>
      ) : (
        <div className="attendance-items">
          {filteredPlans.map(({ plan, match }) => {
            // グループとラウンドを結合
            const groupRoundText = [match.group, match.round ? `第${match.round}節` : null]
              .filter(Boolean)
              .join(' ')

            // カテゴリに基づいてクラスを決定
            const attendanceItemClass = `attendance-item ${plan.category === 'venue' ? 'has-venue' : 'has-broadcast'}`

            return (
              <div key={plan.id} className={attendanceItemClass}>
                {/* 左上: グループ+ラウンド */}
                {groupRoundText && (
                  <div className="attendance-group-round">
                    {groupRoundText}
                  </div>
                )}

                {/* 右上: 情報アイコンとKO時間 */}
                <div className="attendance-header-right">
                  {match.additionalInfo && (
                    <button
                      className="info-icon-button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setInfoModal({ matchId: match.id, content: match.additionalInfo })
                      }}
                      title="追加情報"
                      type="button"
                    >
                      <span className="info-icon">i</span>
                    </button>
                  )}
                  <div className="attendance-time">
                    {match.kickoff === '未定' ? (
                      <span className="time-undefined">未定</span>
                    ) : (
                      <span className="time">{match.kickoff}</span>
                    )}
                  </div>
                </div>

                {/* 試合日 */}
                <div className="attendance-date">
                  {match.dateTime ? (
                    <span className="date-text">
                      {format(parseISO(match.dateTime), 'yyyy年M月d日(E)', { locale: ja })}
                    </span>
                  ) : (
                    <span className="date-text">
                      {format(parseISO(`${match.date}T00:00:00+09:00`), 'yyyy年M月d日(E)', { locale: ja })}
                    </span>
                  )}
                </div>

                {/* 中央: 両クラブ */}
                <div className="attendance-teams">
                  <span className="home-team">{match.homeTeam}</span>
                  <span className="vs">vs</span>
                  <span className="away-team">{match.awayTeam}</span>
                </div>

                <div className="attendance-details">
                  {plan.category === 'venue' && match.venue && (
                    <div className="attendance-venue">
                      <span className="label">会場:</span>
                      <span className="value">{match.venue}</span>
                    </div>
                  )}

                  {plan.category === 'broadcast' && match.broadcast && (
                    <div className="attendance-broadcast">
                      <span className="label">放送:</span>
                      <span className="value">{match.broadcast}</span>
                    </div>
                  )}
                </div>

                {isEditMode && (
                  <div className="attendance-actions">
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(plan.id)
                      }}
                      disabled={deleting[plan.id]}
                      type="button"
                    >
                      {deleting[plan.id] ? '削除中...' : '観戦予定から削除'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 情報モーダル */}
      {infoModal && (
        <div className="modal-overlay" onClick={() => setInfoModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>追加情報</h3>
              <button className="modal-close" onClick={() => setInfoModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>{infoModal.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* 画像生成モーダル */}
      {showWallpaperGenerator && (
        <WallpaperGenerator
          plansWithMatches={attendancePlans}
          onClose={() => setShowWallpaperGenerator(false)}
        />
      )}
    </div>
  )
}

export default AttendanceList
