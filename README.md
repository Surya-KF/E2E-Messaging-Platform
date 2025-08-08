Messenger MVP (WhatsApp‑like)

Stack
- Client: Next.js 14 (App Router) + Tailwind
- Server: Node.js + Express + WebSocket (ws)
- DB: Postgres (Prisma)
- Cache/Broker: Redis
- E2E: placeholder (base64). Replace with libsignal for production.

Prereqs
- Docker + Docker Compose
- Node.js 18+

Quick start
1) Start infra
   docker compose up -d

2) Server setup
   cp server/.env.example server/.env
   cd server
   npm install
   npx prisma generate
   npm run prisma:migrate -- --name init
   npm run dev
   # Server: http://localhost:4000, WS at ws://localhost:4000

3) Web setup (new terminal)
   cd web
   echo "NEXT_PUBLIC_API_URL=http://localhost:4000" > .env.local
   npm install
   npm run dev
   # Web: http://localhost:3000

Using the MVP
- Click “Register demo user” to create a random user.
- In “Other user phone”, paste another user’s phone (create a second user in another browser or incognito), then click Send.
- Messages are relayed via WebSocket. Ciphertext is currently base64(plaintext) as a placeholder.

Next steps (E2E)
- Use @signalapp/libsignal-client in the web app to generate identity key, prekeys, sessions.
- Replace send flow to encrypt with recipient’s prekey bundle; store session state client‑side.
- Store only ciphertext on server (already the case), and never send plaintext to server.
- Implement push notifications (VAPID for web, FCM/APNs for mobile later).

Notes
- This repo runs Postgres and Redis with Docker Compose. App processes run on your host for faster DX.
- For production, add Dockerfiles for server/web and extend docker-compose.
