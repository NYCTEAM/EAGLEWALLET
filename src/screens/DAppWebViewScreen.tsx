import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { ethers } from 'ethers';
import WalletService from '../services/WalletService';
import { useLanguage } from '../i18n/LanguageContext';

type BridgeRequest = {
  type: string;
  id: string;
  method: string;
  params?: any[];
};

const createInjectedProviderScript = (chainId: number, initialAddress?: string | null) => `
  (function() {
    if (window.__EAGLE_PROVIDER__) return;

    var pending = {};
    var listeners = { accountsChanged: [], chainChanged: [], connect: [], disconnect: [] };

    function emit(event, payload) {
      var list = listeners[event] || [];
      for (var i = 0; i < list.length; i++) {
        try { list[i](payload); } catch (e) {}
      }
    }

    function sendRequest(method, params) {
      return new Promise(function(resolve, reject) {
        var id = Date.now().toString() + Math.random().toString(16).slice(2);
        pending[id] = { resolve: resolve, reject: reject };

        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EAGLE_WALLET_REQUEST',
            id: id,
            method: method,
            params: params || []
          }));
        } else {
          reject(new Error('Wallet bridge unavailable'));
        }
      });
    }

    window.__eagleHandleResponse = function(raw) {
      try {
        var payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
        var task = pending[payload.id];
        if (!task) return;
        if (payload.error) task.reject(new Error(payload.error));
        else task.resolve(payload.result);
        delete pending[payload.id];
      } catch (e) {}
    };

    var initialAddress = ${initialAddress ? JSON.stringify(initialAddress) : 'null'};
    var providerInfo = {
      uuid: 'eagle-wallet-provider',
      name: 'Eagle Wallet',
      icon: '',
      rdns: 'com.eaglewallet'
    };
    var chainHex = '${ethers.toQuantity(chainId)}';
    var chainDec = '${String(chainId)}';

    function localAccounts() {
      return initialAddress ? [initialAddress] : [];
    }

    var provider = {
      isMetaMask: true,
      isEagleWallet: true,
      isTokenPocket: true,
      isTrust: true,
      isOkxWallet: true,
      isOKExWallet: true,
      isCoinbaseWallet: false,
      providers: [],
      selectedAddress: initialAddress || null,
      chainId: chainHex,
      networkVersion: chainDec,
      _state: { accounts: initialAddress ? [initialAddress] : [], isConnected: true, isUnlocked: !!initialAddress },
      isConnected: function() { return true; },
      emit: emit,
      request: function(args) {
        if (!args || !args.method) {
          return Promise.reject(new Error('Invalid request'));
        }
        if (args.method === 'eth_chainId') {
          return Promise.resolve(chainHex);
        }
        if (args.method === 'net_version') {
          return Promise.resolve(chainDec);
        }
        if (args && (args.method === 'eth_accounts' || args.method === 'eth_requestAccounts') && initialAddress) {
          return Promise.resolve(localAccounts());
        }
        return sendRequest(args.method, args.params || []);
      },
      enable: function() {
        if (initialAddress) {
          return Promise.resolve(localAccounts());
        }
        return sendRequest('eth_requestAccounts', []);
      },
      on: function(event, handler) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
        return provider;
      },
      removeListener: function(event, handler) {
        if (!listeners[event]) return provider;
        listeners[event] = listeners[event].filter(function(fn) { return fn !== handler; });
        return provider;
      },
      sendAsync: function(payload, callback) {
        if (payload && payload.method === 'eth_chainId') {
          callback(null, { id: payload.id, jsonrpc: '2.0', result: chainHex });
          return;
        }
        if (payload && payload.method === 'net_version') {
          callback(null, { id: payload.id, jsonrpc: '2.0', result: chainDec });
          return;
        }
        if (payload && (payload.method === 'eth_accounts' || payload.method === 'eth_requestAccounts') && initialAddress) {
          callback(null, { id: payload.id, jsonrpc: '2.0', result: localAccounts() });
          return;
        }
        sendRequest(payload.method, payload.params || [])
          .then(function(result) { callback(null, { id: payload.id, jsonrpc: '2.0', result: result }); })
          .catch(function(err) { callback(err, null); });
      },
      send: function(methodOrPayload, params) {
        if (typeof methodOrPayload === 'string') {
          if (methodOrPayload === 'eth_chainId') {
            return Promise.resolve(chainHex);
          }
          if (methodOrPayload === 'net_version') {
            return Promise.resolve(chainDec);
          }
          if ((methodOrPayload === 'eth_accounts' || methodOrPayload === 'eth_requestAccounts') && initialAddress) {
            return Promise.resolve(localAccounts());
          }
          return sendRequest(methodOrPayload, params || []);
        }
        if (methodOrPayload && methodOrPayload.method === 'eth_chainId') {
          return Promise.resolve(chainHex);
        }
        if (methodOrPayload && methodOrPayload.method === 'net_version') {
          return Promise.resolve(chainDec);
        }
        if (methodOrPayload && (methodOrPayload.method === 'eth_accounts' || methodOrPayload.method === 'eth_requestAccounts') && initialAddress) {
          return Promise.resolve(localAccounts());
        }
        return sendRequest(methodOrPayload.method, methodOrPayload.params || []);
      }
    };

    provider._metamask = {
      isUnlocked: function() { return Promise.resolve(!!initialAddress); },
      isApproved: function() { return Promise.resolve(!!initialAddress); },
      requestBatch: function(requests) {
        if (!Array.isArray(requests)) return Promise.resolve([]);
        return Promise.all(requests.map(function(r) { return provider.request(r); }));
      }
    };

    window.__eagleSetAddress = function(address) {
      provider.selectedAddress = address || null;
      provider._state.accounts = address ? [address] : [];
      provider._state.isUnlocked = !!address;
      emit('accountsChanged', address ? [address] : []);
    };

    window.__eagleSetChain = function(chainHex, chainDec) {
      provider.chainId = chainHex;
      provider.networkVersion = String(chainDec);
      emit('chainChanged', chainHex);
      emit('connect', { chainId: chainHex });
    };

    provider.providers = [provider];
    window.ethereum = provider;
    window.web3 = { currentProvider: provider };
    window.tokenpocket = window.tokenpocket || {};
    window.tokenpocket.ethereum = provider;
    window.tokenpocket.isTokenPocket = true;
    window.trustwallet = window.trustwallet || {};
    window.trustwallet.ethereum = provider;
    window.trustwallet.isTrust = true;
    window.okxwallet = window.okxwallet || {};
    window.okxwallet.ethereum = provider;
    window.okxwallet.isOkxWallet = true;
    window.okxwallet.isOKExWallet = true;
    window.__EAGLE_PROVIDER__ = provider;
    window.dispatchEvent(new Event('ethereum#initialized'));
    document.dispatchEvent(new Event('ethereum#initialized'));
    emit('connect', { chainId: provider.chainId });
    if (initialAddress) {
      emit('accountsChanged', [initialAddress]);
    }

    function announceProvider() {
      try {
        var ev = new CustomEvent('eip6963:announceProvider', {
          detail: { info: providerInfo, provider: provider }
        });
        window.dispatchEvent(ev);
      } catch (e) {}
    }
    window.addEventListener('eip6963:requestProvider', announceProvider);
    announceProvider();
  })();
  true;
`;

function decodeSignMessage(value: any): string {
  if (typeof value !== 'string') {
    return String(value ?? '');
  }
  if (value.startsWith('0x')) {
    try {
      return ethers.toUtf8String(value);
    } catch {
      return value;
    }
  }
  return value;
}

function normalizeTypedData(raw: any): {
  domain: any;
  types: Record<string, Array<{ name: string; type: string }>>;
  message: any;
} {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!parsed || !parsed.domain || !parsed.types || !parsed.message) {
    throw new Error('Invalid typed data');
  }

  const types = { ...parsed.types };
  delete (types as any).EIP712Domain;
  return {
    domain: parsed.domain,
    types,
    message: parsed.message,
  };
}

export default function DAppWebViewScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const webviewRef = useRef<WebView>(null);
  const approvedOriginsRef = useRef<Set<string>>(new Set());
  const autoConnectedRef = useRef<Set<string>>(new Set());
  const pendingApprovalsRef = useRef<Map<string, Promise<boolean>>>(new Map());

  const initialUrl = route.params?.url || 'https://pancakeswap.finance';
  const title = route.params?.title || t.dapp.dappBrowser;
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [canGoBack, setCanGoBack] = useState(false);
  const chainId = WalletService.getCurrentNetwork().chainId;
  const autoConnectParam = route.params?.autoConnect ?? 'all';

  const AUTO_CONNECT_HOSTS = ['eagleswap.io', 'eagleswap.llc', 'ai.eagleswaps.com'];
  const AUTO_CONNECT_DELAYS = [0, 700, 1500];

  const [initialAddress, setInitialAddress] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    WalletService.getAddress()
      .then((addr) => {
        if (mounted) {
          setInitialAddress(addr || null);
        }
      })
      .catch(() => null);
    return () => {
      mounted = false;
    };
  }, []);

  const parseOrigin = (url: string): string => {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  };

  const getHost = (url: string): string => {
    try {
      return new URL(url).host.toLowerCase();
    } catch {
      return '';
    }
  };

  const shouldAutoConnect = (url: string): boolean => {
    if (autoConnectParam === false) return false;
    if (autoConnectParam === true || autoConnectParam === 'all') {
      return /^https?:\/\//i.test(url);
    }
    const host = getHost(url);
    if (!host) return false;
    return AUTO_CONNECT_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  };

  const isTrustedOrigin = (origin: string): boolean => {
    if (autoConnectParam === true || autoConnectParam === 'all') {
      return /^https?:\/\//i.test(origin);
    }
    try {
      const host = new URL(origin).host.toLowerCase();
      return AUTO_CONNECT_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
    } catch {
      return false;
    }
  };

  const askForApproval = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let resolved = false;
      const finish = (result: boolean) => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      };

      Alert.alert(
        title,
        message,
        [
          { text: t.common.cancel, style: 'cancel', onPress: () => finish(false) },
          { text: t.common.confirm, onPress: () => finish(true) },
        ],
        {
          cancelable: true,
          onDismiss: () => finish(false),
        }
      );
    });
  };

  const ensureDappConnected = async (origin: string, options?: { autoApprove?: boolean }): Promise<void> => {
    if (approvedOriginsRef.current.has(origin)) {
      return;
    }

    const allowAuto = options?.autoApprove || isTrustedOrigin(origin);
    if (!allowAuto) {
      const existing = pendingApprovalsRef.current.get(origin);
      if (existing) {
        const approved = await existing;
        if (!approved) {
          throw new Error(t.errors.operationCancelled);
        }
      } else {
        const approvalPromise = askForApproval(
          t.dapp.connectWallet,
          `${origin}\n\n${t.dapp.connectWalletMessage}`
        );
        pendingApprovalsRef.current.set(origin, approvalPromise);
        const approved = await approvalPromise;
        pendingApprovalsRef.current.delete(origin);
        if (!approved) {
          throw new Error(t.errors.operationCancelled);
        }
      }
    }

    approvedOriginsRef.current.add(origin);
  };

  const proxyRpc = async (method: string, params: any[], origin: string) => {
    const provider = (await WalletService.getProvider()) as any;
    try {
      return await provider.send(method, params);
    } catch (error) {
      // For trusted dapps, return safe fallback on read calls instead of crashing UI
      if (isTrustedOrigin(origin)) {
        if (method === 'eth_call') return '0x0';
        return null;
      }
      throw error;
    }
  };

  const shareCurrentUrl = async () => {
    await Share.share({ message: currentUrl });
  };

  const sendBridgeResponse = (id: string, result?: any, error?: string) => {
    const payload = JSON.stringify({ id, result, error });
    const script = `window.__eagleHandleResponse && window.__eagleHandleResponse(${JSON.stringify(payload)}); true;`;
    webviewRef.current?.injectJavaScript(script);
  };

  const syncWalletState = async () => {
    const address = await WalletService.getAddress();
    const currentChainId = WalletService.getCurrentNetwork().chainId;
    const chainHex = ethers.toQuantity(currentChainId);
    const script = `
      if (window.__eagleSetChain) window.__eagleSetChain(${JSON.stringify(chainHex)}, ${currentChainId});
      if (window.__eagleSetAddress) window.__eagleSetAddress(${JSON.stringify(address || null)});
      true;
    `;
    webviewRef.current?.injectJavaScript(script);
  };

  const autoConnectIfNeeded = async (url: string) => {
    if (!shouldAutoConnect(url)) return;
    const origin = parseOrigin(url);
    if (autoConnectedRef.current.has(origin)) return;

    autoConnectedRef.current.add(origin);
    try {
      await ensureDappConnected(origin, { autoApprove: true });
      await syncWalletState();
      AUTO_CONNECT_DELAYS.forEach((delay) => {
        setTimeout(() => {
          const requestScript = `
            if (window.ethereum && window.ethereum.request) {
              window.ethereum.request({ method: 'eth_requestAccounts' }).catch(function() {});
            }
            true;
          `;
          webviewRef.current?.injectJavaScript(requestScript);
        }, delay);
      });
    } catch {
      // user cancelled
    }
  };

  const handleBridgeRequest = async (request: BridgeRequest, origin: string) => {
    const method = request.method;
    const params = request.params || [];

    const withAccountsPermission = async () => {
      const address = await WalletService.getAddress();
      const accounts = address ? [address] : [];
      return [
        {
          parentCapability: 'eth_accounts',
          caveats: accounts.length ? [{ type: 'filterResponse', value: accounts }] : [],
        },
      ];
    };

    switch (method) {
      case 'eth_accounts': {
        if (shouldAutoConnect(origin)) {
          approvedOriginsRef.current.add(origin);
        } else if (!approvedOriginsRef.current.has(origin)) {
          return [];
        }
        const address = await WalletService.getAddress();
        const accounts = address ? [address] : [];
        await syncWalletState();
        return accounts;
      }

      case 'eth_requestAccounts': {
        await ensureDappConnected(origin, { autoApprove: shouldAutoConnect(origin) });
        const address = await WalletService.getAddress();
        const accounts = address ? [address] : [];
        await syncWalletState();
        return accounts;
      }

      case 'eth_chainId':
        return ethers.toQuantity(WalletService.getCurrentNetwork().chainId);

      case 'net_version':
        return String(WalletService.getCurrentNetwork().chainId);

      case 'eth_coinbase': {
        const address = await WalletService.getAddress();
        return address || null;
      }

      case 'personal_sign': {
        const raw = params[0] ?? '';
        const message = decodeSignMessage(raw);
        const preview = message.length > 180 ? `${message.slice(0, 180)}...` : message;
        await ensureDappConnected(origin);
        const approved = await askForApproval(t.dapp.signMessage, `${origin}\n\n${preview}`);
        if (!approved) {
          throw new Error(t.errors.operationCancelled);
        }
        return WalletService.signMessage(message);
      }

      case 'eth_sign': {
        const raw = params[1] ?? params[0] ?? '';
        const message = decodeSignMessage(raw);
        const preview = message.length > 180 ? `${message.slice(0, 180)}...` : message;
        await ensureDappConnected(origin);
        const approved = await askForApproval(t.dapp.signMessage, `${origin}\n\n${preview}`);
        if (!approved) {
          throw new Error(t.errors.operationCancelled);
        }
        return WalletService.signMessage(message);
      }

      case 'eth_signTypedData':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4': {
        const raw = params[1] ?? params[0];
        const typed = normalizeTypedData(raw);
        await ensureDappConnected(origin);
        const approved = await askForApproval(
          t.dapp.signTypedData,
          `${origin}\n\n${t.dapp.signTypedDataMessage}`
        );
        if (!approved) {
          throw new Error(t.errors.operationCancelled);
        }
        return WalletService.signTypedData(typed.domain, typed.types, typed.message);
      }

      case 'wallet_requestPermissions': {
        await ensureDappConnected(origin, { autoApprove: shouldAutoConnect(origin) });
        return withAccountsPermission();
      }

      case 'wallet_getPermissions': {
        if (shouldAutoConnect(origin) || approvedOriginsRef.current.has(origin)) {
          return withAccountsPermission();
        }
        return [];
      }

      case 'eth_sendTransaction': {
        const tx = params[0] || {};
        if (!tx.to) {
          throw new Error(t.errors.invalidAddress);
        }

        await ensureDappConnected(origin);
        const txValue = tx.value != null ? ethers.formatEther(ethers.toBigInt(tx.value)) : '0';
        const approved = await askForApproval(
          t.send.confirmTransaction,
          `${origin}\n\n${t.send.to}: ${tx.to}\n${t.send.amount}: ${txValue}`
        );
        if (!approved) {
          throw new Error(t.errors.operationCancelled);
        }

        await WalletService.authorizeSensitiveAction(t.send.confirmTransaction);

        const wallet = await WalletService.getWallet();
        const requestTx: any = { to: tx.to };
        if (tx.data) requestTx.data = tx.data;
        if (tx.value != null) requestTx.value = ethers.toBigInt(tx.value);
        if (tx.gas || tx.gasLimit) requestTx.gasLimit = ethers.toBigInt(tx.gas || tx.gasLimit);
        if (tx.gasPrice) requestTx.gasPrice = ethers.toBigInt(tx.gasPrice);
        if (tx.maxFeePerGas) requestTx.maxFeePerGas = ethers.toBigInt(tx.maxFeePerGas);
        if (tx.maxPriorityFeePerGas) requestTx.maxPriorityFeePerGas = ethers.toBigInt(tx.maxPriorityFeePerGas);
        if (tx.nonce != null) requestTx.nonce = Number(tx.nonce);

        const sentTx = await wallet.sendTransaction(requestTx);
        return sentTx.hash;
      }

      case 'eth_call':
      case 'eth_getBalance':
      case 'eth_getCode':
      case 'eth_gasPrice':
      case 'eth_estimateGas':
      case 'eth_getTransactionCount':
      case 'eth_getTransactionReceipt':
      case 'eth_getBlockByNumber':
      case 'eth_getLogs':
      case 'eth_feeHistory':
      case 'eth_blockNumber': {
        return proxyRpc(method, params, origin);
      }

      case 'wallet_switchEthereumChain': {
        const chainParam = params[0]?.chainId ?? params[0];
        const targetChainId = Number(ethers.toBigInt(chainParam));
        if (targetChainId !== 56) {
          throw new Error(t.errors.networkError);
        }
        await ensureDappConnected(origin);
        const approved = await askForApproval(
          t.network.selectNetwork,
          `${origin}\n\n${t.network.selectNetwork} (${t.network.chainId}: ${targetChainId})`
        );
        if (!approved) {
          throw new Error(t.errors.operationCancelled);
        }
        await WalletService.switchNetwork(targetChainId);
        await syncWalletState();
        return null;
      }

      case 'wallet_addEthereumChain':
        return null;

      default:
        throw new Error(`${t.errors.invalidInput}: ${method}`);
    }
  };

  const handleWebViewMessage = async (event: any) => {
    let request: BridgeRequest | null = null;

    try {
      request = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (!request || request.type !== 'EAGLE_WALLET_REQUEST' || !request.id || !request.method) {
      return;
    }

    try {
      const origin = parseOrigin(event.nativeEvent.url || currentUrl);
      const result = await handleBridgeRequest(request, origin);
      sendBridgeResponse(request.id, result, undefined);
    } catch (error: any) {
      sendBridgeResponse(request.id, undefined, error?.message || t.errors.unknownError);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (canGoBack) {
              webviewRef.current?.goBack();
            } else {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.headerAction}>{t.common.back}</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.url} numberOfLines={1}>{currentUrl}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => webviewRef.current?.reload()}>
            <Text style={styles.headerAction}>{t.common.refresh}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL(currentUrl)}>
            <Text style={styles.headerAction}>{t.dapp.openInBrowser}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={shareCurrentUrl}>
            <Text style={styles.headerAction}>{t.common.share}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {initialAddress === undefined ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color="#E9B949" />
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      ) : (
        <WebView
          ref={webviewRef}
          source={{ uri: initialUrl }}
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScriptBeforeContentLoaded={createInjectedProviderScript(chainId, initialAddress)}
          onMessage={handleWebViewMessage}
          onLoadEnd={(event) => {
            syncWalletState();
            const nextUrl = event?.nativeEvent?.url || currentUrl;
            autoConnectIfNeeded(nextUrl);
          }}
          onNavigationStateChange={(state) => {
            setCurrentUrl(state.url);
            setCanGoBack(state.canGoBack);
            autoConnectIfNeeded(state.url);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1017',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2535',
    backgroundColor: '#131722',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  url: {
    color: '#95A0BC',
    fontSize: 11,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAction: {
    color: '#E9B949',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#95A0BC',
    fontSize: 12,
    fontWeight: '600',
  },
});
