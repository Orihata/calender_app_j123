import React, { useState } from 'react'
import { generateWallpaperImage } from '../../services/imageExportService.js'
import './WallpaperGenerator.css'

/**
 * WallpaperGeneratorコンポーネント
 * 待受画面画像の生成とプレビューを表示
 */
function WallpaperGenerator({ plansWithMatches, onClose }) {
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)
  const [warning, setWarning] = useState(null)
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [coloringPattern, setColoringPattern] = useState('current')

  /**
   * 画像を生成
   */
  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setError(null)
      setWarning(null)
      setPreviewUrl(null)

      // 現地観戦のみフィルタリング
      const venuePlans = plansWithMatches.filter(({ plan }) => plan.category === 'venue')

      if (venuePlans.length === 0) {
        setError('現地観戦予定がありません。')
        return
      }

      // 39試合を超えている場合、警告を表示（画像生成前にチェック）
      const MAX_MATCHES = 39
      if (venuePlans.length > MAX_MATCHES) {
        setWarning(`39試合を超える観戦予定があります（全${venuePlans.length}試合）。最初の39試合のみ表示します。`)
      }

      // 画像を生成（警告があっても続行）
      const blob = await generateWallpaperImage(venuePlans, backgroundColor, coloringPattern)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
    } catch (err) {
      console.error('画像生成エラー:', err)
      setError(`画像の生成に失敗しました: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  /**
   * 画像をダウンロード
   */
  const handleDownload = () => {
    if (!previewUrl) return

    const link = document.createElement('a')
    link.href = previewUrl
    link.download = 'wallpaper_001.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * モーダルを閉じる
   */
  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    onClose()
  }

  return (
    <div className="wallpaper-modal-overlay" onClick={handleClose}>
      <div className="wallpaper-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="wallpaper-modal-header">
          <div className="wallpaper-modal-title-section">
            <h3>待受画面画像生成</h3>
            {warning && (
              <div className="wallpaper-warning-inline">
                {warning}
              </div>
            )}
          </div>
          <button className="wallpaper-modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="wallpaper-modal-body">
          {!previewUrl && (
            <div className="wallpaper-controls">
              <div className="wallpaper-color-picker">
                <label htmlFor="bg-color">背景色:</label>
                <input
                  type="color"
                  id="bg-color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                />
                <span>{backgroundColor}</span>
              </div>

              <div className="wallpaper-pattern-selector">
                <label htmlFor="coloring-pattern">カラーリングパターン:</label>
                <select
                  id="coloring-pattern"
                  value={coloringPattern}
                  onChange={(e) => setColoringPattern(e.target.value)}
                >
                  <option value="current">通常</option>
                  <option value="classic">クラシック</option>
                  <option value="home-based">ホームゲーム</option>
                </select>
              </div>

              <button
                className="wallpaper-generate-button"
                onClick={handleGenerate}
                disabled={generating}
                type="button"
              >
                {generating ? '生成中...' : '画像を生成'}
              </button>
            </div>
          )}

          {error && (
            <div className="wallpaper-error">
              <p>{error}</p>
            </div>
          )}

          {previewUrl && (
            <div className="wallpaper-preview">
              <img src={previewUrl} alt="待受画面プレビュー" />
              <div className="wallpaper-actions">
                <button
                  className="wallpaper-download-button"
                  onClick={handleDownload}
                  type="button"
                >
                  ダウンロード
                </button>
                <button
                  className="wallpaper-regenerate-button"
                  onClick={() => {
                    URL.revokeObjectURL(previewUrl)
                    setPreviewUrl(null)
                    setWarning(null)
                  }}
                  type="button"
                >
                  再生成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WallpaperGenerator
