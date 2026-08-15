# Guild Exporter

Guild Exporter is a Vite+ and Vue 3 application that uses only Discord's official OAuth2 `guilds` scope. It lets you review basic information about the servers you have joined and export the results as JSON—without adding a bot to any server.

## Setup

This project requires Node.js 24 or later, which can run TypeScript directly, and [Vite+](https://viteplus.dev/).

```bash
cp .env.example .env
vp install
```

Create an application in the Discord Developer Portal. Under **OAuth2 → Redirects**, add and save the following URL:

```text
http://localhost:5173/api/auth/callback
```

Add the credentials from the same Discord application to `.env`:

```dotenv
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
APP_ORIGIN=http://localhost:5173
DISCORD_REDIRECT_URI=http://localhost:5173/api/auth/callback
```

The client secret is used only on the server and is never included in the browser bundle.

## Development

Start the development server:

```bash
vp dev
```

Open the displayed URL and select **Discordでリストを読み込む** ("Load the list with Discord").

Run the project checks with:

```bash
vp check
vp test
vp build
```

## Production

After building the application, update the environment variables and the redirect URL in the Discord Developer Portal to match your public URL:

```dotenv
APP_ORIGIN=https://example.com
DISCORD_REDIRECT_URI=https://example.com/api/auth/callback
```

Build and start the production server:

```bash
vp build
vp run start
```

Always use HTTPS in production. Exported server data is held in server memory for no more than 10 minutes. Access tokens are never stored, and the application asks Discord to revoke each token after retrieving the server list.

For a multi-instance deployment, replace the in-memory session store with a shared session store that uses the same short TTL.

## Output

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

Server names and IDs may be sensitive. Share exported data only with people you trust.

Guild Exporter is an independent project and is not affiliated with Discord.
