import React, { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getAllAttendancePlansWithMatches } from '../../services/attendanceService.js'
import {
  buildDailyScheduleBlocks,
  buildTimeAxisLabels,
  minutesToTimeLabel,
  MATCH_DURATION_MINUTES
} from '../../utils/dailyScheduleLayout.js'
import './DailySchedule.css'

function DailySchedule() {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [plansWithMatches, setPlansWithMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getAllAttendancePlansWithMatches()
        setPlansWithMatches(data)
      } catch (error) {
        console.error('観戦予定の読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const { visible, hiddenCount } = useMemo(
    () => buildDailyScheduleBlocks(plansWithMatches, selectedDate),
    [plansWithMatches, selectedDate]
  )

  const timeLabels = useMemo(() => buildTimeAxisLabels(), [])

  const dateDisplay = useMemo(() => {
    try {
      return format(parseISO(selectedDate), 'yyyy年M月d日（E）', { locale: ja })
    } catch {
      return selectedDate
    }
  }, [selectedDate])

  if (loading) {
    return (
      <div className="daily-schedule">
        <div className="daily-schedule-loading">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="daily-schedule">
      <div className="daily-schedule-header">
        <h2>当日の予定表</h2>
        <div className="daily-schedule-date-picker">
          <label htmlFor="daily-schedule-date">日付</label>
          <input
            id="daily-schedule-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="daily-schedule-date-display">{dateDisplay}</div>
      </div>

      {visible.length === 0 ? (
        <div className="daily-schedule-empty">
          <p>この日の観戦・視聴予定はありません。</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            （キックオフが「未定」、または 10:00〜22:00 の範囲外の試合は表示されません）
          </p>
        </div>
      ) : (
        <div className="daily-schedule-timeline-wrapper">
          <div className="daily-schedule-timeline">
            <div className="daily-schedule-axis">
              {timeLabels.map(({ minutes, label, topPercent }) => (
                <div
                  key={minutes}
                  className="daily-schedule-axis-label"
                  style={{ top: `${topPercent}%` }}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="daily-schedule-grid">
              {timeLabels.map(({ minutes, topPercent }) => (
                <div
                  key={`line-${minutes}`}
                  className="daily-schedule-grid-line"
                  style={{ top: `${topPercent}%` }}
                />
              ))}
              <div className="daily-schedule-blocks">
                {visible.map((block) => {
                  const categoryLabel = block.category === 'venue' ? '観戦' : '視聴'
                  const detail =
                    block.category === 'venue'
                      ? block.match.venue
                      : block.match.broadcast
                  const endLabel = minutesToTimeLabel(
                    block.startMinutes + MATCH_DURATION_MINUTES
                  )

                  return (
                    <div
                      key={block.id}
                      className={`daily-schedule-block ${block.category}`}
                      style={{
                        top: `${block.topPercent}%`,
                        height: `${block.heightPercent}%`,
                        left: `${block.leftPercent}%`,
                        width: `calc(${block.widthPercent}% - 4px)`,
                        marginLeft: block.column > 0 ? '2px' : '0',
                        marginRight: '2px'
                      }}
                      title={`${block.match.homeTeam} vs ${block.match.awayTeam}`}
                    >
                      <div className="daily-schedule-block-category">{categoryLabel}</div>
                      <div className="daily-schedule-block-teams">
                        {block.match.homeTeam} vs {block.match.awayTeam}
                      </div>
                      <div className="daily-schedule-block-time">
                        {block.match.kickoff}〜{endLabel}
                      </div>
                      {detail && (
                        <div className="daily-schedule-block-detail">{detail}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {hiddenCount > 0 && (
        <div className="daily-schedule-hidden-notice">
          重複する時間帯が多いため、{hiddenCount}件の予定は表示されていません（最大4件まで並列表示）。
        </div>
      )}

      <div className="daily-schedule-legend">
        <div className="daily-schedule-legend-item">
          <span className="daily-schedule-legend-swatch venue" />
          <span>現地観戦</span>
        </div>
        <div className="daily-schedule-legend-item">
          <span className="daily-schedule-legend-swatch broadcast" />
          <span>放送視聴</span>
        </div>
      </div>
    </div>
  )
}

export default DailySchedule
