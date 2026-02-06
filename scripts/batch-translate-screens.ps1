# Batch translate all screens
# This script adds useLanguage hook to all screen files

$screens = @(
    "CreateWalletScreen",
    "HomeScreen",
    "SendScreen",
    "ReceiveScreen",
    "SwapScreen",
    "NFTScreen",
    "NFTDetailScreen",
    "TokenDetailScreen",
    "TransactionHistoryScreen",
    "TransactionDetailScreen",
    "TransactionResultScreen",
    "SendConfirmationScreen",
    "EnterAddressScreen",
    "EnterAmountScreen",
    "SelectTokenScreen",
    "AddTokenScreen",
    "DAppBrowserScreen",
    "AddDAppScreen",
    "ExportPrivateKeyScreen",
    "RPCNodeScreen",
    "PriceAlertScreen",
    "AdvancedSettingsScreen",
    "WalletsScreen"
)

foreach ($screen in $screens) {
    $file = "src\screens\$screen.tsx"
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Check if already has useLanguage
        if ($content -notmatch "useLanguage") {
            Write-Host "Processing $screen..."
            
            # Add import
            $content = $content -replace "(import.*from 'react';)", "`$1`nimport { useLanguage } from '../i18n/LanguageContext';"
            
            # Add hook at start of component
            $content = $content -replace "(export default function $screen.*\{)", "`$1`n  const { t } = useLanguage();"
            
            Set-Content $file $content -NoNewline
            Write-Host "  ✓ Added useLanguage to $screen"
        } else {
            Write-Host "  ⊘ $screen already has useLanguage"
        }
    }
}

Write-Host "`nDone! Now manually replace hardcoded strings with t.* calls"
