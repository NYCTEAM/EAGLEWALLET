/**
 * Eagle Wallet - Address Book Service
 * Manage saved addresses and contacts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';

const ADDRESS_BOOK_KEY = 'EAGLE_ADDRESS_BOOK';
const RECENT_ADDRESSES_KEY = 'EAGLE_RECENT_ADDRESSES';

export interface AddressEntry {
  id: string;
  address: string;
  name: string;
  note?: string;
  chainId?: number;
  createdAt: number;
  lastUsed?: number;
}

class AddressBookService {
  /**
   * Add address to address book
   */
  async addAddress(entry: Omit<AddressEntry, 'id' | 'createdAt'>): Promise<AddressEntry> {
    try {
      // Validate address
      if (!ethers.isAddress(entry.address)) {
        throw new Error('Invalid address');
      }

      const addresses = await this.getAllAddresses();
      
      // Check if address already exists
      const exists = addresses.find(
        a => a.address.toLowerCase() === entry.address.toLowerCase()
      );
      
      if (exists) {
        throw new Error('Address already exists in address book');
      }

      const newEntry: AddressEntry = {
        ...entry,
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };

      addresses.push(newEntry);
      await AsyncStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(addresses));
      
      return newEntry;
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  }

  /**
   * Get all addresses
   */
  async getAllAddresses(): Promise<AddressEntry[]> {
    try {
      const addressesJson = await AsyncStorage.getItem(ADDRESS_BOOK_KEY);
      if (!addressesJson) return [];
      return JSON.parse(addressesJson);
    } catch (error) {
      console.error('Error getting addresses:', error);
      return [];
    }
  }

  /**
   * Get address by ID
   */
  async getAddress(id: string): Promise<AddressEntry | null> {
    const addresses = await this.getAllAddresses();
    return addresses.find(a => a.id === id) || null;
  }

  /**
   * Search addresses
   */
  async searchAddress(query: string): Promise<AddressEntry[]> {
    const addresses = await this.getAllAddresses();
    const lowerQuery = query.toLowerCase();
    
    return addresses.filter(
      a =>
        a.name.toLowerCase().includes(lowerQuery) ||
        a.address.toLowerCase().includes(lowerQuery) ||
        a.note?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Update address
   */
  async updateAddress(id: string, updates: Partial<AddressEntry>): Promise<void> {
    try {
      const addresses = await this.getAllAddresses();
      const index = addresses.findIndex(a => a.id === id);
      
      if (index === -1) {
        throw new Error('Address not found');
      }

      addresses[index] = { ...addresses[index], ...updates };
      await AsyncStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(addresses));
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  /**
   * Remove address
   */
  async removeAddress(id: string): Promise<void> {
    try {
      const addresses = await this.getAllAddresses();
      const filtered = addresses.filter(a => a.id !== id);
      await AsyncStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing address:', error);
      throw error;
    }
  }

  /**
   * Add to recent addresses
   */
  async addRecentAddress(address: string, chainId: number): Promise<void> {
    try {
      if (!ethers.isAddress(address)) return;

      const recent = await this.getRecentAddresses();
      
      // Remove if already exists
      const filtered = recent.filter(
        r => !(r.address.toLowerCase() === address.toLowerCase() && r.chainId === chainId)
      );
      
      // Add to beginning
      filtered.unshift({
        id: `recent_${Date.now()}`,
        address,
        name: this.formatAddress(address),
        chainId,
        createdAt: Date.now(),
        lastUsed: Date.now(),
      });
      
      // Keep only last 20
      const limited = filtered.slice(0, 20);
      
      await AsyncStorage.setItem(RECENT_ADDRESSES_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error('Error adding recent address:', error);
    }
  }

  /**
   * Get recent addresses
   */
  async getRecentAddresses(chainId?: number): Promise<AddressEntry[]> {
    try {
      const recentJson = await AsyncStorage.getItem(RECENT_ADDRESSES_KEY);
      if (!recentJson) return [];
      
      const recent: AddressEntry[] = JSON.parse(recentJson);
      
      if (chainId !== undefined) {
        return recent.filter(r => r.chainId === chainId);
      }
      
      return recent;
    } catch (error) {
      console.error('Error getting recent addresses:', error);
      return [];
    }
  }

  /**
   * Clear recent addresses
   */
  async clearRecentAddresses(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_ADDRESSES_KEY);
    } catch (error) {
      console.error('Error clearing recent addresses:', error);
    }
  }

  /**
   * Get address name (from address book or format)
   */
  async getAddressName(address: string): Promise<string> {
    const addresses = await this.getAllAddresses();
    const entry = addresses.find(
      a => a.address.toLowerCase() === address.toLowerCase()
    );
    
    return entry?.name || this.formatAddress(address);
  }

  /**
   * Format address for display
   */
  private formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Check if address is in address book
   */
  async isInAddressBook(address: string): Promise<boolean> {
    const addresses = await this.getAllAddresses();
    return addresses.some(
      a => a.address.toLowerCase() === address.toLowerCase()
    );
  }

  /**
   * Get addresses by chain
   */
  async getAddressesByChain(chainId: number): Promise<AddressEntry[]> {
    const addresses = await this.getAllAddresses();
    return addresses.filter(a => a.chainId === chainId || a.chainId === undefined);
  }
}

export default new AddressBookService();
