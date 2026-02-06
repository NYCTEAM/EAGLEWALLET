/**
 * Eagle Wallet - Price Alert Service
 * Set price alerts for tokens
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import PriceService from './PriceService';

const ALERTS_KEY = 'EAGLE_PRICE_ALERTS';

export interface PriceAlert {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  isTriggered: boolean;
  createdAt: number;
  triggeredAt?: number;
  chainId: number;
}

class PriceAlertService {
  private alerts: PriceAlert[] = [];
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Create price alert
   */
  async createAlert(alert: Omit<PriceAlert, 'id' | 'createdAt' | 'isTriggered'>): Promise<PriceAlert> {
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      isTriggered: false,
    };

    this.alerts.push(newAlert);
    await this.saveAlerts();
    
    // Start checking if not already running
    if (!this.checkInterval) {
      this.startChecking();
    }

    return newAlert;
  }

  /**
   * Get all alerts
   */
  async getAllAlerts(): Promise<PriceAlert[]> {
    await this.loadAlerts();
    return this.alerts;
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<PriceAlert[]> {
    await this.loadAlerts();
    return this.alerts.filter(a => a.isActive && !a.isTriggered);
  }

  /**
   * Update alert
   */
  async updateAlert(id: string, updates: Partial<PriceAlert>): Promise<void> {
    const index = this.alerts.findIndex(a => a.id === id);
    if (index !== -1) {
      this.alerts[index] = { ...this.alerts[index], ...updates };
      await this.saveAlerts();
    }
  }

  /**
   * Delete alert
   */
  async deleteAlert(id: string): Promise<void> {
    this.alerts = this.alerts.filter(a => a.id !== id);
    await this.saveAlerts();
  }

  /**
   * Check alerts
   */
  async checkAlerts(): Promise<PriceAlert[]> {
    const triggered: PriceAlert[] = [];
    const activeAlerts = this.alerts.filter(a => a.isActive && !a.isTriggered);

    for (const alert of activeAlerts) {
      try {
        const price = await PriceService.getTokenPrice(alert.tokenAddress, alert.chainId);
        
        let shouldTrigger = false;
        if (alert.condition === 'above' && price >= alert.targetPrice) {
          shouldTrigger = true;
        } else if (alert.condition === 'below' && price <= alert.targetPrice) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          alert.isTriggered = true;
          alert.triggeredAt = Date.now();
          triggered.push(alert);
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }

    if (triggered.length > 0) {
      await this.saveAlerts();
    }

    return triggered;
  }

  /**
   * Start periodic checking
   */
  private startChecking(): void {
    // Check every 5 minutes
    this.checkInterval = setInterval(async () => {
      const triggered = await this.checkAlerts();
      if (triggered.length > 0) {
        // Trigger notifications
        this.notifyAlerts(triggered);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop checking
   */
  stopChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Notify triggered alerts
   */
  private notifyAlerts(alerts: PriceAlert[]): void {
    // In production, use react-native-push-notification
    alerts.forEach(alert => {
      console.log(`Price alert triggered: ${alert.tokenSymbol} ${alert.condition} $${alert.targetPrice}`);
    });
  }

  /**
   * Save alerts to storage
   */
  private async saveAlerts(): Promise<void> {
    try {
      await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Error saving alerts:', error);
    }
  }

  /**
   * Load alerts from storage
   */
  private async loadAlerts(): Promise<void> {
    try {
      const alertsJson = await AsyncStorage.getItem(ALERTS_KEY);
      if (alertsJson) {
        this.alerts = JSON.parse(alertsJson);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }

  /**
   * Clear all alerts
   */
  async clearAllAlerts(): Promise<void> {
    this.alerts = [];
    await AsyncStorage.removeItem(ALERTS_KEY);
  }
}

export default new PriceAlertService();
