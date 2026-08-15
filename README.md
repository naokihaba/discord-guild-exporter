# Guild Exporter

Discord公式OAuth2の `guilds` スコープだけを使い、参加サーバーの基本情報を確認してJSONで保存できるVite+ / Vue 3アプリです。Botの追加は不要です。

## セットアップ

TypeScriptを直接実行できるNode.js 24以上と[Vite+](https://viteplus.dev/)を使用します。

```bash
cp .env.example .env
vp install
```

Discord Developer PortalでApplicationを作成し、**OAuth2 → Redirects** に次を追加して保存します。

```text
http://localhost:5173/api/auth/callback
```

`.env` に同じApplicationの値を設定します。

```dotenv
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
APP_ORIGIN=http://localhost:5173
DISCORD_REDIRECT_URI=http://localhost:5173/api/auth/callback
```

Client Secretはサーバー側でのみ使用され、ブラウザのバンドルには含まれません。

## 開発

```bash
vp dev
```

表示されたURLを開き、`Discordでリストを読み込む` を選択します。

```bash
vp check
vp test
vp build
```

## 本番実行

ビルド後、公開URLに合わせて環境変数とDiscord Developer PortalのRedirectを更新します。

```dotenv
APP_ORIGIN=https://example.com
DISCORD_REDIRECT_URI=https://example.com/api/auth/callback
```

```bash
vp build
vp run start
```

公開環境ではHTTPSを使用してください。取得結果はサーバーメモリに最大10分間だけ保持され、アクセストークンは保存せず、取得後にDiscordへ失効を要求します。複数インスタンスで運用する場合は、同じ短いTTLを持つ共有セッションストアへ差し替えてください。

## 出力

```json
[
  {
    "id": "...",
    "name": "Vue Land",
    "icon": "...",
    "owner": false
  }
]
```

サーバー名やIDも公開範囲に注意し、必要な相手にだけ共有してください。このプロジェクトはDiscord非公式ツールです。
