# Eagle Wallet - Complete Implementation Plan
## 对比AlphaWallet缺失功能清单

### ✅ 已完成功能
1. ✅ 创建钱包
2. ✅ 导入钱包（助记词/私钥）
3. ✅ 代币显示（动态加载）
4. ✅ NFT显示（自动检测）
5. ✅ 发送代币流程
6. ✅ DApp浏览器
7. ✅ RPC节点选择
8. ✅ 实时价格显示

### ❌ 缺失的核心功能

#### 1. **多钱包管理** 🔴 高优先级
**AlphaWallet功能：**
- WalletsViewModel - 管理多个钱包
- 切换钱包
- 重命名钱包
- 删除钱包
- 导出钱包
- 备份钱包

**需要实现：**
```typescript
// src/services/MultiWalletService.ts
interface WalletAccount {
  id: string;
  name: string;
  address: string;
  type: 'mnemonic' | 'privateKey' | 'watch';
  isDefault: boolean;
  createdAt: number;
}

class MultiWalletService {
  // 创建新钱包
  async createWallet(name: string, password: string): Promise<WalletAccount>
  
  // 导入钱包
  async importWallet(name: string, mnemonic: string, password: string): Promise<WalletAccount>
  
  // 获取所有钱包
  async getAllWallets(): Promise<WalletAccount[]>
  
  // 切换钱包
  async switchWallet(walletId: string): Promise<void>
  
  // 重命名钱包
  async renameWallet(walletId: string, newName: string): Promise<void>
  
  // 删除钱包
  async deleteWallet(walletId: string): Promise<void>
  
  // 导出私钥
  async exportPrivateKey(walletId: string, password: string): Promise<string>
  
  // 备份钱包
  async backupWallet(walletId: string): Promise<string>
}
```

**需要的页面：**
- `WalletsScreen.tsx` - 钱包列表
- `AddWalletScreen.tsx` - 添加钱包选项
- `WalletDetailScreen.tsx` - 钱包详情
- `RenameWalletScreen.tsx` - 重命名
- `BackupWalletScreen.tsx` - 备份提示

---

#### 2. **添加自定义代币** 🔴 高优先级
**AlphaWallet功能：**
- AddTokenViewModel
- ImportTokenViewModel
- 输入合约地址自动获取代币信息
- 支持ERC20, ERC721, ERC1155

**需要实现：**
```typescript
// src/services/CustomTokenService.ts
interface CustomToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  type: 'ERC20' | 'ERC721' | 'ERC1155';
  chainId: number;
  logo?: string;
}

class CustomTokenService {
  // 通过合约地址获取代币信息
  async getTokenInfo(contractAddress: string, chainId: number): Promise<CustomToken>
  
  // 添加自定义代币
  async addCustomToken(token: CustomToken): Promise<void>
  
  // 获取用户添加的代币
  async getCustomTokens(chainId: number): Promise<CustomToken[]>
  
  // 删除自定义代币
  async removeCustomToken(address: string, chainId: number): Promise<void>
  
  // 检测代币类型（ERC20/721/1155）
  async detectTokenType(address: string, chainId: number): Promise<string>
}
```

**需要的页面：**
- `AddTokenScreen.tsx` - 添加代币
- `SearchTokenScreen.tsx` - 搜索代币
- `TokenManagementScreen.tsx` - 管理已添加代币

---

#### 3. **交易历史** 🟡 中优先级
**AlphaWallet功能：**
- TransactionDetailViewModel
- 完整交易历史
- 交易详情
- 交易状态追踪

**需要实现：**
```typescript
// src/services/TransactionService.ts
interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  token?: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  gasUsed: string;
  gasPrice: string;
  nonce: number;
  chainId: number;
}

class TransactionService {
  // 获取交易历史
  async getTransactionHistory(address: string, chainId: number): Promise<Transaction[]>
  
  // 获取交易详情
  async getTransactionDetail(txHash: string, chainId: number): Promise<Transaction>
  
  // 监听待处理交易
  async watchPendingTransaction(txHash: string): Promise<Transaction>
  
  // 加速交易
  async speedUpTransaction(txHash: string, newGasPrice: string): Promise<string>
  
  // 取消交易
  async cancelTransaction(txHash: string): Promise<string>
}
```

**需要的页面：**
- `TransactionHistoryScreen.tsx` - 交易列表（已有，需完善）
- `TransactionDetailScreen.tsx` - 交易详情（已有，需完善）

---

#### 4. **Gas费用设置** 🟡 中优先级
**AlphaWallet功能：**
- GasSettingsViewModel
- 自定义Gas Price
- Gas Limit设置
- EIP-1559支持

**需要实现：**
```typescript
// src/services/GasService.ts
interface GasSettings {
  gasPrice?: string;      // Legacy
  maxFeePerGas?: string;  // EIP-1559
  maxPriorityFeePerGas?: string; // EIP-1559
  gasLimit: string;
}

class GasService {
  // 获取推荐Gas价格
  async getGasPrice(chainId: number): Promise<GasSettings>
  
  // 获取Gas估算
  async estimateGas(tx: any, chainId: number): Promise<string>
  
  // 获取EIP-1559费用
  async getEIP1559Fees(chainId: number): Promise<{
    low: GasSettings;
    medium: GasSettings;
    high: GasSettings;
  }>
}
```

**需要的页面：**
- `GasSettingsScreen.tsx` - Gas设置
- Gas选择器组件（慢/标准/快）

---

#### 5. **网络管理** 🟡 中优先级
**AlphaWallet功能：**
- CustomNetworkViewModel
- NetworkToggleViewModel
- 添加自定义网络
- 启用/禁用网络

**需要实现：**
```typescript
// src/services/NetworkService.ts
interface CustomNetwork {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  isCustom: boolean;
  isEnabled: boolean;
}

class NetworkService {
  // 添加自定义网络
  async addCustomNetwork(network: CustomNetwork): Promise<void>
  
  // 获取所有网络
  async getAllNetworks(): Promise<CustomNetwork[]>
  
  // 启用/禁用网络
  async toggleNetwork(chainId: number, enabled: boolean): Promise<void>
  
  // 删除自定义网络
  async removeNetwork(chainId: number): Promise<void>
  
  // 编辑网络
  async editNetwork(chainId: number, updates: Partial<CustomNetwork>): Promise<void>
}
```

**需要的页面：**
- `NetworkManagementScreen.tsx` - 网络管理
- `AddNetworkScreen.tsx` - 添加网络
- `EditNetworkScreen.tsx` - 编辑网络

---

#### 6. **WalletConnect集成** 🟢 低优先级
**AlphaWallet功能：**
- WalletConnectViewModel
- WalletConnectV2ViewModel
- 扫描二维码连接DApp
- 签名请求处理

**需要实现：**
```typescript
// src/services/WalletConnectService.ts
class WalletConnectService {
  // 连接DApp
  async connect(uri: string): Promise<void>
  
  // 断开连接
  async disconnect(sessionId: string): Promise<void>
  
  // 处理签名请求
  async handleSignRequest(request: any): Promise<string>
  
  // 处理交易请求
  async handleTransactionRequest(request: any): Promise<string>
  
  // 获取活动会话
  async getActiveSessions(): Promise<any[]>
}
```

**需要的页面：**
- `WalletConnectScreen.tsx` - WC会话管理
- `WalletConnectRequestScreen.tsx` - 请求确认

---

#### 7. **代币Swap功能** 🟢 低优先级
**AlphaWallet功能：**
- SwapViewModel
- SelectSwapProvidersViewModel
- 代币兑换
- 多个DEX聚合

**需要实现：**
```typescript
// src/services/SwapService.ts
interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  provider: string;
  gasEstimate: string;
  priceImpact: string;
}

class SwapService {
  // 获取兑换报价
  async getQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    chainId: number
  ): Promise<SwapQuote[]>
  
  // 执行兑换
  async executeSwap(quote: SwapQuote): Promise<string>
  
  // 获取支持的代币对
  async getSupportedPairs(chainId: number): Promise<string[][]>
}
```

**需要的页面：**
- `SwapScreen.tsx` - 代币兑换
- `SwapConfirmScreen.tsx` - 确认兑换
- `SelectSwapProviderScreen.tsx` - 选择DEX

---

#### 8. **地址簿** 🟢 低优先级
**AlphaWallet功能：**
- 保存常用地址
- 地址备注
- 地址分组

**需要实现：**
```typescript
// src/services/AddressBookService.ts
interface AddressEntry {
  id: string;
  address: string;
  name: string;
  note?: string;
  chainId?: number;
  createdAt: number;
}

class AddressBookService {
  // 添加地址
  async addAddress(entry: AddressEntry): Promise<void>
  
  // 获取所有地址
  async getAllAddresses(): Promise<AddressEntry[]>
  
  // 搜索地址
  async searchAddress(query: string): Promise<AddressEntry[]>
  
  // 删除地址
  async removeAddress(id: string): Promise<void>
  
  // 更新地址
  async updateAddress(id: string, updates: Partial<AddressEntry>): Promise<void>
}
```

**需要的页面：**
- `AddressBookScreen.tsx` - 地址簿
- `AddAddressScreen.tsx` - 添加地址
- `EditAddressScreen.tsx` - 编辑地址

---

#### 9. **价格提醒** 🟢 低优先级
**AlphaWallet功能：**
- SetPriceAlertViewModel
- TokenAlertsViewModel
- 价格达到目标时通知

**需要实现：**
```typescript
// src/services/PriceAlertService.ts
interface PriceAlert {
  id: string;
  tokenAddress: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: number;
}

class PriceAlertService {
  // 创建价格提醒
  async createAlert(alert: PriceAlert): Promise<void>
  
  // 获取所有提醒
  async getAllAlerts(): Promise<PriceAlert[]>
  
  // 删除提醒
  async removeAlert(id: string): Promise<void>
  
  // 检查价格触发
  async checkAlerts(): Promise<PriceAlert[]>
}
```

---

#### 10. **高级设置** 🟢 低优先级
**AlphaWallet功能：**
- AdvancedSettingsViewModel
- 显示测试网
- 显示开发者选项
- 清除缓存

**需要的页面：**
- `AdvancedSettingsScreen.tsx`
- 测试网络切换
- 开发者工具

---

## 📋 实现优先级

### 🔴 第一阶段（必须）
1. **多钱包管理** - 用户可以创建/管理多个钱包
2. **添加自定义代币** - 用户可以添加任何ERC20代币

### 🟡 第二阶段（重要）
3. **完善交易历史** - 显示所有交易记录
4. **Gas费用设置** - 自定义Gas价格
5. **网络管理** - 添加自定义RPC网络

### 🟢 第三阶段（增强）
6. **WalletConnect** - 连接DApp
7. **Swap功能** - 代币兑换
8. **地址簿** - 保存常用地址
9. **价格提醒** - 价格通知
10. **高级设置** - 更多配置选项

---

## 📁 需要创建的文件

### Services (服务层)
```
src/services/
├── MultiWalletService.ts      ✨ 新建
├── CustomTokenService.ts      ✨ 新建
├── TransactionService.ts      ✨ 新建
├── GasService.ts              ✨ 新建
├── NetworkService.ts          ✨ 新建
├── WalletConnectService.ts    ✨ 新建
├── SwapService.ts             ✨ 新建
├── AddressBookService.ts      ✨ 新建
└── PriceAlertService.ts       ✨ 新建
```

### Screens (页面层)
```
src/screens/
├── WalletsScreen.tsx          ✨ 新建
├── AddWalletScreen.tsx        ✨ 新建
├── WalletDetailScreen.tsx     ✨ 新建
├── AddTokenScreen.tsx         ✨ 新建
├── TokenManagementScreen.tsx  ✨ 新建
├── GasSettingsScreen.tsx      ✨ 新建
├── NetworkManagementScreen.tsx ✨ 新建
├── AddNetworkScreen.tsx       ✨ 新建
├── WalletConnectScreen.tsx    ✨ 新建
├── SwapScreen.tsx             ✨ 新建
├── AddressBookScreen.tsx      ✨ 新建
└── AdvancedSettingsScreen.tsx ✨ 新建
```

### Storage (存储层)
```
src/storage/
├── WalletStorage.ts           ✨ 新建
├── TokenStorage.ts            ✨ 新建
├── NetworkStorage.ts          ✨ 新建
└── AddressBookStorage.ts      ✨ 新建
```

---

## 🎯 立即开始实现

### 第一步：多钱包管理
这是最重要的功能，让我们先实现这个！

**文件清单：**
1. `src/services/MultiWalletService.ts`
2. `src/storage/WalletStorage.ts`
3. `src/screens/WalletsScreen.tsx`
4. `src/screens/AddWalletScreen.tsx`
5. `src/screens/WalletDetailScreen.tsx`

---

## 📊 功能对比表

| 功能 | AlphaWallet | Eagle Wallet | 状态 |
|------|-------------|--------------|------|
| 创建钱包 | ✅ | ✅ | 完成 |
| 导入钱包 | ✅ | ✅ | 完成 |
| **多钱包管理** | ✅ | ❌ | 🔴 待实现 |
| **添加自定义代币** | ✅ | ❌ | 🔴 待实现 |
| 代币显示 | ✅ | ✅ | 完成 |
| NFT显示 | ✅ | ✅ | 完成 |
| 发送代币 | ✅ | ✅ | 完成 |
| **交易历史** | ✅ | 🟡 | 🟡 需完善 |
| **Gas设置** | ✅ | ❌ | 🟡 待实现 |
| **网络管理** | ✅ | 🟡 | 🟡 需完善 |
| DApp浏览器 | ✅ | ✅ | 完成 |
| **WalletConnect** | ✅ | ❌ | 🟢 待实现 |
| **Swap功能** | ✅ | ❌ | 🟢 待实现 |
| **地址簿** | ✅ | ❌ | 🟢 待实现 |
| **价格提醒** | ✅ | ❌ | 🟢 待实现 |
| RPC选择 | ✅ | ✅ | 完成 |
| 实时价格 | ❌ | ✅ | 完成 |

---

## 🚀 下一步行动

**立即开始实现多钱包管理功能！**

这是用户最需要的功能，可以让用户：
- 创建多个钱包账户
- 在不同钱包之间切换
- 给钱包命名
- 备份和导出钱包
- 删除不需要的钱包

准备好了吗？让我们开始编码！🦅
