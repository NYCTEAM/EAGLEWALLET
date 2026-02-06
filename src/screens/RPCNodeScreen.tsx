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
} from 'react-native';
import WalletService from '../services/WalletService';

interface RPCNode {
  name: string;
  url: string;
  latency: number;
  available: boolean;
  region?: string;
}

export default function RPCNodeScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [nodes, setNodes] = useState<RPCNode[]>([]);
  const [selectedNode, setSelectedNode] = useState('Official');
  
  const network = WalletService.getCurrentNetwork();

  useEffect(() => {
    testNodes();
  }, []);

  const testNodes = async () => {
    setTesting(true);
    // Mock testing RPC nodes
    setTimeout(() => {
      const mockNodes: RPCNode[] = [
        { name: 'Official', url: 'https://bsc-dataseed.binance.org', latency: 120, available: true, region: 'Global' },
        { name: 'QuickNode', url: 'https://...quicknode.com', latency: 45, available: true, region: 'US' },
        { name: 'Ankr', url: 'https://rpc.ankr.com/bsc', latency: 85, available: true, region: 'EU' },
        { name: 'Backup 1', url: 'https://bsc-dataseed1.defibit.io', latency: 150, available: true, region: 'Asia' },
        { name: 'Backup 2', url: 'https://bsc-dataseed1.ninicoin.io', latency: 999, available: false, region: 'Global' },
      ];
      
      setNodes(mockNodes.sort((a, b) => a.latency - b.latency));
      setTesting(false);
      setLoading(false);
    }, 1500);
  };

  const handleSelectNode = (nodeName: string) => {
    setSelectedNode(nodeName);
    // TODO: Save to storage and update RPC service
  };

  const getStatusColor = (latency: number) => {
    if (latency < 50) return '#43A047';      // Excellent - Green
    if (latency < 100) return '#7CB342';     // Good - Light Green
    if (latency < 200) return '#FDD835';     // Fair - Yellow
    if (latency < 500) return '#FB8C00';     // Slow - Orange
    return '#E53935';                        // Failed - Red
  };

  const getStatusText = (latency: number) => {
    if (latency < 50) return t.network.fast;
    if (latency < 100) return t.network.normal;
    if (latency < 200) return t.network.normal;
    if (latency < 500) return t.network.slow;
    return t.transaction.failed;
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
        <TouchableOpacity onPress={testNodes} disabled={testing}>
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
