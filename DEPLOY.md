# GitHub Pagesへのデプロイ手順

## 前提条件

- GitHubリポジトリが作成されていること
- リポジトリにコードがプッシュされていること

## デプロイ方法

### 方法1: GitHub Actions（推奨・自動デプロイ）

1. **リポジトリの設定**
   - GitHubリポジトリの Settings → Pages に移動
   - Source: "GitHub Actions" を選択
   - 保存

2. **baseパスの確認**
   - `vite.config.js` の `base` 設定を確認
   - リポジトリ名が `username/repo-name` の場合、baseパスは `/repo-name/` になります
   - カスタムドメインを使用する場合は、`base: '/'` に設定してください

3. **デプロイの実行**
   - `main` または `master` ブランチにプッシュすると、自動的にデプロイが開始されます
   - Actions タブでデプロイの進行状況を確認できます

4. **デプロイ完了**
   - デプロイが完了すると、`https://username.github.io/repo-name/` でアクセスできます

### 方法2: 手動デプロイ（gh-pages）

1. **gh-pagesのインストール**
   ```bash
   npm install -g gh-pages
   ```

2. **ビルド**
   ```bash
   npm run build
   ```

3. **デプロイ**
   ```bash
   gh-pages -d dist
   ```

4. **GitHubリポジトリの設定**
   - Settings → Pages
   - Source: `gh-pages` ブランチを選択

## baseパスの設定

GitHub Pagesは通常、リポジトリ名をサブディレクトリとして使用します。

### リポジトリ名が `calender_app_j123` の場合

`vite.config.js` で以下のように設定：

```javascript
base: '/calender_app_j123/'
```

### カスタムドメインを使用する場合

`vite.config.js` で以下のように設定：

```javascript
base: '/'
```

また、`public/CNAME` ファイルを作成して、カスタムドメインを指定：

```
yourdomain.com
```

## トラブルシューティング

### 404エラーが発生する

- baseパスが正しく設定されているか確認
- リポジトリ名とbaseパスが一致しているか確認

### Service Workerが動作しない

- HTTPS環境であることを確認（GitHub Pagesは自動的にHTTPS）
- baseパスが正しく設定されているか確認

### アセットが読み込まれない

- ビルド後の `dist/` ディレクトリの構造を確認
- baseパスが正しく設定されているか確認

## デプロイ後の確認事項

- [ ] アプリが正常に表示される
- [ ] マスタデータが読み込まれる
- [ ] Service Workerが登録される（開発者ツールのApplicationタブで確認）
- [ ] PWAとしてインストールできる（モバイルブラウザで確認）
- [ ] オフラインで動作する

## 参考リンク

- [GitHub Pages公式ドキュメント](https://docs.github.com/ja/pages)
- [Vite Deploy Guide](https://vitejs.dev/guide/static-deploy.html#github-pages)
