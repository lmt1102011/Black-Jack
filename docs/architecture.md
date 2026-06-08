# Architecture

## Runtime

- Client: React + Vite + TailwindCSS + Framer Motion.
- Backend: Express + Socket.IO.
- Shared package: Blackjack constants, cards, hand scoring, settlement, catalogs.
- Firebase: Authentication on the client, Admin token verification and trusted Firestore writes on the backend.

## Authority Model

The backend owns every security-sensitive decision:

- Shoe creation and shuffling.
- Card drawing.
- Turn validation.
- Blackjack outcomes.
- Insurance, surrender, double, split validation.
- Payouts.
- XP, rank points, and chip balances.

The client renders table snapshots and sends player intent only.

## Socket Events

Client to server:

- `lobby:list`
- `table:quickMatch`
- `table:createPrivate`
- `table:join`
- `table:joinCode`
- `table:spectate`
- `table:leave`
- `game:bet`
- `game:action`
- `chat:message`

Server to client:

- `lobby:update`
- `table:state`
- `table:error`
- `ui:toast`
- `chat:message`

## Scaling Path

The starter server keeps tables in process memory for simple deployment. For multi-instance production:

1. Add the Socket.IO Redis adapter.
2. Store table snapshots in Redis with short TTLs.
3. Persist match results and economy deltas to Firestore from backend-only services.
4. Move matchmaking into a queue-backed service.
5. Add regional namespaces and latency-aware table selection.
