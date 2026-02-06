/**
 * Eagle Wallet - Translation Types
 */

export type Language = 'en' | 'zh' | 'zh-TW' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'ru' | 'ar' | 'pt' | 'it' | 'tr' | 'vi' | 'th' | 'id';

export interface TranslationStrings {
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
  };

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
  };

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
  };

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
  };

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
  };

  settings: {
    settings: string;
    language: string;
    currency: string;
    network: string;
    security: string;
    advanced: string;
    preferences: string;
  };
}
