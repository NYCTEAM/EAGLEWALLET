/**
 * Eagle Wallet - Price Alert Screen
 * Manage price alerts for tokens
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import PriceAlertService, { PriceAlert } from '../services/PriceAlertService';

export default function PriceAlertScreen({ navigation }: any) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    tokenSymbol: '',
    targetPrice: '',
    condition: 'above' as 'above' | 'below',
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const allAlerts = await PriceAlertService.getAllAlerts();
    setAlerts(allAlerts);
  };

  const handleAddAlert = async () => {
    if (!newAlert.tokenSymbol || !newAlert.targetPrice) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await PriceAlertService.createAlert({
        tokenAddress: '0x...', // Get from token selection
        tokenSymbol: newAlert.tokenSymbol,
        targetPrice: parseFloat(newAlert.targetPrice),
        condition: newAlert.condition,
        isActive: true,
        chainId: 56,
      });

      setShowAddModal(false);
      setNewAlert({ tokenSymbol: '', targetPrice: '', condition: 'above' });
      await loadAlerts();
      Alert.alert('Success', 'Price alert created');
    } catch (error) {
      Alert.alert('Error', 'Failed to create alert');
    }
  };

  const handleDeleteAlert = (id: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await PriceAlertService.deleteAlert(id);
            await loadAlerts();
          },
        },
      ]
    );
  };

  const handleToggleAlert = async (alert: PriceAlert) => {
    await PriceAlertService.updateAlert(alert.id, { isActive: !alert.isActive });
    await loadAlerts();
  };

  const renderAlert = ({ item }: { item: PriceAlert }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View>
          <Text style={styles.alertToken}>{item.tokenSymbol}</Text>
          <Text style={styles.alertCondition}>
            {item.condition === 'above' ? '↑' : '↓'} ${item.targetPrice}
          </Text>
        </View>
        
        <View style={styles.alertActions}>
          <TouchableOpacity
            style={[styles.statusBadge, item.isActive && styles.statusBadgeActive]}
            onPress={() => handleToggleAlert(item)}
          >
            <Text style={styles.statusText}>
              {item.isActive ? 'Active' : 'Paused'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteAlert(item.id)}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {item.isTriggered && (
        <View style={styles.triggeredBadge}>
          <Text style={styles.triggeredText}>✓ Triggered</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Price Alerts</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Alert List */}
      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No price alerts</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.createButtonText}>Create Alert</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Alert Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Price Alert</Text>
            
            <Text style={styles.inputLabel}>Token Symbol</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., BNB"
              value={newAlert.tokenSymbol}
              onChangeText={text => setNewAlert({ ...newAlert, tokenSymbol: text })}
              autoCapitalize="characters"
            />
            
            <Text style={styles.inputLabel}>Target Price (USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={newAlert.targetPrice}
              onChangeText={text => setNewAlert({ ...newAlert, targetPrice: text })}
              keyboardType="decimal-pad"
            />
            
            <Text style={styles.inputLabel}>Condition</Text>
            <View style={styles.conditionButtons}>
              <TouchableOpacity
                style={[
                  styles.conditionButton,
                  newAlert.condition === 'above' && styles.conditionButtonActive
                ]}
                onPress={() => setNewAlert({ ...newAlert, condition: 'above' })}
              >
                <Text style={[
                  styles.conditionButtonText,
                  newAlert.condition === 'above' && styles.conditionButtonTextActive
                ]}>
                  Above ↑
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.conditionButton,
                  newAlert.condition === 'below' && styles.conditionButtonActive
                ]}
                onPress={() => setNewAlert({ ...newAlert, condition: 'below' })}
              >
                <Text style={[
                  styles.conditionButtonText,
                  newAlert.condition === 'below' && styles.conditionButtonTextActive
                ]}>
                  Below ↓
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddAlert}
              >
                <Text style={styles.confirmButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    fontSize: 32,
    color: '#F3BA2F',
    fontWeight: '300',
  },
  listContent: {
    padding: 20,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertToken: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  alertCondition: {
    fontSize: 16,
    color: '#666',
  },
  alertActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  statusBadgeActive: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  deleteButton: {
    padding: 4,
  },
  deleteIcon: {
    fontSize: 20,
  },
  triggeredBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  triggeredText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F3BA2F',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#F3BA2F',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  conditionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  conditionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  conditionButtonActive: {
    borderColor: '#F3BA2F',
    backgroundColor: '#FFF9E6',
  },
  conditionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  conditionButtonTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#F3BA2F',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
