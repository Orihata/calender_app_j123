import React, { useState, useEffect, useRef } from 'react'
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
  const [layoutType, setLayoutType] = useState('card')
  const [showColorModal, setShowColorModal] = useState(false)

  // 背景色の選択肢（ごくごく淡い7色）
  const backgroundColors = [
    { value: '#FFFFFF', name: '白' },
    { value: '#F0F7FC', name: '淡い青' },
    { value: '#FFF0F5', name: '淡いピンク' },
    { value: '#F0FFF0', name: '淡いグリーン' },
    { value: '#FFFFF0', name: '淡いイエロー' },
    { value: '#F5F0FF', name: '淡いパープル' },
    { value: '#F5F5F5', name: '淡いグレー' }
  ]

  // 現在選択されている色の名前を取得
  const getCurrentColorName = () => {
    const color = backgroundColors.find(c => c.value === backgroundColor)
    return color ? color.name : '白'
  }

  // 色を選択してモーダルを閉じる
  const handleColorSelect = (colorValue) => {
    setBackgroundColor(colorValue)
    setShowColorModal(false)
  }

  // 色選択モーダルの外側をクリックしたときに閉じる
  const colorModalRef = useRef(null)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (colorModalRef.current && !colorModalRef.current.contains(event.target)) {
        setShowColorModal(false)
      }
    }

    if (showColorModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorModal])

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

      // レイアウトタイプに応じた最大試合数をチェック
      const MAX_MATCHES = layoutType === 'stick' ? 39 : 39
      if (venuePlans.length > MAX_MATCHES) {
        setWarning(`${MAX_MATCHES}試合を超える観戦予定があります（全${venuePlans.length}試合）。最初の${MAX_MATCHES}試合のみ表示します。`)
      }

      // 画像を生成（警告があっても続行）
      const blob = await generateWallpaperImage(venuePlans, backgroundColor, coloringPattern, layoutType)
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
              <div className="wallpaper-background-selector">
                <label htmlFor="bg-color">背景色:</label>
                <div className="wallpaper-color-selector-wrapper" ref={colorModalRef}>
                  <button
                    type="button"
                    className="wallpaper-color-preview"
                    style={{ backgroundColor: backgroundColor }}
                    onClick={() => setShowColorModal(!showColorModal)}
                    title={getCurrentColorName()}
                  />
                  {showColorModal && (
                    <div className="wallpaper-color-modal" onClick={(e) => e.stopPropagation()}>
                      <div className="wallpaper-color-options">
                        {backgroundColors.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            className={`wallpaper-color-option ${backgroundColor === color.value ? 'active' : ''}`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => handleColorSelect(color.value)}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="wallpaper-pattern-selector">
                <label htmlFor="layout-type">レイアウトタイプ:</label>
                <select
                  id="layout-type"
                  value={layoutType}
                  onChange={(e) => setLayoutType(e.target.value)}
                >
                  <option value="card">カード</option>
                  <option value="stick">スティック</option>
                </select>
              </div>

              <div className="wallpaper-pattern-selector">
                <label htmlFor="coloring-pattern">カラーリング:</label>
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
