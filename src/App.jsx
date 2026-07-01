import React, { useEffect, useState } from 'react'
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Calendar from './components/Calendar/Calendar.jsx'
import ImportCSV from './components/ImportCSV/ImportCSV.jsx'
import AttendanceList from './components/AttendanceList/AttendanceList.jsx'
import Settings from './components/Settings/Settings.jsx'
import { ensureCurrentSeasonMasterData } from './services/archiveService.js'
import './App.css'

function App() {
  const [masterDataLoaded, setMasterDataLoaded] = useState(false)

  // アプリ起動時にマスタデータを自動読み込み
  useEffect(() => {
    const initializeMasterData = async () => {
      try {
        const imported = await ensureCurrentSeasonMasterData()
        if (imported > 0) {
          console.log(`[App] マスタデータを取り込みました: ${imported}件`)
        }
      } catch (error) {
        console.error('[App] マスタデータの自動読み込みエラー:', error)
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
