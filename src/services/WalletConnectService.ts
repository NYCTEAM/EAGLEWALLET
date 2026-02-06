/**
 * Eagle Wallet - WalletConnect Service
 * Connect to DApps using WalletConnect protocol
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';

const SESSIONS_KEY = 'EAGLE_WC_SESSIONS';

export interface WCSession {
  id: string;
  name: string;
  url: string;
  icon: string;
  chainId: number;
  accounts: string[];
  connected: boolean;
  createdAt: number;
}

export interface WCRequest {
  id: number;
  method: string;
  params: any[];
  sessionId: string;
}

class WalletConnectService {
  private sessions: Map<string, WCSession> = new Map();

  /**
   * Connect to DApp via URI
   */
  async connect(uri: string, wallet: ethers.Wallet): Promise<WCSession> {
    try {
      // Parse WalletConnect URI
      const params = this.parseURI(uri);
      
      const session: WCSession = {
        id: params.key,
        name: params.name || 'Unknown DApp',
        url: params.bridge,
        icon: params.icon || '',
        chainId: params.chainId || 56,
        accounts: [wallet.address],
        connected: true,
        createdAt: Date.now(),
      };

      this.sessions.set(session.id, session);
      await this.saveSessions();

      return session;
    } catch (error) {
      console.error('WalletConnect error:', error);
      throw new Error('Failed to connect to DApp');
    }
  }

  /**
   * Disconnect session
   */
  async disconnect(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    await this.saveSessions();
  }

  /**
   * Get all active sessions
   */
  async getSessions(): Promise<WCSession[]> {
    await this.loadSessions();
    return Array.from(this.sessions.values());
  }

  /**
   * Handle sign request
   */
  async handleSignRequest(
    request: WCRequest,
    wallet: ethers.Wallet
  ): Promise<string> {
    try {
      const { method, params } = request;

      switch (method) {
        case 'personal_sign':
          return await wallet.signMessage(params[0]);
        
        case 'eth_sign':
          return await wallet.signMessage(params[1]);
        
        case 'eth_signTypedData':
        case 'eth_signTypedData_v4':
          // Implement typed data signing
          return await this.signTypedData(wallet, params[1]);
        
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    } catch (error) {
      console.error('Sign request error:', error);
      throw error;
    }
  }

  /**
   * Handle transaction request
   */
  async handleTransactionRequest(
    request: WCRequest,
    wallet: ethers.Wallet
  ): Promise<string> {
    try {
      const tx = request.params[0];
      const signedTx = await wallet.signTransaction(tx);
      return signedTx;
    } catch (error) {
      console.error('Transaction request error:', error);
      throw error;
    }
  }

  /**
   * Parse WalletConnect URI
   */
  private parseURI(uri: string): any {
    // Simple URI parsing (in production, use @walletconnect/utils)
    const params: any = {};
    
    if (uri.startsWith('wc:')) {
      const parts = uri.split('@');
      params.key = parts[0].replace('wc:', '');
      
      if (parts[1]) {
        const queryParts = parts[1].split('?');
        params.version = queryParts[0];
        
        if (queryParts[1]) {
          const query = new URLSearchParams(queryParts[1]);
          params.bridge = query.get('bridge');
          params.key = query.get('key');
        }
      }
    }
    
    return params;
  }

  /**
   * Sign typed data
   */
  private async signTypedData(wallet: ethers.Wallet, data: string): Promise<string> {
    try {
      const typedData = JSON.parse(data);
      // Implement EIP-712 signing
      return await wallet.signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message
      );
    } catch (error) {
      throw new Error('Failed to sign typed data');
    }
  }

  /**
   * Save sessions to storage
   */
  private async saveSessions(): Promise<void> {
    try {
      const sessions = Array.from(this.sessions.values());
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  /**
   * Load sessions from storage
   */
  private async loadSessions(): Promise<void> {
    try {
      const sessionsJson = await AsyncStorage.getItem(SESSIONS_KEY);
      if (sessionsJson) {
        const sessions: WCSession[] = JSON.parse(sessionsJson);
        sessions.forEach(session => {
          this.sessions.set(session.id, session);
        });
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }

  /**
   * Clear all sessions
   */
  async clearSessions(): Promise<void> {
    this.sessions.clear();
    await AsyncStorage.removeItem(SESSIONS_KEY);
  }
}

export default new WalletConnectService();
