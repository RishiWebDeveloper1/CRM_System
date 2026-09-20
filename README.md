# SupportDesk CRM

A customer support ticket management system built for the Datastraw intern assessment.

## What it does

Lets a support team create, track, and resolve customer tickets — with search, status filtering, priority levels, and an activity note thread on each ticket.

## Tech choices

- **React + Vite** for the frontend — fast dev experience, no overhead
- **Node.js + Express** as the backend, deployed as Vercel serverless functions (the `api/` folder). This way both frontend and backend live in one repo and one Vercel project — no separate backend deployment needed
- **MongoDB Atlas** (free M0 cluster) for the database — flexible schema, cloud-hosted, zero infra to manage
- **JWT** for auth — stateless, works well with serverless since there's no session store to worry about
- **Tailwind CSS** for styling — fast to write, consistent dark theme

I skipped Supabase (even though it would've been simpler) because I wanted to practice the full JWT + Express auth flow — feels more production-relevant.

## Running locally

```bash
# 1. Clone and install
git clone <repo-url>
cd crm-system
npm install

# 2. Set up environment variables
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET

# 3. Run the API (in one terminal)
npm run dev:api

# 4. Run the frontend (in another terminal)
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:3001

## Deploying to Vercel

```bash
npm i -g vercel
vercel
# Set env vars in Vercel dashboard: MONGO_URI, JWT_SECRET
```

The `vercel.json` routes `/api/*` to the serverless Express handler automatically.

## Folder structure

```
api/
  index.js      ← Express app (all routes + models)
  server.js     ← Local dev server (not used in prod)
src/
  pages/        ← Login, Dashboard, TicketPage
  components/   ← Sidebar, CreateTicketModal, Badges, PrivateRoute
  context/      ← AuthContext (JWT state)
  lib/          ← Axios instance with JWT interceptor
```

## Features

- Register / Login with JWT auth
- Create tickets (name, email, subject, description, priority)
- List all tickets — sortable, searchable, filterable by status
- View full ticket detail with activity notes
- Update status (Open → In Progress → Closed) in one click
- Add agent notes to a ticket thread
- Responsive layout

## Known limitations / what I'd add with more time

- No role-based access — all agents can see all tickets. Would add an `assigned_to` field and filter by agent
- Search is a MongoDB regex scan — works fine for small data, would switch to Atlas Search for scale
- No email notifications when ticket status changes
- No pagination — limited to 100 tickets for now, easy to add with `?page=&limit=`
- Cloudinary image attachments — planned but cut from MVP to keep scope tight

## Challenges

The main one was getting Vercel to route API calls correctly in a monorepo setup. The `vercel.json` rewrite config is the key — without it Vite catches the `/api/*` routes and throws 404s.
