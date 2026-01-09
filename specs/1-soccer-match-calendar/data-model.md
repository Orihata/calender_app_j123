# Data Model: サッカー試合予定カレンダーアプリケーション

**Feature**: サッカー試合予定カレンダーアプリケーション  
**Date**: 2026-01-09  
**Status**: Draft

## Entity Relationships

```
Match (試合予定)
  └─> AttendancePlan (観戦予定) [1対1の関係、オプショナル]
```

## Entities

### Match (試合予定)

試合に関する情報を表す基本エンティティ。CSVファイルからインポートされ、カレンダーに表示される。

**属性**:
- `id` (string, required, unique): 試合の一意な識別子（UUID推奨）
- `dateTime` (string | null, required): 試合の日時（ISO 8601形式: "2026-02-06T19:00:00+09:00"）。Kickoffが「未定」の場合は`null`または空文字列
- `date` (string, required): 試合の日付（YYYY-MM-DD形式）。Kickoffが「未定」の場合でも日付は保持される
- `kickoff` (string, required): キックオフ時間（HH:MM形式または"未定"）
- `homeTeam` (string, required): ホームチーム名
- `awayTeam` (string, required): アウェイチーム名
- `venue` (string, optional): 会場名（スタジアム名）。「未定」の場合はそのまま保存
- `group` (string, optional): グループ（EAST/WEST等）
- `round` (string, optional): ラウンド番号
- `broadcast` (string, optional): 放送局情報
- `additionalInfo` (string, optional): その他の情報（必要に応じてgroup、round、broadcastを結合）
- `createdAt` (string, required): 作成日時（ISO 8601形式）
- `updatedAt` (string, required): 更新日時（ISO 8601形式）

**制約**:
- `dateTime` は有効な日時形式、または`null`（Kickoffが「未定」の場合）
- `date` は有効な日付形式（YYYY-MM-DD）でなければならない
- `kickoff` は有効な時間形式（HH:MM）または「未定」でなければならない
- `homeTeam` と `awayTeam` は空文字列であってはならない
- `id` は一意でなければならない

**例（通常の試合）**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "dateTime": "2026-02-06T19:00:00+09:00",
  "date": "2026-02-06",
  "kickoff": "19:00",
  "homeTeam": "横浜Ｆ・マリノス",
  "awayTeam": "ＦＣ町田ゼルビア",
  "venue": "日産スタジアム",
  "group": "EAST",
  "round": "1",
  "broadcast": "DAZN",
  "additionalInfo": "EAST 第1節 DAZN",
  "createdAt": "2026-01-09T10:00:00+09:00",
  "updatedAt": "2026-01-09T10:00:00+09:00"
}
```

**例（キックオフ時間が未定の試合）**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "dateTime": null,
  "date": "2026-02-10",
  "kickoff": "未定",
  "homeTeam": "横浜Ｆ・マリノス",
  "awayTeam": "ＦＣ町田ゼルビア",
  "venue": "未定",
  "group": "EAST",
  "round": "2",
  "broadcast": "DAZN",
  "additionalInfo": "EAST 第2節 DAZN",
  "createdAt": "2026-01-09T10:00:00+09:00",
  "updatedAt": "2026-01-09T10:00:00+09:00"
}
```

### AttendancePlan (観戦予定)

ユーザーが観戦する予定の試合を表す。Matchへの参照を持つ。観戦方法に応じて「現地観戦予定」と「放送視聴予定」の2カテゴリに分離される。

**属性**:
- `id` (string, required, unique): 観戦予定の一意な識別子（UUID推奨）
- `matchId` (string, required): 関連する試合予定のID（Match.idへの参照）
- `category` (string, required): カテゴリ（'venue' | 'broadcast'）
  - `'venue'`: 現地観戦予定
  - `'broadcast'`: 放送視聴予定
- `createdAt` (string, required): 作成日時（ISO 8601形式）
- `updatedAt` (string, required): 更新日時（ISO 8601形式）

**制約**:
- `matchId` は存在するMatchのIDを参照しなければならない
- 同じ `matchId` と `category` の組み合わせに対して複数のAttendancePlanは作成できない（一意制約）
- 同じ試合に対して「現地観戦予定」と「放送視聴予定」の両方を登録可能

**例（現地観戦予定）**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "matchId": "550e8400-e29b-41d4-a716-446655440000",
  "category": "venue",
  "createdAt": "2026-01-09T11:00:00+09:00",
  "updatedAt": "2026-01-09T11:00:00+09:00"
}
```

**例（放送視聴予定）**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440002",
  "matchId": "550e8400-e29b-41d4-a716-446655440000",
  "category": "broadcast",
  "createdAt": "2026-01-09T11:00:00+09:00",
  "updatedAt": "2026-01-09T11:00:00+09:00"
}
```

## Storage Schema

### localStorage キー構造

データは以下のキーでlocalStorageに保存される：

- `matches`: すべての試合予定の配列（Match[]）
- `attendancePlans`: すべての観戦予定の配列（AttendancePlan[]）

**保存形式**:
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

### データ操作パターン

#### 試合予定の追加
1. CSVファイルをパースしてMatchオブジェクトの配列を生成
2. 既存のmatchesとマージ（重複チェック）
3. localStorageに保存

#### 観戦予定の追加
1. matchIdを指定してAttendancePlanを作成
2. 既存のattendancePlansに追加（重複チェック）
3. localStorageに保存

#### 観戦予定の削除
1. matchIdまたはidを指定してAttendancePlanを削除
2. localStorageを更新

#### 試合予定の削除
1. Matchを削除
2. 関連するAttendancePlanも削除（参照整合性の維持）
3. localStorageを更新

## データ検証ルール

### Match 検証

1. **必須フィールドチェック**: `id`, `date`, `kickoff`, `homeTeam`, `awayTeam`, `createdAt`, `updatedAt` が存在する
2. **日付形式チェック**: `date` が有効な日付形式（YYYY-MM-DD）である
3. **キックオフ時間チェック**: `kickoff` が有効な時間形式（HH:MM）または「未定」である
4. **日時形式チェック**: `kickoff`が「未定」でない場合、`dateTime` が有効なISO 8601形式である。`kickoff`が「未定」の場合、`dateTime`は`null`または空文字列でなければならない
5. **日時妥当性チェック**: `kickoff`が「未定」でない場合、`dateTime` が有効な日時である（存在しない日付でない）
6. **文字列長チェック**: `homeTeam`, `awayTeam` が空文字列でない
7. **一意性チェック**: `id` が既存のmatchesと重複していない
8. **CSVマッピング検証**: CSVからインポートする場合、DateとKickoffが正しく処理されていること（Kickoffが「未定」の場合は日時結合を行わない）

### AttendancePlan 検証

1. **必須フィールドチェック**: `id`, `matchId`, `createdAt`, `updatedAt` が存在する
2. **参照整合性チェック**: `matchId` が存在するMatchのIDを参照している
3. **一意性チェック**: 同じ `matchId` に対するAttendancePlanが既に存在しない

## インデックス戦略

### 日付による検索の最適化

カレンダー表示のために、日付で試合予定を高速に検索できるようにする：

```javascript
// 日付をキーとしたインデックス構造（メモリ内）
const matchesByDate = {
  "2026-01-15": [match1, match2, ...],
  "2026-01-20": [match3, ...],
  ...
}
```

このインデックスは、localStorageからデータを読み込んだ際に構築し、メモリ内で保持する。

## データ移行戦略

### バージョン管理

localStorageに保存するデータにバージョン情報を含める：

```json
{
  "version": "1.0.0",
  "matches": [...],
  "attendancePlans": [...]
}
```

将来のスキーマ変更時に、バージョンに基づいてデータを移行する。

## エッジケースの処理

### 重複試合の処理

CSVインポート時に、同じ試合（日時、ホームチーム、アウェイチームが同一）が既に存在する場合：
- オプション1: スキップして警告を表示
- オプション2: 既存の試合を更新（実装時に決定）

### 参照整合性の維持

試合予定が削除された場合、関連する観戦予定も自動的に削除する。

### データ容量の管理

localStorageの容量制限に近づいた場合の警告と、古いデータの削除オプションを提供する。
