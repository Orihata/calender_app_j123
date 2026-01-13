# HashRouterへの変更

## 変更内容

`BrowserRouter`から`HashRouter`に変更しました。

## 変更理由

PWA（Progressive Web App）として動作する際、`BrowserRouter`を使用すると、ページ遷移時にURLが変化し、PWA画面から外部ブラウザが立ち上がってしまう問題が発生していました。

`HashRouter`を使用することで、URLは`#`を使った形式（例: `/#/import`）になり、PWA内でページ遷移が可能になります。

## 変更ファイル

- `src/App.jsx`: `BrowserRouter` → `HashRouter`

## URL形式の違い

### BrowserRouter（変更前）
- カレンダー: `https://orihata.github.io/calender_app_j123/`
- CSVインポート: `https://orihata.github.io/calender_app_j123/import`
- 観戦予定: `https://orihata.github.io/calender_app_j123/attendance`
- 設定: `https://orihata.github.io/calender_app_j123/settings`

### HashRouter（変更後）
- カレンダー: `https://orihata.github.io/calender_app_j123/#/`
- CSVインポート: `https://orihata.github.io/calender_app_j123/#/import`
- 観戦予定: `https://orihata.github.io/calender_app_j123/#/attendance`
- 設定: `https://orihata.github.io/calender_app_j123/#/settings`

## 動作確認

1. 開発サーバーで確認:
   ```bash
   npm run dev
   ```
   - ブラウザで`http://localhost:5173/#/`にアクセス
   - ナビゲーションでページ遷移が正常に動作することを確認

2. ビルドして確認:
   ```bash
   npm run build
   npm run preview
   ```
   - PWAとしてインストール
   - ページ遷移時に外部ブラウザが開かないことを確認

## 注意事項

- `location.pathname`は`/import`のままです（`#`は含まれません）
- ブラウザの戻る/進むボタンは正常に動作します
- ブックマークや共有URLには`#`が含まれますが、PWAでは問題ありません
