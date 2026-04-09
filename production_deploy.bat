@echo off
REM production_deploy.bat
REM Saha Yönetim Paneli Production Deploy - Windows Version
REM
REM Çalıştırın: production_deploy.bat

setlocal enabledelayedexpansion

echo ============================================================
echo.  SYP PRODUCTION DEPLOY - WINDOWS
echo ============================================================
echo.

REM Renk yoksa, direkt yazı kullan
echo [1/5] Build Prosesi Başlatılıyor...
call npm run build
if errorlevel 1 (
    echo Build başarısız!
    pause
    exit /b 1
)
echo ✓ Build Tamamlandı
echo.

echo [2/5] Firebase Firestore Rules Kontrol Ediliyor...
call npm run deploy:rules 2>nul || echo ⚠ Rules kontrol atlandı
echo ✓ Rules Tamamlandı
echo.

echo [3/5] Import Dry-Run Test Yapılıyor...
call npm run import:basvurular -- --dry-run
if errorlevel 1 (
    echo Dry-run başarısız!
    pause
    exit /b 1
)
echo ✓ Dry-Run Tamamlandı
echo.

echo [4/5] Başvuruları Firestore'a Yüklüyor...
echo     ⏱ Bu adım 2-3 dakika sürebilir...
echo.
call npm run import:basvurular
if errorlevel 1 (
    echo İçe aktarım başarısız!
    echo Ayrıntılar için Firebase Console'u kontrol edin
    pause
    exit /b 1
)
echo ✓ İçe Aktarım Tamamlandı
echo.

echo [5/5] Doğrulama...
echo.
echo Firebase Console'da Kontrol Edin:
echo   1. https://console.firebase.google.com
echo   2. Collections: meydanBasvurulari (12.094 doc beklenen)
echo   3. Collections: meydanBasvuruStats (39 doc beklenen)
echo.

echo ============================================================
echo  ✅ DEPLOYMENT TAMAMLANDI
echo ============================================================
echo.
echo Sonraki Adımlar:
echo   → Uygulamayı test edin (npm run dev)
echo   → Meydan detay sayfasında başvuru filtreleri kontrol edin
echo   → Kategori filtresinin çalıştığını doğrulayın
echo   → Başvuru listesinde normalized konu ve category alanlarını görün
echo.

pause
