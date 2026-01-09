import Papa from 'papaparse'
import { combineDateTime } from '../utils/dateUtils.js'
import { isValidDateFormat, isValidTimeFormat, isRequired } from '../utils/validation.js'
import { Match } from '../models/Match.js'

/**
 * CSVParserService
 * CSVファイルをパースしてMatchオブジェクトの配列に変換するサービス
 */

/**
 * パース結果
 * @typedef {Object} ParseResult
 * @property {Array<Match>} matches - 正常にパースされた試合予定
 * @property {Array<ParseError>} errors - パースエラーのリスト
 * @property {Array<ParseWarning>} warnings - 警告のリスト
 */

/**
 * パースエラー
 * @typedef {Object} ParseError
 * @property {number} row - エラーが発生した行番号（1ベース）
 * @property {string} [field] - エラーが発生したフィールド名
 * @property {string} message - エラーメッセージ（日本語）
 * @property {string} [data] - 問題のあるデータ
 */

/**
 * パース警告
 * @typedef {Object} ParseWarning
 * @property {number} row - 警告が発生した行番号（1ベース）
 * @property {string} [field] - 警告が発生したフィールド名
 * @property {string} message - 警告メッセージ（日本語）
 * @property {string} [data] - 問題のあるデータ
 */

/**
 * CSVファイルをパースしてMatchオブジェクトの配列に変換
 * @param {File} file - パースするCSVファイル
 * @returns {Promise<ParseResult>} パース結果
 */
export async function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const matches = []
    const errors = []
    const warnings = []

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        // ヘッダー行の検証
        const requiredHeaders = ['Date', 'Kickoff', 'Home', 'Away']
        const headers = results.meta.fields || []
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
        
        if (missingHeaders.length > 0) {
          errors.push({
            row: 0,
            field: 'header',
            message: `必須のヘッダーが不足しています: ${missingHeaders.join(', ')}`,
            data: headers.join(', ')
          })
          resolve({ matches, errors, warnings })
          return
        }

        // 各行を処理
        results.data.forEach((row, index) => {
          const rowNumber = index + 2 // ヘッダー行を考慮して+2
          
          try {
            const match = parseRow(row, rowNumber, errors, warnings)
            if (match) {
              matches.push(match)
            }
          } catch (error) {
            errors.push({
              row: rowNumber,
              message: error.message || 'パースエラーが発生しました',
              data: JSON.stringify(row)
            })
          }
        })

        resolve({ matches, errors, warnings })
      },
      error: (error) => {
        reject(new Error(`CSVファイルの読み込みに失敗しました: ${error.message}`))
      }
    })
  })
}

/**
 * CSVの1行をパースしてMatchオブジェクトに変換
 * @param {Object} row - CSVの1行のデータ
 * @param {number} rowNumber - 行番号
 * @param {Array<ParseError>} errors - エラー配列（参照渡し）
 * @param {Array<ParseWarning>} warnings - 警告配列（参照渡し）
 * @returns {Match|null} Matchオブジェクト。エラーの場合はnull
 */
function parseRow(row, rowNumber, errors, warnings) {
  // Dateが「未定」の場合は警告として処理（先にチェック）
  if (row.Date === '未定' || (row.Date && row.Date.trim() === '未定')) {
    warnings.push({
      row: rowNumber,
      field: 'Date',
      message: 'Dateが「未定」のため、この行はスキップされます',
      data: row.Date
    })
    return null
  }

  // 必須フィールドチェック
  if (!isRequired(row.Date)) {
    errors.push({
      row: rowNumber,
      field: 'Date',
      message: 'Dateは必須です',
      data: row.Date
    })
    return null
  }

  if (!isRequired(row.Kickoff)) {
    errors.push({
      row: rowNumber,
      field: 'Kickoff',
      message: 'Kickoffは必須です',
      data: row.Kickoff
    })
    return null
  }

  if (!isRequired(row.Home)) {
    errors.push({
      row: rowNumber,
      field: 'Home',
      message: 'Homeは必須です',
      data: row.Home
    })
    return null
  }

  if (!isRequired(row.Away)) {
    errors.push({
      row: rowNumber,
      field: 'Away',
      message: 'Awayは必須です',
      data: row.Away
    })
    return null
  }

  // 日付形式チェック
  if (!isValidDateFormat(row.Date)) {
    errors.push({
      row: rowNumber,
      field: 'Date',
      message: 'Dateは有効な日付形式（YYYY-MM-DD）である必要があります',
      data: row.Date
    })
    return null
  }

  // キックオフ時間チェック
  if (!isValidTimeFormat(row.Kickoff)) {
    errors.push({
      row: rowNumber,
      field: 'Kickoff',
      message: 'Kickoffは有効な時間形式（HH:MM）または「未定」である必要があります',
      data: row.Kickoff
    })
    return null
  }

  // 文字列長チェック
  if (row.Home.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'Home',
      message: 'Homeは空文字列であってはなりません',
      data: row.Home
    })
    return null
  }

  if (row.Away.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'Away',
      message: 'Awayは空文字列であってはなりません',
      data: row.Away
    })
    return null
  }

  // 日時結合
  const dateTime = combineDateTime(row.Date, row.Kickoff)
  
  // 日時妥当性チェック（Kickoffが「未定」でない場合）
  if (row.Kickoff !== '未定' && dateTime === null) {
    errors.push({
      row: rowNumber,
      field: 'Kickoff',
      message: 'DateとKickoffを結合した日時が無効です',
      data: `${row.Date} ${row.Kickoff}`
    })
    return null
  }

  // additionalInfoの生成
  const additionalInfoParts = []
  if (row.Group) additionalInfoParts.push(row.Group)
  if (row.Round) additionalInfoParts.push(`第${row.Round}節`)
  if (row.Broadcast) additionalInfoParts.push(row.Broadcast)
  const additionalInfo = additionalInfoParts.length > 0 ? additionalInfoParts.join(' ') : null

  // Matchオブジェクトを作成
  const now = new Date().toISOString()
  const matchData = {
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

  return new Match(matchData)
}

/**
 * UUIDを生成（簡易版）
 * @returns {string} UUID文字列
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
