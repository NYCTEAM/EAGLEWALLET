# 🦅 Eagle Wallet

![Android Build](https://github.com/NYCTEAM/EAGLEWALLET/workflows/Android%20Build/badge.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**完整功能的 Web3 钱包 - 专为 BSC 和 XLAYER 设计**

一个现代化、安全、功能完整的加密货币钱包，支持 BSC 和 XLAYER 网络。

## ✨ 核心特性

- 🔐 **安全可靠** - 私钥加密本地存储，永不上传
- 🌐 **双网络支持** - BSC 和 XLAYER 主网
- 📱 **跨平台** - Android 和 iOS 双平台支持
- 💰 **完整交易** - 发送、接收、交易历史、详情查看
- 🖼️ **NFT 管理** - 自动读取、展示、转账 NFT
- 🌐 **DApp 浏览器** - 内置生态，一键访问 DeFi/NFT 应用
- 🚀 **高性能** - React Native 构建，流畅体验
- 🔄 **智能 RPC** - US/HK 节点自动切换，最快连接
- 🔒 **隐私保护** - RPC URL 完全隐藏

## 🛠️ Tech Stack

- **React Native** - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **ethers.js** - Ethereum library for wallet operations
- **React Navigation** - Navigation framework
- **AsyncStorage** - Local data persistence
- **Keychain** - Secure credential storage

## 📦 Installation

### Prerequisites

- Node.js >= 18
- React Native CLI
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

### Setup

```bash
# Navigate to project directory
cd EagleWallet

# Install dependencies
npm install

# For iOS only
cd ios && pod install && cd ..

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Download

### Latest Release
[![Download APK](https://img.shields.io/badge/Download-APK-green)](https://github.com/NYCTEAM/EAGLEWALLET/releases/latest)

- **APK**: Direct installation on Android devices
- **AAB**: For Google Play Store submission

### Build from Source
See [SETUP.md](./SETUP.md) for detailed instructions.

### GitHub Actions
Every push automatically builds APK/AAB. Download from [Actions](https://github.com/NYCTEAM/EAGLEWALLET/actions) tab.

## Quick Start

### 1. Create New Wallet
- Open the app
- Click "Create New Wallet"
- Set a secure password (min 8 characters)
- **IMPORTANT**: Save your 12-word recovery phrase securely!

### 2. Import Existing Wallet
- Open the app
- Click "Import Wallet"
- Choose import method:
  - Recovery Phrase (12 or 24 words)
  - Private Key
- Enter your credentials
- Set a password

### 3. Using the Wallet
- View balance for BSC and XLAYER
- Switch networks with one tap
- Send and receive tokens
- View transaction history

## 🌐 Supported Networks

### BSC (Binance Smart Chain)
- **Chain ID**: 56
- **Symbol**: BNB
- **Explorer**: https://bscscan.com

### XLAYER
- **Chain ID**: 196
- **Symbol**: OKB
- **Explorer**: https://www.oklink.com/xlayer

## 🔒 Security Features

- ✅ Private keys never leave your device
- ✅ Encrypted storage using native keychains
- ✅ Password-protected wallet access
- ✅ Secure transaction signing
- ✅ No analytics or tracking

## 📱 Screenshots

[Add screenshots here]

## 🛣️ Roadmap

- [ ] Token management (ERC-20/BEP-20)
- [ ] QR code scanning for addresses
- [ ] Transaction history with block explorer links
- [ ] Multiple wallet accounts
- [ ] Biometric authentication
- [ ] WalletConnect integration
- [ ] DApp browser

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This wallet is provided as-is. Always keep your recovery phrase safe and never share it with anyone. The developers are not responsible for any loss of funds.

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Made with ❤️ for the BSC and XLAYER communities**
