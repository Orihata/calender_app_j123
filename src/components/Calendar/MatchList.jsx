import React, { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createAttendancePlan, getAttendancePlansByMatchId, deleteAttendancePlanByMatchIdAndCategory } from '../../services/attendanceService.js'
import './MatchList.css'

/**
 * MatchListコンポーネント
 * 試合予定の一覧を表示
 */
function MatchList({ matches, onAttendanceChange }) {
  const [attendanceStatus, setAttendanceStatus] = useState({})
  const [loading, setLoading] = useState({})
  const [showCategoryModal, setShowCategoryModal] = useState(null) // matchId
  const [infoModal, setInfoModal] = useState(null) // { matchId, content }

  // 観戦予定の状態を確認
  useEffect(() => {
    const checkAttendanceStatus = async () => {
      const status = {}
      for (const match of matches) {
        const plans = await getAttendancePlansByMatchId(match.id)
        status[match.id] = {
          venue: plans.some(p => p.category === 'venue'),
          broadcast: plans.some(p => p.category === 'broadcast')
        }
      }
      setAttendanceStatus(status)
    }
    if (matches && matches.length > 0) {
      checkAttendanceStatus()
    }
  }, [matches])

  /**
   * 観戦予定に追加（カテゴリ選択、排他選択）
   */
  const handleAddAttendance = async (matchId, category) => {
    // スクロール位置を保存
    const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
    
    try {
      setLoading(prev => ({ ...prev, [`${matchId}-${category}`]: true }))
      
      // 排他選択: 他方のカテゴリを削除
      const otherCategory = category === 'venue' ? 'broadcast' : 'venue'
      const existingPlans = await getAttendancePlansByMatchId(matchId)
      const existingOtherPlan = existingPlans.find(p => p.category === otherCategory)
      
      if (existingOtherPlan) {
        await deleteAttendancePlanByMatchIdAndCategory(matchId, otherCategory)
      }
      
      await createAttendancePlan(matchId, category)
      const plans = await getAttendancePlansByMatchId(matchId)
      setAttendanceStatus(prev => ({
        ...prev,
        [matchId]: {
          venue: plans.some(p => p.category === 'venue'),
          broadcast: plans.some(p => p.category === 'broadcast')
        }
      }))
      setShowCategoryModal(null)
      if (onAttendanceChange) {
        onAttendanceChange()
      }
      
      // スクロール位置を復元
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition)
      })
    } catch (error) {
      alert(`観戦予定の追加に失敗しました: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, [`${matchId}-${category}`]: false }))
    }
  }

  /**
   * 観戦予定から削除
   */
  const handleRemoveAttendance = async (matchId, category) => {
    // スクロール位置を保存
    const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
    
    try {
      setLoading(prev => ({ ...prev, [`${matchId}-${category}`]: true }))
      await deleteAttendancePlanByMatchIdAndCategory(matchId, category)
      const plans = await getAttendancePlansByMatchId(matchId)
      setAttendanceStatus(prev => ({
        ...prev,
        [matchId]: {
          venue: plans.some(p => p.category === 'venue'),
          broadcast: plans.some(p => p.category === 'broadcast')
        }
      }))
      if (onAttendanceChange) {
        onAttendanceChange()
      }
      
      // スクロール位置を復元
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition)
      })
    } catch (error) {
      alert(`観戦予定の削除に失敗しました: ${error.message}`)
    } finally {
      setLoading(prev => ({ ...prev, [`${matchId}-${category}`]: false }))
    }
  }
  if (!matches || matches.length === 0) {
    return (
      <div className="match-list-empty">
        <p>試合予定がありません</p>
      </div>
    )
  }

  // 日時順にソート（dateTimeがnullの場合は最後に）
  const sortedMatches = [...matches].sort((a, b) => {
    if (!a.dateTime && !b.dateTime) return 0
    if (!a.dateTime) return 1
    if (!b.dateTime) return -1
    return new Date(a.dateTime) - new Date(b.dateTime)
  })

  return (
    <div className="match-list">
      {sortedMatches.map((match) => {
        // グループとラウンドを結合
        const groupRoundText = [match.group, match.round ? `第${match.round}節` : null]
          .filter(Boolean)
          .join(' ')

        // 観戦予定の状態に基づいてクラスを決定
        const hasVenue = attendanceStatus[match.id]?.venue
        const hasBroadcast = attendanceStatus[match.id]?.broadcast
        const matchItemClass = `match-item ${hasVenue ? 'has-venue' : ''} ${hasBroadcast ? 'has-broadcast' : ''}`

        return (
          <div key={match.id} className={matchItemClass}>
            {/* 左上: グループ+ラウンド */}
            {groupRoundText && (
              <div className="match-group-round">
                {groupRoundText}
              </div>
            )}

            {/* 右上: 情報アイコンとKO時間 */}
            <div className="match-header-right">
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
              <div className="match-time">
                {match.kickoff === '未定' ? (
                  <span className="time-undefined">未定</span>
                ) : (
                  <span className="time">{match.kickoff}</span>
                )}
              </div>
            </div>

            {/* 中央: 両クラブ */}
            <div className="match-teams">
              <span className="home-team">{match.homeTeam}</span>
              <span className="vs">vs</span>
              <span className="away-team">{match.awayTeam}</span>
            </div>
          
            <div className="match-details">
              {match.venue && (
                <div className="match-venue">
                  <span className="label">会場:</span>
                  <span className="value">{match.venue}</span>
                </div>
              )}

              {match.broadcast && (
                <div className="match-broadcast">
                  <span className="label">放送:</span>
                  <span className="value">{match.broadcast}</span>
                </div>
              )}
            </div>

          <div className="match-actions">
            <div className="attendance-buttons">
              {attendanceStatus[match.id]?.venue ? (
                <button
                  className="btn-attendance btn-remove btn-venue"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemoveAttendance(match.id, 'venue')
                  }}
                  disabled={loading[`${match.id}-venue`]}
                  type="button"
                >
                  {loading[`${match.id}-venue`] ? '削除中...' : '現地観戦予定から削除'}
                </button>
              ) : (
                <button
                  className="btn-attendance btn-add btn-venue"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAddAttendance(match.id, 'venue')
                  }}
                  disabled={loading[`${match.id}-venue`]}
                  type="button"
                >
                  {loading[`${match.id}-venue`] ? '追加中...' : '現地観戦予定に追加'}
                </button>
              )}
              
              {attendanceStatus[match.id]?.broadcast ? (
                <button
                  className="btn-attendance btn-remove btn-broadcast"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemoveAttendance(match.id, 'broadcast')
                  }}
                  disabled={loading[`${match.id}-broadcast`]}
                  type="button"
                >
                  {loading[`${match.id}-broadcast`] ? '削除中...' : '放送視聴予定から削除'}
                </button>
              ) : (
                <button
                  className="btn-attendance btn-add btn-broadcast"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAddAttendance(match.id, 'broadcast')
                  }}
                  disabled={loading[`${match.id}-broadcast`]}
                  type="button"
                >
                  {loading[`${match.id}-broadcast`] ? '追加中...' : '放送視聴予定に追加'}
                </button>
              )}
            </div>
          </div>
        </div>
        )
      })}
      
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
    </div>
  )
}

export default MatchList
