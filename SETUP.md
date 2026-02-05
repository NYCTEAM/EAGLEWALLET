# Eagle Wallet - 完整安装指南

## 📋 前置要求

### 必需软件
1. **Node.js** (v18 或更高)
   - 下载: https://nodejs.org/
   - 验证: `node --version`

2. **React Native CLI**
   ```bash
   npm install -g react-native-cli
   ```

3. **Android 开发环境**
   - Android Studio
   - Android SDK (API 33+)
   - Java JDK 11+

4. **iOS 开发环境** (仅 macOS)
   - Xcode 14+
   - CocoaPods: `sudo gem install cocoapods`

## 🚀 快速开始

### 1. 安装依赖

```bash
cd EagleWallet
npm install
```

### 2. Android 配置

```bash
# 确保 Android SDK 环境变量已设置
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 3. iOS 配置 (仅 macOS)

```bash
cd ios
pod install
cd ..
```

### 4. 运行应用

#### Android
```bash
# 启动 Metro bundler
npm start

# 在新终端运行 Android
npm run android
```

#### iOS
```bash
npm run ios
```

## 🔧 常见问题

### 问题 1: Metro bundler 端口占用
```bash
# 清理并重启
npm start -- --reset-cache
```

### 问题 2: Android 构建失败
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 问题 3: iOS Pod 安装失败
```bash
cd ios
pod deintegrate
pod install
cd ..
```

## 📱 构建发布版本

### Android APK
```bash
cd android
./gradlew assembleRelease
# APK 位置: android/app/build/outputs/apk/release/app-release.apk
```

### Android AAB (Google Play)
```bash
cd android
./gradlew bundleRelease
# AAB 位置: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS IPA
1. 打开 Xcode
2. 选择 Product > Archive
3. 导出 IPA 文件

## 🔐 签名配置

### Android
1. 生成签名密钥:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore eagle-wallet.keystore -alias eagle-wallet -keyalg RSA -keysize 2048 -validity 10000
```

2. 配置 `android/gradle.properties`:
```properties
EAGLE_UPLOAD_STORE_FILE=eagle-wallet.keystore
EAGLE_UPLOAD_KEY_ALIAS=eagle-wallet
EAGLE_UPLOAD_STORE_PASSWORD=your_password
EAGLE_UPLOAD_KEY_PASSWORD=your_password
```

### iOS
1. 在 Apple Developer 创建证书
2. 在 Xcode 中配置 Signing & Capabilities

## 🌐 网络配置

应用默认支持两个网络：

### BSC (Binance Smart Chain)
- Chain ID: 56
- RPC: https://binance.llamarpc.com
- Explorer: https://bscscan.com

### XLAYER
- Chain ID: 196
- RPC: https://rpc.xlayer.tech
- Explorer: https://www.oklink.com/xlayer

可以在 `src/config/networks.ts` 中修改 RPC 节点。

## 📊 性能优化

### 启用 Hermes (Android)
已在 `android/app/build.gradle` 中默认启用:
```gradle
project.ext.react = [
    enableHermes: true
]
```

### 减小 APK 大小
```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include "armeabi-v7a", "arm64-v8a"
        }
    }
}
```

## 🧪 测试

```bash
# 运行测试
npm test

# 代码检查
npm run lint
```

## 📦 项目结构

```
EagleWallet/
├── src/
│   ├── config/          # 网络配置
│   ├── services/        # 钱包服务
│   ├── screens/         # 界面组件
│   └── utils/           # 工具函数
├── android/             # Android 原生代码
├── ios/                 # iOS 原生代码
├── App.tsx              # 应用入口
└── package.json         # 依赖配置
```

## 🔄 更新依赖

```bash
# 检查过期包
npm outdated

# 更新所有依赖
npm update

# 更新特定包
npm install ethers@latest
```

## 💡 开发技巧

### 调试
1. 摇动设备打开开发菜单
2. 选择 "Debug"
3. 在 Chrome DevTools 中调试

### 热重载
代码修改后自动刷新，无需重新构建

### 日志查看
```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

## 🆘 获取帮助

- GitHub Issues: [项目地址]
- 文档: README.md
- React Native 文档: https://reactnative.dev/

---

**祝开发顺利！🚀**
