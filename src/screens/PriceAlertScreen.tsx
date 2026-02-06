/**
 * Eagle Wallet - Price Alert Screen
 * Set alerts for token price changes
 */

import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';

interface PriceAlert {
  id: string;
  tokenSymbol: string;
  targetPrice: string;
  condition: 'above' | 'below';
  isActive: boolean;
}

export default function PriceAlertScreen({ navigation }: any) {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<PriceAlert[]>([
    { id: '1', tokenSymbol: 'BNB', targetPrice: '350.00', condition: 'above', isActive: true },
    { id: '2', tokenSymbol: 'BTC', targetPrice: '45000.00', condition: 'below', isActive: false },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAlert, setNewAlert] = useState({
    tokenSymbol: '',
    targetPrice: '',
    condition: 'above' as 'above' | 'below',
  });

  const handleAddAlert = () => {
    if (!newAlert.tokenSymbol || !newAlert.targetPrice) {
      Alert.alert(t.common.error, t.errors.invalidInput);
      return;
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      tokenSymbol: newAlert.tokenSymbol.toUpperCase(),
      targetPrice: newAlert.targetPrice,
      condition: newAlert.condition,
      isActive: true,
    };

    setAlerts([...alerts, alert]);
    setShowAddModal(false);
    setNewAlert({ tokenSymbol: '', targetPrice: '', condition: 'above' });
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const renderAlert = ({ item }: { item: PriceAlert }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View>
          <Text style={styles.alertToken}>{item.tokenSymbol}</Text>
          <Text style={styles.alertCondition}>
            {item.condition === 'above' ? '↑' : '↓'} {item.targetPrice} USD
          </Text>
        </View>
        <View style={styles.alertActions}>
          <TouchableOpacity 
            style={[styles.statusBadge, item.isActive && styles.statusBadgeActive]}
            onPress={() => toggleAlert(item.id)}
          >
            <Text style={styles.statusText}>
              {item.isActive ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteAlert(item.id)}
          >
            <Text style={styles.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Simulation trigger indicator */}
      {Math.random() > 0.8 && item.isActive && (
        <View style={styles.triggeredBadge}>
          <Text style={styles.triggeredText}>🔔 Triggered</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← {t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t.settings.priceAlerts}</Text>
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
            <Text style={styles.emptyIcon}>🔕</Text>
            <Text style={styles.emptyText}>{t.common.none}</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.createButtonText}>{t.common.add}</Text>
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
            <Text style={styles.modalTitle}>{t.common.add}</Text>

            <Text style={styles.inputLabel}>{t.token.tokenSymbol}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., BNB"
              value={newAlert.tokenSymbol}
              onChangeText={text => setNewAlert({ ...newAlert, tokenSymbol: text })}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>{t.token.price} (USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={newAlert.targetPrice}
              onChangeText={text => setNewAlert({ ...newAlert, targetPrice: text })}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>{t.common.filter}</Text>
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
                  {t.priceAlert.above} ↑
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
                  {t.priceAlert.below} ↓
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t.common.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddAlert}
              >
                <Text style={styles.confirmButtonText}>{t.common.confirm}</Text>
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
