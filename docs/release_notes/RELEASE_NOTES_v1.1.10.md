# リリースノート Version 1.1.10

**リリース日**: 2026-01-17

## 概要

ドキュメント構成の整理を行い、仕様書の参照関係とSSOT（Single Source of Truth）を明確化しました。開発・保守性の向上を目的とした内部構造の改善です。

## 主な変更内容

### ドキュメント構成の整理

#### ディレクトリ構造の再編成

以下のディレクトリ構造でドキュメントを整理しました：

- **`docs/release_notes/`**: リリースノートを統合
- **`docs/feature_spec/`**: 機能別の詳細仕様書を統合
  - `wallpaper/`: 待受画面画像出力機能の仕様書
  - `MEMO_FEATURE_SPEC.md`: ひとことメモ機能の仕様書
- **`docs/survey/`**: 技術調査・問題解決に関するドキュメントを統合
- **`docs/readme/`**: セットアップ・デプロイ手順書を統合

#### SSOT（Single Source of Truth）の明確化

仕様書の参照関係を階層化して明確化しました：

1. **実装詳細仕様（SSOT）**: `docs/feature_spec/`
   - 実装済み機能の詳細仕様
   - 開発時の参照先
   - 各機能の具体的な仕様、UI、データモデルの詳細

2. **設計構造仕様**: `specs/1-soccer-match-calendar/`
   - 高レベル設計・全体構造
   - User Story の定義と優先度
   - データモデルの概要

#### 仕様書の整合性確保

- **`specs/spec.md`**: 実装済み機能（User Story 4-8）を追加
- **`specs/data-model.md`**: データモデルの変更を反映（`memo`, `supportingTeam`フィールド）
- **`specs/tasks.md`**: 実装済みタスクを反映
- **相互参照の追加**: `specs/`と`docs/feature_spec/`の間に参照関係を明示

### 更新ルールの明確化

スラッシュコマンド使用時や仕様書更新時のルールを明確化しました：

- **既存User Story（US1-3）の変更**: `docs/feature_spec/`で管理、`specs/`は更新しない
- **新規User Story（US4以降）の追加**: 
  1. 開発中: `docs/feature_spec/`で詳細管理
  2. 実装完了後: `specs/`にUser Storyとして追加（高レベル設計のみ）
  3. 詳細仕様は常に`docs/feature_spec/`を参照

### 影響範囲

- **ユーザーへの影響**: なし（内部構造の整理のみ）
- **既存機能への影響**: なし
- **開発者への影響**: 仕様書の参照先が明確になり、開発・保守が容易になります

## 技術的改善

### ドキュメント管理

- 仕様書の一元管理と参照関係の明確化
- SSOT定義による矛盾の防止
- 更新プロセスの標準化

### ファイル移動

以下のファイルを移動しました：

- **リリースノート**: `docs/RELEASE_NOTES_*.md` → `docs/release_notes/`
- **機能仕様書**: `docs/WALLPAPER_SPEC_*.md`, `docs/card_layout_sample.json` → `docs/feature_spec/wallpaper/`
- **機能仕様書**: `docs/MEMO_FEATURE_SPEC.md` → `docs/feature_spec/`
- **調査結果**: `docs/HASHROUTER_CHANGE.md`, `docs/PWA_FIX.md`, `docs/CHECK_FILES.md` → `docs/survey/`
- **手順書**: `docs/SETUP_*.md`, `docs/COMMIT_README.md`, `docs/DEPLOY.md` → `docs/readme/`

### SSOT参照パスの更新

`docs/card_layout_sample.json`の移動に伴い、以下のファイル内の参照パスを更新：

- `docs/release_notes/RELEASE_NOTES_v1.1.0.md`
- `docs/feature_spec/wallpaper/WALLPAPER_SPEC_*.md`
- `docs/TASKS_v1.1.0.md`
- `docs/MEMO_FEATURE_SPEC.md`
- `src/services/imageExportService.js`

すべての参照を `docs/feature_spec/wallpaper/card_layout_sample.json` に更新しました。

## ドキュメント更新

### 更新されたファイル

- **`specs/1-soccer-match-calendar/spec.md`**: 参照関係・SSOT定義と新規User Storyを追加
- **`specs/1-soccer-match-calendar/data-model.md`**: データモデルの変更を反映
- **`specs/1-soccer-match-calendar/tasks.md`**: 実装済みタスクを反映
- **`docs/README.md`**: 新しいディレクトリ構造に合わせて更新
- **`docs/feature_spec/*.md`**: `specs/`への参照を追加

## 互換性

- 既存のコード: 影響なし
- 既存のデータ: 影響なし
- 既存機能への影響: なし

---

## バージョン履歴

- **Version 1.1.10** (2026-01-17): ドキュメント構成の整理、SSOT定義の明確化
- **Version 1.1.6** (2026-01-17): 待ち受け画面画像生成への応援クラブ反映
- **Version 1.1.5** (2026-01-16): 応援クラブ機能の追加、クラブカラー読み込みの改善、UIの改善
- **Version 1.1.4** (2026-01-15): 試合予定の削除機能、メニュー構造の再編成
- **Version 1.1.3** (2026-01-14): 手動追加機能の実装、画像出力機能のレイアウト調整
- **Version 1.1.2** (2026-01-13): メモ機能の改善、画像出力機能の最適化
- **Version 1.1.0**: メモ機能の追加、画像出力機能の実装
- **Version 1.0.2** (2026-01-09): キャンディーバー機能の追加
- **Version 1.0.1** (2026-01-09): UI/UXデザインの大幅な改善
- **Version 1.0.0** (2026-01-09): 初回リリース
