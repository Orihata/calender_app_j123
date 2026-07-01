# リリースノート Version 2.0.2

**リリース日**: 2026-07-01

## 概要

v2.0.1 で追加したシーズンアーカイブ機能の不具合修正と、YLC（ルヴァンカップ）試合データのマスタ生成ルール修正を行いました。

## 主な変更内容

### アーカイブ後のマスタ取込修正

- Service Worker が古いマスタをキャッシュ優先で返していた問題を修正（ネットワーク優先）
- マスタ取込を一括保存に変更
- アーカイブ済みで現行シーズン試合がない場合、起動時にマスタを自動取り込み

### YLCマスタデータの修正

- 「マッチＮｏ［１］」等の情報を `broadcast` から `additionalInfo` へ移動
- 対象: YLC 1stラウンド 等（52試合）

## 変更ファイル

- `src/services/archiveService.js`
- `src/services/masterDataService.js`
- `src/services/matchService.js`
- `src/App.jsx`
- `public/sw.js`
- `scripts/convert-html-to-csv.js`
- `j_league_schedule_from_website_utf8.csv`
- `public/data/master-matches.json`

## 利用上の注意

- 既にアーカイブ済みでカレンダーが空の場合は、v2.0.2 反映後にページを強制リロードしてください
- PWA インストール版はタブを閉じて開き直すと新しい Service Worker が有効になります
