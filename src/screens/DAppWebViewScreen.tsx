/**
 * Eagle Wallet - DApp WebView Screen
 * Built-in browser for DApps with Web3 injection
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import WalletService from '../services/WalletService';

export default function DAppWebViewScreen({ route, navigation }: any) {
  const { url, name } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [inputUrl, setInputUrl] = useState(url);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [chainId, setChainId] = useState<string>('0x38');

  // Load wallet data on mount
  React.useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const address = await WalletService.getAddress();
      const network = WalletService.getCurrentNetwork();
      
      if (address) {
        setWalletAddress(address);
        // Convert chainId to hex
        const hexChainId = '0x' + network.chainId.toString(16);
        setChainId(hexChainId);
        
        console.log('DApp Browser - Wallet:', address);
        console.log('DApp Browser - Network:', network.name, hexChainId);
      }
    } catch (error) {
      console.error('Load wallet data error:', error);
    }
  };

  /**
   * Web3 Provider injection script
   */
  const getInjectedJavaScript = () => `
    (function() {
      // Ethereum Provider
      window.ethereum = {
        isMetaMask: true,
        isEagleWallet: true,
        chainId: '${chainId}',
        networkVersion: '${parseInt(chainId, 16)}',
        selectedAddress: '${walletAddress}',
        
        // Request accounts
        request: async function(args) {
          if (args.method === 'eth_requestAccounts') {
            // Auto-return connected address
            return ['${walletAddress}'];
          }
          
          if (args.method === 'eth_accounts') {
            // Auto-return connected address
            return window.ethereum.selectedAddress ? [window.ethereum.selectedAddress] : [];
          }
          
          if (args.method === 'eth_chainId') {
            return window.ethereum.chainId;
          }
          
          if (args.method === 'personal_sign') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'personal_sign',
              params: args.params
            }));
            return new Promise((resolve) => {
              window.resolveSign = resolve;
            });
          }
          
          if (args.method === 'eth_sendTransaction') {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'eth_sendTransaction',
              params: args.params
            }));
            return new Promise((resolve) => {
              window.resolveTx = resolve;
            });
          }
          
          throw new Error('Method not supported: ' + args.method);
        },
        
        // Legacy methods
        enable: function() {
          return this.request({ method: 'eth_requestAccounts' });
        },
        
        send: function(method, params) {
          return this.request({ method, params });
        },
        
        sendAsync: function(payload, callback) {
          this.request(payload).then(
            result => callback(null, { result }),
            error => callback(error)
          );
        },
        
        on: function(event, callback) {
          console.log('Event listener registered:', event);
        },
        
        removeListener: function(event, callback) {
          console.log('Event listener removed:', event);
        }
      };
      
      // Web3.js compatibility
      window.web3 = {
        currentProvider: window.ethereum,
        eth: {
          defaultAccount: null
        }
      };
      
      console.log('Eagle Wallet Web3 Provider injected');
      console.log('Auto-connected address:', window.ethereum.selectedAddress);
      console.log('Chain ID:', window.ethereum.chainId);
      
      // Trigger connect event for DApps that listen
      if (window.ethereum.selectedAddress) {
        window.dispatchEvent(new Event('ethereum#initialized'));
      }
    })();
    true;
  `;

  /**
   * Handle messages from WebView
   */
  const handleMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'eth_requestAccounts':
          await handleRequestAccounts();
          break;
          
        case 'personal_sign':
          await handlePersonalSign(message.params);
          break;
          
        case 'eth_sendTransaction':
          await handleSendTransaction(message.params);
          break;
      }
    } catch (error) {
      console.error('Handle message error:', error);
    }
  };

  /**
   * Handle account request
   */
  const handleRequestAccounts = async () => {
    try {
      const address = await WalletService.getAddress();
      
      // Inject address into WebView
      const script = `
        window.ethereum.selectedAddress = '${address}';
        if (window.resolveAccounts) {
          window.resolveAccounts(['${address}']);
        }
        true;
      `;
      
      webViewRef.current?.injectJavaScript(script);
    } catch (error) {
      console.error('Request accounts error:', error);
    }
  };

  /**
   * Handle personal sign
   */
  const handlePersonalSign = async (params: any[]) => {
    Alert.alert(
      'Sign Message',
      `DApp requests to sign:\n\n${params[0]}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            webViewRef.current?.injectJavaScript(`
              if (window.resolveSign) {
                window.resolveSign(null);
              }
            `);
          },
        },
        {
          text: 'Sign',
          onPress: async () => {
            try {
              // In production, actually sign the message
              const signature = '0x...signed...';
              
              webViewRef.current?.injectJavaScript(`
                if (window.resolveSign) {
                  window.resolveSign('${signature}');
                }
              `);
            } catch (error) {
              Alert.alert('Error', 'Failed to sign message');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle send transaction
   */
  const handleSendTransaction = async (params: any[]) => {
    const tx = params[0];
    
    Alert.alert(
      'Confirm Transaction',
      `To: ${tx.to}\nValue: ${tx.value || '0'} BNB`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            webViewRef.current?.injectJavaScript(`
              if (window.resolveTx) {
                window.resolveTx(null);
              }
            `);
          },
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // In production, actually send the transaction
              const txHash = '0x...transaction...hash...';
              
              webViewRef.current?.injectJavaScript(`
                if (window.resolveTx) {
                  window.resolveTx('${txHash}');
                }
              `);
              
              Alert.alert('Success', 'Transaction sent!');
            } catch (error) {
              Alert.alert('Error', 'Transaction failed');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle navigation
   */
  const handleNavigationStateChange = (navState: any) => {
    setCurrentUrl(navState.url);
    setInputUrl(navState.url);
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
  };

  /**
   * Navigate to URL
   */
  const handleGo = () => {
    let finalUrl = inputUrl;
    
    // Add https:// if no protocol
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    setCurrentUrl(finalUrl);
  };

  /**
   * Reload page
   */
  const handleReload = () => {
    webViewRef.current?.reload();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {name || 'DApp Browser'}
          </Text>
        </View>
        
        <TouchableOpacity onPress={handleReload}>
          <Text style={styles.reloadButton}>⟳</Text>
        </TouchableOpacity>
      </View>

      {/* URL Bar */}
      <View style={styles.urlBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => webViewRef.current?.goBack()}
          disabled={!canGoBack}
        >
          <Text style={[styles.navButtonText, !canGoBack && styles.navButtonDisabled]}>
            ←
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => webViewRef.current?.goForward()}
          disabled={!canGoForward}
        >
          <Text style={[styles.navButtonText, !canGoForward && styles.navButtonDisabled]}>
            →
          </Text>
        </TouchableOpacity>
        
        <TextInput
          style={styles.urlInput}
          value={inputUrl}
          onChangeText={setInputUrl}
          onSubmitEditing={handleGo}
          placeholder="Enter URL..."
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity style={styles.goButton} onPress={handleGo}>
          <Text style={styles.goButtonText}>Go</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      {walletAddress ? (
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webview}
          injectedJavaScriptBeforeContentLoaded={getInjectedJavaScript()}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F3BA2F" />
            </View>
          )}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F3BA2F" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#F3BA2F" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  reloadButton: {
    fontSize: 24,
    color: '#666',
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  navButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  navButtonText: {
    fontSize: 20,
    color: '#000',
  },
  navButtonDisabled: {
    color: '#CCC',
  },
  urlInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  goButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3BA2F',
    borderRadius: 18,
  },
  goButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
