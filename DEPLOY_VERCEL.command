#!/bin/bash

# ╔══════════════════════════════════════════╗
# ║   LAVAI — Deploy Vercel                 ║
# ║   Duplo clique para deployar            ║
# ╚══════════════════════════════════════════╝

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

cd "$(dirname "$0")/lavai-app"

echo ""
echo -e "${CYAN}${BOLD}  LAVAI — Deploy Vercel${RESET}"
echo -e "${CYAN}  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# Verifica se Node está instalado
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js não encontrado. Instale em nodejs.org${RESET}"
  exit 1
fi

echo -e "${CYAN}[1/3] Instalando dependências...${RESET}"
npm install --legacy-peer-deps --silent

echo -e "${GREEN}✓ Dependências prontas${RESET}"
echo ""
echo -e "${CYAN}[2/3] Iniciando deploy na Vercel...${RESET}"
echo -e "${YELLOW}  (Se for a primeira vez, faça login quando solicitado)${RESET}"
echo ""

npx vercel --yes

echo ""
echo -e "${GREEN}${BOLD}✅ Deploy concluído!${RESET}"
echo -e "${CYAN}  Acesse a URL acima para ver o LAVAI no ar 🚀${RESET}"
echo ""

# Mantém o terminal aberto
read -p "Pressione Enter para fechar..."
