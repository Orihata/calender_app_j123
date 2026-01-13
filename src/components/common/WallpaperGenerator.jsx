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
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')

  /**
   * 画像を生成
   */
  const handleGenerate = async () => {
    try {
      setGenerating(true)
      setError(null)
      setPreviewUrl(null)

      // 現地観戦のみフィルタリング
      const venuePlans = plansWithMatches.filter(({ plan }) => plan.category === 'venue')

      if (venuePlans.length === 0) {
        setError('現地観戦予定がありません。')
        return
      }

      // 画像を生成
      const blob = await generateWallpaperImage(venuePlans, backgroundColor)
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
          <h3>待受画面画像生成</h3>
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
