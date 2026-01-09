# PWA baseパス修正

## 問題

GitHub Pagesで`https://orihata.github.io/calender_app_j123`にデプロイした際、PWAとして動作しない問題が発生していました。

原因：
- `manifest.json`の`start_url`が`/`になっていた
- アイコンパスが`/icons/...`になっていた（baseパスを考慮していない）
- Service Worker内のパスがbaseパスを考慮していなかった

## 修正内容

### 1. Viteプラグインの作成

`vite-plugin-manifest.js`を作成し、ビルド時に`manifest.json`のbaseパスを動的に設定するようにしました。

### 2. `index.html`の修正

```html
<!-- 修正前 -->
<link rel="manifest" href="/manifest.json" />

<!-- 修正後 -->
<link rel="manifest" href="%BASE_URL%manifest.json" />
```

### 3. Service Workerの修正

`public/sw.js`でbaseパスを動的に取得するように修正：

```javascript
const BASE_PATH = self.location.pathname.replace(/\/sw\.js$/, '') || '/'
const MASTER_DATA_URL = BASE_PATH + (BASE_PATH.endsWith('/') ? '' : '/') + 'data/master-matches.json'
```

### 4. ビルド確認

```bash
VITE_BASE_PATH=/calender_app_j123/ npm run build
```

ビルド後の`dist/manifest.json`を確認：
- `start_url`: `/calender_app_j123/` ✅
- アイコンパス: `/calender_app_j123/icons/...` ✅

## デプロイ後の確認

1. `https://orihata.github.io/calender_app_j123/`にアクセス
2. 開発者ツールのApplicationタブで確認：
   - Service Workerが登録されているか
   - manifest.jsonが正しく読み込まれているか
   - アイコンパスが正しいか
3. PWAとしてインストールできるか確認

## 注意事項

- GitHub Actionsでビルドする際、`GITHUB_REPOSITORY`環境変数から自動的にbaseパスが設定されます
- ローカルでビルドする場合は、`VITE_BASE_PATH`環境変数でbaseパスを指定できます
