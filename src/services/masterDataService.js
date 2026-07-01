/**
 * MasterDataService
 * マスタデータ（試合予定）の読み込みを行うサービス
 */

/**
 * マスタデータを読み込む
 * @param {{ preferNetwork?: boolean }} [options]
 * @returns {Promise<Array>} 試合予定の配列
 */
export async function loadMasterData(options = {}) {
  const { preferNetwork = false } = options

  try {
    const basePath = import.meta.env.BASE_URL
    const dataPath = `${basePath}data/master-matches.json`
    const requestUrl = preferNetwork
      ? `${dataPath}?t=${Date.now()}`
      : dataPath

    if (!preferNetwork && 'caches' in window) {
      const cacheKeys = [
        dataPath,
        new URL(dataPath, window.location.origin).href
      ]
      for (const key of cacheKeys) {
        const cached = await caches.match(key)
        if (cached) {
          const data = await cached.json()
          console.log('[MasterDataService] マスタデータをキャッシュから読み込みました')
          return data.matches || []
        }
      }
    }

    const response = await fetch(requestUrl, preferNetwork ? { cache: 'no-store' } : undefined)
    if (!response.ok) {
      throw new Error(`マスタデータの読み込みに失敗しました: ${response.status}`)
    }
    const data = await response.json()
    console.log('[MasterDataService] マスタデータをネットワークから読み込みました')
    return data.matches || []
  } catch (error) {
    console.error('[MasterDataService] マスタデータ読み込みエラー:', error)
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
