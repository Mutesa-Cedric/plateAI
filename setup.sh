#!/usr/bin/env bash
# PlateAI — one-time setup script
# Usage: ./setup.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Colours ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${BLUE}[setup]${NC}  $*"; }
ok()      { echo -e "${GREEN}[ok]${NC}     $*"; }
warn()    { echo -e "${YELLOW}[warn]${NC}   $*"; }
fatal()   { echo -e "${RED}[error]${NC}  $*"; exit 1; }
section() { echo -e "\n${BOLD}$*${NC}"; }

# ── Prerequisites ─────────────────────────────────────────────
section "Checking prerequisites"

need() { command -v "$1" &>/dev/null || fatal "$1 is required but was not found. Install it and re-run."; }

need python3
need node
need npm
ok "python3 $(python3 --version | cut -d' ' -f2), node $(node -v), npm $(npm -v)"

# ── Core (Python / Flask) ─────────────────────────────────────
section "Setting up core service"

cd "$REPO_ROOT/core"

if [ ! -d "venv" ]; then
    info "Creating Python virtual environment..."
    python3 -m venv venv
    ok "Virtual environment created."
fi

info "Activating venv and installing dependencies..."
# shellcheck source=/dev/null
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
deactivate
ok "Python dependencies installed."

if [ ! -f ".env" ]; then
    cp .env.example .env
    warn "core/.env created from example."
    warn "Fill in your GROQ_API_KEY and IBM Watson keys before using AI features."
    warn "The service will start, but AI endpoints will fail until keys are set."
else
    ok "core/.env already exists — skipping."
fi

# ── Server (Node.js / Express) ────────────────────────────────
section "Setting up server service"

cd "$REPO_ROOT/server"

info "Installing Node.js dependencies..."
npm install --silent
ok "Node.js dependencies installed."

if [ ! -f ".env" ]; then
    cp .env.example .env
    ok "server/.env created from example (SQLite by default)."
else
    ok "server/.env already exists — skipping."
fi

# ── Detect database backend ───────────────────────────────────
section "Detecting database backend"

# Source the .env to read DATABASE_URL (ignore unset vars in .env)
set +u
# shellcheck source=/dev/null
source <(grep -v '^#' "$REPO_ROOT/server/.env" | grep -v '^$' | sed 's/^/export /')
set -u

DB_URL="${DATABASE_URL:-}"
SCHEMA_ARG=""

if [[ -z "$DB_URL" || "$DB_URL" == file:* ]]; then
    info "DATABASE_URL is SQLite (file:) — using schema.sqlite.prisma."
    SCHEMA_ARG="--schema prisma/schema.sqlite.prisma"

    # Ensure DATABASE_URL is set to a file path in .env
    if ! grep -q "^DATABASE_URL=" .env; then
        echo "DATABASE_URL=file:./dev.db" >> .env
    fi

elif [[ "$DB_URL" == postgresql://* || "$DB_URL" == postgres://* ]]; then
    info "DATABASE_URL is PostgreSQL — checking connectivity..."

    # Verify connectivity only when pg_isready is available.
    # If it's not installed, trust the URL — Prisma will report a clear
    # connection error if PostgreSQL is actually unreachable.
    if command -v pg_isready &>/dev/null; then
        if pg_isready -d "$DB_URL" -q 2>/dev/null; then
            ok "PostgreSQL is reachable — using schema.prisma."
        else
            warn "pg_isready reports PostgreSQL is not reachable."
            warn "Check your DATABASE_URL and that PostgreSQL is running, then re-run setup.sh."
            warn "Falling back to SQLite for now."
            if [[ "$(uname)" == "Darwin" ]]; then
                sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL=file:./dev.db|' .env
            else
                sed -i    's|^DATABASE_URL=.*|DATABASE_URL=file:./dev.db|' .env
            fi
            SCHEMA_ARG="--schema prisma/schema.sqlite.prisma"
        fi
    else
        ok "pg_isready not found — trusting DATABASE_URL and proceeding with PostgreSQL schema."
        ok "Prisma will fail with a clear error if the connection is wrong."
    fi
else
    warn "Unrecognised DATABASE_URL format — defaulting to SQLite."
    SCHEMA_ARG="--schema prisma/schema.sqlite.prisma"
fi

# ── Prisma ────────────────────────────────────────────────────
section "Running database migrations"

info "Generating Prisma client..."
# shellcheck disable=SC2086
npx prisma generate $SCHEMA_ARG

info "Pushing schema to database..."
# shellcheck disable=SC2086
npx prisma db push $SCHEMA_ARG --accept-data-loss

ok "Schema applied."

# ── Seed ──────────────────────────────────────────────────────
section "Seeding database"

if npm run seed; then
    ok "Database seeded."
    info "Demo account: demo@plateai.com / password123"
else
    warn "Seed script exited non-zero — if data already exists this is expected."
fi

# ── Audio directory ───────────────────────────────────────────
section "Creating shared directories"

mkdir -p "$REPO_ROOT/audio"
ok "audio/ directory ready."

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}Setup complete!${NC}"
echo ""
echo -e "  Before starting, make sure these files have your real API keys:"
echo -e "    ${BOLD}core/.env${NC}   → GROQ_API_KEY, IBM Watson keys"
echo -e "    ${BOLD}server/.env${NC} → SECRET (change the default!)"
echo ""
echo -e "  Start both services with:"
echo -e "    ${BOLD}./start.sh${NC}"
echo ""
echo -e "  Health checks (once running):"
echo -e "    Core   → http://localhost:5000/health"
echo -e "    Server → http://localhost:8000/health"
echo ""
