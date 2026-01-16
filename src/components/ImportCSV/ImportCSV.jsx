import React, { useState } from 'react'
import { parseCSV } from '../../services/csvParser.js'
import { createMatches, getAllMatches, deleteMatches } from '../../services/matchService.js'
import { combineDateTime } from '../../utils/dateUtils.js'
import { isValidDateFormat, isValidTimeFormat, isRequired } from '../../utils/validation.js'
import { Match } from '../../models/Match.js'
import './ImportCSV.css'

/**
 * ImportCSVコンポーネント（データ編集画面）
 * CSVインポート、手動登録、削除機能を提供
 */
function ImportCSV() {
  // モーダル表示状態
  const [showCsvModal, setShowCsvModal] = useState(false)
  const [showManualModal, setShowManualModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // CSVインポート関連の状態
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // 手動追加モーダルの状態管理
  const [manualFormData, setManualFormData] = useState({
    Group: '',
    Round: '',
    Date: '',
    Kickoff: '',
    Home: '',
    Away: '',
    Stadium: '',
    Broadcast: '',
    Etc: ''
  })
  const [manualLoading, setManualLoading] = useState(false)
  const [manualError, setManualError] = useState(null)
  const [manualSuccess, setManualSuccess] = useState(false)

  // 削除モーダルの状態管理
  const [matches, setMatches] = useState([])
  const [selectedMatchIds, setSelectedMatchIds] = useState(new Set())
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [detailModal, setDetailModal] = useState(null) // 詳細情報モーダル用

  /**
   * 試合予定一覧を読み込む
   */
  const loadMatches = async () => {
    try {
      const allMatches = await getAllMatches()
      // 日付順にソート（dateTimeがnullの場合は最後に）
      const sortedMatches = [...allMatches].sort((a, b) => {
        if (!a.dateTime && !b.dateTime) return 0
        if (!a.dateTime) return 1
        if (!b.dateTime) return -1
        return new Date(a.dateTime) - new Date(b.dateTime)
      })
      setMatches(sortedMatches)
    } catch (err) {
      console.error('試合予定の読み込みエラー:', err)
    }
  }

  /**
   * CSVインポートモーダルを開く
   */
  const handleOpenCsvModal = () => {
    setShowCsvModal(true)
    setFile(null)
    setError(null)
    setResult(null)
  }

  /**
   * CSVインポートモーダルを閉じる
   */
  const handleCloseCsvModal = () => {
    setShowCsvModal(false)
    setFile(null)
    setError(null)
    setResult(null)
    const fileInput = document.getElementById('csv-file-input')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  /**
   * ファイル選択ハンドラ
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('CSVファイルを選択してください')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
      setResult(null)
    }
  }

  /**
   * CSVインポート実行
   */
  const handleImport = async () => {
    if (!file) {
      setError('ファイルを選択してください')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const parseResult = await parseCSV(file)

      if (parseResult.errors.length > 0) {
        setError(`エラーが${parseResult.errors.length}件発生しました。詳細を確認してください。`)
        setResult(parseResult)
        setLoading(false)
        return
      }

      if (parseResult.matches.length === 0) {
        setError('インポートできる試合予定がありませんでした')
        setResult(parseResult)
        setLoading(false)
        return
      }

      const saveResult = await createMatches(parseResult.matches.map(m => m.toJSON()))

      setResult({
        ...parseResult,
        saveResult
      })

      if (saveResult.errors.length === 0) {
        setError(null)
      } else {
        setError(`${saveResult.success.length}件の試合予定をインポートしましたが、${saveResult.errors.length}件でエラーが発生しました`)
      }

    } catch (err) {
      setError(`インポートエラー: ${err.message}`)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }


  /**
   * UUIDを生成（簡易版）
   */
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * 手動追加モーダルを開く
   */
  const handleOpenManualModal = () => {
    setShowManualModal(true)
    setManualError(null)
    setManualSuccess(false)
    setManualFormData({
      Group: '',
      Round: '',
      Date: '',
      Kickoff: '',
      Home: '',
      Away: '',
      Stadium: '',
      Broadcast: '',
      Etc: ''
    })
  }

  /**
   * 手動追加モーダルを閉じる
   */
  const handleCloseManualModal = () => {
    setShowManualModal(false)
    setManualError(null)
    setManualSuccess(false)
    setManualFormData({
      Group: '',
      Round: '',
      Date: '',
      Kickoff: '',
      Home: '',
      Away: '',
      Stadium: '',
      Broadcast: '',
      Etc: ''
    })
  }

  /**
   * 手動追加フォームの入力変更ハンドラ
   */
  const handleManualFormChange = (e) => {
    const { name, value } = e.target
    setManualFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (manualError) {
      setManualError(null)
    }
    if (manualSuccess) {
      setManualSuccess(false)
    }
  }

  /**
   * 手動追加のバリデーション
   */
  const validateManualForm = (formData) => {
    if (formData.Date === '未定' || (formData.Date && formData.Date.trim() === '未定')) {
      return {
        valid: false,
        error: null,
        warning: 'Dateが「未定」のため、登録できません'
      }
    }

    if (!isRequired(formData.Date)) {
      return { valid: false, error: 'Dateは必須です', warning: null }
    }

    if (!isRequired(formData.Kickoff)) {
      return { valid: false, error: 'Kickoffは必須です', warning: null }
    }

    if (!isRequired(formData.Home)) {
      return { valid: false, error: 'Homeは必須です', warning: null }
    }

    if (!isRequired(formData.Away)) {
      return { valid: false, error: 'Awayは必須です', warning: null }
    }

    if (!isValidDateFormat(formData.Date)) {
      return { valid: false, error: 'Dateは有効な日付形式（YYYY-MM-DD）である必要があります', warning: null }
    }

    if (!isValidTimeFormat(formData.Kickoff)) {
      return { valid: false, error: 'Kickoffは有効な時間形式（HH:MM）または「未定」である必要があります', warning: null }
    }

    if (formData.Home.trim() === '') {
      return { valid: false, error: 'Homeは空文字列であってはなりません', warning: null }
    }

    if (formData.Away.trim() === '') {
      return { valid: false, error: 'Awayは空文字列であってはなりません', warning: null }
    }

    const dateTime = combineDateTime(formData.Date, formData.Kickoff)
    
    if (formData.Kickoff !== '未定' && dateTime === null) {
      return { valid: false, error: 'DateとKickoffを結合した日時が無効です', warning: null }
    }

    return { valid: true, error: null, warning: null }
  }

  /**
   * 手動追加の登録処理
   */
  const handleManualSubmit = async (e) => {
    e.preventDefault()

    setManualLoading(true)
    setManualError(null)
    setManualSuccess(false)

    try {
      const validation = validateManualForm(manualFormData)
      
      if (validation.warning) {
        setManualError(validation.warning)
        setManualLoading(false)
        return
      }

      if (!validation.valid) {
        setManualError(validation.error)
        setManualLoading(false)
        return
      }

      const dateTime = combineDateTime(manualFormData.Date, manualFormData.Kickoff)

      const now = new Date().toISOString()
      const matchData = {
        id: generateUUID(),
        dateTime: dateTime,
        date: manualFormData.Date,
        kickoff: manualFormData.Kickoff,
        homeTeam: manualFormData.Home.trim(),
        awayTeam: manualFormData.Away.trim(),
        venue: manualFormData.Stadium ? manualFormData.Stadium.trim() : null,
        group: manualFormData.Group ? manualFormData.Group.trim() : null,
        round: manualFormData.Round ? String(manualFormData.Round).trim() : null,
        broadcast: manualFormData.Broadcast ? manualFormData.Broadcast.trim() : null,
        additionalInfo: manualFormData.Etc ? manualFormData.Etc.trim() : null,
        createdAt: now,
        updatedAt: now
      }

      const saveResult = await createMatches([matchData])

      if (saveResult.errors.length > 0) {
        setManualError(`登録エラー: ${saveResult.errors[0].error}`)
      } else {
        setManualSuccess(true)
        setTimeout(() => {
          handleCloseManualModal()
        }, 2000)
      }

    } catch (err) {
      setManualError(`登録エラー: ${err.message}`)
    } finally {
      setManualLoading(false)
    }
  }

  /**
   * 削除モーダルを開く
   */
  const handleOpenDeleteModal = async () => {
    setShowDeleteModal(true)
    setSelectedMatchIds(new Set())
    setDeleteError(null)
    await loadMatches()
  }

  /**
   * 削除モーダルを閉じる
   */
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false)
    setSelectedMatchIds(new Set())
    setDeleteError(null)
  }

  /**
   * チェックボックスの変更ハンドラ
   */
  const handleCheckboxChange = (matchId) => {
    setSelectedMatchIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(matchId)) {
        newSet.delete(matchId)
      } else {
        newSet.add(matchId)
      }
      return newSet
    })
  }

  /**
   * 全選択/全解除
   */
  const handleSelectAll = () => {
    if (selectedMatchIds.size === matches.length) {
      setSelectedMatchIds(new Set())
    } else {
      setSelectedMatchIds(new Set(matches.map(m => m.id)))
    }
  }

  /**
   * 選択した試合を削除
   */
  const handleDeleteSelected = async () => {
    if (selectedMatchIds.size === 0) {
      setDeleteError('削除する試合を選択してください')
      return
    }

    const selectedMatches = matches.filter(m => selectedMatchIds.has(m.id))
    const matchInfo = selectedMatches.slice(0, 3).map(m => `${m.homeTeam} vs ${m.awayTeam} (${m.date})`).join('\n')
    const confirmMessage = `以下の${selectedMatchIds.size}件の試合予定を削除しますか？\n\n${matchInfo}${selectedMatches.length > 3 ? '\n...' : ''}\n\nこの操作は取り消せません。`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const ids = Array.from(selectedMatchIds)
      const deleteResult = await deleteMatches(ids)

      if (deleteResult.errors.length > 0) {
        setDeleteError(`${deleteResult.success}件の削除に成功しましたが、${deleteResult.errors.length}件でエラーが発生しました`)
      } else {
        setSelectedMatchIds(new Set())
        await loadMatches()
      }
    } catch (err) {
      setDeleteError(`削除エラー: ${err.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="import-csv">
      <h2>データ編集</h2>
      
      {/* トップページ：選択ボタン */}
      <div className="data-edit-top">
        <div className="top-button-group">
          <button
            onClick={handleOpenCsvModal}
            className="btn btn-primary btn-large"
          >
            予定の一括登録(CSV)
          </button>
          <button
            onClick={handleOpenManualModal}
            className="btn btn-primary btn-large"
          >
            予定の手動登録
          </button>
          <button
            onClick={handleOpenDeleteModal}
            className="btn btn-primary btn-large"
          >
            予定の削除
          </button>
        </div>
      </div>

      {/* CSVインポートモーダル */}
      {showCsvModal && (
        <div className="modal-overlay" onClick={handleCloseCsvModal}>
          <div className="modal-content csv-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>予定の一括登録(CSV)</h3>
              <button className="modal-close" onClick={handleCloseCsvModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="file-input-group">
                <label htmlFor="csv-file-input">CSVファイルを選択:</label>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={loading}
                />
                {file && (
                  <div className="file-info">
                    <span>選択されたファイル: {file.name}</span>
                    <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                  </div>
                )}
              </div>

              <div className="button-group">
                <button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="btn btn-primary"
                >
                  {loading ? 'インポート中...' : 'インポート実行'}
                </button>
              </div>

              {error && (
                <div className="error-message">
                  <strong>エラー:</strong> {error}
                </div>
              )}

              {result && (
                <div className="import-result">
                  <h4>インポート結果</h4>
                  
                  <div className="result-summary">
                    <div className="summary-item success">
                      <span className="label">成功:</span>
                      <span className="value">{result.saveResult ? result.saveResult.success.length : result.matches.length}件</span>
                    </div>
                    {result.errors.length > 0 && (
                      <div className="summary-item error">
                        <span className="label">エラー:</span>
                        <span className="value">{result.errors.length}件</span>
                      </div>
                    )}
                    {result.warnings.length > 0 && (
                      <div className="summary-item warning">
                        <span className="label">警告:</span>
                        <span className="value">{result.warnings.length}件</span>
                      </div>
                    )}
                  </div>

                  {result.errors.length > 0 && (
                    <div className="error-list">
                      <h5>エラー詳細</h5>
                      <ul>
                        {result.errors.map((err, index) => (
                          <li key={index}>
                            <strong>行 {err.row}:</strong> {err.message}
                            {err.field && <span> (フィールド: {err.field})</span>}
                            {err.data && <div className="error-data">{err.data}</div>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.warnings.length > 0 && (
                    <div className="warning-list">
                      <h5>警告詳細</h5>
                      <ul>
                        {result.warnings.map((warn, index) => (
                          <li key={index}>
                            <strong>行 {warn.row}:</strong> {warn.message}
                            {warn.field && <span> (フィールド: {warn.field})</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.saveResult && result.saveResult.errors.length > 0 && (
                    <div className="save-error-list">
                      <h5>保存エラー</h5>
                      <ul>
                        {result.saveResult.errors.map((err, index) => (
                          <li key={index}>
                            <strong>エラー:</strong> {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={handleCloseCsvModal}
                className="btn btn-secondary"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 手動追加モーダル */}
      {showManualModal && (
        <div className="modal-overlay" onClick={handleCloseManualModal}>
          <div className="modal-content manual-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>試合予定を手動で追加</h3>
              <button className="modal-close" onClick={handleCloseManualModal}>×</button>
            </div>

            <form className="manual-form" onSubmit={handleManualSubmit}>
              <div className="modal-body manual-form-body">
                <div className="form-group">
                  <label htmlFor="manual-group">
                    Group <span className="field-optional">（任意）</span>
                  </label>
                  <input
                    id="manual-group"
                    type="text"
                    name="Group"
                    value={manualFormData.Group}
                    onChange={handleManualFormChange}
                    placeholder="例: EAST, WEST"
                    disabled={manualLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manual-round">
                    Round <span className="field-optional">（任意）</span>
                  </label>
                  <input
                    id="manual-round"
                    type="text"
                    name="Round"
                    value={manualFormData.Round}
                    onChange={handleManualFormChange}
                    placeholder="例: 1"
                    disabled={manualLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manual-date">
                    Date <span className="field-required">*</span>
                  </label>
                  <input
                    id="manual-date"
                    type="text"
                    name="Date"
                    value={manualFormData.Date}
                    onChange={handleManualFormChange}
                    placeholder="YYYY-MM-DD（例: 2026-02-06）"
                    disabled={manualLoading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manual-kickoff">
                    Kickoff <span className="field-required">*</span>
                  </label>
                  <input
                    id="manual-kickoff"
                    type="text"
                    name="Kickoff"
                    value={manualFormData.Kickoff}
                    onChange={handleManualFormChange}
                    placeholder="HH:MM（例: 19:00）または「未定」"
                    disabled={manualLoading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manual-home">
                    Home <span className="field-required">*</span>
                  </label>
                  <input
                    id="manual-home"
                    type="text"
                    name="Home"
                    value={manualFormData.Home}
                    onChange={handleManualFormChange}
                    placeholder="ホームチーム名"
                    disabled={manualLoading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manual-away">
                    Away <span className="field-required">*</span>
                  </label>
                  <input
                    id="manual-away"
                    type="text"
                    name="Away"
                    value={manualFormData.Away}
                    onChange={handleManualFormChange}
                    placeholder="アウェイチーム名"
                    disabled={manualLoading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manual-stadium">
                    Stadium <span className="field-optional">（任意）</span>
                  </label>
                  <input
                    id="manual-stadium"
                    type="text"
                    name="Stadium"
                    value={manualFormData.Stadium}
                    onChange={handleManualFormChange}
                    placeholder="スタジアム名"
                    disabled={manualLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manual-broadcast">
                    Broadcast <span className="field-optional">（任意）</span>
                  </label>
                  <input
                    id="manual-broadcast"
                    type="text"
                    name="Broadcast"
                    value={manualFormData.Broadcast}
                    onChange={handleManualFormChange}
                    placeholder="放送局情報"
                    disabled={manualLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="manual-etc">
                    Etc <span className="field-optional">（任意）</span>
                  </label>
                  <input
                    id="manual-etc"
                    type="text"
                    name="Etc"
                    value={manualFormData.Etc}
                    onChange={handleManualFormChange}
                    placeholder="その他の情報"
                    disabled={manualLoading}
                  />
                </div>

                {manualError && (
                  <div className="manual-error-message">
                    <strong>エラー:</strong> {manualError}
                  </div>
                )}

                {manualSuccess && (
                  <div className="manual-success-message">
                    <strong>成功:</strong> 試合予定を登録しました
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleCloseManualModal}
                  disabled={manualLoading}
                  className="btn btn-secondary"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="btn btn-primary"
                >
                  {manualLoading ? '登録中...' : '登録'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 削除モーダル */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCloseDeleteModal}>
          <div className="modal-content delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>予定の削除</h3>
              <button className="modal-close" onClick={handleCloseDeleteModal}>×</button>
            </div>

            <div className="modal-body">
              {matches.length === 0 ? (
                <div className="empty-message">
                  <p>登録されている試合予定がありません</p>
                </div>
              ) : (
                <>
                  <div className="delete-controls">
                    <button
                      onClick={handleSelectAll}
                      className="btn btn-secondary btn-small"
                    >
                      {selectedMatchIds.size === matches.length ? '全解除' : '全選択'}
                    </button>
                    <span className="selected-count">
                      選択中: {selectedMatchIds.size}件 / {matches.length}件
                    </span>
                  </div>

                  <div className="match-list-container">
                    <ul className="match-delete-list">
                      {matches.map(match => {
                        // 詳細情報があるかチェック
                        const hasDetails = match.venue || match.group || match.round || match.broadcast || match.additionalInfo
                        
                        return (
                          <li key={match.id} className={selectedMatchIds.has(match.id) ? 'delete-list-item selected' : 'delete-list-item'}>
                            <div className="delete-item-row">
                              <label className="delete-checkbox-wrapper">
                                <input
                                  type="checkbox"
                                  checked={selectedMatchIds.has(match.id)}
                                  onChange={() => handleCheckboxChange(match.id)}
                                  className="delete-checkbox-input"
                                />
                              </label>
                              <div className="delete-match-content">
                                <span className="delete-match-date">{match.date}</span>
                                {match.kickoff && (
                                  <span className="delete-match-time">{match.kickoff}</span>
                                )}
                                <span className="delete-match-teams">
                                  {match.homeTeam} vs {match.awayTeam}
                                </span>
                              </div>
                              {hasDetails && (
                                <button
                                  className="delete-detail-btn"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setDetailModal(match)
                                  }}
                                  title="詳細情報"
                                  type="button"
                                >
                                  <span className="delete-detail-icon">i</span>
                                </button>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {deleteError && (
                    <div className="error-message">
                      <strong>エラー:</strong> {deleteError}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="btn btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedMatchIds.size === 0 || deleteLoading}
                className="btn btn-danger"
              >
                {deleteLoading ? '削除中...' : `選択した試合を削除 (${selectedMatchIds.size}件)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳細情報モーダル */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal-content detail-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>試合詳細情報</h3>
              <button className="modal-close" onClick={() => setDetailModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-info">
                <div className="detail-row">
                  <span className="detail-label">日付:</span>
                  <span className="detail-value">{detailModal.date}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">キックオフ:</span>
                  <span className="detail-value">{detailModal.kickoff || '未定'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">ホーム:</span>
                  <span className="detail-value">{detailModal.homeTeam}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">アウェイ:</span>
                  <span className="detail-value">{detailModal.awayTeam}</span>
                </div>
                {detailModal.venue && (
                  <div className="detail-row">
                    <span className="detail-label">会場:</span>
                    <span className="detail-value">{detailModal.venue}</span>
                  </div>
                )}
                {detailModal.group && (
                  <div className="detail-row">
                    <span className="detail-label">グループ:</span>
                    <span className="detail-value">{detailModal.group}</span>
                  </div>
                )}
                {detailModal.round && (
                  <div className="detail-row">
                    <span className="detail-label">ラウンド:</span>
                    <span className="detail-value">{detailModal.round}</span>
                  </div>
                )}
                {detailModal.broadcast && (
                  <div className="detail-row">
                    <span className="detail-label">放送:</span>
                    <span className="detail-value">{detailModal.broadcast}</span>
                  </div>
                )}
                {detailModal.additionalInfo && (
                  <div className="detail-row">
                    <span className="detail-label">その他:</span>
                    <span className="detail-value">{detailModal.additionalInfo}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="btn btn-secondary"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportCSV
