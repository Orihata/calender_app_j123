import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Router>
      <div className="App">
        <header>
          <h1>サッカー試合予定カレンダー</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<div>カレンダー表示（実装中）</div>} />
            <Route path="/import" element={<div>CSVインポート（実装中）</div>} />
            <Route path="/attendance" element={<div>観戦予定（実装中）</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
