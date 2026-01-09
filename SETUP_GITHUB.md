# GitHubリポジトリ設定手順

## 1. GitHubでリポジトリを作成

1. GitHubにログイン
2. 右上の「+」→「New repository」をクリック
3. リポジトリ情報を入力:
   - **Repository name**: `calender_app_j123`（または任意の名前）
   - **Description**: サッカー試合予定カレンダーアプリケーション
   - **Visibility**: Public または Private（どちらでも可）
   - **Initialize this repository with**: チェックを外す（既存のコードがあるため）
4. 「Create repository」をクリック

## 2. ローカルリポジトリの準備

### 2.1 変更をコミット

```bash
# 変更をステージング
git add .

# コミット
git commit -m "Version 1.0.0: 初回コミット - PWA対応、GitHub Pagesデプロイ設定"
```

### 2.2 リモートリポジトリの設定

GitHubで作成したリポジトリのURLを使用してリモートを設定します。

**HTTPSの場合:**
```bash
git remote add origin https://github.com/[username]/calender_app_j123.git
```

**SSHの場合:**
```bash
git remote add origin git@github.com:[username]/calender_app_j123.git
```

`[username]` はあなたのGitHubユーザー名に置き換えてください。

### 2.3 既存のリモートがある場合

既存のリモートを削除してから新規設定:

```bash
# 既存のリモートを確認
git remote -v

# 既存のリモートを削除（必要な場合）
git remote remove origin

# 新しいリモートを追加
git remote add origin https://github.com/[username]/calender_app_j123.git
```

## 3. コードをプッシュ

```bash
# メインブランチにプッシュ
git push -u origin 1-soccer-match-calendar

# または、mainブランチを作成してプッシュ
git checkout -b main
git push -u origin main
```

**注意**: GitHub Pagesのデプロイワークフローは `main` または `master` ブランチを想定しています。
`1-soccer-match-calendar` ブランチを使用する場合は、`.github/workflows/deploy.yml` の `branches` を変更してください。

## 4. GitHub Pagesの設定

1. GitHubリポジトリの **Settings** → **Pages** に移動
2. **Source**: "GitHub Actions" を選択
3. 保存

## 5. デプロイの確認

1. リポジトリの **Actions** タブでデプロイの進行状況を確認
2. デプロイ完了後、以下のURLでアクセス可能:
   - `https://[username].github.io/calender_app_j123/`

## トラブルシューティング

### リモートが正しく設定されていない

```bash
# リモートを確認
git remote -v

# リモートを削除して再設定
git remote remove origin
git remote add origin https://github.com/[username]/calender_app_j123.git
```

### ブランチ名が異なる場合

`.github/workflows/deploy.yml` の `branches` セクションを編集:

```yaml
on:
  push:
    branches:
      - 1-soccer-match-calendar  # 実際のブランチ名に変更
```

### baseパスの確認

リポジトリ名が `calender_app_j123` 以外の場合、`vite.config.js` の `getBasePath()` 関数を確認してください。
