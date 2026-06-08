# Deployment Guide

## Backend on Render

1. Create a Render web service from this GitHub repository.
2. Render will read `render.yaml`.
3. Set these environment variables:
   - `CLIENT_ORIGIN`: the deployed frontend URL.
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_DATABASE_URL` optional.
4. Deploy.

The backend exposes:

- `GET /health`
- `GET /api/tables`
- Socket.IO namespace on the default path.

## Frontend

Build the client:

```bash
npm run build --workspace client
```

Deploy `client/dist` to Firebase Hosting, Netlify, Vercel, Cloudflare Pages, or any static host.

Set client environment variables:

- `VITE_API_URL`: deployed backend URL.
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Scaling Notes

Socket.IO rooms are in memory in this starter implementation. For multiple Render instances, add the official Redis adapter and store table snapshots in Firestore or Redis. Keep the backend authoritative for all cards, shuffles, balance changes, and rewards.
