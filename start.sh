#!/usr/bin/env bash
# PlateAI — start both services
# Usage: ./start.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Colours ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

fatal() { echo -e "${RED}[error]${NC} $*"; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────
[[ ! -d "$REPO_ROOT/core/venv" ]] && \
    fatal "core/venv not found. Run ./setup.sh first."

[[ ! -d "$REPO_ROOT/server/node_modules" ]] && \
    fatal "server/node_modules not found. Run ./setup.sh first."

[[ ! -f "$REPO_ROOT/core/.env" ]] && \
    fatal "core/.env not found. Run ./setup.sh first."

[[ ! -f "$REPO_ROOT/server/.env" ]] && \
    fatal "server/.env not found. Run ./setup.sh first."

mkdir -p "$REPO_ROOT/.logs" "$REPO_ROOT/audio"

# ── Output helpers ────────────────────────────────────────────
# Prefix every line from a service with a coloured tag.
# Usage: tag_output "LABEL" "\033[colour_code]" < pipe
tag_output() {
    local label="$1" color="$2"
    while IFS= read -r line; do
        printf "%b[%-6s]%b %s\n" "$color" "$label" "$NC" "$line"
    done
}

# ── Start core ────────────────────────────────────────────────
(
    cd "$REPO_ROOT/core"
    # shellcheck source=/dev/null
    source venv/bin/activate
    # config.py calls load_dotenv() — no need to source .env here.
    exec python app.py
) 2>&1 | tag_output "core" "$BLUE" &
CORE_PIPE_PID=$!

# ── Start server ──────────────────────────────────────────────
(
    cd "$REPO_ROOT/server"
    exec npm run dev
) 2>&1 | tag_output "server" "$CYAN" &
SERVER_PIPE_PID=$!

# ── Print service info ────────────────────────────────────────
echo ""
echo -e "${BOLD}PlateAI is starting...${NC}"
echo ""
echo -e "  ${BOLD}Core${NC}   → http://localhost:5000"
echo -e "  ${BOLD}Server${NC} → http://localhost:8000"
echo ""
echo -e "  ${BOLD}Health:${NC}"
echo -e "    curl http://localhost:5000/health"
echo -e "    curl http://localhost:8000/health"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services.${NC}"
echo ""

# ── Graceful shutdown ─────────────────────────────────────────
cleanup() {
    trap '' INT TERM   # prevent re-entry
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    # Kill our entire process group — catches both the subshells and
    # the Python / Node children they spawned.
    kill -- -$$ 2>/dev/null || true
    wait 2>/dev/null || true
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

trap cleanup INT TERM

# Wait for both background pipe processes; when either exits (crash /
# Ctrl-C) the trap fires and cleans up the other.
wait $CORE_PIPE_PID $SERVER_PIPE_PID
