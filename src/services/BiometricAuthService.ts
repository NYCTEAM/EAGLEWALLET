import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const BIOMETRIC_ENABLED_KEY = 'EAGLE_BIOMETRIC_ENABLED';
const BIOMETRIC_PROBE_SERVICE = 'EAGLE_BIOMETRIC_PROBE';
const BIOMETRIC_PROBE_USERNAME = 'probe';
const BIOMETRIC_PROBE_SECRET = 'probe-secret';

class BiometricAuthService {
  async isAvailable(): Promise<boolean> {
    try {
      const biometryType = await Keychain.getSupportedBiometryType();
      return !!biometryType;
    } catch {
      return false;
    }
  }

  async isEnabled(): Promise<boolean> {
    try {
      return (await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY)) === '1';
    } catch {
      return false;
    }
  }

  async setEnabled(enabled: boolean): Promise<void> {
    if (!enabled) {
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, '0');
      return;
    }

    const available = await this.isAvailable();
    if (!available) {
      throw new Error('Biometric authentication is not available on this device');
    }

    // Save a protected probe item so every sensitive action can require
    // biometric/device credential confirmation consistently.
    await Keychain.setGenericPassword(BIOMETRIC_PROBE_USERNAME, BIOMETRIC_PROBE_SECRET, {
      service: BIOMETRIC_PROBE_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      authenticationType: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    });

    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, '1');
  }

  async authenticate(reason: string): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: BIOMETRIC_PROBE_SERVICE,
        authenticationPrompt: {
          title: 'Security Verification',
          subtitle: reason,
          description: reason,
          cancel: 'Cancel',
        },
      });

      return !!credentials;
    } catch {
      return false;
    }
  }

  async ensureAuthenticated(reason: string): Promise<void> {
    const enabled = await this.isEnabled();
    if (!enabled) {
      return;
    }

    const ok = await this.authenticate(reason);
    if (!ok) {
      throw new Error('Biometric verification failed or cancelled');
    }
  }
}

export default new BiometricAuthService();
