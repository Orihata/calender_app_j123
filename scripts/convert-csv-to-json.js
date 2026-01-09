import fs from 'fs'
import Papa from 'papaparse'
import { parse, isValid } from 'date-fns'

/**
 * CSVファイルをJSON形式のマスタデータに変換するスクリプト
 */

const CSV_FILE = 'j_league_schedule_from_website_utf8.csv'
const OUTPUT_FILE = 'public/data/master-matches.json'

// UUID生成関数
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// CSVを読み込んでJSONに変換
const csvContent = fs.readFileSync(CSV_FILE, 'utf-8')

Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    const matches = []
    const errors = []

    results.data.forEach((row, index) => {
      const rowNumber = index + 2 // ヘッダー行を考慮

      // Dateが「未定」の場合はスキップ
      if (row.Date === '未定' || (row.Date && row.Date.trim() === '未定')) {
        return
      }

      // 必須フィールドチェック
      if (!row.Date || !row.Kickoff || !row.Home || !row.Away) {
        errors.push(`行 ${rowNumber}: 必須フィールドが不足しています`)
        return
      }

      // 日付形式チェック
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(row.Date)) {
        errors.push(`行 ${rowNumber}: 日付形式が不正です: ${row.Date}`)
        return
      }

      // 時間形式チェック
      if (row.Kickoff !== '未定' && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(row.Kickoff)) {
        errors.push(`行 ${rowNumber}: 時間形式が不正です: ${row.Kickoff}`)
        return
      }

      // 日時結合
      let dateTime = null
      if (row.Kickoff && row.Kickoff !== '未定') {
        try {
          const dateObj = parse(row.Date, 'yyyy-MM-dd', new Date())
          if (isValid(dateObj)) {
            const [hours, minutes] = row.Kickoff.split(':').map(Number)
            if (!isNaN(hours) && !isNaN(minutes)) {
              dateObj.setHours(hours, minutes, 0, 0)
              const year = dateObj.getFullYear()
              const month = String(dateObj.getMonth() + 1).padStart(2, '0')
              const day = String(dateObj.getDate()).padStart(2, '0')
              const hour = String(dateObj.getHours()).padStart(2, '0')
              const minute = String(dateObj.getMinutes()).padStart(2, '0')
              const second = String(dateObj.getSeconds()).padStart(2, '0')
              dateTime = `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`
            }
          }
        } catch (error) {
          // エラー時はnullのまま
        }
      }

      // additionalInfoの生成（Etcカラムを使用）
      const additionalInfo = row.Etc ? row.Etc.trim() : null

      // Matchオブジェクトを作成
      const now = new Date().toISOString()
      const match = {
        id: generateUUID(),
        dateTime: dateTime,
        date: row.Date,
        kickoff: row.Kickoff,
        homeTeam: row.Home.trim(),
        awayTeam: row.Away.trim(),
        venue: row.Stadium ? row.Stadium.trim() : null,
        group: row.Group ? row.Group.trim() : null,
        round: row.Round ? String(row.Round).trim() : null,
        broadcast: row.Broadcast ? row.Broadcast.trim() : null,
        additionalInfo: additionalInfo,
        createdAt: now,
        updatedAt: now
      }

      matches.push(match)
    })

    // マスタデータオブジェクトを作成
    const masterData = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalMatches: matches.length,
      matches: matches
    }

    // 出力ディレクトリを作成
    const outputDir = 'public/data'
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // JSONファイルに書き込み
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(masterData, null, 2), 'utf-8')

    console.log(`✅ マスタデータを生成しました: ${OUTPUT_FILE}`)
    console.log(`   試合数: ${matches.length}件`)
    if (errors.length > 0) {
      console.log(`   ⚠️  エラー: ${errors.length}件`)
      errors.forEach(err => console.log(`      ${err}`))
    }
  },
  error: (error) => {
    console.error('❌ CSVパースエラー:', error)
    process.exit(1)
  }
})
