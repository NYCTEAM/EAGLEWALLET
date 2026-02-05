# 🚀 Eagle Wallet - 发布打包指南

## ✅ 已完成配置

1. ✅ 生成签名密钥：`eagle-wallet-release.keystore`
2. ✅ 配置 Gradle 签名
3. ✅ 打包 JavaScript Bundle
4. ✅ 版本号：1.0.0

---

## 📦 **方法 1：使用 Android Studio（推荐）**

### 步骤：
1. 打开 Android Studio
2. 打开项目：`G:\WALLET\EagleWallet\android`
3. 菜单：`Build` → `Generate Signed Bundle / APK`
4. 选择：`Android App Bundle` (AAB) 用于 Google Play
5. 选择密钥库：`app/eagle-wallet-release.keystore`
   - 密码：`eagle2026`
   - 别名：`eagle-wallet`
   - 密钥密码：`eagle2026`
6. 选择 `release` 构建类型
7. 点击 `Finish`

### 输出位置：
- **AAB (Google Play)**: `android/app/build/outputs/bundle/release/app-release.aab`
- **APK (直接安装)**: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📦 **方法 2：命令行打包**

### 前提条件：
需要安装 Android SDK 和配置环境变量

### 打包 APK：
```bash
cd G:\WALLET\EagleWallet\android
.\gradlew assembleRelease
```

### 打包 AAB（Google Play）：
```bash
cd G:\WALLET\EagleWallet\android
.\gradlew bundleRelease
```

---

## 🏪 **Google Play 商店发布**

### ✅ 支持 Google Play！

Eagle Wallet **完全支持** Google Play 商店发布：

#### 已配置：
- ✅ **AAB 格式** - Google Play 要求的格式
- ✅ **签名配置** - 生产环境签名
- ✅ **版本管理** - versionCode: 1, versionName: 1.0.0
- ✅ **ProGuard** - 代码混淆（可选）
- ✅ **目标 SDK** - Android 14 (API 34)
- ✅ **最低 SDK** - Android 7.0 (API 24)

#### 发布步骤：

1. **构建 AAB**
   ```bash
   cd android
   .\gradlew bundleRelease
   ```

2. **获取 AAB 文件**
   - 位置：`android/app/build/outputs/bundle/release/app-release.aab`

3. **登录 Google Play Console**
   - https://play.google.com/console

4. **创建应用**
   - 应用名称：Eagle Wallet
   - 默认语言：中文/英文
   - 应用类型：应用
   - 免费/付费：免费

5. **上传 AAB**
   - 进入"生产"轨道
   - 创建新版本
   - 上传 `app-release.aab`

6. **填写商店信息**
   - 应用图标（512x512）
   - 截图（至少 2 张）
   - 应用描述
   - 隐私政策 URL

7. **内容分级**
   - 填写问卷
   - 金融应用分类

8. **提交审核**
   - 审核时间：通常 1-3 天

---

## 📱 **应用信息**

### 基本信息：
- **包名**: `com.eaglewallet`
- **版本**: 1.0.0 (versionCode: 1)
- **最低 Android**: 7.0 (API 24)
- **目标 Android**: 14 (API 34)

### 权限：
- `INTERNET` - 连接区块链 RPC
- `ACCESS_NETWORK_STATE` - 检查网络状态
- `USE_BIOMETRIC` - 生物识别（可选）
- `CAMERA` - 扫描二维码（可选）

### 应用大小：
- 预计：15-25 MB

---

## 🔐 **签名密钥信息**

**重要：请妥善保管！**

- **密钥库文件**: `android/app/eagle-wallet-release.keystore`
- **密钥库密码**: `eagle2026`
- **密钥别名**: `eagle-wallet`
- **密钥密码**: `eagle2026`
- **有效期**: 10000 天（约 27 年）

⚠️ **备份密钥库！** 丢失后无法更新应用！

---

## 📝 **Google Play 商店清单**

### 必需资源：

#### 图标和截图：
- [ ] 应用图标 512x512 PNG
- [ ] 功能图片 1024x500 PNG
- [ ] 手机截图（至少 2 张）
- [ ] 7 英寸平板截图（可选）
- [ ] 10 英寸平板截图（可选）

#### 文本内容：
- [ ] 简短描述（80 字符）
- [ ] 完整描述（4000 字符）
- [ ] 应用标题（30 字符）

#### 政策：
- [ ] 隐私政策 URL
- [ ] 服务条款（可选）

#### 分类：
- [ ] 应用类别：金融
- [ ] 内容分级问卷

---

## 🎯 **建议的商店描述**

### 简短描述：
```
Eagle Wallet - 安全的 BSC 和 XLAYER 加密货币钱包，支持 NFT 和 DApp
```

### 完整描述：
```
🦅 Eagle Wallet - 您的 Web3 安全钱包

Eagle Wallet 是一款专为 BSC (Binance Smart Chain) 和 XLAYER 网络设计的去中心化加密货币钱包。

✨ 核心功能：
• 💰 安全的资产管理 - 私钥本地加密存储
• 🔄 快速转账 - 发送和接收加密货币
• 🖼️ NFT 管理 - 自动读取和展示您的 NFT
• 🌐 DApp 浏览器 - 一键访问去中心化应用
• 📊 交易历史 - 完整的交易记录和详情
• 🔐 多重安全 - 密码保护 + 生物识别

🌐 支持网络：
• BSC Mainnet (Binance Smart Chain)
• XLAYER Mainnet

🔒 安全特性：
• 私钥永不离开您的设备
• AES-256 加密存储
• 生物识别解锁
• 开源透明

📱 简单易用：
• 清晰的用户界面
• 一键创建/导入钱包
• 实时余额显示
• QR 码扫描

Eagle Wallet - 让 Web3 触手可及！
```

---

## 🚀 **快速开始**

### 测试 APK（不需要 Google Play）：
```bash
# 1. 构建 APK
cd android
.\gradlew assembleRelease

# 2. 安装到设备
adb install app/build/outputs/apk/release/app-release.apk
```

### 发布到 Google Play：
```bash
# 1. 构建 AAB
cd android
.\gradlew bundleRelease

# 2. 上传到 Google Play Console
# 文件位置：app/build/outputs/bundle/release/app-release.aab
```

---

## ✅ **检查清单**

打包前确认：
- [ ] 所有功能测试通过
- [ ] 更新版本号
- [ ] 准备应用图标和截图
- [ ] 编写隐私政策
- [ ] 备份签名密钥
- [ ] 测试 release APK

---

**Eagle Wallet 已完全配置好 Google Play 发布！** 🎉
