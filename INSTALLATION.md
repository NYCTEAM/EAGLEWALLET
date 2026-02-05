# 🦅 Eagle Wallet - 完整安装指南

## 📋 系统要求

### Windows 系统
- Windows 10/11
- Node.js 18+
- JDK 11+
- Android Studio
- Git

## 🚀 快速开始

### 1. 安装依赖（已完成）

```bash
cd g:\WALLET\EagleWallet
npm install  # 已完成
```

### 2. 启动 Metro Bundler

```bash
npm start
```

### 3. 运行 Android 应用

**新终端窗口：**

```bash
npm run android
```

或者手动构建：

```bash
cd android
.\gradlew assembleDebug
```

## 📱 完整功能列表

### ✅ 已实现功能

#### 💰 钱包核心
- [x] 创建钱包（12词助记词）
- [x] 导入钱包（助记词/私钥）
- [x] 密码加密存储
- [x] 查看余额
- [x] 发送交易
- [x] 接收代币（QR码）
- [x] 交易历史
- [x] 交易详情

#### 🌐 网络支持
- [x] BSC Mainnet (Chain ID: 56)
- [x] XLAYER Mainnet (Chain ID: 196)
- [x] 一键网络切换
- [x] 多 RPC 节点备份

#### 🖼️ NFT 功能
- [x] 自动读取用户 NFTs
- [x] NFT 画廊展示
- [x] NFT 详情查看
- [x] NFT 转账功能
- [x] IPFS 图片支持
- [x] ERC-721 标准

#### 🌐 DApp 浏览器
- [x] 预置热门 DApps
  - PancakeSwap (BSC)
  - Venus Protocol (BSC)
  - OKX DEX (XLAYER)
  - X Layer Bridge
- [x] 自定义 DApp
- [x] 搜索功能
- [x] 分类浏览
- [x] 访问历史

#### ⚙️ 设置
- [x] 生物识别开关
- [x] 导出私钥
- [x] 备份钱包
- [x] 修改密码
- [x] 语言选择
- [x] 货币选择
- [x] 删除钱包

## 🏗️ 项目结构

```
EagleWallet/
├── android/                    # Android 原生代码
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/eaglewallet/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   └── MainApplication.kt
│   │   │   ├── res/
│   │   │   │   ├── values/
│   │   │   │   │   ├── strings.xml
│   │   │   │   │   ├── styles.xml
│   │   │   │   │   └── colors.xml
│   │   │   │   └── drawable/
│   │   │   └── AndroidManifest.xml
│   │   ├── build.gradle
│   │   └── proguard-rules.pro
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradle.properties
│   ├── local.properties
│   └── gradlew.bat
├── src/
│   ├── config/
│   │   └── networks.ts         # BSC & XLAYER 配置
│   ├── services/
│   │   ├── WalletService.ts    # 钱包核心
│   │   ├── NFTService.ts       # NFT 管理
│   │   └── DAppService.ts      # DApp 管理
│   └── screens/
│       ├── CreateWalletScreen.tsx
│       ├── HomeScreen.tsx
│       ├── SendScreen.tsx
│       ├── ReceiveScreen.tsx
│       ├── TransactionHistoryScreen.tsx
│       ├── TransactionDetailScreen.tsx
│       ├── NFTScreen.tsx
│       ├── NFTDetailScreen.tsx
│       ├── DAppBrowserScreen.tsx
│       ├── AddDAppScreen.tsx
│       └── SettingsScreen.tsx
├── App.tsx                     # 应用入口
├── index.js                    # React Native 入口
├── package.json                # 依赖配置
├── tsconfig.json              # TypeScript 配置
├── metro.config.js            # Metro 配置
├── babel.config.js            # Babel 配置
└── README.md                  # 项目说明
```

## 🔧 故障排除

### 问题 1: Metro Bundler 无法启动
```bash
# 清理缓存
npm start -- --reset-cache
```

### 问题 2: Android 构建失败
```bash
cd android
.\gradlew clean
cd ..
npm run android
```

### 问题 3: 依赖问题
```bash
# 删除 node_modules 重新安装
rm -rf node_modules
npm install
```

### 问题 4: Gradle 下载慢
在 `android/gradle/wrapper/gradle-wrapper.properties` 中修改为国内镜像：
```properties
distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-8.0.1-all.zip
```

## 📦 构建发布版本

### Android APK
```bash
cd android
.\gradlew assembleRelease
```

生成的 APK 位置：
`android/app/build/outputs/apk/release/app-release.apk`

### Android AAB (Google Play)
```bash
cd android
.\gradlew bundleRelease
```

生成的 AAB 位置：
`android/app/build/outputs/bundle/release/app-release.aab`

## 🔐 签名配置

### 生成签名密钥
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore eagle-wallet.keystore -alias eagle-wallet -keyalg RSA -keysize 2048 -validity 10000
```

### 配置签名
在 `android/app/build.gradle` 中添加：
```gradle
android {
    signingConfigs {
        release {
            storeFile file('eagle-wallet.keystore')
            storePassword 'your_password'
            keyAlias 'eagle-wallet'
            keyPassword 'your_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## 🌐 网络配置

### BSC Mainnet
- Chain ID: 56
- Symbol: BNB
- RPC: https://binance.llamarpc.com
- Explorer: https://bscscan.com

### XLAYER Mainnet
- Chain ID: 196
- Symbol: OKB
- RPC: https://rpc.xlayer.tech
- Explorer: https://www.oklink.com/xlayer

## 📝 开发命令

```bash
# 启动开发服务器
npm start

# 运行 Android
npm run android

# 运行 iOS (仅 macOS)
npm run ios

# 运行测试
npm test

# 代码检查
npm run lint

# TypeScript 类型检查
npx tsc --noEmit
```

## 🎯 下一步

1. ✅ 所有功能已完成
2. ✅ Android 配置已完成
3. 🔄 运行 `npm start` 启动开发服务器
4. 🔄 运行 `npm run android` 启动应用
5. 🎉 开始使用 Eagle Wallet！

## 📞 支持

遇到问题？
- 查看 [README.md](./README.md)
- 查看 [SETUP.md](./SETUP.md)
- 提交 Issue

---

**Eagle Wallet - 您的 BSC & XLAYER 安全钱包** 🦅
