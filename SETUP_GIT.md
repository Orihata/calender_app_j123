# Gitリポジトリ設定手順

## 状況

- 親ディレクトリ（`/home/yobata/Project`）でGitが初期化されていた
- `calender_app_j123`を独立したGitリポジトリとして管理する必要がある

## 解決手順

### 1. `calender_app_j123`内でGitリポジトリを初期化

```bash
cd /home/yobata/Project/calender_app_j123
git init
```

### 2. すべてのファイルをステージング

```bash
git add .
```

### 3. 初回コミット

```bash
git commit -m "Version 1.0.0: 初回コミット - サッカー試合予定カレンダーアプリケーション"
```

### 4. ブランチ名を確認・設定

```bash
# 現在のブランチを確認
git branch

# 必要に応じてブランチ名を変更
git branch -M main
# または
git branch -M 1-soccer-match-calendar
```

### 5. リモートリポジトリを設定

```bash
# GitHubリポジトリのURLを設定
git remote add origin https://github.com/[username]/calender_app_j123.git

# リモートを確認
git remote -v
```

### 6. プッシュ

```bash
git push -u origin main
# または
git push -u origin 1-soccer-match-calendar
```

## 親ディレクトリのGitリポジトリについて

親ディレクトリ（`/home/yobata/Project`）のGitリポジトリから`calender_app_j123`を除外する場合：

```bash
cd /home/yobata/Project

# .gitignoreに追加
echo "calender_app_j123/" >> .gitignore

# 既に追跡されている場合は削除
git rm -r --cached calender_app_j123
git commit -m "Remove calender_app_j123 from parent repository"
```

## 注意事項

- `calender_app_j123`は独立したGitリポジトリとして管理されます
- 親ディレクトリのGitリポジトリとは別物です
- GitHub Pagesのデプロイは`calender_app_j123`リポジトリに対して行われます
