# PlateAI — Setup Guide

## Quick Start

```bash
git clone <repo-url>
cd plateAI
./setup.sh   # one-time setup
./start.sh   # start both services
```

That's it. Both services start with coloured, prefixed logs in a single terminal window.

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

1. Creates a Python virtual environment at `core/venv/` and installs `core/requirements.txt`.
2. Runs `npm install` inside `server/`.
3. Creates `core/.env` and `server/.env` from the bundled examples (skips if they already exist).
4. **Detects which database to use** (see below) and runs the appropriate Prisma migration.
5. Seeds the database with a demo user account.
6. Creates the shared `audio/` directory used by the TTS service.

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
| `DEBUG` | No | `True` (default) enables Flask debug mode and auto-reload |
| `AUDIO_FOLDER` | No | Path for generated audio files. Default: `../audio` |

The core service **will start** without API keys, but AI endpoints will return errors until they are filled in.

### `server/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Port for the Express server. Default: `8000` |
| `SECRET` | Yes | JWT signing secret. **Change this before going to production.** Generate one with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `DATABASE_URL` | Yes | Database connection string. SQLite: `file:./dev.db`. PostgreSQL: `postgresql://user:pass@host:5432/dbname` |

---

## Health Checks

Once both services are running, verify them:

```bash
curl http://localhost:5000/health
# {"status":"ok","service":"core"}

curl http://localhost:8000/health
# {"status":"ok","service":"server"}
```

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

| Service | Port | Base URL |
|---------|------|----------|
| Core (Flask) | 5000 | `http://localhost:5000` |
| Server (Express) | 8000 | `http://localhost:8000` |

---

## Running Services Separately

If you need to run each service in its own terminal:

```bash
# Terminal 1 — core
cd core
source venv/bin/activate
source .env
python app.py

# Terminal 2 — server
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

The service starts without API keys, but calls to `/diet-check`, `/chat`, `/tts`, `/stt`, `/advisor`, and `/cook-for-me` will fail. Fill in the relevant keys in `core/.env` and restart.

### Port already in use

Something else is on port 5000 or 8000. Change `PORT` in `server/.env` or stop the conflicting process.

### `./setup.sh: Permission denied`

```bash
chmod +x setup.sh start.sh
```
