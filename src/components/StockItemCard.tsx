import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StockItem, StockStatus } from '../types/StockItem';

interface Props {
  item: StockItem;
  onDelete: (id: string) => void;
  onToggleNotify: (item: StockItem) => void;
}

const STATUS_COLORS: Record<StockStatus, string> = {
  in_stock: '#4CAF50',
  out_of_stock: '#F44336',
  error: '#FF9800',
  unknown: '#9E9E9E',
};

const STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: 'IN STOCK',
  out_of_stock: 'OUT OF STOCK',
  error: 'CHECK ERROR',
  unknown: 'NOT CHECKED',
};

function formatLastChecked(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function StockItemCard({ item, onDelete, onToggleNotify }: Props) {
  function confirmDelete() {
    Alert.alert('Remove Item', `Remove "${item.name}" from tracking?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => onDelete(item.id) },
    ]);
  }

  const statusColor = STATUS_COLORS[item.lastStatus];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor }]}>
          <Text style={styles.badgeText}>{STATUS_LABELS[item.lastStatus]}</Text>
        </View>
      </View>

      <Text style={styles.url} numberOfLines={1}>{item.url}</Text>
      <Text style={styles.meta}>
        Keyword: <Text style={styles.metaValue}>"{item.selector}"</Text>
      </Text>
      <Text style={styles.meta}>
        Last checked: <Text style={styles.metaValue}>{formatLastChecked(item.lastChecked)}</Text>
      </Text>
      <Text style={styles.meta}>
        Check every: <Text style={styles.metaValue}>{item.checkIntervalMinutes} min</Text>
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, item.notifyOnInStock ? styles.btnActive : styles.btnMuted]}
          onPress={() => onToggleNotify(item)}
        >
          <Text style={styles.btnText}>
            {item.notifyOnInStock ? '🔔 Notify On' : '🔕 Notify Off'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={confirmDelete}>
          <Text style={styles.btnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    color: '#1a1a2e',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  url: {
    fontSize: 12,
    color: '#6c6c80',
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  metaValue: {
    fontWeight: '600',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: '#4CAF50',
  },
  btnMuted: {
    backgroundColor: '#9E9E9E',
  },
  btnDanger: {
    backgroundColor: '#F44336',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});
