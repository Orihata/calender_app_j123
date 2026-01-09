import React, { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getAllAttendancePlansWithMatches, deleteAttendancePlan } from '../../services/attendanceService.js'
import './AttendanceList.css'

/**
 * AttendanceListコンポーネント
 * 観戦予定の一覧を表示
 */
function AttendanceList() {
  const [attendancePlans, setAttendancePlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState({})
  const [filter, setFilter] = useState('all') // 'all', 'venue', 'broadcast'

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

  // フィルタリングされた観戦予定を取得
  const filteredPlans = filter === 'all' 
    ? attendancePlans 
    : attendancePlans.filter(({ plan }) => plan.category === filter)

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
      
      {/* フィルターボタン */}
      <div className="attendance-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          すべて ({attendancePlans.length})
        </button>
        <button
          className={`filter-btn ${filter === 'venue' ? 'active' : ''}`}
          onClick={() => setFilter('venue')}
        >
          現地観戦予定 ({venueCount})
        </button>
        <button
          className={`filter-btn ${filter === 'broadcast' ? 'active' : ''}`}
          onClick={() => setFilter('broadcast')}
        >
          放送視聴予定 ({broadcastCount})
        </button>
      </div>

      <div className="attendance-count">
        {filter === 'all' 
          ? `全${attendancePlans.length}件の観戦予定`
          : filter === 'venue'
          ? `現地観戦予定: ${filteredPlans.length}件`
          : `放送視聴予定: ${filteredPlans.length}件`}
      </div>

      {filteredPlans.length === 0 ? (
        <div className="attendance-list-empty">
          <p>該当する観戦予定がありません</p>
        </div>
      ) : (
        <div className="attendance-items">
          {filteredPlans.map(({ plan, match }) => (
          <div key={plan.id} className="attendance-item">
            {/* カテゴリタグ */}
            <div className="attendance-category-tag">
              <span className={`tag tag-${plan.category}`}>
                {plan.getCategoryLabel()}
              </span>
            </div>
            
            <div className="attendance-header">
              <div className="attendance-teams">
                <span className="home-team">{match.homeTeam}</span>
                <span className="vs">vs</span>
                <span className="away-team">{match.awayTeam}</span>
              </div>
              <div className="attendance-time">
                {match.kickoff === '未定' ? (
                  <span className="time-undefined">未定</span>
                ) : (
                  <span className="time">{match.kickoff}</span>
                )}
              </div>
            </div>

            <div className="attendance-details">
              {match.venue && (
                <div className="attendance-venue">
                  <span className="label">会場:</span>
                  <span className="value">{match.venue}</span>
                </div>
              )}

              {match.dateTime && (
                <div className="attendance-datetime">
                  <span className="label">日時:</span>
                  <span className="value">
                    {format(parseISO(match.dateTime), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                  </span>
                </div>
              )}

              {match.kickoff === '未定' && (
                <div className="attendance-datetime">
                  <span className="label">日付:</span>
                  <span className="value">
                    {format(parseISO(`${match.date}T00:00:00+09:00`), 'yyyy年MM月dd日', { locale: ja })}
                  </span>
                </div>
              )}

              {match.group && (
                <div className="attendance-group">
                  <span className="label">グループ:</span>
                  <span className="value">{match.group}</span>
                </div>
              )}

              {match.round && (
                <div className="attendance-round">
                  <span className="label">ラウンド:</span>
                  <span className="value">第{match.round}節</span>
                </div>
              )}

              {match.broadcast && (
                <div className="attendance-broadcast">
                  <span className="label">放送:</span>
                  <span className="value">{match.broadcast}</span>
                </div>
              )}
            </div>

            <div className="attendance-actions">
              <button
                className="btn-delete"
                onClick={() => handleDelete(plan.id)}
                disabled={deleting[plan.id]}
              >
                {deleting[plan.id] ? '削除中...' : '観戦予定から削除'}
              </button>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AttendanceList
