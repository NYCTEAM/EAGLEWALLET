# 🦅 Eagle Wallet

A modern, secure, and simple cryptocurrency wallet for **BSC (Binance Smart Chain)** and **XLAYER** networks.

## ✨ Features

- 🔐 **Secure** - Private keys encrypted and stored locally
- 🌐 **Dual Network** - Support for BSC and XLAYER mainnet only
- 📱 **Cross-Platform** - Works on both Android and iOS
- 💰 **Simple UI** - Clean and intuitive interface
- 🚀 **Fast** - Built with React Native for optimal performance
- 🔄 **Easy Switch** - Quick network switching between BSC and XLAYER

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

## 🚀 Quick Start

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
