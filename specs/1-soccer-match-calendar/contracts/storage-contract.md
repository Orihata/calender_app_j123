# Storage Contract: データストレージ仕様

**Feature**: サッカー試合予定カレンダーアプリケーション  
**Date**: 2026-01-09  
**Status**: Draft

## 概要

このアプリケーションはブラウザのlocalStorageを使用してデータを永続化します。すべてのデータはJSON形式で保存されます。

## ストレージキー

### `matches`

すべての試合予定（Matchオブジェクトの配列）を保存します。

**型**: `Match[]`

**例**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "dateTime": "2026-01-15T14:00:00+09:00",
    "homeTeam": "チームA",
    "awayTeam": "チームB",
    "venue": "スタジアムX",
    "additionalInfo": "リーグ戦 第5節",
    "createdAt": "2026-01-09T10:00:00+09:00",
    "updatedAt": "2026-01-09T10:00:00+09:00"
  }
]
```

### `attendancePlans`

すべての観戦予定（AttendancePlanオブジェクトの配列）を保存します。

**型**: `AttendancePlan[]`

**例**:
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "matchId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-01-09T11:00:00+09:00",
    "updatedAt": "2026-01-09T11:00:00+09:00"
  }
]
```

## サービスインターフェース

### StorageService

localStorageへのアクセスを抽象化するサービス。

#### `getMatches(): Promise<Match[]>`

すべての試合予定を取得します。

**戻り値**: 試合予定の配列。データが存在しない場合は空配列。

**エラー**: localStorageへのアクセスに失敗した場合、エラーをスローします。

#### `saveMatches(matches: Match[]): Promise<void>`

試合予定の配列を保存します。

**パラメータ**:
- `matches`: 保存する試合予定の配列

**エラー**: localStorageへの書き込みに失敗した場合、エラーをスローします。

#### `getAttendancePlans(): Promise<AttendancePlan[]>`

すべての観戦予定を取得します。

**戻り値**: 観戦予定の配列。データが存在しない場合は空配列。

**エラー**: localStorageへのアクセスに失敗した場合、エラーをスローします。

#### `saveAttendancePlans(plans: AttendancePlan[]): Promise<void>`

観戦予定の配列を保存します。

**パラメータ**:
- `plans`: 保存する観戦予定の配列

**エラー**: localStorageへの書き込みに失敗した場合、エラーをスローします。

#### `clearAll(): Promise<void>`

すべてのデータを削除します。

**エラー**: localStorageへのアクセスに失敗した場合、エラーをスローします。

## データ整合性

### 参照整合性

- `AttendancePlan.matchId` は必ず存在する `Match.id` を参照しなければなりません
- `Match` が削除された場合、関連する `AttendancePlan` も自動的に削除されます

### 一意性制約

- `Match.id` は一意でなければなりません
- `AttendancePlan.id` は一意でなければなりません
- 同じ `matchId` に対する `AttendancePlan` は1つまでです

## エラーハンドリング

### ストレージ容量不足

localStorageの容量制限（通常5-10MB）に達した場合：

1. ユーザーに警告を表示
2. 古いデータの削除を提案
3. データのエクスポートを推奨

### データ破損

JSONのパースに失敗した場合：

1. バックアップデータがあれば復元を試みる
2. バックアップがない場合は、データをクリアして初期状態に戻す
3. ユーザーに状況を通知

## バージョン管理

将来的なスキーマ変更に対応するため、データにバージョン情報を含めることを検討：

```json
{
  "version": "1.0.0",
  "matches": [...],
  "attendancePlans": [...]
}
```

現時点では、シンプルさを優先してバージョン情報は含めませんが、将来の拡張のために設計を考慮します。
