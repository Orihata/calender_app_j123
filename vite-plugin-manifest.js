/**
 * Viteプラグイン: manifest.jsonのbaseパスを動的に設定
 */
import fs from 'fs'
import path from 'path'

export function manifestBasePath() {
  let basePath = '/'
  
  return {
    name: 'manifest-base-path',
    configResolved(config) {
      // baseパスを取得
      basePath = config.base
    },
    closeBundle() {
      // ビルド完了後にmanifest.jsonを処理
      const manifestPath = path.join(process.cwd(), 'dist', 'manifest.json')
      
      if (fs.existsSync(manifestPath)) {
        try {
          const manifestContent = fs.readFileSync(manifestPath, 'utf-8')
          const manifest = JSON.parse(manifestContent)
          
          // start_urlをbaseパスに合わせて更新
          manifest.start_url = basePath
          
          // アイコンパスをbaseパスに合わせて更新
          if (manifest.icons) {
            manifest.icons = manifest.icons.map(icon => ({
              ...icon,
              src: basePath + icon.src.replace(/^\//, '')
            }))
          }
          
          // 更新されたmanifest.jsonを保存
          fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
          console.log(`[manifest-base-path] baseパスを設定: ${basePath}`)
        } catch (error) {
          console.error('[manifest-base-path] manifest.jsonの処理エラー:', error)
        }
      }
    }
  }
}
