import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { manifestBasePath } from './vite-plugin-manifest.js'

// GitHub Pages用のbaseパス設定
// リポジトリ名: calender_app_j123
// GitHub Actionsの環境変数から自動取得、または手動で設定
function getBasePath() {
  // GitHub Actions環境の場合
  if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1]
    return `/${repoName}/`
  }
  // 環境変数で指定されている場合
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH
  }
  // デフォルト（カスタムドメインやルートパスの場合）
  return '/'
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    manifestBasePath() // manifest.jsonのbaseパスを動的に設定
  ],
  base: getBasePath(),
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
