# Script pour exécuter tous les tests de la Phase 7
# Usage: .\run_all_tests.ps1

param(
    [switch]$SkipModelTests,
    [switch]$SkipAPITests,
    [switch]$SkipIntegrationTests,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PHASE 7 - TESTS ET VALIDATION" -ForegroundColor Cyan
Write-Host "  YouTube Sentiment Analysis System" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que pytest est installé
Write-Host "Vérification des dépendances..." -ForegroundColor Yellow
try {
    & python -c "import pytest" 2>&1 | Out-Null
    Write-Host "✓ pytest est installé" -ForegroundColor Green
} catch {
    Write-Host "❌ pytest n'est pas installé" -ForegroundColor Red
    Write-Host "Installation en cours..." -ForegroundColor Yellow
    pip install pytest
}

Write-Host ""

# Préparer les arguments pytest
$pytestArgs = "-v"
if ($Verbose) {
    $pytestArgs += " -s"
}

$allTestsPassed = $true
$testResults = @{}

# TEST 1: Tests du Modèle
if (-not $SkipModelTests) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  TEST 1/3: TESTS DU MODELE ML" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Tests à exécuter:" -ForegroundColor Yellow
    Write-Host "  - Performance sur test set (accuracy, F1-score)" -ForegroundColor Gray
    Write-Host "  - Cas limites (texte court/long, emojis, langues)" -ForegroundColor Gray
    Write-Host "  - Temps d'inférence" -ForegroundColor Gray
    Write-Host ""
    
    try {
        $result = & python -m pytest tests/test_model.py $pytestArgs
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host ""
            Write-Host "✅ Tests du modèle: RÉUSSIS" -ForegroundColor Green
            $testResults["Model Tests"] = "✅ PASSED"
        } else {
            Write-Host ""
            Write-Host "❌ Tests du modèle: ÉCHOUÉS" -ForegroundColor Red
            $allTestsPassed = $false
            $testResults["Model Tests"] = "❌ FAILED"
        }
    } catch {
        Write-Host "❌ Erreur lors de l'exécution des tests du modèle: $_" -ForegroundColor Red
        $allTestsPassed = $false
        $testResults["Model Tests"] = "❌ ERROR"
    }
} else {
    Write-Host "⏭️  Tests du modèle ignorés (--SkipModelTests)" -ForegroundColor Yellow
    $testResults["Model Tests"] = "⏭️  SKIPPED"
}

# TEST 2: Tests de l'API
if (-not $SkipAPITests) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  TEST 2/3: TESTS DE L'API" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: L'API doit être lancée sur http://localhost:7860" -ForegroundColor Yellow
    Write-Host "   Commande: uvicorn app_api:app --host 0.0.0.0 --port 7860" -ForegroundColor Gray
    Write-Host ""
    
    # Vérifier si l'API est accessible
    Write-Host "Vérification de l'API..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:7860/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✓ API est accessible" -ForegroundColor Green
        Write-Host ""
        
        try {
            $result = & python -m pytest tests/test_api.py $pytestArgs
            $exitCode = $LASTEXITCODE
            
            if ($exitCode -eq 0) {
                Write-Host ""
                Write-Host "✅ Tests de l'API: RÉUSSIS" -ForegroundColor Green
                $testResults["API Tests"] = "✅ PASSED"
            } else {
                Write-Host ""
                Write-Host "❌ Tests de l'API: ÉCHOUÉS" -ForegroundColor Red
                $allTestsPassed = $false
                $testResults["API Tests"] = "❌ FAILED"
            }
        } catch {
            Write-Host "❌ Erreur lors de l'exécution des tests de l'API: $_" -ForegroundColor Red
            $allTestsPassed = $false
            $testResults["API Tests"] = "❌ ERROR"
        }
    } catch {
        Write-Host "❌ API non accessible sur http://localhost:7860" -ForegroundColor Red
        Write-Host "   Lancez l'API d'abord, puis relancez les tests" -ForegroundColor Yellow
        $allTestsPassed = $false
        $testResults["API Tests"] = "❌ API NOT RUNNING"
    }
} else {
    Write-Host "⏭️  Tests de l'API ignorés (--SkipAPITests)" -ForegroundColor Yellow
    $testResults["API Tests"] = "⏭️  SKIPPED"
}

# TEST 3: Tests d'Intégration
if (-not $SkipIntegrationTests) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  TEST 3/3: TESTS D'INTEGRATION" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Tests à exécuter:" -ForegroundColor Yellow
    Write-Host "  - Flux complet Extension → API → Résultats" -ForegroundColor Gray
    Write-Host "  - API locale vs production" -ForegroundColor Gray
    Write-Host "  - Cas limites et récupération d'erreurs" -ForegroundColor Gray
    Write-Host ""
    
    # Vérifier si l'API est accessible
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:7860/health" -TimeoutSec 5 -ErrorAction Stop
        
        try {
            $result = & python -m pytest tests/test_integration.py $pytestArgs
            $exitCode = $LASTEXITCODE
            
            if ($exitCode -eq 0) {
                Write-Host ""
                Write-Host "✅ Tests d'intégration: RÉUSSIS" -ForegroundColor Green
                $testResults["Integration Tests"] = "✅ PASSED"
            } else {
                Write-Host ""
                Write-Host "❌ Tests d'intégration: ÉCHOUÉS" -ForegroundColor Red
                $allTestsPassed = $false
                $testResults["Integration Tests"] = "❌ FAILED"
            }
        } catch {
            Write-Host "❌ Erreur lors de l'exécution des tests d'intégration: $_" -ForegroundColor Red
            $allTestsPassed = $false
            $testResults["Integration Tests"] = "❌ ERROR"
        }
    } catch {
        Write-Host "❌ API non accessible sur http://localhost:7860" -ForegroundColor Red
        Write-Host "   Les tests d'intégration nécessitent l'API" -ForegroundColor Yellow
        $allTestsPassed = $false
        $testResults["Integration Tests"] = "❌ API NOT RUNNING"
    }
} else {
    Write-Host "⏭️  Tests d'intégration ignorés (--SkipIntegrationTests)" -ForegroundColor Yellow
    $testResults["Integration Tests"] = "⏭️  SKIPPED"
}

# RÉSUMÉ FINAL
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

foreach ($test in $testResults.Keys) {
    $status = $testResults[$test]
    $color = if ($status -like "*PASSED*") { "Green" } 
             elseif ($status -like "*SKIPPED*") { "Yellow" } 
             else { "Red" }
    Write-Host "  $test : $status" -ForegroundColor $color
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allTestsPassed) {
    Write-Host ""
    Write-Host "🎉 TOUS LES TESTS ONT RÉUSSI!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Cyan
    Write-Host "  1. Tests manuels de l'extension Chrome" -ForegroundColor White
    Write-Host "     Voir: tests/test_extension_manual.md" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Générer le rapport de tests" -ForegroundColor White
    Write-Host "     Commande: .\generate_test_report.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  3. Déployer sur Hugging Face (si pas déjà fait)" -ForegroundColor White
    Write-Host "     Commande: .\deploy_to_hf.ps1 YOUR_USERNAME" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ CERTAINS TESTS ONT ÉCHOUÉ" -ForegroundColor Red
    Write-Host ""
    Write-Host "Actions recommandées:" -ForegroundColor Yellow
    Write-Host "  1. Vérifier les logs d'erreur ci-dessus" -ForegroundColor White
    Write-Host "  2. Corriger les problèmes identifiés" -ForegroundColor White
    Write-Host "  3. Relancer les tests: .\run_all_tests.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Tests terminés le: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""