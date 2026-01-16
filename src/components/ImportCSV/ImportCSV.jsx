import React, { useState } from 'react'
import { parseCSV } from '../../services/csvParser.js'
import { createMatches } from '../../services/matchService.js'
import { combineDateTime } from '../../utils/dateUtils.js'
import { isValidDateFormat, isValidTimeFormat, isRequired } from '../../utils/validation.js'
import { Match } from '../../models/Match.js'
import './ImportCSV.css'

/**
 * ImportCSVコンポーネント
 * CSVファイルをインポートする機能を提供
 */
function ImportCSV() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  
  // 手動追加モーダルの状態管理
  const [showManualModal, setShowManualModal] = useState(false)
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

  /**
   * ファイル選択ハンドラ
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // CSVファイルかどうかチェック
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
      // CSVパース
      const parseResult = await parseCSV(file)

      // エラーがある場合
      if (parseResult.errors.length > 0) {
        setError(`エラーが${parseResult.errors.length}件発生しました。詳細を確認してください。`)
        setResult(parseResult)
        setLoading(false)
        return
      }

      // マッチがない場合
      if (parseResult.matches.length === 0) {
        setError('インポートできる試合予定がありませんでした')
        setResult(parseResult)
        setLoading(false)
        return
      }

      // 試合予定を保存
      const saveResult = await createMatches(parseResult.matches.map(m => m.toJSON()))

      // 結果を設定
      setResult({
        ...parseResult,
        saveResult
      })

      // 成功メッセージ
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
   * ファイル選択をリセット
   */
  const handleReset = () => {
    setFile(null)
    setError(null)
    setResult(null)
    // ファイル入力もリセット
    const fileInput = document.getElementById('csv-file-input')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  /**
   * UUIDを生成（簡易版）
   * @returns {string} UUID文字列
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
    // 入力時にエラーをクリア
    if (manualError) {
      setManualError(null)
    }
    if (manualSuccess) {
      setManualSuccess(false)
    }
  }

  /**
   * 手動追加のバリデーション
   * @param {Object} formData - フォームデータ
   * @returns {Object} { valid: boolean, error: string|null, warning: string|null }
   */
  const validateManualForm = (formData) => {
    // Dateが「未定」の場合は警告
    if (formData.Date === '未定' || (formData.Date && formData.Date.trim() === '未定')) {
      return {
        valid: false,
        error: null,
        warning: 'Dateが「未定」のため、登録できません'
      }
    }

    // 必須フィールドチェック
    if (!isRequired(formData.Date)) {
      return {
        valid: false,
        error: 'Dateは必須です',
        warning: null
      }
    }

    if (!isRequired(formData.Kickoff)) {
      return {
        valid: false,
        error: 'Kickoffは必須です',
        warning: null
      }
    }

    if (!isRequired(formData.Home)) {
      return {
        valid: false,
        error: 'Homeは必須です',
        warning: null
      }
    }

    if (!isRequired(formData.Away)) {
      return {
        valid: false,
        error: 'Awayは必須です',
        warning: null
      }
    }

    // 日付形式チェック
    if (!isValidDateFormat(formData.Date)) {
      return {
        valid: false,
        error: 'Dateは有効な日付形式（YYYY-MM-DD）である必要があります',
        warning: null
      }
    }

    // キックオフ時間チェック
    if (!isValidTimeFormat(formData.Kickoff)) {
      return {
        valid: false,
        error: 'Kickoffは有効な時間形式（HH:MM）または「未定」である必要があります',
        warning: null
      }
    }

    // 文字列長チェック
    if (formData.Home.trim() === '') {
      return {
        valid: false,
        error: 'Homeは空文字列であってはなりません',
        warning: null
      }
    }

    if (formData.Away.trim() === '') {
      return {
        valid: false,
        error: 'Awayは空文字列であってはなりません',
        warning: null
      }
    }

    // 日時結合
    const dateTime = combineDateTime(formData.Date, formData.Kickoff)
    
    // 日時妥当性チェック（Kickoffが「未定」でない場合）
    if (formData.Kickoff !== '未定' && dateTime === null) {
      return {
        valid: false,
        error: 'DateとKickoffを結合した日時が無効です',
        warning: null
      }
    }

    return {
      valid: true,
      error: null,
      warning: null
    }
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
      // バリデーション
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

      // 日時結合
      const dateTime = combineDateTime(manualFormData.Date, manualFormData.Kickoff)

      // Matchオブジェクトを作成
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

      // 保存
      const saveResult = await createMatches([matchData])

      if (saveResult.errors.length > 0) {
        setManualError(`登録エラー: ${saveResult.errors[0].error}`)
      } else {
        setManualSuccess(true)
        // 3秒後にモーダルを閉じる
        setTimeout(() => {
          handleCloseManualModal()
          // ページをリロードして最新のデータを表示（オプション）
          // window.location.reload()
        }, 2000)
      }

    } catch (err) {
      setManualError(`登録エラー: ${err.message}`)
    } finally {
      setManualLoading(false)
    }
  }

  return (
    <div className="import-csv">
      <h2>CSVファイルインポート</h2>
      
      <div className="import-csv-form">
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
          <button
            onClick={handleReset}
            disabled={loading}
            className="btn btn-secondary"
          >
            リセット
          </button>
          <button
            onClick={handleOpenManualModal}
            disabled={loading || manualLoading}
            className="btn btn-primary"
          >
            手動で追加
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>エラー:</strong> {error}
        </div>
      )}

      {result && (
        <div className="import-result">
          <h3>インポート結果</h3>
          
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
              <h4>エラー詳細</h4>
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
              <h4>警告詳細</h4>
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
              <h4>保存エラー</h4>
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

      {/* 手動追加モーダル */}
      {showManualModal && (
        <div className="manual-modal-overlay" onClick={handleCloseManualModal}>
          <div className="manual-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="manual-modal-header">
              <h3>試合予定を手動で追加</h3>
              <button className="manual-modal-close" onClick={handleCloseManualModal}>×</button>
            </div>

            <form className="manual-form" onSubmit={handleManualSubmit}>
              <div className="manual-form-body">
                {/* Group（任意） */}
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

                {/* Round（任意） */}
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

                {/* Date（必須） */}
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

                {/* Kickoff（必須） */}
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

                {/* Home（必須） */}
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

                {/* Away（必須） */}
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

                {/* Stadium（任意） */}
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

                {/* Broadcast（任意） */}
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

                {/* Etc（任意） */}
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

              <div className="manual-modal-footer">
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
    </div>
  )
}

export default ImportCSV
