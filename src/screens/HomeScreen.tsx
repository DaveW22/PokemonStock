import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import StockItemCard from '../components/StockItemCard';
import { StockItem } from '../types/StockItem';
import { deleteItem, getItems, updateItem } from '../storage/stockStorage';
import { runManualCheck } from '../services/stockChecker';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const [items, setItems] = useState<StockItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);

  async function loadItems() {
    const stored = await getItems();
    setItems(stored);
  }

  // Reload list every time the screen comes into focus (e.g. after adding an item)
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, []),
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }

  async function handleCheckNow() {
    setChecking(true);
    await runManualCheck();
    await loadItems();
    setChecking(false);
  }

  async function handleDelete(id: string) {
    await deleteItem(id);
    await loadItems();
  }

  async function handleToggleNotify(item: StockItem) {
    const updated: StockItem = { ...item, notifyOnInStock: !item.notifyOnInStock };
    await updateItem(updated);
    await loadItems();
  }

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.title}>StockWise</Text>
        <View style={styles.toolbarActions}>
          <TouchableOpacity
            style={[styles.iconBtn, checking && styles.iconBtnDisabled]}
            onPress={handleCheckNow}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.iconBtnText}>⟳ Check</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.iconBtnAdd]}
            onPress={() => navigation.navigate('AddItem')}
          >
            <Text style={styles.iconBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No items tracked yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap "+ Add" to start monitoring product pages for availability.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StockItemCard
              item={item}
              onDelete={handleDelete}
              onToggleNotify={handleToggleNotify}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  toolbar: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  iconBtnAdd: {
    backgroundColor: '#2196F3',
  },
  iconBtnDisabled: {
    opacity: 0.6,
  },
  iconBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  list: {
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6c6c80',
    textAlign: 'center',
    lineHeight: 20,
  },
});
