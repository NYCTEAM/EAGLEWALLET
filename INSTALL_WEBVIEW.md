# 安装 react-native-webview

DApp内置浏览器需要安装 `react-native-webview` 依赖。

## 安装步骤

```bash
# 安装依赖
npm install react-native-webview

# iOS需要安装pods
cd ios && pod install && cd ..
```

## Android配置

在 `android/app/src/main/AndroidManifest.xml` 添加网络权限（如果还没有）：

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## iOS配置

在 `ios/EagleWallet/Info.plist` 添加（如果还没有）：

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## 重新编译

```bash
# Android
npm run android

# iOS
npm run ios
```

## 功能说明

内置DApp浏览器支持：
- ✅ Web3 Provider注入
- ✅ eth_requestAccounts
- ✅ personal_sign
- ✅ eth_sendTransaction
- ✅ 前进/后退导航
- ✅ URL地址栏
- ✅ 刷新功能
- ✅ 完整的以太坊兼容性

## 使用方法

1. 打开DApp Browser
2. 点击任意DApp
3. 在内置浏览器中打开
4. DApp会自动检测到Eagle Wallet
5. 可以直接连接钱包和签名交易
