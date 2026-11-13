# SecondLook

A React app that helps students revisit mathematical reasoning through a guided demo and screen-sharing feedback.

## Development

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

The landing page, interactive examples, and local screen-sharing preview work without credentials. Screen sharing requires HTTPS (or localhost), a supported desktop browser, and permission from the browser and operating system. Live AI analysis and AI summaries require the relevant provider keys. Copy `.env.example` to `.env.local` for local development. Vite exposes `VITE_` variables to browsers; use restricted development credentials and never include private keys in a public deployment. Existing imported credentials are preserved only in ignored `.env.private`, which Vite does not load automatically.

```sh
npm run build
npm run preview
```

Run screen-sharing regression checks with `node --test tests/screenShare.test.js`.

## GitHub Pages

The Pages workflow builds and deploys pushes to `main`, and can also be run manually on another branch. In repository Settings → Pages, select **GitHub Actions** as the source. The public build includes no provider keys, so live AI features require a separate authenticated backend before public use.
