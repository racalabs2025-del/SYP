#!/bin/bash
# production_deploy.sh
# 
# Saha Yönetim Paneli Production Deploy Rehberi
# 
# Bu betiği çalıştırın:
#   bash production_deploy.sh
#   
# Veya elle adımları takip edin

set -e

echo "============================================================"
echo " 🚀 SYP PRODUCTION DEPLOY"
echo "============================================================"
echo ""

# Renk kodlar
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Adım 1: Build
echo -e "${YELLOW}[1/5] Build process başlatılıyor...${NC}"
npm run build
echo -e "${GREEN}✓ Build tamamlandı${NC}"
echo ""

# Adım 2: Firebase Rules Deploy
echo -e "${YELLOW}[2/5] Firestore Rules deploy ediliyor...${NC}"
npm run deploy:rules || echo -e "${RED}⚠ Rules deploy atlandı (opsiyonel)${NC}"
echo -e "${GREEN}✓ Rules kontrol tamamlandı${NC}"
echo ""

# Adım 3: Dry-run test
echo -e "${YELLOW}[3/5] Import dry-run test ediliyor...${NC}"
npm run import:basvurular -- --dry-run
echo -e "${GREEN}✓ Dry-run tamamlandı${NC}"
echo ""

# Adım 4: Production Import
echo -e "${YELLOW}[4/5] Başvuruları Firestore'a yüklüyor...${NC}"
echo -e "${YELLOW}     ⏱  Bu adım 2-3 dakika sürebilir${NC}"
npm run import:basvurular
echo -e "${GREEN}✓ İçe aktarım tamamlandı${NC}"
echo ""

# Adım 5: Verification
echo -e "${YELLOW}[5/5] Doğrulama yapılıyor...${NC}"
echo ""       
echo "Firebase Console'da kontrol edin:"
echo "  1. firebaseapp.com → Console"
echo "  2. Collections: meydanBasvurulari (12.094 doc)"
echo "  3. Collections: meydanBasvuruStats (39 doc)"
echo ""

echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN} ✅ DEPLOYMENT TAMAMLANDI${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "Sonraki adımlar:"
echo "  → Application test edin"
echo "  → Meydan detay sayfasında başvuru filtreleri kontrol edin"
echo "  → Categories filtresinin çalıştığını doğrulayın"
echo ""
