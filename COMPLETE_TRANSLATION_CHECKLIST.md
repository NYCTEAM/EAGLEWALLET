# 完整翻译检查清单
# Complete Translation Checklist

## ✅ 已完成 (4/27)

1. ✅ **AddWalletScreen** - 100%
2. ✅ **LanguageSettingsScreen** - 100%
3. ✅ **SettingsScreen** - 95%
4. ✅ **DAppWebViewScreen** - 90%

## 🔴 需要翻译 (23/27)

### HomeScreen.tsx - 31处未翻译

#### 需要替换的文本：
```typescript
// Line 197
"Total Balance" → {t.home.totalBalance}

// Line 216
"Send" → {t.home.send}

// Line 224
"Receive" → {t.home.receive}

// Line 232
"Swap" → {t.home.swap}

// Line 243
"NFTs" → {t.home.nft}

// Line 251
"DApps" → {t.dapp.dappBrowser}

// Line 259
"Settings" → {t.settings.settings}

// Line 269
"Tokens" → {t.home.tokens}

// Line 275
"NFT" → {t.home.nft}

// Line 281
"DeFi" → "DeFi" // 保持英文

// Line 287
"Activity" → {t.home.activity}

// Line 295
"Total assets" → {t.token.tokens}

// Line 297
"Manage" → {t.common.edit}

// Line 334
"Custom Tokens" → {t.token.customToken}

// Line 372
"Add Token" → {t.token.addToken}

// Line 382-383
"No NFTs yet" → {t.nft.noNFTs}
"Your NFT collection will appear here" → {t.nft.noNFTs}

// Line 393-394
"No DeFi positions" → "暂无DeFi"
"Your DeFi investments will appear here" → "您的DeFi投资将显示在这里"

// Line 403
"Recent Transactions" → {t.transaction.history}

// Line 405
"View All" → {t.common.all}

// Line 411-412
"No transactions yet" → {t.transaction.noTransactions}
"Your transaction history will appear here" → {t.home.noTransactions}

// Line 441
"Home" → {t.home.myWallet}

// Line 446
"Browser" → {t.dapp.dappBrowser}

// Line 451
"Trade" → {t.home.swap}

// Line 456
"Settings" → {t.settings.settings}

// Line 473
"Select Network" → {t.network.selectNetwork}

// Line 480
"BNB Smart Chain" → "BNB Smart Chain" // 保持

// Line 487
"X Layer" → "X Layer" // 保持

// Line 497
"Select Wallet" → {t.home.selectWallet}

// Line 512
"Manage / Add Wallets" → {t.home.manageAddWallets}
```

### CreateWalletScreen.tsx - 20处未翻译

```typescript
"Create Wallet" → {t.wallet.createWallet}
"Import Wallet" → {t.wallet.importWallet}
"Password" → {t.wallet.password}
"Confirm Password" → {t.wallet.confirmPassword}
"Mnemonic Phrase" → {t.wallet.mnemonic}
"Private Key" → {t.wallet.privateKey}
"Create" → {t.common.confirm}
"Import" → {t.wallet.importWallet}
// Alert对话框也需要翻译
```

### SendScreen.tsx - 12处未翻译

```typescript
"Send" → {t.send.send}
"Recipient Address" → {t.send.recipientAddress}
"Amount" → {t.send.amount}
"Gas Fee" → {t.send.gasFee}
"Total" → {t.send.total}
"Confirm" → {t.common.confirm}
"Cancel" → {t.common.cancel}
// 等等...
```

### ReceiveScreen.tsx - 8处未翻译

```typescript
"Receive" → {t.receive.receive}
"My Address" → {t.receive.myAddress}
"QR Code" → {t.receive.qrCode}
"Copy Address" → {t.receive.copyAddress}
"Share" → {t.common.share}
// 等等...
```

### TransactionDetailScreen.tsx - 15处未翻译

```typescript
"Transaction Details" → {t.transaction.transactionDetails}
"Status" → {t.transaction.status}
"From" → {t.transaction.from}
"To" → {t.transaction.to}
"Amount" → {t.transaction.amount}
"Fee" → {t.transaction.fee}
"Total" → {t.transaction.total}
"Block" → {t.transaction.block}
"Hash" → {t.transaction.hash}
"Time" → {t.transaction.time}
"View on Explorer" → {t.transaction.viewOnExplorer}
// 等等...
```

### SwapScreen.tsx - 14处未翻译

```typescript
"Swap" → {t.swap.swap}
"You Pay" → {t.swap.youPay}
"You Receive" → {t.swap.youReceive}
"Select Token" → {t.swap.selectToken}
"Balance" → {t.swap.balance}
"MAX" → {t.send.max}
"Rate" → {t.swap.rate}
"Slippage Tolerance" → {t.swap.slippageTolerance}
"Price Impact" → {t.swap.priceImpact}
"Minimum Received" → {t.swap.minimumReceived}
"Review Swap" → {t.swap.reviewSwap}
"Confirm Swap" → {t.swap.confirmSwap}
// 等等...
```

### AddTokenScreen.tsx - 12处未翻译

```typescript
"Add Custom Token" → {t.token.addToken}
"Token Address" → {t.token.tokenAddress}
"Token Symbol" → {t.token.tokenSymbol}
"Token Decimals" → {t.token.tokenDecimals}
"Token Name" → {t.token.tokenName}
"Add" → {t.common.add}
"Cancel" → {t.common.cancel}
// 等等...
```

### NFTDetailScreen.tsx - 12处未翻译

```typescript
"NFT Details" → {t.nft.details}
"Collection" → {t.nft.collection}
"Owner" → {t.nft.owner}
"Token ID" → {t.nft.tokenId}
"Contract" → {t.nft.contract}
"Description" → {t.nft.description}
"Properties" → {t.nft.properties}
"Send" → {t.nft.send}
"View on Explorer" → {t.nft.viewOnExplorer}
// 等等...
```

### WalletsScreen.tsx - 4处未翻译

```typescript
"My Wallets" → {t.wallet.myWallets}
"Active" → {t.wallet.activeWallet}
"Delete" → {t.common.delete}
// Alert对话框
```

### NFTScreen.tsx - 4处未翻译

```typescript
"My NFTs" → {t.nft.myNFTs}
"No NFTs yet" → {t.nft.noNFTs}
"Refresh" → {t.common.refresh}
"Loading..." → {t.common.loading}
```

### TransactionHistoryScreen.tsx - 3处未翻译

```typescript
"Transactions" → {t.transaction.transactions}
"All" → {t.common.all}
"Pending" → {t.transaction.pending}
```

### AddDAppScreen.tsx - 7处未翻译

```typescript
"Add DApp" → {t.dapp.addDApp}
"DApp Name" → {t.dapp.dappName}
"DApp URL" → {t.dapp.dappUrl}
"Add" → {t.common.add}
"Cancel" → {t.common.cancel}
// 等等...
```

### PriceAlertScreen.tsx - 9处未翻译

```typescript
"Price Alerts" → {t.settings.priceAlerts}
"Token" → {t.token.token}
"Target Price" → "目标价格"
"Add Alert" → "添加提醒"
// 等等...
```

### AdvancedSettingsScreen.tsx - 6处未翻译

```typescript
"Advanced Settings" → {t.settings.advancedSettings}
"Developer Mode" → "开发者模式"
"Debug Mode" → "调试模式"
// 等等...
```

### ExportPrivateKeyScreen.tsx - 5处未翻译

```typescript
"Export Private Key" → {t.settings.exportPrivateKey}
"Private Key" → {t.wallet.privateKey}
"Copy" → {t.common.copy}
"Warning" → {t.common.warning}
// 等等...
```

### RPCNodeScreen.tsx - 3处未翻译

```typescript
"RPC Nodes" → {t.settings.rpcNodes}
"Test Connection" → {t.network.testConnection}
"Connection Speed" → {t.network.connectionSpeed}
```

### DAppBrowserScreen.tsx - 2处未翻译

```typescript
"DApp Browser" → {t.dapp.dappBrowser}
"Search" → {t.common.search}
```

### SendConfirmationScreen.tsx - 1处未翻译

```typescript
"Confirm Transaction" → {t.send.confirmTransaction}
```

## 📊 统计

- **总未翻译文本**: 172处
- **P0核心**: 71处 (HomeScreen 31 + CreateWallet 20 + Send 12 + Receive 8)
- **P1重要**: 57处 (Transaction 15 + Swap 14 + AddToken 12 + NFT 12 + 其他)
- **P2+P3**: 44处

## ⏱️ 预计时间

- P0: 2-3小时
- P1: 2-3小时
- P2+P3: 1-2小时
- **总计**: 5-8小时纯翻译时间
