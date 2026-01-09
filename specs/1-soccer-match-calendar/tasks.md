# Implementation Tasks: サッカー試合予定カレンダーアプリケーション

**Feature**: サッカー試合予定カレンダーアプリケーション  
**Branch**: `1-soccer-match-calendar`  
**Date**: 2026-01-09  
**Status**: Draft

## 概要

このドキュメントは、サッカー試合予定カレンダーアプリケーションの実装タスクを整理したものです。タスクはユーザーストーリー別に整理され、各ストーリーは独立して実装・テスト可能です。

**元データ**: `j_league_schedule_from_website_utf8.csv` をCSVファイルとしてインポートし、サーバサイド（localStorage）で各イベントデータとしてJSONで保持します。

## タスク統計

- **総タスク数**: 45
- **User Story 1 (P1)**: 18タスク
- **User Story 2 (P2)**: 12タスク
- **User Story 3 (P3)**: 8タスク
- **Setup & Foundational**: 7タスク

## 依存関係グラフ

```
Phase 1: Setup
    ↓
Phase 2: Foundational (データモデル、ストレージサービス)
    ↓
Phase 3: User Story 1 (試合予定のインポートとカレンダー表示)
    ↓
Phase 4: User Story 2 (観戦予定の設定)
    ↓
Phase 5: User Story 3 (ピックアップ試合の一覧出力)
    ↓
Final Phase: Polish & Cross-Cutting Concerns
```

## 実装戦略

### MVPスコープ
最初のMVPは **User Story 1** のみを実装します。これにより、ユーザーはCSVファイルから試合予定をインポートし、カレンダー形式で表示できるようになります。

### 段階的実装
1. **Phase 1-2**: プロジェクトセットアップと基盤構築
2. **Phase 3**: User Story 1を実装（MVP）
3. **Phase 4**: User Story 2を実装
4. **Phase 5**: User Story 3を実装
5. **Final Phase**: パフォーマンス最適化、エラーハンドリング強化、アクセシビリティ対応

### 並列実行の機会
- モデル定義とユーティリティ関数は並列実装可能
- コンポーネントのスタイリングとロジックは並列実装可能
- ユニットテストは各機能実装後に並列で記述可能

---

## Phase 1: Setup（プロジェクト初期化）

### 目標
プロジェクトの基本構造を構築し、開発環境を整備する。

### 独立テスト基準
- プロジェクトが正常にビルドできる
- 開発サーバーが起動できる
- 基本的なReactコンポーネントが表示できる

### タスク

- [ ] T001 Create project structure per implementation plan in specs/1-soccer-match-calendar/plan.md
- [ ] T002 Initialize Vite project with React template in project root
- [ ] T003 Install core dependencies (React 18+, React Router, PapaParse, date-fns) via package.json
- [ ] T004 Install development dependencies (Jest, React Testing Library, @testing-library/user-event) via package.json
- [ ] T005 Create directory structure (src/components, src/services, src/models, src/utils, tests) per plan.md
- [ ] T006 Create public/index.html with basic HTML structure
- [ ] T007 Configure Vite build settings in vite.config.js

---

## Phase 2: Foundational（基盤タスク）

### 目標
データモデル、ストレージサービス、ユーティリティ関数などの基盤コンポーネントを実装する。これらはすべてのユーザーストーリーで使用される。

### 独立テスト基準
- データモデルが正しく定義され、バリデーションが機能する
- ストレージサービスがlocalStorageに正常に読み書きできる
- 日付操作ユーティリティが正しく動作する

### タスク

- [ ] T008 [P] Define Match model class in src/models/Match.js with all required fields per data-model.md
- [ ] T009 [P] Define AttendancePlan model class in src/models/AttendancePlan.js with all required fields per data-model.md
- [ ] T010 [P] Implement date utilities (format, parse, compare) in src/utils/dateUtils.js using date-fns
- [ ] T011 [P] Implement validation functions (date, time, required fields) in src/utils/validation.js
- [ ] T012 Implement StorageService with getMatches, saveMatches, getAttendancePlans, saveAttendancePlans, clearAll methods in src/services/storage.js
- [ ] T013 Implement MatchService with create, read, update, delete operations in src/services/matchService.js
- [ ] T014 Implement AttendanceService with create, read, delete operations in src/services/attendanceService.js

---

## Phase 3: User Story 1 - 試合予定のインポートとカレンダー表示 (Priority: P1)

### ストーリー目標
ユーザーはCSVファイルから試合予定をインポートし、カレンダー形式で日時ごとに複数の試合予定を一括表示できる。

### 独立テスト基準
CSVファイルをインポートし、カレンダー上で特定の日時に複数の試合予定が正しく表示されることを確認できる。この機能単体で、ユーザーは試合予定を視覚的に把握できる価値を得られる。

### 受け入れシナリオ
1. CSVファイルをインポートすると、試合予定がシステムに読み込まれ、カレンダーに表示される
2. 複数の試合予定が同じ日時に存在する場合、カレンダーでその日時を表示すると、すべての試合予定が一括で表示される
3. カレンダーが表示されている状態で、異なる日付を選択すると、その日付の試合予定が表示される
4. 無効なCSVファイルが提供された場合、エラーメッセージが表示され、データは読み込まれない

### タスク

#### CSVインポート機能

- [ ] T015 [US1] Implement CSVParserService.parseCSV method in src/services/csvParser.js per csv-import-contract.md
- [ ] T016 [US1] Implement CSV field mapping (Date+Kickoff→dateTime, Home→homeTeam, Away→awayTeam, etc.) in src/services/csvParser.js
- [ ] T017 [US1] Implement date-time combination logic (Date + Kickoff → ISO 8601) with "未定" handling in src/services/csvParser.js
- [ ] T018 [US1] Implement CSV validation (required fields, date format, time format) in src/services/csvParser.js
- [ ] T019 [US1] Implement error handling and error message generation in src/services/csvParser.js
- [ ] T020 [US1] Create ImportCSV component with file input and import button in src/components/ImportCSV/ImportCSV.js
- [ ] T021 [US1] Implement CSV import UI with error/warning display in src/components/ImportCSV/ImportCSV.js
- [ ] T022 [US1] Integrate CSVParserService with MatchService to save imported matches in src/components/ImportCSV/ImportCSV.js

#### カレンダー表示機能

- [ ] T023 [US1] Create Calendar component structure in src/components/Calendar/Calendar.js
- [ ] T024 [US1] Implement date navigation (month view, date selection) in src/components/Calendar/Calendar.js
- [ ] T025 [US1] Implement match grouping by date using dateUtils in src/components/Calendar/Calendar.js
- [ ] T026 [US1] Create MatchList component to display matches for selected date in src/components/Calendar/MatchList.js
- [ ] T027 [US1] Implement responsive calendar layout for mobile (320px+) in src/components/Calendar/Calendar.js
- [ ] T028 [US1] Integrate Calendar with MatchService to load and display matches in src/components/Calendar/Calendar.js
- [ ] T029 [US1] Implement match display with homeTeam, awayTeam, venue, kickoff in src/components/Calendar/MatchList.js
- [ ] T030 [US1] Handle "未定" kickoff time display in UI (show date + "未定") in src/components/Calendar/MatchList.js

#### 統合とルーティング

- [ ] T031 [US1] Create main App component with React Router setup in src/App.js
- [ ] T032 [US1] Add routes for calendar view and import view in src/App.js

---

## Phase 4: User Story 2 - 観戦予定の設定 (Priority: P2)

### ストーリー目標
ユーザーは特定の試合を選択して観戦予定としてマークし、観戦予定を管理できる。

### 独立テスト基準
試合予定を選択して観戦予定としてマークし、観戦予定一覧で確認できる。この機能単体で、ユーザーは観戦予定を管理できる価値を得られる。

### 受け入れシナリオ
1. カレンダーに試合予定が表示されている状態で、特定の試合を選択して観戦予定としてマークすると、その試合が観戦予定として記録される
2. 観戦予定としてマークされた試合が存在する状態で、観戦予定一覧を表示すると、マークされたすべての試合が表示される
3. 観戦予定としてマークされた試合が存在する状態で、観戦予定のマークを解除すると、その試合が観戦予定一覧から削除される
4. 同じ試合が複数回マークされる場合、観戦予定を確認すると、重複なく1回のみ記録される

### タスク

- [ ] T033 [US2] Add "観戦予定に追加" button to MatchList component in src/components/Calendar/MatchList.js
- [ ] T034 [US2] Implement markAsAttendancePlan method in AttendanceService in src/services/attendanceService.js
- [ ] T035 [US2] Implement duplicate check (same matchId) in AttendanceService in src/services/attendanceService.js
- [ ] T036 [US2] Create AttendanceList component structure in src/components/AttendanceList/AttendanceList.js
- [ ] T037 [US2] Implement attendance plan loading from AttendanceService in src/components/AttendanceList/AttendanceList.js
- [ ] T038 [US2] Implement match lookup by matchId to display match details in AttendanceList in src/components/AttendanceList/AttendanceList.js
- [ ] T039 [US2] Add "観戦予定から削除" button to AttendanceList component in src/components/AttendanceList/AttendanceList.js
- [ ] T040 [US2] Implement removeAttendancePlan method in AttendanceService in src/services/attendanceService.js
- [ ] T041 [US2] Add route for attendance list view in src/App.js
- [ ] T042 [US2] Update MatchList to show attendance status (already marked) in src/components/Calendar/MatchList.js
- [ ] T043 [US2] Implement reference integrity check (delete attendance plan when match is deleted) in MatchService in src/services/matchService.js
- [ ] T044 [US2] Add navigation link to attendance list in main navigation in src/App.js

---

## Phase 5: User Story 3 - ピックアップ試合の一覧出力 (Priority: P3)

### ストーリー目標
ユーザーは観戦予定としてマークした試合（ピックアップした試合）のみを一覧として出力できる。

### 独立テスト基準
観戦予定としてマークされた試合を一覧として出力し、出力された内容が正しいことを確認できる。この機能単体で、ユーザーは選択した試合情報を外部で利用できる価値を得られる。

### 受け入れシナリオ
1. 観戦予定としてマークされた試合が存在する状態で、一覧出力を実行すると、マークされた試合のみが一覧として出力される
2. 観戦予定としてマークされた試合が存在しない状態で、一覧出力を実行すると、空の一覧または適切なメッセージが表示される
3. 複数の観戦予定が存在する状態で、一覧出力を実行すると、すべての観戦予定が時系列順または指定された順序で出力される
4. 一覧出力が実行される状態で、出力形式を確認すると、試合の主要情報（日時、対戦カード等）が含まれる

### タスク

- [ ] T045 [US3] Implement exportAttendancePlansToJSON method in AttendanceService in src/services/attendanceService.js
- [ ] T046 [US3] Implement exportAttendancePlansToCSV method in AttendanceService in src/services/attendanceService.js
- [ ] T047 [US3] Add "一覧出力" button to AttendanceList component in src/components/AttendanceList/AttendanceList.js
- [ ] T048 [US3] Implement export format selection (JSON/CSV) UI in src/components/AttendanceList/AttendanceList.js
- [ ] T049 [US3] Implement file download functionality for exported data in src/components/AttendanceList/AttendanceList.js
- [ ] T050 [US3] Implement sorting by dateTime (chronological order) for exported data in src/services/attendanceService.js
- [ ] T051 [US3] Handle empty attendance plans case (show message) in src/components/AttendanceList/AttendanceList.js
- [ ] T052 [US3] Format exported data with match details (dateTime, homeTeam, awayTeam, venue, etc.) in src/services/attendanceService.js

---

## Final Phase: Polish & Cross-Cutting Concerns

### 目標
パフォーマンス最適化、エラーハンドリング強化、アクセシビリティ対応、エッジケースの処理を実装する。

### タスク

- [ ] T053 Implement error boundary component for React error handling in src/components/common/ErrorBoundary.js
- [ ] T054 Add loading states and progress indicators for CSV import in src/components/ImportCSV/ImportCSV.js
- [ ] T055 Implement localStorage capacity warning and data cleanup options in src/services/storage.js
- [ ] T056 Add keyboard navigation support for calendar and match list in src/components/Calendar/Calendar.js
- [ ] T057 Implement ARIA attributes for screen reader support in src/components/Calendar/Calendar.js and src/components/AttendanceList/AttendanceList.js
- [ ] T058 Optimize calendar rendering with React.memo for large datasets (1000+ matches) in src/components/Calendar/Calendar.js
- [ ] T059 Implement date-based indexing for fast match lookup in MatchService in src/services/matchService.js
- [ ] T060 Handle edge cases: duplicate matches, invalid dates, missing fields in src/services/csvParser.js
- [ ] T061 Add data versioning support for future schema changes in src/services/storage.js
- [ ] T062 Implement data backup and restore functionality in src/services/storage.js

---

## 並列実行の例

### User Story 1 内での並列実行
- T015-T019 (CSVパーサー実装) と T023-T024 (カレンダー基本構造) は並列実装可能
- T025-T026 (マッチグループ化) と T027 (レスポンシブレイアウト) は並列実装可能

### User Story 2 内での並列実行
- T033-T035 (観戦予定マーク機能) と T036-T037 (観戦予定一覧表示) は並列実装可能
- T038-T040 (削除機能) と T041-T042 (ルーティングとUI更新) は並列実装可能

### User Story 3 内での並列実行
- T045-T046 (エクスポート機能) と T047-T048 (UI実装) は並列実装可能

---

## テスト戦略

### ユニットテスト
各サービス、ユーティリティ、モデルに対してユニットテストを実装する。

### 統合テスト
各ユーザーストーリーに対して、受け入れシナリオに基づいた統合テストを実装する。

### テストファイル構造
- `tests/unit/services/` - サービス層のユニットテスト
- `tests/unit/utils/` - ユーティリティ関数のユニットテスト
- `tests/unit/models/` - データモデルのユニットテスト
- `tests/integration/userStories/` - ユーザーストーリー別の統合テスト

---

## データ形式定義

### Match (試合予定) JSON形式

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "dateTime": "2026-02-06T19:00:00+09:00",
  "date": "2026-02-06",
  "kickoff": "19:00",
  "homeTeam": "横浜FM",
  "awayTeam": "町田",
  "venue": "日産ス",
  "group": "EAST",
  "round": "1",
  "broadcast": "ＤＡＺＮ",
  "additionalInfo": "EAST 第1節 ＤＡＺＮ",
  "createdAt": "2026-01-09T10:00:00+09:00",
  "updatedAt": "2026-01-09T10:00:00+09:00"
}
```

**キックオフ時間が「未定」の場合**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "dateTime": null,
  "date": "2026-02-10",
  "kickoff": "未定",
  "homeTeam": "横浜FM",
  "awayTeam": "町田",
  "venue": "未定",
  "group": "EAST",
  "round": "2",
  "broadcast": "ＤＡＺＮ",
  "additionalInfo": "EAST 第2節 ＤＡＺＮ",
  "createdAt": "2026-01-09T10:00:00+09:00",
  "updatedAt": "2026-01-09T10:00:00+09:00"
}
```

### AttendancePlan (観戦予定) JSON形式

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "matchId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-01-09T11:00:00+09:00",
  "updatedAt": "2026-01-09T11:00:00+09:00"
}
```

### localStorage ストレージ構造

```json
{
  "matches": [
    { /* Match object */ },
    { /* Match object */ }
  ],
  "attendancePlans": [
    { /* AttendancePlan object */ },
    { /* AttendancePlan object */ }
  ]
}
```

### CSVからJSONへのマッピング

`j_league_schedule_from_website_utf8.csv` の各フィールドは以下のようにマッピングされます：

- `Group` → `group` (オプション)
- `Round` → `round` (オプション)
- `Date` → `date` (必須)
- `Kickoff` → `kickoff` (必須、または"未定")
- `Date` + `Kickoff` → `dateTime` (ISO 8601形式、Kickoffが"未定"の場合はnull)
- `Home` → `homeTeam` (必須)
- `Away` → `awayTeam` (必須)
- `Stadium` → `venue` (オプション、または"未定")
- `Broadcast` → `broadcast` (オプション)
- `Group` + `Round` + `Broadcast` → `additionalInfo` (結合して保存)

---

## 次のステップ

1. Phase 1のタスクから開始し、プロジェクトをセットアップする
2. Phase 2で基盤コンポーネントを実装する
3. Phase 3でUser Story 1を実装し、MVPを完成させる
4. Phase 4、Phase 5で残りの機能を実装する
5. Final Phaseで品質向上と最適化を行う

各フェーズは独立してテスト可能であり、段階的に機能を追加していくことができます。
