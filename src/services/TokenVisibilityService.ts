import AsyncStorage from '@react-native-async-storage/async-storage';

const HIDDEN_TOKENS_KEY_PREFIX = 'EAGLE_HIDDEN_TOKENS_';

export default class TokenVisibilityService {
  static getStorageKey(chainId: number) {
    return `${HIDDEN_TOKENS_KEY_PREFIX}${chainId}`;
  }

  static normalizeKey(value: string) {
    return String(value || '').toLowerCase();
  }

  static getTokenKey(token: { address?: string; symbol?: string }) {
    if (token.address) {
      return this.normalizeKey(token.address);
    }
    if (token.symbol) {
      return this.normalizeKey(token.symbol);
    }
    return '';
  }

  static async getHiddenTokens(chainId: number): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(this.getStorageKey(chainId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => this.normalizeKey(item)).filter(Boolean);
    } catch {
      return [];
    }
  }

  static async setTokenHidden(chainId: number, tokenKey: string, hidden: boolean) {
    const key = this.normalizeKey(tokenKey);
    if (!key) return;
    const existing = await this.getHiddenTokens(chainId);
    const set = new Set(existing);
    if (hidden) {
      set.add(key);
    } else {
      set.delete(key);
    }
    await AsyncStorage.setItem(this.getStorageKey(chainId), JSON.stringify(Array.from(set)));
  }
}
