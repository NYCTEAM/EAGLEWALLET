/**
 * Eagle Wallet - RPC Node Settings
 * Manage RPC nodes for current network
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WalletService from '../services/WalletService';
import RPCService from '../services/RPCService';

interface RPCNode {
  name: string;
  url: string;
  latency: number;
  available: boolean;
  region?: string;
  apiKey?: string;
  fetchOptions?: any;
}

const PINNED_RPC_KEY_PREFIX = 'EAGLE_PINNED_RPC_';
const LEGACY_PINNED_RPC_KEY = 'EAGLE_PINNED_RPC';

export default function RPCNodeScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [nodes, setNodes] = useState<RPCNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [pinnedNode, setPinnedNode] = useState<string>('');
  
  const network = WalletService.getCurrentNetwork();

  useEffect(() => {
    loadPinnedNode();
    loadCachedNodes();
    testNodes(true);
  }, [network.chainId]);

  const loadPinnedNode = async () => {
    try {
      const pinnedKey = `${PINNED_RPC_KEY_PREFIX}${network.chainId}`;
      let pinned = await AsyncStorage.getItem(pinnedKey);
      if (!pinned) {
        const legacy = await AsyncStorage.getItem(LEGACY_PINNED_RPC_KEY);
        if (legacy) {
          pinned = legacy;
          await AsyncStorage.setItem(pinnedKey, legacy);
        }
      }
      if (pinned) {
        setPinnedNode(pinned);
        setSelectedNode(pinned);
      }
    } catch (error) {
      console.error('Failed to load pinned node:', error);
    }
  };

  const loadCachedNodes = async () => {
    try {
      const cached = await RPCService.getCachedNodes(network.chainId);
      if (cached?.nodes?.length) {
        setNodes(cached.nodes as RPCNode[]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load cached RPC nodes:', error);
    }
  };

  const testNodes = async (forceRefresh: boolean = false) => {
    setTesting(true);
    const testedNodes = await RPCService.getNodes(network.chainId, forceRefresh);
    setNodes(testedNodes as RPCNode[]);

    let currentPinned = pinnedNode;
    if (!currentPinned) {
      const pinnedKey = `${PINNED_RPC_KEY_PREFIX}${network.chainId}`;
      currentPinned = await AsyncStorage.getItem(pinnedKey);
      if (currentPinned) {
        setPinnedNode(currentPinned);
        setSelectedNode(currentPinned);
      }
    }

    if (!currentPinned && testedNodes.length > 0 && testedNodes[0].available) {
      const fastestNode = testedNodes[0];
      setSelectedNode(fastestNode.name);
      setPinnedNode(fastestNode.name);

      const pinnedKey = `${PINNED_RPC_KEY_PREFIX}${network.chainId}`;
      AsyncStorage.setItem(pinnedKey, fastestNode.name).catch(err => {
        console.error('Failed to auto-save fastest node:', err);
      });
    }

    setTesting(false);
    setLoading(false);
  };
  const handleSelectNode = async (nodeName: string) => {
    setSelectedNode(nodeName);
    setPinnedNode(nodeName);
    
    try {
      const pinnedKey = `${PINNED_RPC_KEY_PREFIX}${network.chainId}`;
      await AsyncStorage.setItem(pinnedKey, nodeName);
      Alert.alert(
        t.common.success,
        `${t.network.rpcNode} ${nodeName} ${t.network.selected}`,
        [{ text: t.common.ok }]
      );
    } catch (error) {
      console.error('Failed to save pinned node:', error);
    }
  };

  const getStatusColor = (latency: number) => {
    if (latency < 200) return '#43A047';     // Fast - Green
    if (latency < 500) return '#FDD835';     // Normal - Yellow
    if (latency < 1000) return '#FB8C00';    // Slow - Orange
    return '#E53935';                        // Very Slow - Red
  };

  const getStatusText = (latency: number) => {
    if (latency < 200) return t.network.fast;
    if (latency < 500) return t.network.normal;
    if (latency < 1000) return t.network.slow;
    return t.network.slow; // Or "Very Slow" if translation exists, fallback to Slow
  };

  const getRegionFlag = (region?: string) => {
    switch (region) {
      case 'US': return '🇺🇸';
      case 'HK': return '🇭🇰';
      case 'Global': return '🌐';
      default: return '🌍';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings.rpcNodes}</Text>
        <TouchableOpacity onPress={() => testNodes(true)} disabled={testing}>
          <Text style={styles.refreshButton}>
            {testing ? '⏳' : '🔄'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Network Info */}
      <View style={styles.networkInfo}>
        <Text style={styles.networkName}>{network.name}</Text>
        <Text style={styles.networkSubtext}>
          {nodes.length} {t.network.nodesAvailable}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F3BA2F" />
          <Text style={styles.loadingText}>{t.network.testConnection}...</Text>
        </View>
      ) : (
        <ScrollView style={styles.nodeList}>
          {nodes.map((node, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.nodeCard,
                selectedNode === node.name && styles.nodeCardSelected
              ]}
              onPress={() => handleSelectNode(node.name)}
              disabled={!node.available}
            >
              <View style={styles.nodeHeader}>
                <View style={styles.nodeLeft}>
                  <Text style={styles.nodeFlag}>
                    {getRegionFlag(node.region)}
                  </Text>
                  <View>
                    <Text style={styles.nodeName}>{node.name}</Text>
                    {node.region && (
                      <Text style={styles.nodeRegion}>{node.region}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.nodeRight}>
                  {node.available ? (
                    <>
                      <Text style={[
                        styles.nodeLatency,
                        { color: getStatusColor(node.latency) }
                      ]}>
                        {node.latency}ms
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(node.latency) + '20' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(node.latency) }
                        ]}>
                          {getStatusText(node.latency)}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={[styles.statusBadge, styles.statusFailed]}>
                      <Text style={styles.statusTextFailed}>{t.network.disconnected}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Latency Bar */}
              {node.available && (
                <View style={styles.latencyBarContainer}>
                  <View
                    style={[
                      styles.latencyBar,
                      {
                        width: `${Math.min((node.latency / 500) * 100, 100)}%`,
                        backgroundColor: getStatusColor(node.latency)
                      }
                    ]}
                  />
                </View>
              )}

              {/* Selected Checkmark */}
              {selectedNode === node.name && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedCheck}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Info Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t.network.hiddenUrl}
        </Text>
        <Text style={styles.footerSubtext}>
          {t.network.fastestNode}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    color: '#F3BA2F',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  refreshButton: {
    fontSize: 24,
  },
  networkInfo: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  networkName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  networkSubtext: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  nodeList: {
    flex: 1,
    padding: 20,
  },
  nodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nodeFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  nodeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  nodeRegion: {
    fontSize: 12,
    color: '#999',
  },
  nodeRight: {
    alignItems: 'flex-end',
  },
  nodeLatency: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusFailed: {
    backgroundColor: '#FFEBEE',
  },
  statusTextFailed: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E53935',
  },
  latencyBarContainer: {
    height: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  latencyBar: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
  nodeCardSelected: {
    borderWidth: 2,
    borderColor: '#F3BA2F',
    backgroundColor: '#FFF9E6',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3BA2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
