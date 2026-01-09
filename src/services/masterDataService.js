/**
 * MasterDataService
 * マスタデータ（試合予定）の読み込みを行うサービス
 */

/**
 * マスタデータを読み込む
 * @returns {Promise<Array>} 試合予定の配列
 */
export async function loadMasterData() {
  try {
    // baseパスを考慮したパス
    const basePath = import.meta.env.BASE_URL
    const dataPath = `${basePath}data/master-matches.json`
    
    // まずキャッシュから取得を試みる（Service Worker経由）
    if ('caches' in window) {
      const cached = await caches.match(dataPath)
      if (cached) {
        const data = await cached.json()
        console.log('[MasterDataService] マスタデータをキャッシュから読み込みました')
        return data.matches || []
      }
    }

    // キャッシュがない場合はネットワークから取得
    const response = await fetch(dataPath)
    if (!response.ok) {
      throw new Error(`マスタデータの読み込みに失敗しました: ${response.status}`)
    }
    const data = await response.json()
    console.log('[MasterDataService] マスタデータをネットワークから読み込みました')
    return data.matches || []
  } catch (error) {
    console.error('[MasterDataService] マスタデータ読み込みエラー:', error)
    // エラー時は空配列を返す（アプリは動作を継続）
    return []
  }
}

/**
 * マスタデータのバージョンを取得
 * @returns {Promise<string|null>} バージョン文字列。取得できない場合はnull
 */
export async function getMasterDataVersion() {
  try {
    const basePath = import.meta.env.BASE_URL
    const dataPath = `${basePath}data/master-matches.json`
    const response = await fetch(dataPath)
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    return data.version || null
  } catch (error) {
    console.error('[MasterDataService] バージョン取得エラー:', error)
    return null
  }
}
