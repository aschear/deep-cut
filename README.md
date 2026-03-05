# Deep Cut

Point your phone at a song. Read its story.

Deep Cut is a mobile-first web app that identifies music playing nearby and generates a rich editorial "Behind the Music" page using Claude. Tap once, listen for ~9 seconds, and get a beautifully written piece covering the band's history, the story behind the song, critical reception, any controversies, and deep trivia.

---

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** — dark editorial aesthetic
- **AudD API** — audio fingerprinting / song identification
- **Anthropic API** (`claude-sonnet-4-20250514`) — editorial content generation
- **Google Fonts** — Playfair Display (titles), Lora (body), DM Sans (UI)

---

## Local Development

### 1. Clone and install

```bash
git clone <repo-url>
cd deep-cut
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your keys:

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |
| `AUDD_API_KEY` | [dashboard.audd.io](https://dashboard.audd.io/) |

> **No AudD key?** Leave `AUDD_API_KEY` blank. The app will return a mock song ("Night Drive" by Dream Division) so you can develop and test the full UI flow without a paid key.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> ⚠️ **Microphone access requires HTTPS in production.** In local development, `localhost` is treated as a secure context by most browsers, so mic capture works. On any other domain, HTTPS is mandatory — Render provides this automatically.

---

## Deployment on Render

1. Push this repo to GitHub.
2. In the Render dashboard, create a new **Web Service** pointing to your repo.
3. Set the following:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Add your environment variables (`ANTHROPIC_API_KEY`, `AUDD_API_KEY`) in the Render **Environment** tab.
5. Deploy.

Render provides HTTPS automatically — microphone access will work on mobile browsers out of the box.

---

## Project Structure

```
deep-cut/
├── app/
│   ├── layout.tsx              # Root layout (fonts, metadata, viewport)
│   ├── page.tsx                # Listen screen
│   ├── globals.css             # Tailwind base + safe-area utilities
│   ├── deep-cut/
│   │   └── page.tsx            # Editorial result page
│   └── api/
│       ├── identify/route.ts   # AudD fingerprinting (server-side)
│       └── generate/route.ts   # Claude content generation (server-side)
├── components/
│   ├── ListenButton.tsx        # MediaRecorder capture + API orchestration
│   ├── LoadingState.tsx        # Full-width animated waveform
│   ├── DeepCutPage.tsx         # Editorial page with blurred album art bg
│   ├── SectionBlock.tsx        # Reusable header + prose section
│   └── ErrorState.tsx          # Editorial error messaging
├── lib/
│   ├── types.ts                # Shared TypeScript interfaces
│   ├── audd.ts                 # AudD API client (with mock fallback)
│   └── claude.ts               # Anthropic client + JSON validation
└── .env.local.example
```

---

## Browser Compatibility Notes

- **MediaRecorder API** is supported in all modern mobile browsers (Chrome, Safari 14.5+, Firefox).
- **Safari on iOS** supports `audio/mp4` as a MIME type. The app auto-detects the best available format and falls back gracefully.
- **Microphone permission** is prompted on first tap. If denied, the app shows a clear error message with instructions to re-enable in browser settings.

---

## Adding Your AudD Key

Once you have a key from [dashboard.audd.io](https://dashboard.audd.io/):

1. Add it to `.env.local`: `AUDD_API_KEY=your_key`
2. Restart the dev server.

The mock fallback is only active when the key is absent — it will never run in production if the key is set.
