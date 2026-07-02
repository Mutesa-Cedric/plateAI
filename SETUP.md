# PlateAI — Setup Guide

## Quick Start

```bash
git clone <repo-url>
cd plateAI
./setup.sh   # one-time setup
./start.sh   # start both services
```

That's it. The private gRPC core and public Express server start with coloured, prefixed logs in a single terminal window.

---

## Prerequisites

| Tool | Minimum version | Check |
|------|-----------------|-------|
| Python | 3.10 | `python3 --version` |
| Node.js | 18 | `node -v` |
| npm | 9 | `npm -v` |

No Docker, no global installs, no database server required by default.

---

## What `setup.sh` Does

1. Creates a Python virtual environment at `core/venv/`, installs `core/requirements.txt`, and generates gRPC stubs from `proto/ai.proto`.
2. Runs `npm install` inside `server/`.
3. Creates `core/.env` and `server/.env` from the bundled examples (skips if they already exist).
4. **Detects which database to use** (see below) and runs the appropriate Prisma migration.
5. Seeds the database with a demo user account.
6. Creates `core/.env` / `server/.env` from examples when missing (includes gRPC defaults). **Existing** env files are left unchanged — re-check `GRPC_HOST` / `GRPC_PORT` (core) and `CORE_GRPC_URL` (server) manually after upgrades.

---

## Database — SQLite vs PostgreSQL

### Default: SQLite (no setup needed)

`server/.env` ships with:

```env
DATABASE_URL=file:./dev.db
```

`setup.sh` detects this and uses `server/prisma/schema.sqlite.prisma` automatically.  
The database file is created at `server/dev.db` on first run.

### Switching to PostgreSQL

1. Edit `server/.env` and replace the `DATABASE_URL` line:

   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/plateai
   ```

2. Re-run `./setup.sh`. It will detect the `postgresql://` prefix, verify the connection, and apply the main `server/prisma/schema.prisma` (PostgreSQL).

If PostgreSQL is set in `.env` but the server is not reachable when `setup.sh` runs, the script automatically falls back to SQLite and logs a warning. Update `.env` and re-run `setup.sh` once PostgreSQL is available.

### Schema files

| File | Used when |
|------|-----------|
| `server/prisma/schema.prisma` | `DATABASE_URL` starts with `postgresql://` |
| `server/prisma/schema.sqlite.prisma` | `DATABASE_URL` starts with `file:` (default) |

Both schemas define identical models. SQLite stores enums as `TEXT`; Prisma maps them transparently.

---

## Environment Variables

### `core/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key — used by all LLM features (diet check, chat, advisor, cook) |
| `TEXT_TO_SPEECH_IBM_API_KEY` | For TTS | IBM Watson TTS API key |
| `TEXT_TO_SPEECH_IBM_URL` | For TTS | IBM Watson TTS service URL |
| `SPEECH_TO_TEXT_IBM_API_KEY` | For STT | IBM Watson STT API key |
| `SPEECH_TO_TEXT_IBM_URL` | For STT | IBM Watson STT service URL |
| `GRPC_HOST` | No | Bind host for the private gRPC server. Default: `127.0.0.1` (loopback only) |
| `GRPC_PORT` | No | gRPC port. Default: `50051` |
| `DEBUG` | No | Reserved for verbose logging |

The core service **will start** without API keys, but AI RPCs that need Groq/IBM will fail until they are filled in.

**Core must not be exposed publicly.** Prefer `GRPC_HOST=127.0.0.1` so only co-located processes (the Express server) can connect.

### `server/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Port for the Express server. Default: `8000` |
| `SECRET` | Yes | JWT signing secret. **Change this before going to production.** Generate one with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `DATABASE_URL` | Yes | Database connection string. SQLite: `file:./dev.db`. PostgreSQL: `postgresql://user:pass@host:5432/dbname` |
| `CORE_GRPC_URL` | No | Address of the private core gRPC worker. Default: `127.0.0.1:50051` |

---

## Health Checks

Once both services are running, verify them:

```bash
curl http://localhost:8000/health
# {"status":"ok","service":"server","core_grpc":"127.0.0.1:50051"}

curl http://localhost:8000/ai/health
# {"status":"ok","service":"server","core":{"status":"ok","service":"core"}, ...}
```

AI features for clients always go through the public server (`/ai/*`). Core has **no public HTTP port**.

---

## Seed Data

`setup.sh` creates one demo account:

| Field | Value |
|-------|-------|
| Email | `demo@plateai.com` |
| Password | `password123` |
| Purpose | MAINTAIN |

To re-seed manually (e.g. after resetting the database):

```bash
cd server && npm run seed
```

---

## Service Ports

| Service | Port | Access |
|---------|------|--------|
| Core (private gRPC) | `50051` on `127.0.0.1` | **Server only** — not for mobile/web |
| Server (Express) | `8000` | Public API (`/auth`, `/meals`, `/ai`) |

---

## Running Services Separately

If you need to run each service in its own terminal:

```bash
# Terminal 1 — private core (gRPC)
cd core
source venv/bin/activate
python app.py

# Terminal 2 — public server
cd server
npm run dev
```

---

## Troubleshooting

### `npm run dev` fails immediately

The `dev` script uses `ts-node-dev`. If you see a TypeScript parse error, check that `server/node_modules` exists (`npm install` inside `server/`).

### Prisma error: "Can't reach database server"

Your `DATABASE_URL` points to PostgreSQL but it's not running. Either start PostgreSQL, or set `DATABASE_URL=file:./dev.db` in `server/.env` and re-run `./setup.sh`.

### IBM Watson / Groq errors

Core starts without API keys, but RPCs that need Groq/IBM fail. Clients see errors on `POST /ai/*`. Fill in the relevant keys in `core/.env` and restart.

### `/ai/health` returns degraded / core_error

Express is up but cannot reach the private gRPC core. Ensure `./start.sh` (or `python app.py` in `core/`) is running and `CORE_GRPC_URL` in `server/.env` matches `GRPC_HOST:GRPC_PORT` in `core/.env` (default `127.0.0.1:50051`).

### Port already in use

Something else is on port `8000` (HTTP) or `50051` (gRPC). Change `PORT` / `CORE_GRPC_URL` / `GRPC_PORT` accordingly, or stop the conflicting process.

### `./setup.sh: Permission denied`

```bash
chmod +x setup.sh start.sh
```
