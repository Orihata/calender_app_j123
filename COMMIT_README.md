# 初回コミット手順

## 現在の状態

✅ `calender_app_j123`内で独立したGitリポジトリを初期化しました
✅ ブランチ: `main`
✅ コミット履歴: なし（新規リポジトリ）

## 次のステップ

### 1. すべてのファイルをステージング

```bash
cd /home/yobata/Project/calender_app_j123
git add .
```

### 2. 初回コミット

```bash
git commit -m "Version 1.0.0: 初回コミット - サッカー試合予定カレンダーアプリケーション

- CSVインポート機能
- カレンダー表示機能
- 観戦予定管理（現地観戦予定・放送視聴予定）
- PWA対応（オフライン動作、ホーム画面インストール）
- マスタデータ自動読み込み
- GitHub Pagesデプロイ設定"
```

### 3. リモートリポジトリを設定

GitHubでリポジトリを作成後：

```bash
git remote add origin https://github.com/[username]/calender_app_j123.git
```

### 4. プッシュ

```bash
git push -u origin main
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

## 確認事項

- [ ] `calender_app_j123`内で独立したGitリポジトリが初期化されている
- [ ] `.gitignore`が適切に設定されている
- [ ] 大きなファイル（100MB以上）が含まれていない
- [ ] GitHubリポジトリが作成されている
- [ ] リモートリポジトリが設定されている
