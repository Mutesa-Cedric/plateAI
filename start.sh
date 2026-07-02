#!/usr/bin/env bash
# PlateAI — start core (private gRPC) + public Express server
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

[[ ! -f "$REPO_ROOT/core/generated/ai_pb2_grpc.py" ]] && \
    fatal "core gRPC stubs missing. Run ./setup.sh first."

mkdir -p "$REPO_ROOT/.logs"

# ── Output helpers ────────────────────────────────────────────
tag_output() {
    local label="$1" color="$2"
    while IFS= read -r line; do
        printf "%b[%-6s]%b %s\n" "$color" "$label" "$NC" "$line"
    done
}

# ── Start core (private gRPC on loopback) ─────────────────────
(
    cd "$REPO_ROOT/core"
    # shellcheck source=/dev/null
    source venv/bin/activate
    exec python app.py
) 2>&1 | tag_output "core" "$BLUE" &
CORE_PIPE_PID=$!

# ── Start server (public HTTP API) ────────────────────────────
(
    cd "$REPO_ROOT/server"
    exec npm run dev
) 2>&1 | tag_output "server" "$CYAN" &
SERVER_PIPE_PID=$!

# ── Print service info ────────────────────────────────────────
echo ""
echo -e "${BOLD}PlateAI is starting...${NC}"
echo ""
echo -e "  ${BOLD}Core${NC}   → gRPC 127.0.0.1:50051  ${YELLOW}(private — server only)${NC}"
echo -e "  ${BOLD}Server${NC} → http://localhost:8000  ${GREEN}(public API for clients)${NC}"
echo ""
echo -e "  ${BOLD}Health:${NC}"
echo -e "    curl http://localhost:8000/health"
echo -e "    curl http://localhost:8000/ai/health"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services.${NC}"
echo ""

cleanup() {
    trap '' INT TERM
    echo ""
    echo -e "${YELLOW}Stopping all services...${NC}"
    kill -- -$$ 2>/dev/null || true
    wait 2>/dev/null || true
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

trap cleanup INT TERM

wait $CORE_PIPE_PID $SERVER_PIPE_PID
