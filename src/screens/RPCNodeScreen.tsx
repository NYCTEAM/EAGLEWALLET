/**
 * Eagle Wallet - RPC Node Selection Screen
 * 显示 RPC 节点名称和状态，隐藏实际 URL
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import RPCService from '../services/RPCService';
import { NETWORKS } from '../config/networks';

export default function RPCNodeScreen({ route, navigation }: any) {
  const { chainId } = route.params;
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const network = NETWORKS[chainId];

  useEffect(() => {
    testNodes();
  }, []);

  const testNodes = async () => {
    setTesting(true);
    try {
      const results = await RPCService.testAllRPCs(chainId);
      setNodes(results);
    } catch (error) {
      console.error('Test nodes error:', error);
    } finally {
      setTesting(false);
      setLoading(false);
    }
  };

  const getStatusColor = (latency: number) => {
    if (latency < 50) return '#43A047';      // 优秀 - 绿色
    if (latency < 100) return '#7CB342';     // 良好 - 浅绿
    if (latency < 200) return '#FDD835';     // 一般 - 黄色
    if (latency < 500) return '#FB8C00';     // 慢 - 橙色
    return '#E53935';                        // 失败 - 红色
  };

  const getStatusText = (latency: number) => {
    if (latency < 50) return 'Excellent';
    if (latency < 100) return 'Good';
    if (latency < 200) return 'Fair';
    if (latency < 500) return 'Slow';
    return 'Failed';
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
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>RPC Nodes</Text>
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
          {nodes.length} nodes available
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F3BA2F" />
          <Text style={styles.loadingText}>Testing nodes...</Text>
        </View>
      ) : (
        <ScrollView style={styles.nodeList}>
          {nodes.map((node, index) => (
            <View key={index} style={styles.nodeCard}>
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
                      <Text style={styles.statusTextFailed}>Offline</Text>
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
            </View>
          ))}
        </ScrollView>
      )}

      {/* Info Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🔒 RPC URLs are hidden for security
        </Text>
        <Text style={styles.footerSubtext}>
          Fastest node is automatically selected
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
});
