import React, { useState, useEffect, useMemo, useRef } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getAllMatches, getMatchesByDate, buildDateIndex } from '../../services/matchService.js'
import { getAllAttendancePlans, deleteAttendancePlanByMatchIdAndCategory } from '../../services/attendanceService.js'
import MatchList from './MatchList.jsx'
import './Calendar.css'

/**
 * Calendarコンポーネント
 * カレンダー形式で試合予定を表示
 */
function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [matches, setMatches] = useState([])
  const [matchesByDate, setMatchesByDate] = useState({})
  const [attendancePlans, setAttendancePlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [candyBarHeight, setCandyBarHeight] = useState(0)
  const candyBarRef = useRef(null)

  // 試合予定と観戦予定を読み込む
  useEffect(() => {
    loadMatches(true) // 初期読み込み時はローディングを表示
    loadAttendancePlans()
  }, [])

  /**
   * 試合予定を読み込む
   * @param {boolean} showLoading - ローディング表示するかどうか（デフォルト: false）
   */
  const loadMatches = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const allMatches = await getAllMatches()
      setMatches(allMatches)
      
      // 日付別インデックスを構築
      const index = buildDateIndex(allMatches)
      setMatchesByDate(index)
    } catch (error) {
      console.error('試合予定の読み込みエラー:', error)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  /**
   * 観戦予定を読み込む
   */
  const loadAttendancePlans = async () => {
    try {
      const plans = await getAllAttendancePlans()
      setAttendancePlans(plans)
    } catch (error) {
      console.error('観戦予定の読み込みエラー:', error)
    }
  }

  /**
   * 前の月に移動
   */
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  /**
   * 次の月に移動
   */
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  /**
   * 今日に戻る
   */
  const handleToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  /**
   * 日付を選択
   */
  const handleDateClick = (date) => {
    setSelectedDate(date)
  }

  // カレンダーの日付を生成
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: ja })
  const calendarEnd = endOfWeek(monthEnd, { locale: ja })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // 選択された日付の試合予定を取得
  const selectedDateMatches = selectedDate
    ? matchesByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : []

  // 選択された日付で観戦予定がある試合を取得（キャンディーバー用）
  const attendanceMatchesForCandyBar = useMemo(() => {
    if (!selectedDate) return []
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const dayMatches = matchesByDate[dateStr] || []
    
    return dayMatches
      .map(match => {
        const plans = attendancePlans.filter(plan => plan.matchId === match.id)
        const venuePlan = plans.find(p => p.category === 'venue')
        const broadcastPlan = plans.find(p => p.category === 'broadcast')
        
        if (venuePlan) {
          return { match, category: 'venue', plan: venuePlan }
        } else if (broadcastPlan) {
          return { match, category: 'broadcast', plan: broadcastPlan }
        }
        return null
      })
      .filter(Boolean)
  }, [selectedDate, matchesByDate, attendancePlans])

  // キャンディーバーの高さを測定
  useEffect(() => {
    if (candyBarRef.current && attendanceMatchesForCandyBar.length > 0) {
      const updateHeight = () => {
        if (candyBarRef.current) {
          const height = candyBarRef.current.offsetHeight
          setCandyBarHeight(height)
        }
      }
      
      // 初回測定
      updateHeight()
      
      // リサイズ時にも再測定
      const resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(candyBarRef.current)
      
      return () => {
        if (candyBarRef.current) {
          resizeObserver.unobserve(candyBarRef.current)
        }
      }
    } else {
      setCandyBarHeight(0)
    }
  }, [attendanceMatchesForCandyBar])

  /**
   * キャンディーバーから観戦予定を削除
   */
  const handleRemoveFromCandyBar = async (matchId, category) => {
    try {
      await deleteAttendancePlanByMatchIdAndCategory(matchId, category)
      await loadAttendancePlans()
      await loadMatches(false)
    } catch (error) {
      alert(`観戦予定の削除に失敗しました: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="calendar-loading">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div 
      className="calendar-container"
      style={{
        paddingBottom: candyBarHeight > 0 ? `${candyBarHeight + 20}px` : '0'
      }}
    >
      <div className="calendar-header">
        <h2>試合予定カレンダー</h2>
        <div className="calendar-controls">
          <button onClick={handlePrevMonth} className="btn-nav">← 前月</button>
          <button onClick={handleToday} className="btn-today">今日</button>
          <button onClick={handleNextMonth} className="btn-nav">次月 →</button>
        </div>
        <div className="calendar-month">
          {format(currentDate, 'yyyy年M月', { locale: ja })}
        </div>
      </div>

      <div className="calendar-grid">
        {/* 曜日ヘッダー */}
        <div className="calendar-weekdays">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <div key={index} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        {/* カレンダー日付 */}
        <div className="calendar-days">
          {calendarDays.map((day, index) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayMatches = matchesByDate[dateStr] || []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            
            // その日の試合で観戦予定があるかチェック
            const hasAttendance = dayMatches.some(match => 
              attendancePlans.some(plan => plan.matchId === match.id)
            )

            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayMatches.length > 0 ? 'has-matches' : ''} ${hasAttendance ? 'has-attendance' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <div className="day-number">{format(day, 'd')}</div>
                {dayMatches.length > 0 && (
                  <div className="match-badge" title={`${dayMatches.length}試合`}>
                    {dayMatches.length}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 選択された日付の試合一覧 */}
      {selectedDate && (
        <div className="selected-date-matches">
          <h3>
            {format(selectedDate, 'yyyy年M月d日', { locale: ja })}の試合
          </h3>
          {selectedDateMatches.length > 0 ? (
            <MatchList 
              matches={selectedDateMatches} 
              onAttendanceChange={() => {
                loadMatches(false) // ローディングを表示しない
                loadAttendancePlans()
              }}
            />
          ) : (
            <p className="no-matches">この日の試合予定はありません</p>
          )}
        </div>
      )}

      {/* キャンディーバー: 選択された日付で観戦予定がある試合を画面下部に固定表示 */}
      {selectedDate && attendanceMatchesForCandyBar.length > 0 && (
        <div className="attendance-candy-bar" ref={candyBarRef}>
          {attendanceMatchesForCandyBar.map(({ match, category }) => {
            // カテゴリに応じたラベルと情報を取得
            const categoryLabel = category === 'venue' ? '観戦' : '視聴'
            const locationInfo = category === 'venue' ? match.venue : match.broadcast
            
            // 表示テキストを構築（カテゴリラベルを除く）
            const displayText = [
              `${match.homeTeam} vs ${match.awayTeam}`,
              match.kickoff,
              locationInfo || ''
            ].filter(Boolean).join(' ')

            return (
              <div
                key={`${match.id}-${category}`}
                className={`candy-bar-item candy-bar-${category}`}
              >
                <span className={`candy-bar-category candy-bar-category-${category}`}>
                  {categoryLabel}
                </span>
                <span className="candy-bar-text">
                  {displayText}
                </span>
                <button
                  className="candy-bar-remove"
                  onClick={() => handleRemoveFromCandyBar(match.id, category)}
                  type="button"
                  title="取り消し"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Calendar
