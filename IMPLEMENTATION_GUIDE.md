# Eagle Wallet - 完整翻译实施指南

## 当前状态 Current Status

### 已完成的翻译 Completed
- ✅ **基础结构**: types.ts, LanguageContext, translations.ts
- ✅ **语言支持**: 16种语言框架
- ✅ **自动检测**: 设备语言自动检测
- ✅ **RTL支持**: 阿拉伯语RTL布局
- ✅ **屏幕翻译**:
  - AddWalletScreen (100%)
  - LanguageSettingsScreen (100%)
  - DAppWebViewScreen (100%)
  - SettingsScreen (80% - 需要完成es和ja)

### 下一步行动 Next Steps

## 第一阶段：完成核心翻译类型 (1-2小时)

### 步骤 1: 替换types.ts
```bash
# 备份当前文件
cp src/i18n/types.ts src/i18n/types-old.ts

# 使用扩展版本
cp src/i18n/types-extended.ts src/i18n/types.ts
```

### 步骤 2: 更新所有语言文件
需要为每个语言文件添加新的翻译键：
- en.ts ✅ (作为参考)
- zh.ts (简体中文)
- zh-TW.ts (繁体中文)
- es.ts (西班牙语)
- ja.ts (日语)
- 其他语言使用英文后备

## 第二阶段：批量翻译屏幕 (按优先级)

### P0 - 立即完成 (核心功能)

#### 1. HomeScreen - 主页
**文件**: `src/screens/HomeScreen.tsx`
**翻译键**: `home.*`, `common.*`, `wallet.*`
**预计时间**: 30分钟

关键文本：
- 余额显示
- 操作按钮 (发送/接收/兑换)
- 代币列表
- 钱包选择器
- 网络选择器

#### 2. SendScreen + EnterAmountScreen + SendConfirmationScreen
**文件**: 
- `src/screens/SendScreen.tsx`
- `src/screens/EnterAmountScreen.tsx`
- `src/screens/SendConfirmationScreen.tsx`
**翻译键**: `send.*`, `common.*`
**预计时间**: 45分钟

#### 3. ReceiveScreen - 接收
**文件**: `src/screens/ReceiveScreen.tsx`
**翻译键**: `receive.*`
**预计时间**: 15分钟

#### 4. TransactionHistoryScreen + TransactionDetailScreen
**文件**:
- `src/screens/TransactionHistoryScreen.tsx`
- `src/screens/TransactionDetailScreen.tsx`
**翻译键**: `transaction.*`
**预计时间**: 30分钟

### P1 - 重要功能 (1-2天)

#### 5. SwapScreen
**文件**: `src/screens/SwapScreen.tsx`
**翻译键**: `swap.*`
**预计时间**: 30分钟

#### 6. NFTScreen + NFTDetailScreen
**文件**:
- `src/screens/NFTScreen.tsx`
- `src/screens/NFTDetailScreen.tsx`
**翻译键**: `nft.*`
**预计时间**: 30分钟

#### 7. TokenDetailScreen + AddTokenScreen + SelectTokenScreen
**文件**:
- `src/screens/TokenDetailScreen.tsx`
- `src/screens/AddTokenScreen.tsx`
- `src/screens/SelectTokenScreen.tsx`
**翻译键**: `token.*`
**预计时间**: 45分钟

#### 8. WalletsScreen + CreateWalletScreen
**文件**:
- `src/screens/WalletsScreen.tsx`
- `src/screens/CreateWalletScreen.tsx`
**翻译键**: `wallet.*`
**预计时间**: 30分钟

### P2 - 次要功能

#### 9. DAppBrowserScreen + AddDAppScreen
**文件**:
- `src/screens/DAppBrowserScreen.tsx`
- `src/screens/AddDAppScreen.tsx`
**翻译键**: `dapp.*`
**预计时间**: 30分钟

#### 10. ExportPrivateKeyScreen
**文件**: `src/screens/ExportPrivateKeyScreen.tsx`
**翻译键**: `settings.*`, `security.*`
**预计时间**: 20分钟

### P3 - 高级功能

#### 11. AdvancedSettingsScreen
**文件**: `src/screens/AdvancedSettingsScreen.tsx`
**翻译键**: `settings.*`
**预计时间**: 20分钟

#### 12. RPCNodeScreen
**文件**: `src/screens/RPCNodeScreen.tsx`
**翻译键**: `network.*`
**预计时间**: 20分钟

#### 13. PriceAlertScreen
**文件**: `src/screens/PriceAlertScreen.tsx`
**翻译键**: `settings.*`
**预计时间**: 20分钟

## 第三阶段：测试和优化

### 测试清单
- [ ] 所有屏幕英文显示正常
- [ ] 所有屏幕简体中文显示正常
- [ ] 所有屏幕繁体中文显示正常
- [ ] 语言切换立即生效
- [ ] 设备语言自动检测工作正常
- [ ] 阿拉伯语RTL布局正确
- [ ] 所有Alert对话框已翻译
- [ ] 所有placeholder已翻译
- [ ] 所有错误消息已翻译

## 实施建议

### 高效工作流程
1. **一次处理一个屏幕**
2. **先添加翻译键到types.ts**
3. **然后更新所有语言文件**
4. **最后更新组件代码**
5. **立即测试该屏幕**

### 翻译原则
- 保持简洁明了
- 使用用户熟悉的术语
- 保持一致性
- 考虑文化差异
- 技术术语可保留英文（如NFT, DApp, Gas）

### 代码规范
```typescript
// ✅ 好的做法
const { t } = useLanguage();
<Text>{t.home.send}</Text>

// ❌ 避免
<Text>Send</Text>
<Text>{"Send"}</Text>
```

## 时间估算

- **第一阶段** (完成核心类型): 1-2小时
- **第二阶段 P0** (核心功能): 2-3小时
- **第二阶段 P1** (重要功能): 3-4小时
- **第二阶段 P2+P3** (其他功能): 2-3小时
- **第三阶段** (测试优化): 2-3小时

**总计**: 10-15小时工作量

## 资源

### 参考文件
- `src/i18n/types-extended.ts` - 完整翻译类型
- `src/i18n/locales/en.ts` - 英文参考
- `src/i18n/locales/zh.ts` - 中文参考
- `src/screens/AddWalletScreen.tsx` - 完整翻译示例

### 工具
- VS Code 多光标编辑
- 查找替换功能
- Git分支管理

## 提交策略

建议按功能模块提交：
```bash
git commit -m "feat: Add complete translations for Home screen"
git commit -m "feat: Add complete translations for Send/Receive screens"
git commit -m "feat: Add complete translations for Transaction screens"
# etc...
```

## 注意事项

1. **不要一次性修改所有文件** - 容易出错
2. **保持Git提交小而频繁** - 便于回滚
3. **先完成P0功能** - 确保核心功能可用
4. **测试每个屏幕** - 发现问题立即修复
5. **保持翻译一致性** - 使用相同术语

## 完成标准

- [ ] 所有27个屏幕已翻译
- [ ] 所有16种语言文件已更新
- [ ] 所有测试通过
- [ ] 文档已更新
- [ ] 代码已提交并推送
