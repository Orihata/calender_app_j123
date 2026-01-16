import React, { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Calendar from './components/Calendar/Calendar.jsx'
import ImportCSV from './components/ImportCSV/ImportCSV.jsx'
import AttendanceList from './components/AttendanceList/AttendanceList.jsx'
import Settings from './components/Settings/Settings.jsx'
import { loadMasterData } from './services/masterDataService.js'
import { getAllMatches, createMatches } from './services/matchService.js'
import './App.css'

function App() {
  const [masterDataLoaded, setMasterDataLoaded] = useState(false)

  // アプリ起動時にマスタデータを自動読み込み
  useEffect(() => {
    const initializeMasterData = async () => {
      try {
        // 既存の試合予定を確認
        const existingMatches = await getAllMatches()
        
        // 既にデータがある場合はスキップ（オプション: ユーザーが手動でインポートした場合）
        // マスタデータを強制的に読み込む場合は、このチェックを削除
        if (existingMatches.length === 0) {
          console.log('[App] マスタデータを自動読み込み中...')
          const masterMatches = await loadMasterData()
          
          if (masterMatches.length > 0) {
            // マスタデータをインポート
            const result = await createMatches(masterMatches.map(m => m))
            console.log(`[App] マスタデータを読み込みました: ${result.success.length}件`)
            if (result.errors.length > 0) {
              console.warn(`[App] エラー: ${result.errors.length}件`)
            }
          }
        } else {
          console.log('[App] 既存の試合予定データがあるため、マスタデータの自動読み込みをスキップしました')
        }
      } catch (error) {
        console.error('[App] マスタデータの自動読み込みエラー:', error)
        // エラーが発生してもアプリは動作を継続
      } finally {
        setMasterDataLoaded(true)
      }
    }

    initializeMasterData()
  }, [])

  // Service Workerの登録
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // baseパスを考慮したService Workerの登録
        const swPath = import.meta.env.BASE_URL + 'sw.js'
        navigator.serviceWorker.register(swPath)
          .then((registration) => {
            console.log('[App] Service Worker登録成功:', registration.scope)
          })
          .catch((error) => {
            console.error('[App] Service Worker登録エラー:', error)
          })
      })
    }
  }, [])

  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <h1>サッカー試合予定カレンダー</h1>
          <Nav />
        </header>
        <main className="app-main">
          {!masterDataLoaded && (
            <div className="loading-indicator">
              <p>データを読み込み中...</p>
            </div>
          )}
          <Routes>
            <Route path="/" element={<Calendar />} />
            <Route path="/import" element={<ImportCSV />} />
            <Route path="/attendance" element={<AttendanceList />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

/**
 * ナビゲーションコンポーネント
 */
function Nav() {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }
  
  const closeMenu = () => {
    setIsMenuOpen(false)
  }
  
  return (
    <nav className="app-nav">
      <button 
        className="hamburger-menu"
        onClick={toggleMenu}
        aria-label="メニューを開く"
      >
        <span className="hamburger-icon"></span>
        <span className="hamburger-icon"></span>
        <span className="hamburger-icon"></span>
      </button>
      <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
        <Link 
          to="/" 
          className={location.pathname === '/' ? 'active' : ''}
          onClick={closeMenu}
        >
          カレンダー
        </Link>
        <Link 
          to="/import" 
          className={location.pathname === '/import' ? 'active' : ''}
          onClick={closeMenu}
        >
          データ編集
        </Link>
        <Link 
          to="/attendance" 
          className={location.pathname === '/attendance' ? 'active' : ''}
          onClick={closeMenu}
        >
          観戦予定
        </Link>
        <Link 
          to="/settings" 
          className={location.pathname === '/settings' ? 'active' : ''}
          onClick={closeMenu}
        >
          設定
        </Link>
      </div>
      <div className={`nav-overlay ${isMenuOpen ? 'active' : ''}`} onClick={closeMenu}></div>
    </nav>
  )
}

export default App
