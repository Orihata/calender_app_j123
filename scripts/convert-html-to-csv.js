import fs from 'fs'
import path from 'path'

/**
 * J. League Data Site の保存HTMLから
 * j_league_schedule_from_website_utf8.csv 形式のCSVを生成する
 *
 * Usage:
 *   node scripts/convert-html-to-csv.js [input.html] [output.csv]
 */

const DEFAULT_INPUT = '/mnt/c/Users/y.obata/Downloads/J. League Data Site.html'
const DEFAULT_OUTPUT = 'j_league_schedule_from_website_utf8.csv'

const inputPath = process.argv[2] || DEFAULT_INPUT
const outputPath = process.argv[3] || DEFAULT_OUTPUT

function toHalfWidth(str) {
  return str.replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)
  )
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseDate(dateStr) {
  if (!dateStr || dateStr.includes('未定')) {
    return null
  }
  const normalized = toHalfWidth(dateStr)
  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{2})/)
  if (!match) {
    return null
  }
  const [, yy, mm, dd] = match
  return `20${yy}-${mm}-${dd}`
}

function parseRound(roundStr) {
  const normalized = toHalfWidth(roundStr)
  const sectionMatch = normalized.match(/第(\d+)節/)
  if (sectionMatch) {
    return sectionMatch[1]
  }
  const roundMatch = normalized.match(/(\d+)回戦/)
  if (roundMatch) {
    return roundMatch[1]
  }
  return normalized.trim()
}

function parseKickoff(kickoffStr) {
  const kickoff = toHalfWidth(kickoffStr).trim()
  if (!kickoff) {
    return '未定'
  }
  return kickoff
}

function parseStadium(stadiumStr) {
  const stadium = stadiumStr.replace(/●/g, '').trim()
  if (!stadium || stadium === '未定') {
    return '未定'
  }
  return stadium
}

function parseGroup(competitionStr) {
  return competitionStr.trim()
}

/** YLC等の勝者プレースホルダー [9]w → 未定 */
function parseTeamName(teamStr) {
  const team = teamStr.trim()
  if (/^\[\d+\]w$/.test(team)) {
    return '未定'
  }
  return team
}

/** マッチＮｏ［１］ 等は broadcast ではなく Etc（additionalInfo）へ */
function parseBroadcastAndEtc(broadcastStr) {
  const text = broadcastStr.trim()
  if (!text) {
    return { broadcast: '', etc: '' }
  }
  if (/マッチ/.test(text)) {
    return { broadcast: '', etc: text }
  }
  return { broadcast: text, etc: '' }
}

function escapeCsvField(value) {
  const str = value ?? ''
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function extractTableRows(html) {
  const tableStart = html.indexOf('<table class="table-base00 search-table">')
  if (tableStart === -1) {
    throw new Error('検索結果テーブルが見つかりません')
  }
  const tableEnd = html.indexOf('</table>', tableStart)
  const tableHtml = html.slice(tableStart, tableEnd)
  const rowMatches = [...tableHtml.matchAll(/<tr>(.*?)<\/tr>/gs)]
  const rows = []

  for (const rowMatch of rowMatches) {
    const cellMatches = [...rowMatch[1].matchAll(/<td[^>]*>(.*?)<\/td>/gs)]
    if (cellMatches.length < 11) {
      continue
    }
    const cells = cellMatches.map((cell) => stripHtml(cell[1]))
    if (!/^\d{4}\/\d{2}$/.test(cells[0])) {
      continue
    }
    rows.push(cells)
  }

  return rows
}

function convertRow(cells) {
  const [
    ,
    competition,
    roundRaw,
    dateRaw,
    kickoffRaw,
    home,
    ,
    away,
    stadiumRaw,
    ,
    broadcast
  ] = cells

  const date = parseDate(dateRaw)
  if (!date) {
    return { skipped: true, reason: `日付未定または不正: ${dateRaw}` }
  }

  const { broadcast: broadcastValue, etc } = parseBroadcastAndEtc(broadcast)

  return {
    skipped: false,
    row: {
      Group: parseGroup(competition),
      Round: parseRound(roundRaw),
      Date: date,
      Kickoff: parseKickoff(kickoffRaw),
      Home: parseTeamName(home),
      Away: parseTeamName(away),
      Stadium: parseStadium(stadiumRaw),
      Broadcast: broadcastValue,
      Etc: etc
    }
  }
}

function rowsToCsv(rows) {
  const header = 'Group,Round,Date,Kickoff,Home,Away,Stadium,Broadcast,Etc'
  const lines = rows.map((row) =>
    [
      row.Group,
      row.Round,
      row.Date,
      row.Kickoff,
      row.Home,
      row.Away,
      row.Stadium,
      row.Broadcast,
      row.Etc
    ].map(escapeCsvField).join(',')
  )
  return [header, ...lines].join('\n') + '\n'
}

const html = fs.readFileSync(inputPath, 'utf-8')
const tableRows = extractTableRows(html)

const converted = []
const skipped = []

for (const cells of tableRows) {
  const result = convertRow(cells)
  if (result.skipped) {
    skipped.push(result.reason)
  } else {
    converted.push(result.row)
  }
}

fs.writeFileSync(outputPath, rowsToCsv(converted), 'utf-8')

console.log(`✅ CSVを生成しました: ${outputPath}`)
console.log(`   入力HTML: ${inputPath}`)
console.log(`   HTML行数: ${tableRows.length}件`)
console.log(`   出力試合数: ${converted.length}件`)
if (skipped.length > 0) {
  console.log(`   スキップ: ${skipped.length}件`)
  skipped.forEach((reason) => console.log(`      - ${reason}`))
}

const groups = [...new Set(converted.map((r) => r.Group))].sort()
console.log(`   大会: ${groups.join(', ')}`)
