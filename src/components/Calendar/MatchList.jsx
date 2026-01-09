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
   * 観戦予定に追加（カテゴリ選択）
   */
  const handleAddAttendance = async (matchId, category) => {
    try {
      setLoading(prev => ({ ...prev, [`${matchId}-${category}`]: true }))
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
      {sortedMatches.map((match) => (
        <div key={match.id} className="match-item">
          <div className="match-header">
            <div className="match-teams">
              <span className="home-team">{match.homeTeam}</span>
              <span className="vs">vs</span>
              <span className="away-team">{match.awayTeam}</span>
            </div>
            <div className="match-time">
              {match.kickoff === '未定' ? (
                <span className="time-undefined">未定</span>
              ) : (
                <span className="time">{match.kickoff}</span>
              )}
            </div>
          </div>
          
          <div className="match-details">
            {match.venue && (
              <div className="match-venue">
                <span className="label">会場:</span>
                <span className="value">{match.venue}</span>
              </div>
            )}
            
            {match.dateTime && (
              <div className="match-datetime">
                <span className="label">日時:</span>
                <span className="value">
                  {format(parseISO(match.dateTime), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                </span>
              </div>
            )}
            
            {match.kickoff === '未定' && (
              <div className="match-datetime">
                <span className="label">日付:</span>
                <span className="value">
                  {format(parseISO(`${match.date}T00:00:00+09:00`), 'yyyy年MM月dd日', { locale: ja })}
                </span>
              </div>
            )}

            {match.group && (
              <div className="match-group">
                <span className="label">グループ:</span>
                <span className="value">{match.group}</span>
              </div>
            )}

            {match.round && (
              <div className="match-round">
                <span className="label">ラウンド:</span>
                <span className="value">第{match.round}節</span>
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
                  onClick={() => handleRemoveAttendance(match.id, 'venue')}
                  disabled={loading[`${match.id}-venue`]}
                >
                  {loading[`${match.id}-venue`] ? '削除中...' : '現地観戦予定から削除'}
                </button>
              ) : (
                <button
                  className="btn-attendance btn-add btn-venue"
                  onClick={() => handleAddAttendance(match.id, 'venue')}
                  disabled={loading[`${match.id}-venue`]}
                >
                  {loading[`${match.id}-venue`] ? '追加中...' : '現地観戦予定に追加'}
                </button>
              )}
              
              {attendanceStatus[match.id]?.broadcast ? (
                <button
                  className="btn-attendance btn-remove btn-broadcast"
                  onClick={() => handleRemoveAttendance(match.id, 'broadcast')}
                  disabled={loading[`${match.id}-broadcast`]}
                >
                  {loading[`${match.id}-broadcast`] ? '削除中...' : '放送視聴予定から削除'}
                </button>
              ) : (
                <button
                  className="btn-attendance btn-add btn-broadcast"
                  onClick={() => handleAddAttendance(match.id, 'broadcast')}
                  disabled={loading[`${match.id}-broadcast`]}
                >
                  {loading[`${match.id}-broadcast`] ? '追加中...' : '放送視聴予定に追加'}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MatchList
