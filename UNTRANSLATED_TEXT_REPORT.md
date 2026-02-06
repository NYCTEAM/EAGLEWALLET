# 未翻译文本详细报告
# Untranslated Text Detailed Report

生成时间: 2026-02-06 01:58 AM

## 📊 总体统计

- **总屏幕数**: 27
- **发现硬编码英文文本**: 172处
- **需要翻译的屏幕**: 23个

## 🔴 严重问题 - 大量未翻译文本

### 1. HomeScreen.tsx - 31处未翻译 ⚠️⚠️⚠️
**优先级: P0 - 最高**
- Total Balance
- Send, Receive, Swap
- Tokens, NFT, Activity
- DeFi, Total assets
- Custom Tokens
- 等等...

### 2. CreateWalletScreen.tsx - 20处未翻译 ⚠️⚠️⚠️
**优先级: P0 - 最高**
- Create Wallet
- Import Wallet
- Password, Confirm Password
- Mnemonic Phrase
- 等等...

### 3. TransactionDetailScreen.tsx - 15处未翻译 ⚠️⚠️
**优先级: P0 - 高**
- Transaction Details
- Status, From, To
- Amount, Fee, Total
- Block, Hash, Time
- 等等...

### 4. SwapScreen.tsx - 14处未翻译 ⚠️⚠️
**优先级: P1 - 高**
- Swap
- You Pay, You Receive
- Select Token
- Slippage Tolerance
- 等等...

### 5. AddTokenScreen.tsx - 12处未翻译 ⚠️
**优先级: P1 - 中**
- Add Custom Token
- Token Address
- Token Symbol
- Token Decimals
- 等等...

### 6. NFTDetailScreen.tsx - 12处未翻译 ⚠️
**优先级: P1 - 中**
- NFT Details
- Collection, Owner
- Token ID, Contract
- Properties, Description
- 等等...

### 7. SendScreen.tsx - 12处未翻译 ⚠️⚠️
**优先级: P0 - 最高**
- Send
- Recipient Address
- Amount
- Gas Fee
- 等等...

### 8. PriceAlertScreen.tsx - 9处未翻译 ⚠️
**优先级: P3 - 低**

### 9. ReceiveScreen.tsx - 8处未翻译 ⚠️⚠️
**优先级: P0 - 高**
- Receive
- My Address
- QR Code
- Copy Address
- 等等...

### 10-23. 其他屏幕 - 共47处未翻译

## 📋 详细清单

### P0 - 核心功能（必须立即翻译）

#### HomeScreen.tsx (31处)
```
- "Total Balance"
- "Send"
- "Receive"  
- "Swap"
- "NFTs"
- "Tokens"
- "NFT"
- "DeFi"
- "Activity"
- "Total assets"
- "Custom Tokens"
- "Manage Wallets"
- "Settings"
- "DApp Browser"
- 等等...
```

#### CreateWalletScreen.tsx (20处)
```
- "Create Wallet"
- "Import Wallet"
- "Password"
- "Confirm Password"
- "Mnemonic Phrase"
- "Private Key"
- "Create"
- "Import"
- Alert对话框文本
- 等等...
```

#### SendScreen.tsx (12处)
```
- "Send"
- "Recipient Address"
- "Amount"
- "Gas Fee"
- "Confirm"
- "Cancel"
- Alert对话框
- 等等...
```

#### ReceiveScreen.tsx (8处)
```
- "Receive"
- "My Address"
- "QR Code"
- "Copy Address"
- "Share"
- 等等...
```

#### TransactionDetailScreen.tsx (15处)
```
- "Transaction Details"
- "Status"
- "From"
- "To"
- "Amount"
- "Fee"
- "Total"
- "Block"
- "Hash"
- "Time"
- "View on Explorer"
- 等等...
```

### P1 - 重要功能

#### SwapScreen.tsx (14处)
#### AddTokenScreen.tsx (12处)
#### NFTDetailScreen.tsx (12处)
#### NFTScreen.tsx (4处)
#### WalletsScreen.tsx (4处)
#### TransactionHistoryScreen.tsx (3处)

### P2 - 次要功能

#### AddDAppScreen.tsx (7处)
#### DAppBrowserScreen.tsx (2处)
#### SendConfirmationScreen.tsx (1处)

### P3 - 高级功能

#### PriceAlertScreen.tsx (9处)
#### AdvancedSettingsScreen.tsx (6处)
#### ExportPrivateKeyScreen.tsx (5处)
#### RPCNodeScreen.tsx (3处)

## 🔍 检查方法

使用正则表达式搜索: `<Text[^>]*>[A-Z][a-z]`
- 匹配所有包含英文大写字母开头的Text组件
- 不包括已使用 {t.*} 的翻译

## ⚠️ 关键发现

1. **HomeScreen是最严重的** - 31处未翻译，这是用户最常看到的页面
2. **CreateWalletScreen** - 20处未翻译，首次使用体验
3. **核心交易功能** - Send/Receive/Swap都有大量未翻译
4. **Alert对话框** - 大部分Alert.alert()还是英文

## 📝 建议行动

### 立即行动（今天完成）
1. HomeScreen - 31处
2. CreateWalletScreen - 20处
3. SendScreen - 12处
4. ReceiveScreen - 8处

### 第二优先级（明天完成）
5. TransactionDetailScreen - 15处
6. SwapScreen - 14处
7. AddTokenScreen - 12处
8. NFTDetailScreen - 12处

### 第三优先级（后续完成）
9-23. 其余屏幕

## 🎯 完成标准

- [ ] 所有172处硬编码文本已替换
- [ ] 所有Alert.alert已翻译
- [ ] 所有placeholder已翻译
- [ ] 测试中英文切换
- [ ] 无遗漏文本

## 📊 预计工作量

- **P0核心功能**: 2-3小时
- **P1重要功能**: 2-3小时
- **P2+P3其他**: 1-2小时
- **测试验证**: 1小时

**总计**: 6-9小时
