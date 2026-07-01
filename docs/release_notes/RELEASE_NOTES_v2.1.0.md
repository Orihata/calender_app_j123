# リリースノート Version 2.1.0

**リリース日**: 2026-07-01

## 概要

観戦・視聴予定を1日の時間軸で俯瞰する「当日の予定表」機能を追加しました。現地に行く日の同日視聴予定を把握しやすくすることを目的としています。

## 主な変更内容

### 当日の予定表

- メニューに「予定表」を追加（`/daily-schedule`）
- デフォルトは当日、日付ピッカーで任意の年月日を選択可能
- 10:00〜22:00 の縦型タイムラインで表示
- 現地観戦は青、放送視聴は緑のブロック（キックオフから2時間固定）
- 時間帯が重なる場合は現地観戦を優先し、最大4件まで並列表示（5件目以降は非表示）

## 変更ファイル

- `src/components/DailySchedule/DailySchedule.jsx`
- `src/components/DailySchedule/DailySchedule.css`
- `src/utils/dailyScheduleLayout.js`
- `src/App.jsx`
- `public/sw.js`

## 利用上の注意

- キックオフが「未定」、または 10:00〜22:00 と重ならない予定は表示されません
- PWA 利用時は更新後にタブを閉じて開き直すと新しい Service Worker が有効になります
