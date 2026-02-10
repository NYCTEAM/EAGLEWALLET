import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { RNCamera } from 'react-native-camera';
import { ethers } from 'ethers';
import { useLanguage } from '../i18n/LanguageContext';

function extractEvmAddress(raw: string): string | null {
  const text = raw.trim();
  const directMatch = text.match(/0x[a-fA-F0-9]{40}/);

  if (directMatch && ethers.isAddress(directMatch[0])) {
    return ethers.getAddress(directMatch[0]);
  }

  if (ethers.isAddress(text)) {
    return ethers.getAddress(text);
  }

  return null;
}

export default function ScanQRCodeScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const sourceRouteKey = route.params?.sourceRouteKey;

  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const current = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );
    if (current) {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const granted = await requestCameraPermission();
      if (!mounted) {
        return;
      }
      setHasPermission(granted);
      if (!granted) {
        Alert.alert(t.common.error, t.errors.permissionDenied, [
          {
            text: t.common.ok,
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [navigation, requestCameraPermission, t.common.error, t.common.ok, t.errors.permissionDenied]);

  const onBarCodeRead = useCallback(
    (event: { data?: string }) => {
      if (locked) {
        return;
      }

      const data = String(event?.data || '');
      const address = extractEvmAddress(data);

      if (!address) {
        setLocked(true);
        Alert.alert(t.common.error, t.errors.invalidAddress, [
          {
            text: t.common.ok,
            onPress: () => setLocked(false),
          },
        ]);
        return;
      }

      setLocked(true);

      if (sourceRouteKey) {
        navigation.dispatch({
          ...CommonActions.setParams({ address }),
          source: sourceRouteKey,
        });
      } else {
        navigation.navigate('Send', { address });
      }

      navigation.goBack();
    },
    [
      locked,
      navigation,
      sourceRouteKey,
      t.common.error,
      t.common.ok,
      t.errors.invalidAddress,
    ]
  );

  return (
    <View style={styles.container}>
      {hasPermission ? (
        <RNCamera
          style={styles.camera}
          type={RNCamera.Constants.Type.back}
          captureAudio={false}
          onBarCodeRead={onBarCodeRead}
          barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        >
          <View style={styles.overlay}>
            <Text style={styles.title}>{t.send.scanQRCode}</Text>
            <View style={styles.scanBox} />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>{t.common.cancel}</Text>
            </TouchableOpacity>
          </View>
        </RNCamera>
      ) : (
        <View style={styles.fallback}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>{t.common.cancel}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
  },
  scanBox: {
    width: 240,
    height: 240,
    borderWidth: 2,
    borderColor: '#F3BA2F',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    marginTop: 28,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
