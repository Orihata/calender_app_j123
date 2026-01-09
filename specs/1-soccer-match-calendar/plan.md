# Implementation Plan: サッカー試合予定カレンダーアプリケーション

**Branch**: `1-soccer-match-calendar` | **Date**: 2026-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/1-soccer-match-calendar/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

サッカークラブの試合予定を管理するローカルブラウザアプリケーションを開発する。CSVファイルから試合予定をインポートし、カレンダー形式で表示、観戦予定を設定し、選択した試合のみを一覧出力する機能を提供する。ReactJSを使用したシングルページアプリケーションとして実装し、すべてのデータはローカルのJSON形式で保持する。

## Technical Context

**Language/Version**: JavaScript (ES6+), Node.js 18+ (開発環境)  
**Primary Dependencies**: React 18+, React Router (ルーティング), PapaParse (CSVパーシング), date-fns (日付操作), localStorage API (データ永続化)  
**Storage**: ブラウザのlocalStorage（JSON形式で試合予定と観戦予定を保持）  
**Testing**: Jest, React Testing Library, @testing-library/user-event  
**Target Platform**: モダンブラウザ（Chrome, Firefox, Safari, Edgeの最新版）、モバイルブラウザ対応  
**Project Type**: single (シングルページアプリケーション、バックエンド不要)  
**Performance Goals**: 1000件の試合予定でカレンダー表示が2秒以内、CSVインポート（100件）が3分以内  
**Constraints**: ローカル実行のみ（インターネット接続不要）、モバイル対応（画面幅320px以上）、軽量な実装  
**Scale/Scope**: 最大1000件の試合予定、1ユーザー、ローカルストレージ容量制限内

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

憲法の原則に準拠していることを確認：

- ✅ **I. 日本語実装**: すべてのコード、コメント、ドキュメントが日本語で記述されているか
- ✅ **II. ローカル実行可能**: 外部サービスへの依存が最小限で、ローカル環境で完全に実行可能か
- ✅ **III. テスト駆動開発**: TDDが適用され、テストが先に記述されているか
- ✅ **IV. 統合テスト**: 必要な統合テストが計画されているか
- ✅ **V. シンプリシティ**: 必要最小限の機能から開始し、複雑さが正当化されているか

違反がある場合は、下記の Complexity Tracking セクションで正当化を記録すること。

## Project Structure

### Documentation (this feature)

```text
specs/1-soccer-match-calendar/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/          # Reactコンポーネント
│   ├── Calendar/       # カレンダー表示コンポーネント
│   ├── MatchList/      # 試合予定一覧コンポーネント
│   ├── ImportCSV/      # CSVインポートコンポーネント
│   ├── AttendanceList/ # 観戦予定一覧コンポーネント
│   └── common/         # 共通コンポーネント（Button, Modal等）
├── services/           # ビジネスロジック
│   ├── csvParser.js    # CSVパーシングサービス
│   ├── storage.js      # localStorage操作サービス
│   ├── matchService.js # 試合予定管理サービス
│   └── attendanceService.js # 観戦予定管理サービス
├── models/             # データモデル
│   ├── Match.js        # 試合予定モデル
│   └── AttendancePlan.js # 観戦予定モデル
├── utils/              # ユーティリティ関数
│   ├── dateUtils.js    # 日付操作ユーティリティ
│   └── validation.js   # バリデーション関数
├── App.js              # メインアプリケーションコンポーネント
└── index.js            # エントリーポイント

public/
├── index.html
└── favicon.ico

tests/
├── unit/               # ユニットテスト
│   ├── services/
│   ├── utils/
│   └── models/
├── integration/        # 統合テスト
│   └── userStories/    # ユーザーストーリー別の統合テスト
└── __mocks__/          # モックファイル
```

**Structure Decision**: シングルページアプリケーションとして、すべてのロジックをクライアントサイドで実装。バックエンドサーバーは不要。データはブラウザのlocalStorageにJSON形式で保存。コンポーネント、サービス、モデルを明確に分離し、保守性を確保。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| なし | - | - |
