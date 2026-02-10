/**
 * Eagle Wallet - Backup Service
 * Backup and restore wallet data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { ethers } from 'ethers';
import WalletStorage, { WalletAccount } from '../storage/WalletStorage';

const MULTI_WALLET_KEY_PREFIX = 'EAGLE_WALLET_';
const LEGACY_WALLET_KEY = 'EAGLE_WALLET_KEY';
const LEGACY_WALLET_ADDRESS_KEY = 'EAGLE_WALLET_ADDRESS';
const LEGACY_MNEMONIC_KEY = 'EAGLE_WALLET_MNEMONIC';
const LEGACY_PASSWORD_HASH_KEY = 'EAGLE_PASSWORD_HASH';

interface BackupWallet extends WalletAccount {
  privateKey?: string;
}

interface LegacyWalletSnapshot {
  privateKey?: string;
  address?: string;
  mnemonic?: string;
  passwordHash?: string;
}

export interface BackupData {
  version: string;
  timestamp: number;
  wallets: BackupWallet[];
  activeWalletId?: string | null;
  legacyWallet?: LegacyWalletSnapshot;
  settings: any;
  addressBook: any[];
  customTokens: any[];
}

interface SecureBackupEnvelopeV3 {
  v: 3;
  i: number; // PBKDF2 iterations
  s: string; // salt hex
  n: string; // nonce hex
  d: string; // encrypted payload hex
  m: string; // HMAC hex
}

class BackupService {
  private readonly VERSION = '1.1.0';
  private readonly PBKDF2_ITERATIONS = 210_000;

  async createBackup(password: string): Promise<string> {
    try {
      const wallets = await this.getWalletsWithSecrets();
      const settings = await this.getSettings();
      const addressBook = await this.getAddressBook();
      const customTokens = await this.getCustomTokens();
      const activeWalletId = await WalletStorage.getActiveWalletId();
      const legacyWallet = await this.getLegacyWalletSnapshot();

      const backupData: BackupData = {
        version: this.VERSION,
        timestamp: Date.now(),
        wallets,
        activeWalletId,
        legacyWallet,
        settings,
        addressBook,
        customTokens,
      };

      return this.encryptBackup(JSON.stringify(backupData), password);
    } catch (error) {
      console.error('Backup error:', error);
      throw new Error('Failed to create backup');
    }
  }

  async restoreBackup(encryptedData: string, password: string): Promise<void> {
    try {
      const decrypted = await this.decryptBackup(encryptedData, password);
      const backupData: BackupData = JSON.parse(decrypted);

      if (!this.isCompatibleVersion(backupData.version)) {
        throw new Error('Incompatible backup version');
      }

      await this.restoreWallets(backupData.wallets, backupData.activeWalletId || null);
      await this.restoreLegacyWallet(backupData.legacyWallet, backupData.wallets, backupData.activeWalletId || null);
      await this.restoreSettings(backupData.settings);
      await this.restoreAddressBook(backupData.addressBook);
      await this.restoreCustomTokens(backupData.customTokens);
    } catch (error) {
      console.error('Restore error:', error);
      throw new Error('Failed to restore backup');
    }
  }

  async exportMnemonic(walletId: string): Promise<string> {
    try {
      const keyName = `${MULTI_WALLET_KEY_PREFIX}${walletId}`;
      const credentials = await Keychain.getGenericPassword({ service: keyName });
      if (!credentials) {
        throw new Error('Wallet not found');
      }
      return credentials.password;
    } catch (error) {
      console.error('Export mnemonic error:', error);
      throw error;
    }
  }

  private async getWalletsWithSecrets(): Promise<BackupWallet[]> {
    const wallets = await WalletStorage.getAllWallets();
    const withSecrets: BackupWallet[] = [];

    for (const wallet of wallets) {
      if (wallet.type === 'watch') {
        withSecrets.push(wallet);
        continue;
      }

      const keyName = `${MULTI_WALLET_KEY_PREFIX}${wallet.id}`;
      const credentials = await Keychain.getGenericPassword({ service: keyName });

      withSecrets.push({
        ...wallet,
        privateKey: credentials ? credentials.password : undefined,
      });
    }

    return withSecrets;
  }

  private async getLegacyWalletSnapshot(): Promise<LegacyWalletSnapshot> {
    const [legacyCredentials, mnemonicCredentials, address, passwordHash] = await Promise.all([
      Keychain.getGenericPassword(),
      Keychain.getGenericPassword({ service: LEGACY_MNEMONIC_KEY }),
      AsyncStorage.getItem(LEGACY_WALLET_ADDRESS_KEY),
      AsyncStorage.getItem(LEGACY_PASSWORD_HASH_KEY),
    ]);

    return {
      privateKey: legacyCredentials ? legacyCredentials.password : undefined,
      mnemonic: mnemonicCredentials ? mnemonicCredentials.password : undefined,
      address: address || undefined,
      passwordHash: passwordHash || undefined,
    };
  }

  private encryptBackup(data: string, password: string): string {
    const salt = ethers.randomBytes(16);
    const nonce = ethers.randomBytes(16);

    const derived = ethers.pbkdf2(
      ethers.toUtf8Bytes(password),
      salt,
      this.PBKDF2_ITERATIONS,
      64,
      'sha256'
    );
    const derivedBytes = ethers.getBytes(derived);
    const encKey = derivedBytes.slice(0, 32);
    const macKey = derivedBytes.slice(32, 64);

    const plaintext = ethers.toUtf8Bytes(data);
    const encrypted = this.streamCipherXor(plaintext, encKey, nonce);
    const macInput = ethers.concat([salt, nonce, encrypted]);
    const mac = ethers.computeHmac('sha256', macKey, macInput);

    const envelope: SecureBackupEnvelopeV3 = {
      v: 3,
      i: this.PBKDF2_ITERATIONS,
      s: ethers.hexlify(salt),
      n: ethers.hexlify(nonce),
      d: ethers.hexlify(encrypted),
      m: mac,
    };

    return `EAGLE_BACKUP_V3:${ethers.encodeBase64(ethers.toUtf8Bytes(JSON.stringify(envelope)))}`;
  }

  private async decryptBackup(encrypted: string, password: string): Promise<string> {
    if (encrypted.startsWith('EAGLE_BACKUP_V3:')) {
      const payload = encrypted.replace('EAGLE_BACKUP_V3:', '');
      const envelopeRaw = ethers.toUtf8String(ethers.decodeBase64(payload));
      const envelope: SecureBackupEnvelopeV3 = JSON.parse(envelopeRaw);

      if (!envelope || envelope.v !== 3 || !envelope.s || !envelope.n || !envelope.d || !envelope.m) {
        throw new Error('Invalid backup format');
      }

      const salt = ethers.getBytes(envelope.s);
      const nonce = ethers.getBytes(envelope.n);
      const encryptedBytes = ethers.getBytes(envelope.d);

      const derived = ethers.pbkdf2(
        ethers.toUtf8Bytes(password),
        salt,
        envelope.i,
        64,
        'sha256'
      );
      const derivedBytes = ethers.getBytes(derived);
      const encKey = derivedBytes.slice(0, 32);
      const macKey = derivedBytes.slice(32, 64);

      const expectedMac = ethers.computeHmac(
        'sha256',
        macKey,
        ethers.concat([salt, nonce, encryptedBytes])
      );

      if (expectedMac.toLowerCase() !== envelope.m.toLowerCase()) {
        throw new Error('Incorrect password');
      }

      const plaintextBytes = this.streamCipherXor(encryptedBytes, encKey, nonce);
      return ethers.toUtf8String(plaintextBytes);
    }

    if (encrypted.startsWith('EAGLE_BACKUP_V2:')) {
      const parts = encrypted.split(':');
      if (parts.length < 3) {
        throw new Error('Invalid backup format');
      }

      const storedHash = parts[1];
      const encodedData = parts.slice(2).join(':');
      const pwHash = ethers.keccak256(ethers.toUtf8Bytes(password)).slice(0, 18);
      if (pwHash !== storedHash) {
        throw new Error('Incorrect password');
      }

      const keyBytes = ethers.toUtf8Bytes(password.padEnd(32, '0').slice(0, 32));
      const dataBytes = ethers.decodeBase64(encodedData);
      const decrypted = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        decrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      return ethers.toUtf8String(decrypted);
    }

    if (encrypted.startsWith('EAGLE_BACKUP_V1:')) {
      const data = encrypted.replace('EAGLE_BACKUP_V1:', '');
      return ethers.toUtf8String(ethers.decodeBase64(data));
    }

    throw new Error('Invalid backup format');
  }

  private streamCipherXor(data: Uint8Array, key: Uint8Array, nonce: Uint8Array): Uint8Array {
    const output = new Uint8Array(data.length);
    let offset = 0;
    let counter = 0;

    while (offset < data.length) {
      const counterBytes = ethers.toBeArray(counter);
      const counterBlock = new Uint8Array(16);
      counterBlock.set(counterBytes, 16 - counterBytes.length);

      const streamBlockHex = ethers.computeHmac(
        'sha256',
        key,
        ethers.concat([nonce, counterBlock])
      );
      const streamBlock = ethers.getBytes(streamBlockHex);

      for (let i = 0; i < streamBlock.length && offset < data.length; i++, offset++) {
        output[offset] = data[offset] ^ streamBlock[i];
      }

      counter += 1;
    }

    return output;
  }

  private isCompatibleVersion(version: string): boolean {
    return version === this.VERSION || version === '1.0.0';
  }

  private async getSettings(): Promise<any> {
    const settings = await AsyncStorage.getItem('EAGLE_SETTINGS');
    return settings ? JSON.parse(settings) : {};
  }

  private async getAddressBook(): Promise<any[]> {
    const addressBook = await AsyncStorage.getItem('EAGLE_ADDRESS_BOOK');
    return addressBook ? JSON.parse(addressBook) : [];
  }

  private async getCustomTokens(): Promise<any[]> {
    const tokens = await AsyncStorage.getItem('EAGLE_CUSTOM_TOKENS');
    return tokens ? JSON.parse(tokens) : [];
  }

  private async restoreWallets(wallets: BackupWallet[], activeWalletId: string | null): Promise<void> {
    const existingServices = await Keychain.getAllGenericPasswordServices();
    const walletServices = existingServices.filter((service) => service.startsWith(MULTI_WALLET_KEY_PREFIX));

    for (const service of walletServices) {
      await Keychain.resetGenericPassword({ service });
    }

    await WalletStorage.clearAllWallets();

    for (const wallet of wallets) {
      const account: WalletAccount = {
        id: wallet.id,
        name: wallet.name,
        address: wallet.address,
        type: wallet.type,
        isDefault: wallet.isDefault,
        createdAt: wallet.createdAt,
        color: wallet.color,
      };

      await WalletStorage.addWallet(account);

      if (wallet.type !== 'watch' && wallet.privateKey) {
        await Keychain.setGenericPassword(`wallet:${wallet.id}`, wallet.privateKey, {
          service: `${MULTI_WALLET_KEY_PREFIX}${wallet.id}`,
        });
      }
    }

    if (activeWalletId) {
      const restoredActive = wallets.find((wallet) => wallet.id === activeWalletId);
      if (restoredActive) {
        await WalletStorage.setActiveWallet(restoredActive.id);
      }
    }
  }

  private async restoreLegacyWallet(
    legacyWallet: LegacyWalletSnapshot | undefined,
    wallets: BackupWallet[],
    activeWalletId: string | null
  ): Promise<void> {
    await Keychain.resetGenericPassword();
    await Keychain.resetGenericPassword({ service: LEGACY_MNEMONIC_KEY });
    await AsyncStorage.removeItem(LEGACY_WALLET_ADDRESS_KEY);
    await AsyncStorage.removeItem(LEGACY_PASSWORD_HASH_KEY);

    let privateKey = legacyWallet?.privateKey;
    let address = legacyWallet?.address;
    let mnemonic = legacyWallet?.mnemonic;

    if (!privateKey) {
      const activeWallet = wallets.find((wallet) => wallet.id === activeWalletId && wallet.type !== 'watch');
      if (activeWallet?.privateKey) {
        privateKey = activeWallet.privateKey;
        address = activeWallet.address;
      }
    }

    if (privateKey) {
      await Keychain.setGenericPassword(LEGACY_WALLET_KEY, privateKey);
      if (address) {
        await AsyncStorage.setItem(LEGACY_WALLET_ADDRESS_KEY, address);
      }
    }

    if (mnemonic) {
      await Keychain.setGenericPassword(LEGACY_MNEMONIC_KEY, mnemonic, { service: LEGACY_MNEMONIC_KEY });
    }

    if (legacyWallet?.passwordHash) {
      await AsyncStorage.setItem(LEGACY_PASSWORD_HASH_KEY, legacyWallet.passwordHash);
    }
  }

  private async restoreSettings(settings: any): Promise<void> {
    await AsyncStorage.setItem('EAGLE_SETTINGS', JSON.stringify(settings || {}));
  }

  private async restoreAddressBook(addressBook: any[]): Promise<void> {
    await AsyncStorage.setItem('EAGLE_ADDRESS_BOOK', JSON.stringify(addressBook || []));
  }

  private async restoreCustomTokens(tokens: any[]): Promise<void> {
    await AsyncStorage.setItem('EAGLE_CUSTOM_TOKENS', JSON.stringify(tokens || []));
  }
}

export default new BackupService();
