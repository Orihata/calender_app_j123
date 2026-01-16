import React, { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getAllAttendancePlansWithMatches, deleteAttendancePlan, updateAttendancePlan } from '../../services/attendanceService.js'
import WallpaperGenerator from '../common/WallpaperGenerator.jsx'
import './AttendanceList.css'

// 色マスタを読み込む
let colorMaster = null
const DEFAULT_TEXT_COLOR = '#2c3e50'

/**
 * 色マスタを読み込む
 * @returns {Promise<Object>} 色マスタオブジェクト
 */
async function loadColorMaster() {
  if (colorMaster) {
    return colorMaster
  }

  try {
    const basePath = import.meta.env.BASE_URL
    const colorMasterPath = `${basePath}data/color-master.json`
    const response = await fetch(colorMasterPath)
    if (!response.ok) {
      console.warn('[AttendanceList] 色マスタの読み込みに失敗しました')
      return null
    }
    const data = await response.json()
    colorMaster = data
    return data
  } catch (error) {
    console.error('[AttendanceList] 色マスタ読み込みエラー:', error)
    return null
  }
}

/**
 * チーム名から文字色を取得
 * @param {string} teamName - チーム名
 * @returns {string} 文字色（HEX形式）
 */
function getTeamTextColor(teamName) {
  if (!colorMaster || !teamName) {
    return DEFAULT_TEXT_COLOR
  }

  const teamColors = colorMaster.colors[teamName]
  if (!teamColors) {
    return DEFAULT_TEXT_COLOR
  }

  return teamColors.text || DEFAULT_TEXT_COLOR
}

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
  const [memoStates, setMemoStates] = useState({}) // { [planId]: memoText }
  const [savingMemo, setSavingMemo] = useState({}) // { [planId]: boolean }
  const [colorMasterLoaded, setColorMasterLoaded] = useState(false) // 色マスタ読み込み完了フラグ

  // 観戦予定を読み込む
  useEffect(() => {
    const initialize = async () => {
      // 色マスタを先に読み込む（完了を待つ）
      await loadColorMaster()
      setColorMasterLoaded(true)
      // 観戦予定を読み込む
      await loadAttendancePlans()
    }
    initialize()
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
      // メモ状態を初期化（既存のメモを状態に反映）
      const initialMemoStates = {}
      sorted.forEach(({ plan }) => {
        initialMemoStates[plan.id] = plan.memo || ''
      })
      setMemoStates(prev => ({ ...prev, ...initialMemoStates }))
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
      // メモ状態もクリア
      setMemoStates(prev => {
        const newStates = { ...prev }
        delete newStates[planId]
        return newStates
      })
    } catch (error) {
      alert(`観戦予定の削除に失敗しました: ${error.message}`)
    } finally {
      setDeleting(prev => ({ ...prev, [planId]: false }))
    }
  }

  /**
   * メモを保存
   */
  const handleMemoSave = async (planId, memoText) => {
    try {
      setSavingMemo(prev => ({ ...prev, [planId]: true }))
      // 空文字列や空白のみの場合はnullに変換
      const memo = memoText && memoText.trim() ? memoText.trim() : null
      await updateAttendancePlan(planId, { memo })
      // メモ状態を更新
      setMemoStates(prev => ({
        ...prev,
        [planId]: memo || ''
      }))
      // 一覧を再読み込み
      await loadAttendancePlans()
    } catch (error) {
      console.error('メモの保存エラー:', error)
      alert(`メモの保存に失敗しました: ${error.message}`)
    } finally {
      setSavingMemo(prev => ({ ...prev, [planId]: false }))
    }
  }

  /**
   * メモ入力欄の値を変更
   */
  const handleMemoChange = (planId, value) => {
    // 最大20文字に制限
    const truncatedValue = value.length > 20 ? value.slice(0, 20) : value
    setMemoStates(prev => ({
      ...prev,
      [planId]: truncatedValue
    }))
  }

  /**
   * 応援クラブを変更
   */
  const handleSupportingTeamChange = async (planId, teamType) => {
    // スクロール位置を保存
    const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
    
    try {
      const plan = attendancePlans.find(({ plan }) => plan.id === planId)?.plan
      if (!plan) return

      // 現在の応援クラブを取得
      const currentSupportingTeam = plan.supportingTeam

      // 同じチームを選択した場合は選択解除（中立）、そうでなければ切り替え
      const newSupportingTeam = currentSupportingTeam === teamType ? null : teamType

      // 更新
      await updateAttendancePlan(planId, { supportingTeam: newSupportingTeam })
      
      // 一覧を再読み込み
      await loadAttendancePlans()
      
      // スクロール位置を復元
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition)
      })
    } catch (error) {
      console.error('応援クラブの更新エラー:', error)
      alert(`応援クラブの更新に失敗しました: ${error.message}`)
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
      {/* 見出しとコントロールを固定表示 */}
      <div className="attendance-header-sticky">
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
                  <button
                    className={`home-team-button ${plan.supportingTeam === 'home' ? 'selected' : ''}`}
                    style={{ 
                      color: plan.supportingTeam === 'home' ? '#fff' : getTeamTextColor(match.homeTeam),
                      backgroundColor: plan.supportingTeam === 'home' ? getTeamTextColor(match.homeTeam) : 'transparent'
                    }}
                    onClick={isEditMode ? (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSupportingTeamChange(plan.id, 'home')
                    } : undefined}
                    disabled={!isEditMode}
                    type="button"
                  >
                    {match.homeTeam}
                  </button>
                  <span className="vs">vs</span>
                  <button
                    className={`away-team-button ${plan.supportingTeam === 'away' ? 'selected' : ''}`}
                    style={{ 
                      color: plan.supportingTeam === 'away' ? '#fff' : getTeamTextColor(match.awayTeam),
                      backgroundColor: plan.supportingTeam === 'away' ? getTeamTextColor(match.awayTeam) : 'transparent'
                    }}
                    onClick={isEditMode ? (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSupportingTeamChange(plan.id, 'away')
                    } : undefined}
                    disabled={!isEditMode}
                    type="button"
                  >
                    {match.awayTeam}
                  </button>
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

                {/* メモ表示/編集欄 */}
                <div className="attendance-memo">
                  {isEditMode ? (
                    // 編集モード: テキストボックスとして表示
                    <>
                      <input
                        type="text"
                        className="memo-input"
                        placeholder="ひとことメモを入力...（最大20文字）"
                        value={memoStates[plan.id] !== undefined ? memoStates[plan.id] : (plan.memo || '')}
                        onChange={(e) => {
                          handleMemoChange(plan.id, e.target.value)
                        }}
                        onBlur={(e) => {
                          const currentMemo = plan.memo || ''
                          const newMemo = memoStates[plan.id] !== undefined ? memoStates[plan.id] : ''
                          if (currentMemo !== newMemo) {
                            handleMemoSave(plan.id, newMemo)
                          }
                        }}
                        maxLength={20}
                        disabled={savingMemo[plan.id]}
                      />
                      {savingMemo[plan.id] && (
                        <span className="memo-saving-indicator">保存中...</span>
                      )}
                    </>
                  ) : (
                    // 閲覧モード: テキストとして表示（メモがない場合は非表示）
                    plan.memo && (
                      <div className="memo-display">
                        {plan.memo}
                      </div>
                    )
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
