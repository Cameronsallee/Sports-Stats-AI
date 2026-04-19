# BetPulse — AI Sports Betting Tracker

## Overview

A full-stack sports betting behavioral analytics platform. Users track bets, monitor bankroll health, and receive AI-powered analysis of their betting psychology and patterns.

**Not a picks platform** — BetPulse only analyzes behavior (tilt, chasing losses, overconfidence, bankroll discipline). It never suggests bets.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (jsonwebtoken + bcryptjs), stored in localStorage
- **AI**: OpenAI via Replit AI Integrations (`gpt-5.2`)
- **Frontend**: React + Vite + Tailwind + shadcn/ui

## Features

- User registration & login (email/password, JWT)
- Bet tracking (sport, bet type, teams, odds, stake, result, notes)
- Automatic P&L calculation and bankroll tracking
- Betting stats: win rate, ROI, average odds, P&L by sport, streak
- AI behavior insights: risk score, tilt detection, chasing losses detection, overconfidence detection, bankroll discipline score, 3 improvement rules

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## DB Schema

- `users` — id, email, password_hash, created_at
- `bets` — id, user_id, sport, bet_type, teams, odds, stake, result, profit_loss, notes, created_at
- `bankroll` — user_id, starting_bankroll, current_bankroll

## API Routes

All routes under `/api`:
- `POST /auth/register` — register user
- `POST /auth/login` — login user
- `GET /auth/me` — get current user (auth required)
- `GET /bets` — list user's bets (filterable by sport/result)
- `POST /bets` — create bet
- `PATCH /bets/:id` — update bet
- `DELETE /bets/:id` — delete bet
- `GET /bankroll` — get bankroll
- `PUT /bankroll` — set starting bankroll
- `GET /stats` — betting stats summary
- `GET /insights` — AI behavior insights (generated via OpenAI)

## Pages

- `/login` — email/password login
- `/register` — create account
- `/dashboard` — bankroll overview, stats, recent bets
- `/bets` — full bet list, add/edit/delete bets
- `/insights` — AI behavior analysis

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
