#!/bin/bash

# ╔════════════════════════════════════════╗
# ║    LAVAI — Setup Script               ║
# ║    Um comando instala tudo            ║
# ╚════════════════════════════════════════╝

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}"
echo "  ██╗      █████╗ ██╗   ██╗ █████╗ ██╗"
echo "  ██║     ██╔══██╗██║   ██║██╔══██╗██║"
echo "  ██║     ███████║██║   ██║███████║██║"
echo "  ██║     ██╔══██║╚██╗ ██╔╝██╔══██║██║"
echo "  ███████╗██║  ██║ ╚████╔╝ ██║  ██║██║"
echo "  ╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝╚═╝"
echo -e "${RESET}"
echo -e "${BOLD}  O sistema operacional do lava-jato moderno${RESET}"
echo ""

# ── Check dependencies ────────────────────────────────────────
echo -e "${CYAN}[1/4] Verificando dependências...${RESET}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js não encontrado. Instale em nodejs.org${RESET}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}Node.js 18+ necessário. Versão atual: $(node -v)${RESET}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detectado${RESET}"

if ! command -v npm &> /dev/null; then
  echo -e "${RED}npm não encontrado.${RESET}"
  exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) detectado${RESET}"

# ── Install dependencies ──────────────────────────────────────
echo ""
echo -e "${CYAN}[2/4] Instalando dependências...${RESET}"
npm install --legacy-peer-deps
echo -e "${GREEN}✓ Dependências instaladas${RESET}"

# ── Setup env ────────────────────────────────────────────────
echo ""
echo -e "${CYAN}[3/4] Configurando variáveis de ambiente...${RESET}"
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo -e "${YELLOW}⚠ Arquivo .env.local criado. Configure suas chaves quando precisar do backend.${RESET}"
else
  echo -e "${GREEN}✓ .env.local já existe${RESET}"
fi

# ── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}[4/4] Pronto!${RESET}"
echo ""
echo -e "${GREEN}${BOLD}✅ LAVAI instalado com sucesso!${RESET}"
echo ""
echo -e "Para iniciar o servidor de desenvolvimento:"
echo -e "${BOLD}  npm run dev${RESET}"
echo ""
echo -e "Acesse em: ${CYAN}http://localhost:3000${RESET}"
echo ""
echo -e "Páginas disponíveis:"
echo -e "  ${CYAN}/${RESET}               → Página inicial"
echo -e "  ${CYAN}/dashboard${RESET}      → Dashboard principal"
echo -e "  ${CYAN}/fila${RESET}           → Fila ao vivo"
echo -e "  ${CYAN}/clientes${RESET}       → Gestão de clientes"
echo -e "  ${CYAN}/agendar${RESET}        → Página pública de agendamento"
echo ""
echo -e "${YELLOW}💡 Para fazer deploy na Vercel:${RESET}"
echo -e "  ${BOLD}npx vercel${RESET}"
echo ""
