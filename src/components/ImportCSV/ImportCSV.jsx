import React, { useState } from 'react'
import { parseCSV } from '../../services/csvParser.js'
import { createMatches } from '../../services/matchService.js'
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
    </div>
  )
}

export default ImportCSV
