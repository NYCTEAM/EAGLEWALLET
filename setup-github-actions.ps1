# Eagle Wallet - GitHub Actions 配置脚本

Write-Host "🦅 Eagle Wallet - GitHub Actions 配置" -ForegroundColor Green
Write-Host ""

# 检查密钥库文件
$keystorePath = "android\app\eagle-wallet-release.keystore"
if (-not (Test-Path $keystorePath)) {
    Write-Host "❌ 错误：找不到密钥库文件" -ForegroundColor Red
    Write-Host "   路径：$keystorePath" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 找到密钥库文件" -ForegroundColor Green

# 转换为 Base64
Write-Host ""
Write-Host "🔄 转换密钥库为 Base64..." -ForegroundColor Yellow

try {
    $bytes = [System.IO.File]::ReadAllBytes($keystorePath)
    $base64 = [System.Convert]::ToBase64String($bytes)
    $base64 | Out-File "keystore-base64.txt" -Encoding UTF8
    
    Write-Host "✅ Base64 已保存到：keystore-base64.txt" -ForegroundColor Green
} catch {
    Write-Host "❌ 转换失败：$_" -ForegroundColor Red
    exit 1
}

# 显示配置说明
Write-Host ""
Write-Host "📝 GitHub Secrets 配置步骤：" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 进入 GitHub 仓库" -ForegroundColor White
Write-Host "   https://github.com/YOUR_USERNAME/EagleWallet" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host ""
Write-Host "3. 点击 'New repository secret' 添加以下 Secrets：" -ForegroundColor White
Write-Host ""

# 显示 Secrets 表格
Write-Host "   ┌─────────────────────────┬──────────────────────────┐" -ForegroundColor Gray
Write-Host "   │ Name                    │ Value                    │" -ForegroundColor Gray
Write-Host "   ├─────────────────────────┼──────────────────────────┤" -ForegroundColor Gray
Write-Host "   │ KEYSTORE_BASE64         │ 从 keystore-base64.txt  │" -ForegroundColor White
Write-Host "   │                         │ 复制全部内容             │" -ForegroundColor Gray
Write-Host "   ├─────────────────────────┼──────────────────────────┤" -ForegroundColor Gray
Write-Host "   │ SIGNING_KEY_ALIAS       │ eagle-wallet             │" -ForegroundColor White
Write-Host "   ├─────────────────────────┼──────────────────────────┤" -ForegroundColor Gray
Write-Host "   │ SIGNING_KEY_PASSWORD    │ eagle2026                │" -ForegroundColor White
Write-Host "   ├─────────────────────────┼──────────────────────────┤" -ForegroundColor Gray
Write-Host "   │ SIGNING_STORE_PASSWORD  │ eagle2026                │" -ForegroundColor White
Write-Host "   └─────────────────────────┴──────────────────────────┘" -ForegroundColor Gray
Write-Host ""

# 显示使用方法
Write-Host "🚀 使用方法：" -ForegroundColor Cyan
Write-Host ""
Write-Host "方法 1：推送代码自动构建" -ForegroundColor White
Write-Host "   git push origin master" -ForegroundColor Gray
Write-Host ""
Write-Host "方法 2：手动触发构建" -ForegroundColor White
Write-Host "   1. 进入 Actions 标签" -ForegroundColor Gray
Write-Host "   2. 选择工作流" -ForegroundColor Gray
Write-Host "   3. 点击 'Run workflow'" -ForegroundColor Gray
Write-Host ""
Write-Host "方法 3：发布版本" -ForegroundColor White
Write-Host "   git tag v1.0.0" -ForegroundColor Gray
Write-Host "   git push origin v1.0.0" -ForegroundColor Gray
Write-Host ""

# 显示下载说明
Write-Host "📥 下载构建产物：" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 进入 Actions 标签" -ForegroundColor White
Write-Host "2. 选择最新的工作流运行" -ForegroundColor White
Write-Host "3. 滚动到底部 'Artifacts'" -ForegroundColor White
Write-Host "4. 下载 APK/AAB" -ForegroundColor White
Write-Host ""

# 安全提醒
Write-Host "⚠️  安全提醒：" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. 不要将 keystore-base64.txt 提交到 Git" -ForegroundColor White
Write-Host "2. 配置完成后可以删除 keystore-base64.txt" -ForegroundColor White
Write-Host "3. 妥善保管原始密钥库文件" -ForegroundColor White
Write-Host ""

# 添加到 .gitignore
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -notlike "*keystore-base64.txt*") {
        Add-Content ".gitignore" "`nkeystore-base64.txt"
        Write-Host "✅ 已添加 keystore-base64.txt 到 .gitignore" -ForegroundColor Green
    }
}

Write-Host "✅ 配置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📚 详细文档：GITHUB_ACTIONS.md" -ForegroundColor Cyan
Write-Host ""
