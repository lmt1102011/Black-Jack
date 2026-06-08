# AAA Online Blackjack

A production-oriented online multiplayer Blackjack web game scaffold built with React, Vite, TailwindCSS, Framer Motion, Node.js, Express, Socket.IO, and Firebase.

The project is designed for social casino play only. It does not support real-money gambling, deposits, withdrawals, or cash-out.

## Features

- Server-authoritative Blackjack rules: hit, stand, double down, split, surrender, insurance, blackjack, push, bust.
- Real-time public and private tables with room codes, spectators, chat, reconnect-friendly table snapshots, and live lobby counts.
- Firebase Authentication-ready client with guest fallback for local development.
- Firebase Admin integration-ready backend with guest fallback when credentials are not configured.
- Premium responsive casino UI for desktop, tablet, and mobile.
- Economy, missions, battle pass, achievements, leaderboard, friends, profile, settings, and admin panel surfaces.
- Firestore schema guide, security rules, Render deployment config, and environment examples.

## Quick Start

```bash
npm install
npm run dev
```

The app runs on:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Environment

Copy the example files before deploying:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Firebase is optional for local guest play. Configure it when you want real accounts, token validation, Firestore persistence, analytics, and storage.

## Deployment

Render can deploy the backend using `render.yaml`. The frontend can be deployed to Firebase Hosting, Netlify, Vercel, or any static host after `npm run build --workspace client`.

See [docs/deployment.md](docs/deployment.md) for production setup notes.
