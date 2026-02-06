# Eagle Wallet - Complete Translation Plan

## 翻译进度 Translation Progress

### ✅ 已完成 Completed (4/27)
1. ✅ **AddWalletScreen** - 创建/导入钱包
2. ✅ **LanguageSettingsScreen** - 语言设置
3. ✅ **SettingsScreen** - 设置页面 (进行中)
4. ✅ **DAppWebViewScreen** - DApp浏览器

### 🔄 进行中 In Progress (1/27)
5. 🔄 **SettingsScreen** - 需要完成es和ja翻译

### ⏳ 待翻译 Pending (22/27)
6. ⏳ **HomeScreen** - 主页 (最重要)
7. ⏳ **CreateWalletScreen** - 创建钱包
8. ⏳ **WalletsScreen** - 钱包列表
9. ⏳ **SendScreen** - 发送
10. ⏳ **ReceiveScreen** - 接收
11. ⏳ **SwapScreen** - 兑换
12. ⏳ **NFTScreen** - NFT列表
13. ⏳ **NFTDetailScreen** - NFT详情
14. ⏳ **TokenDetailScreen** - 代币详情
15. ⏳ **TransactionHistoryScreen** - 交易历史
16. ⏳ **TransactionDetailScreen** - 交易详情
17. ⏳ **TransactionResultScreen** - 交易结果
18. ⏳ **SendConfirmationScreen** - 发送确认
19. ⏳ **EnterAddressScreen** - 输入地址
20. ⏳ **EnterAmountScreen** - 输入金额
21. ⏳ **SelectTokenScreen** - 选择代币
22. ⏳ **AddTokenScreen** - 添加代币
23. ⏳ **DAppBrowserScreen** - DApp浏览器主页
24. ⏳ **AddDAppScreen** - 添加DApp
25. ⏳ **ExportPrivateKeyScreen** - 导出私钥
26. ⏳ **RPCNodeScreen** - RPC节点
27. ⏳ **PriceAlertScreen** - 价格提醒
28. ⏳ **AdvancedSettingsScreen** - 高级设置

## 翻译结构 Translation Structure

```typescript
export interface TranslationStrings {
  common: {...}          // ✅ 完成
  home: {...}            // ⏳ 需要扩展
  wallet: {...}          // ✅ 完成
  errors: {...}          // ✅ 完成
  dapp: {...}            // ✅ 完成
  settings: {...}        // 🔄 进行中
  
  // 待添加 To be added:
  send: {...}            // 发送相关
  receive: {...}         // 接收相关
  swap: {...}            // 兑换相关
  nft: {...}             // NFT相关
  transaction: {...}     // 交易相关
  token: {...}           // 代币相关
  network: {...}         // 网络相关
  security: {...}        // 安全相关
}
```

## 优先级 Priority

### P0 - 核心功能 (必须立即完成)
- HomeScreen
- SendScreen
- ReceiveScreen
- TransactionHistoryScreen

### P1 - 重要功能
- SwapScreen
- NFTScreen
- TokenDetailScreen
- WalletsScreen

### P2 - 次要功能
- DAppBrowserScreen
- AddTokenScreen
- ExportPrivateKeyScreen

### P3 - 高级功能
- AdvancedSettingsScreen
- RPCNodeScreen
- PriceAlertScreen

## 实施策略 Implementation Strategy

1. **第一阶段**: 完成SettingsScreen的es和ja翻译
2. **第二阶段**: 扩展types.ts添加所有必要的翻译键
3. **第三阶段**: 批量更新所有语言文件(en, zh, zh-TW, es, ja)
4. **第四阶段**: 逐个更新屏幕组件使用翻译
5. **第五阶段**: 测试和修复

## 注意事项 Notes

- 所有硬编码文本必须替换为翻译键
- Alert对话框也需要翻译
- 占位符文本(placeholder)需要翻译
- 错误消息需要翻译
- 按钮文本需要翻译
- 标题和副标题需要翻译
