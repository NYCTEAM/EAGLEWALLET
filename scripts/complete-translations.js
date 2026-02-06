/**
 * Script to add complete settings translations to all language files
 * Run with: node scripts/complete-translations.js
 */

const fs = require('fs');
const path = require('path');

const settingsTranslations = {
  es: `  settings: {
    settings: 'Configuración',
    back: 'Atrás',
    
    // Sections
    walletManagement: 'Gestión de Billeteras',
    network: 'Red',
    security: 'Seguridad',
    advanced: 'Avanzado',
    preferences: 'Preferencias',
    about: 'Acerca de',
    dangerZone: 'ZONA DE PELIGRO',
    
    // Wallet Management
    myWallets: 'Mis Billeteras',
    myWalletsSubtitle: 'Gestionar múltiples billeteras',
    addCustomToken: 'Añadir Token Personalizado',
    addCustomTokenSubtitle: 'Añadir tokens ERC20/721/1155',
    
    // Network
    currentNetwork: 'Red Actual',
    rpcNodes: 'Nodos RPC',
    rpcNodesSubtitle: 'Ver y probar velocidad de conexión',
    
    // Security
    biometricAuth: 'Autenticación Biométrica',
    biometricAuthSubtitle: 'Usar huella digital o Face ID',
    exportPrivateKey: 'Exportar Clave Privada',
    exportPrivateKeySubtitle: 'Ver tu clave privada',
    backupWallet: 'Respaldar Billetera',
    backupWalletSubtitle: 'Ver frase de recuperación',
    changePassword: 'Cambiar Contraseña',
    changePasswordSubtitle: 'Actualizar contraseña de billetera',
    
    // Advanced
    priceAlerts: 'Alertas de Precio',
    priceAlertsSubtitle: 'Configurar notificaciones de precio',
    advancedSettings: 'Configuración Avanzada',
    advancedSettingsSubtitle: 'Opciones de desarrollador',
    
    // Preferences
    language: 'Idioma',
    currency: 'Moneda',
    
    // About
    version: 'Versión',
    termsOfService: 'Términos de Servicio',
    privacyPolicy: 'Política de Privacidad',
    support: 'Soporte',
    supportSubtitle: 'Obtener ayuda',
    
    // Danger Zone
    deleteWallet: 'Eliminar Billetera',
    deleteWalletSubtitle: 'Eliminar permanentemente la billetera',
    
    // Alerts
    exportPrivateKeyTitle: 'Exportar Clave Privada',
    exportPrivateKeyMessage: '¡Tu clave privada da acceso completo a tu billetera. Nunca la compartas con nadie!',
    backupWalletTitle: 'Respaldar Billetera',
    backupWalletMessage: 'Anota tu frase de recuperación y guárdala de forma segura',
    deleteWalletTitle: 'Eliminar Billetera',
    deleteWalletMessage: '¿Estás seguro? ¡Asegúrate de haber respaldado tu frase de recuperación!',
    show: 'Mostrar',
    showRecoveryPhrase: 'Mostrar Frase de Recuperación',
    chooseCurrency: 'Elegir moneda',
  },`,
  
  ja: `  settings: {
    settings: '設定',
    back: '戻る',
    
    // Sections
    walletManagement: 'ウォレット管理',
    network: 'ネットワーク',
    security: 'セキュリティ',
    advanced: '詳細設定',
    preferences: '環境設定',
    about: '情報',
    dangerZone: '危険ゾーン',
    
    // Wallet Management
    myWallets: 'マイウォレット',
    myWalletsSubtitle: '複数のウォレットを管理',
    addCustomToken: 'カスタムトークンを追加',
    addCustomTokenSubtitle: 'ERC20/721/1155トークンを追加',
    
    // Network
    currentNetwork: '現在のネットワーク',
    rpcNodes: 'RPCノード',
    rpcNodesSubtitle: '接続速度を表示・テスト',
    
    // Security
    biometricAuth: '生体認証',
    biometricAuthSubtitle: '指紋またはFace IDを使用',
    exportPrivateKey: '秘密鍵をエクスポート',
    exportPrivateKeySubtitle: '秘密鍵を表示',
    backupWallet: 'ウォレットをバックアップ',
    backupWalletSubtitle: 'リカバリーフレーズを表示',
    changePassword: 'パスワードを変更',
    changePasswordSubtitle: 'ウォレットパスワードを更新',
    
    // Advanced
    priceAlerts: '価格アラート',
    priceAlertsSubtitle: '価格通知を設定',
    advancedSettings: '詳細設定',
    advancedSettingsSubtitle: '開発者オプション',
    
    // Preferences
    language: '言語',
    currency: '通貨',
    
    // About
    version: 'バージョン',
    termsOfService: '利用規約',
    privacyPolicy: 'プライバシーポリシー',
    support: 'サポート',
    supportSubtitle: 'ヘルプを取得',
    
    // Danger Zone
    deleteWallet: 'ウォレットを削除',
    deleteWalletSubtitle: 'ウォレットを完全に削除',
    
    // Alerts
    exportPrivateKeyTitle: '秘密鍵をエクスポート',
    exportPrivateKeyMessage: '秘密鍵はウォレットへの完全なアクセスを提供します。誰とも共有しないでください！',
    backupWalletTitle: 'ウォレットをバックアップ',
    backupWalletMessage: 'リカバリーフレーズを書き留めて安全に保管してください',
    deleteWalletTitle: 'ウォレットを削除',
    deleteWalletMessage: '本当によろしいですか？リカバリーフレーズをバックアップしていることを確認してください！',
    show: '表示',
    showRecoveryPhrase: 'リカバリーフレーズを表示',
    chooseCurrency: '通貨を選択',
  },`
};

console.log('Settings translations ready for es and ja');
console.log('Copy these to the respective locale files');
