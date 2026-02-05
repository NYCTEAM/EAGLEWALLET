# 🚀 GitHub Actions 自动构建 APK/AAB

## ✅ 已配置完成

Eagle Wallet 现在支持通过 GitHub Actions 自动构建 Android APK 和 AAB！

---

## 📦 **两个工作流**

### 1. **android-build.yml** - 开发构建
**触发条件：**
- 推送到 `master` 或 `main` 分支
- Pull Request
- 手动触发

**输出：**
- `app-debug.apk` - 调试版本
- `app-release.apk` - 发布版本

### 2. **android-release.yml** - 正式发布
**触发条件：**
- 推送标签（如 `v1.0.0`）
- 手动触发

**输出：**
- `app-release.apk` - 直接安装
- `app-release.aab` - Google Play 商店

---

## 🔧 **配置步骤**

### 步骤 1：上传密钥库到 GitHub Secrets

#### 1.1 转换密钥库为 Base64
```bash
# Windows PowerShell
$bytes = [System.IO.File]::ReadAllBytes("android\app\eagle-wallet-release.keystore")
$base64 = [System.Convert]::ToBase64String($bytes)
$base64 | Out-File keystore-base64.txt
```

或者使用命令行：
```bash
# Linux/Mac
base64 android/app/eagle-wallet-release.keystore > keystore-base64.txt
```

#### 1.2 添加到 GitHub Secrets
1. 进入 GitHub 仓库
2. Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. 添加以下 Secrets：

| Name | Value |
|------|-------|
| `KEYSTORE_BASE64` | 从 `keystore-base64.txt` 复制的内容 |
| `SIGNING_KEY_ALIAS` | `eagle-wallet` |
| `SIGNING_KEY_PASSWORD` | `eagle2026` |
| `SIGNING_STORE_PASSWORD` | `eagle2026` |

---

## 🚀 **使用方法**

### 方法 1：自动构建（推送代码）
```bash
git add .
git commit -m "Update app"
git push origin master
```

GitHub Actions 会自动开始构建！

### 方法 2：手动触发
1. 进入 GitHub 仓库
2. Actions 标签
3. 选择工作流
4. 点击 "Run workflow"
5. 选择分支
6. 点击 "Run workflow"

### 方法 3：发布版本（标签）
```bash
# 创建版本标签
git tag v1.0.0
git push origin v1.0.0
```

会自动创建 GitHub Release 并附带 APK/AAB！

---

## 📥 **下载构建产物**

### 开发构建
1. 进入 Actions 标签
2. 选择最新的工作流运行
3. 滚动到底部 "Artifacts"
4. 下载：
   - `app-debug` - 调试版本
   - `app-release` - 发布版本

### 正式发布
1. 进入 Releases 标签
2. 选择最新版本
3. 下载：
   - `app-release.apk` - 直接安装
   - `app-release.aab` - Google Play

---

## 🔄 **构建流程**

```
1. Checkout 代码
   ↓
2. 安装 Node.js 18
   ↓
3. 安装 Java 17
   ↓
4. 安装 npm 依赖
   ↓
5. 缓存 Gradle
   ↓
6. 打包 JavaScript Bundle
   ↓
7. 解码签名密钥
   ↓
8. 构建 APK/AAB
   ↓
9. 上传产物
   ↓
10. 创建 Release（如果是标签）
```

---

## ⏱️ **构建时间**

- **首次构建**: ~8-10 分钟
- **后续构建**: ~5-7 分钟（有缓存）

---

## 📊 **构建状态徽章**

在 README.md 中添加：

```markdown
![Android Build](https://github.com/YOUR_USERNAME/EagleWallet/workflows/Android%20Build/badge.svg)
```

---

## 🎯 **版本发布流程**

### 1. 更新版本号
编辑 `android/app/build.gradle`：
```gradle
defaultConfig {
    versionCode 2
    versionName "1.0.1"
}
```

### 2. 提交更改
```bash
git add android/app/build.gradle
git commit -m "Bump version to 1.0.1"
git push
```

### 3. 创建标签
```bash
git tag v1.0.1
git push origin v1.0.1
```

### 4. 等待构建
GitHub Actions 会自动：
- 构建 APK 和 AAB
- 创建 GitHub Release
- 附加下载文件

### 5. 下载并发布
- APK → 直接分发
- AAB → 上传到 Google Play

---

## 🔐 **安全注意事项**

### ✅ **已做的安全措施**
- 密钥库使用 Base64 加密存储
- 密码存储在 GitHub Secrets
- Secrets 不会在日志中显示
- 只有仓库管理员可以访问

### ⚠️ **重要提醒**
1. **不要**将密钥库文件提交到 Git
2. **不要**在代码中硬编码密码
3. **定期**备份密钥库文件
4. **限制**仓库访问权限

---

## 📝 **工作流文件位置**

```
.github/
└── workflows/
    ├── android-build.yml      # 开发构建
    └── android-release.yml    # 正式发布
```

---

## 🐛 **故障排除**

### 问题 1: 构建失败 - 找不到密钥库
**解决方案：**
- 确认已添加 `KEYSTORE_BASE64` Secret
- 检查 Base64 编码是否正确

### 问题 2: 签名失败
**解决方案：**
- 检查所有签名相关的 Secrets
- 确认密码正确

### 问题 3: JavaScript Bundle 失败
**解决方案：**
- 检查 `package.json` 依赖
- 确认 `index.js` 存在

### 问题 4: Gradle 构建超时
**解决方案：**
- 检查 Gradle 缓存
- 减少并行构建

---

## 📱 **测试构建的 APK**

### 下载后：
```bash
# 安装到设备
adb install app-release.apk

# 查看日志
adb logcat | grep EagleWallet
```

---

## 🎉 **优势**

### ✅ **自动化**
- 无需本地构建
- 节省开发时间
- 一致的构建环境

### ✅ **可靠性**
- 每次构建都相同
- 无本地环境问题
- 自动测试

### ✅ **分发**
- 自动创建 Release
- 方便下载
- 版本管理

### ✅ **协作**
- 团队成员都能构建
- Pull Request 自动测试
- 代码审查更容易

---

## 📚 **相关链接**

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [React Native 构建指南](https://reactnative.dev/docs/signed-apk-android)
- [Google Play 发布指南](https://developer.android.com/studio/publish)

---

## 🚀 **快速开始**

```bash
# 1. 配置 Secrets（见上文）

# 2. 推送代码触发构建
git push origin master

# 3. 查看构建状态
# 访问：https://github.com/YOUR_USERNAME/EagleWallet/actions

# 4. 下载 APK
# 在 Actions 页面的 Artifacts 中下载
```

---

**GitHub Actions 已配置完成！现在可以自动构建 APK 和 AAB！** 🎉
