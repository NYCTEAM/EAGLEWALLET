/**
 * Eagle Wallet - Extended Translation Types
 * Complete translation structure for all screens
 */

export type Language = 'en' | 'zh' | 'zh-TW' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'ru' | 'ar' | 'pt' | 'it' | 'tr' | 'vi' | 'th' | 'id' | 'hi' | 'uk';

export interface TranslationStrings {
  // ===== COMMON =====
  common: {
    confirm: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    back: string;
    next: string;
    done: string;
    close: string;
    copy: string;
    copied: string;
    share: string;
    loading: string;
    success: string;
    error: string;
    warning: string;
    ok: string;
    yes: string;
    no: string;
    search: string;
    filter: string;
    sort: string;
    all: string;
    none: string;
    select: string;
    selected: string;
    add: string;
    remove: string;
    refresh: string;
    retry: string;
    skip: string;
    continue: string;
    contentCopied: string;
    send: string;
    receive: string;
    biometrics: string;
    verifyBiometrics: string;
    faceId: string;
    touchId: string;
    verifyDescription: string;
    quickSubmit: string;
  };

  // ===== HOME SCREEN =====
  home: {
    myWallet: string;
    totalBalance: string;
    send: string;
    receive: string;
    swap: string;
    tokens: string;
    nft: string;
    activity: string;
    selectWallet: string;
    selectNetwork: string;
    manageAddWallets: string;
    noTokens: string;
    noTransactions: string;
    pullToRefresh: string;
    hideSmallBalances: string;
    showSmallBalances: string;
  };

  // ===== WALLET =====
  wallet: {
    createWallet: string;
    importWallet: string;
    walletName: string;
    walletNamePlaceholder: string;
    walletNameHint: string;
    password: string;
    passwordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    mnemonic: string;
    mnemonicPlaceholder: string;
    privateKey: string;
    privateKeyPlaceholder: string;
    createNewWallet: string;
    importMnemonic: string;
    importPrivateKey: string;
    backupWarning: string;
    createSuccess: string;
    createSuccessMessage: string;
    importSuccess: string;
    importSuccessMessage: string;
    switchSuccess: string;
    deleteConfirm: string;
    deleteConfirmMessage: string;
    deleteSuccess: string;
    myWallets: string;
    activeWallet: string;
    walletAddress: string;
    copyAddress: string;
    addressCopied: string;
    passwordHint: string;
    generating: string;
    appSubtitle: string;
    poweredBy: string;
    privateKeyName: string;
    watchWallet: string;
    watchHint: string;
  };

  // ===== SEND =====
  send: {
    send: string;
    sendTo: string;
    recipient: string;
    recipientAddress: string;
    recipientPlaceholder: string;
    amount: string;
    amountPlaceholder: string;
    max: string;
    balance: string;
    available: string;
    gasFee: string;
    total: string;
    estimatedTime: string;
    fast: string;
    normal: string;
    slow: string;
    custom: string;
    gasPrice: string;
    gasLimit: string;
    nonce: string;
    data: string;
    sendConfirmation: string;
    confirmTransaction: string;
    transactionDetails: string;
    from: string;
    to: string;
    sending: string;
    sent: string;
    failed: string;
    viewTransaction: string;
    sendAnother: string;
    backToHome: string;
    scanQRCode: string;
    pasteAddress: string;
    recentAddresses: string;
    myWallets: string;
    enterAmount: string;
    insufficientBalance: string;
    invalidAddress: string;
    invalidAmount: string;
  };

  // ===== RECEIVE =====
  receive: {
    receive: string;
    myAddress: string;
    qrCode: string;
    copyAddress: string;
    share: string;
    addressCopied: string;
    shareAddress: string;
    onlyReceive: string;
    warningMessage: string;
    network: string;
  };

  // ===== SWAP =====
  swap: {
    swap: string;
    from: string;
    to: string;
    youPay: string;
    youReceive: string;
    selectToken: string;
    balance: string;
    max: string;
    rate: string;
    priceImpact: string;
    minimumReceived: string;
    estimatedReceived: string;
    slippageTolerance: string;
    transactionFee: string;
    route: string;
    pool: string;
    swapRoute: string;
    priceReference: string;
    price: string;
    fee: string;
    wallet: string;
    swapping: string;
    swapSuccess: string;
    swapFailed: string;
    insufficientLiquidity: string;
    priceImpactTooHigh: string;
    enterAmount: string;
    reviewSwap: string;
    confirmSwap: string;
    swapSettings: string;
    slippage: string;
    deadline: string;
    minutes: string;
    approve: string;
    approving: string;
    miningReward: string;
  };

  // ===== NFT =====
  nft: {
    nft: string;
    myNFTs: string;
    collection: string;
    collections: string;
    tokenId: string;
    owner: string;
    contract: string;
    description: string;
    properties: string;
    details: string;
    send: string;
    viewOnExplorer: string;
    refresh: string;
    noNFTs: string;
    loading: string;
    loadingNFTs: string;
    sendNFT: string;
    sendTo: string;
    confirmSend: string;
    nftSent: string;
    viewOnMarketplace: string;
    standard: string;
    unknownCollection: string;
  };

  // ===== TRANSACTION =====
  transaction: {
    transactions: string;
    history: string;
    pending: string;
    completed: string;
    failed: string;
    all: string;
    sent: string;
    received: string;
    swapped: string;
    approved: string;
    contract: string;
    noTransactions: string;
    transactionDetails: string;
    status: string;
    from: string;
    to: string;
    amount: string;
    fee: string;
    total: string;
    time: string;
    block: string;
    hash: string;
    nonce: string;
    gasPrice: string;
    gasUsed: string;
    gasLimit: string;
    data: string;
    viewOnExplorer: string;
    copyHash: string;
    hashCopied: string;
    speedUp: string;
    cancel: string;
    success: string;
    failure: string;
    confirming: string;
    confirmed: string;
    miningReward: string;
    viewRewards: string;
  };

  // ===== TOKEN =====
  token: {
    tokens: string;
    token: string;
    addToken: string;
    customToken: string;
    searchToken: string;
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals: string;
    tokenName: string;
    tokenAdded: string;
    tokenRemoved: string;
    invalidTokenAddress: string;
    tokenAlreadyAdded: string;
    balance: string;
    price: string;
    change24h: string;
    marketCap: string;
    volume24h: string;
    high24h: string;
    low24h: string;
    hideToken: string;
    showToken: string;
    removeToken: string;
    tokenDetails: string;
    contract: string;
    holders: string;
    totalSupply: string;
    activity: string;
    info: string;
    viewOnExplorer: string;
    importToken: string;
  };

  // ===== DAPP =====
  dapp: {
    dappBrowser: string;
    share: string;
    copyLink: string;
    scan: string;
    refresh: string;
    favorite: string;
    translatePage: string;
    clearCache: string;
    switchWallet: string;
    selectWalletPrompt: string;
    cacheClearConfirm: string;
    cacheCleared: string;
    linkCopied: string;
    favoriteAdded: string;
    translateInDevelopment: string;
    favorites: string;
    history: string;
    discover: string;
    search: string;
    searchPlaceholder: string;
    noDApps: string;
    popularDApps: string;
    recentlyVisited: string;
    addDApp: string;
    dappName: string;
    dappUrl: string;
    dappAdded: string;
    removeDApp: string;
    openInBrowser: string;
    customDApp: string;
    icon: string;
    addInfo: string;
    description: string;
    category: string;
    categoryDefi: string;
    categoryNft: string;
    categoryGame: string;
    categorySocial: string;
    categoryOther: string;
    connectWallet: string;
    connectWalletMessage: string;
    signMessage: string;
    signTypedData: string;
    signTypedDataMessage: string;
    pancakeDesc: string;
    uniswapDesc: string;
  };

  // ===== SETTINGS =====
  settings: {
    settings: string;
    back: string;
    
    // Sections
    walletManagement: string;
    network: string;
    security: string;
    advanced: string;
    preferences: string;
    about: string;
    dangerZone: string;
    
    // Wallet Management
    myWallets: string;
    myWalletsSubtitle: string;
    addCustomToken: string;
    addCustomTokenSubtitle: string;
    
    // Network
    currentNetwork: string;
    rpcNodes: string;
    rpcNodesSubtitle: string;
    
    // Security
    biometricAuth: string;
    biometricAuthSubtitle: string;
    exportPrivateKey: string;
    exportPrivateKeySubtitle: string;
    backupWallet: string;
    backupWalletSubtitle: string;
    changePassword: string;
    changePasswordSubtitle: string;
    
    // Advanced
    priceAlerts: string;
    priceAlertsSubtitle: string;
    advancedSettings: string;
    advancedSettingsSubtitle: string;
    
    // Preferences
    language: string;
    currency: string;
    
    // About
    version: string;
    termsOfService: string;
    privacyPolicy: string;
    support: string;
    supportSubtitle: string;
    
    // Danger Zone
    deleteWallet: string;
    deleteWalletSubtitle: string;
    
    // Alerts
    exportPrivateKeyTitle: string;
    exportPrivateKeyMessage: string;
    backupWalletTitle: string;
    backupWalletMessage: string;
    deleteWalletTitle: string;
    deleteWalletMessage: string;
    show: string;
    showRecoveryPhrase: string;
    chooseCurrency: string;
    resetApp: string;
    resetMessage: string;
    appReset: string;
    displayTestnet: string;
    enableAdvanced: string;
    autoLock: string;
    autoLockSubtitle: string;
    analytics: string;
    analyticsSubtitle: string;
    clearCacheSubtitle: string;
    resetAppSubtitle: string;
    advancedWarning: string;
  };

  // ===== NETWORK =====
  network: {
    network: string;
    networks: string;
    selectNetwork: string;
    customNetwork: string;
    addNetwork: string;
    networkName: string;
    rpcUrl: string;
    chainId: string;
    symbol: string;
    blockExplorer: string;
    networkAdded: string;
    networkRemoved: string;
    invalidRpcUrl: string;
    testConnection: string;
    connected: string;
    disconnected: string;
    connectionSpeed: string;
    fast: string;
    normal: string;
    slow: string;
    mainnet: string;
    testnet: string;
    nodesAvailable: string;
    hiddenUrl: string;
    fastestNode: string;
    bsc: string;
    rpcNode: string;
    selected: string;
  };

  // ===== PRICE ALERT =====
  priceAlert: {
    above: string;
    below: string;
    targetPrice: string;
    noAlerts: string;
    triggered: string;
    active: string;
    paused: string;
    pause: string;
    resume: string;
  };

  // ===== AI =====
  ai: {
    title: string;
    askPlaceholder: string;
    send: string;
    thinking: string;
    error: string;
    welcomeMessage: string;
    suggestedQuestions: string;
    marketAnalysis: string;
    securityCheck: string;
    pricePrediction: string;
    dailyLimit: string;
    upgrade: string;
    currentTier: string;
    free: string;
    holder: string;
    vip: string;
    pro: string;
    tokensRemaining: string;
    upgradePrompt: string;
    buyEagle: string;
    buyNft: string;
  };

  // ===== ERRORS =====
  errors: {
    walletNameRequired: string;
    passwordRequired: string;
    passwordMismatch: string;
    passwordTooShort: string;
    mnemonicRequired: string;
    mnemonicInvalid: string;
    privateKeyRequired: string;
    privateKeyInvalid: string;
    createWalletFailed: string;
    importWalletFailed: string;
    switchWalletFailed: string;
    deleteWalletFailed: string;
    insufficientBalance: string;
    invalidAddress: string;
    invalidAmount: string;
    transactionFailed: string;
    networkError: string;
    unknownError: string;
    connectionFailed: string;
    timeout: string;
    invalidInput: string;
    operationCancelled: string;
    permissionDenied: string;
    notFound: string;
    alreadyExists: string;
  };
}
