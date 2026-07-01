# リリースノート Version 2.0.0

**リリース日**: 2026-07-01

## 概要

2026/27シーズンの試合日程に対応しました。J. League Data Site の保存HTMLからマスタデータ用CSVを生成するツールを追加し、マスタデータを全面更新しています。

## 主な変更内容

### マスタデータの更新

- **対象シーズン**: 2026/27
- **試合数**: 1,191件（旧データ: 573件）
- **大会**: Ｊ１、Ｊ２、Ｊ３、ＹＬＣ 1stラウンド
- **データソース**: J. League Data Site（日程・結果）

### HTML→CSV変換ツールの追加

- **新規ファイル**: `scripts/convert-html-to-csv.js`
- J. League Data Site の保存HTMLを `j_league_schedule_from_website_utf8.csv` 形式に変換
- YLCの勝者プレースホルダー（`[9]w` 等）を「未定」に正規化
- **npmスクリプト**: `npm run generate-csv-from-html`

### データ更新手順

```bash
# 1. J. League Data Site のHTMLを保存
# 2. CSVを生成
npm run generate-csv-from-html

# 3. JSONマスタデータを生成
npm run generate-master-data
```

## 変更ファイル

- `scripts/convert-html-to-csv.js`（新規）
- `j_league_schedule_from_website_utf8.csv`
- `public/data/master-matches.json`
- `package.json`

## 注意事項

- Group列の値が旧形式（EAST/WEST等）から大会名（Ｊ１/Ｊ２/Ｊ３等）に変更されています
- 試合日が「未定」の行はマスタデータ生成時にスキップされます（1件）
