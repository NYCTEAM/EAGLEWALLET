# Eagle Wallet - APK 打包脚本
# 使用 Android Studio 的 Gradle

Write-Host "🦅 Eagle Wallet - 开始打包..." -ForegroundColor Green
Write-Host ""

# 检查 Android SDK
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    $androidHome = $env:ANDROID_SDK_ROOT
}

if (-not $androidHome) {
    Write-Host "❌ 错误：未找到 Android SDK" -ForegroundColor Red
    Write-Host "请设置 ANDROID_HOME 或 ANDROID_SDK_ROOT 环境变量" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "或者使用 Android Studio 打包：" -ForegroundColor Cyan
    Write-Host "1. 打开 Android Studio" -ForegroundColor White
    Write-Host "2. 打开项目：G:\WALLET\EagleWallet\android" -ForegroundColor White
    Write-Host "3. Build → Generate Signed Bundle / APK" -ForegroundColor White
    exit 1
}

Write-Host "✅ Android SDK: $androidHome" -ForegroundColor Green

# 清理旧构建
Write-Host ""
Write-Host "🧹 清理旧构建..." -ForegroundColor Yellow
Set-Location android
if (Test-Path "app\build") {
    Remove-Item -Recurse -Force "app\build\outputs" -ErrorAction SilentlyContinue
}

# 打包 JavaScript Bundle
Write-Host ""
Write-Host "📦 打包 JavaScript..." -ForegroundColor Yellow
Set-Location ..
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ JavaScript 打包失败" -ForegroundColor Red
    exit 1
}

Write-Host "✅ JavaScript 打包完成" -ForegroundColor Green

# 构建 APK
Write-Host ""
Write-Host "🔨 构建 Release APK..." -ForegroundColor Yellow
Set-Location android

# 尝试使用系统 Gradle
$gradleCmd = Get-Command gradle -ErrorAction SilentlyContinue
if ($gradleCmd) {
    gradle assembleRelease
} else {
    # 使用 Gradle Wrapper
    if (Test-Path "gradlew.bat") {
        .\gradlew.bat assembleRelease
    } else {
        Write-Host "❌ 未找到 Gradle" -ForegroundColor Red
        Write-Host ""
        Write-Host "请使用 Android Studio 打包：" -ForegroundColor Cyan
        Write-Host "1. 打开 Android Studio" -ForegroundColor White
        Write-Host "2. 打开项目：G:\WALLET\EagleWallet\android" -ForegroundColor White
        Write-Host "3. Build → Generate Signed Bundle / APK" -ForegroundColor White
        Write-Host "4. 选择 APK，使用 eagle-wallet-release.keystore" -ForegroundColor White
        Write-Host "   密码：eagle2026" -ForegroundColor White
        exit 1
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ APK 构建失败" -ForegroundColor Red
    exit 1
}

# 检查输出
$apkPath = "app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    Write-Host ""
    Write-Host "✅ APK 构建成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 APK 位置：" -ForegroundColor Cyan
    Write-Host "   $((Get-Item $apkPath).FullName)" -ForegroundColor White
    Write-Host ""
    $size = [math]::Round((Get-Item $apkPath).Length / 1MB, 2)
    Write-Host "📦 文件大小：$size MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 安装命令：" -ForegroundColor Cyan
    Write-Host "   adb install $apkPath" -ForegroundColor White
} else {
    Write-Host "❌ 未找到 APK 文件" -ForegroundColor Red
}

Set-Location ..
