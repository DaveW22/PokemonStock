import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { addItem } from '../storage/stockStorage';
import { StockItem } from '../types/StockItem';

type Props = NativeStackScreenProps<RootStackParamList, 'AddItem'>;

export default function AddItemScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [selector, setSelector] = useState('add to cart');
  const [intervalMinutes, setIntervalMinutes] = useState('15');
  const [notifyOnInStock, setNotifyOnInStock] = useState(true);
  const [saving, setSaving] = useState(false);

  function validate(): string | null {
    if (!name.trim()) return 'Please enter a product name.';
    if (!url.trim()) return 'Please enter a product URL.';
    if (!/^https?:\/\/.+/.test(url.trim())) return 'URL must start with http:// or https://';
    if (!selector.trim()) return 'Please enter a keyword to detect stock status.';
    const interval = parseInt(intervalMinutes, 10);
    if (isNaN(interval) || interval < 5) return 'Check interval must be at least 5 minutes.';
    return null;
  }

  async function handleSave() {
    const error = validate();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setSaving(true);
    const newItem: StockItem = {
      id: Date.now().toString(),
      name: name.trim(),
      url: url.trim(),
      selector: selector.trim(),
      checkIntervalMinutes: parseInt(intervalMinutes, 10),
      lastChecked: null,
      lastStatus: 'unknown',
      notifyOnInStock,
      createdAt: new Date().toISOString(),
    };

    await addItem(newItem);
    setSaving(false);
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Product Details</Text>

        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. PS5 Console"
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Product URL *</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com/product"
          placeholderTextColor="#aaa"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>In-Stock Keyword *</Text>
        <TextInput
          style={styles.input}
          value={selector}
          onChangeText={setSelector}
          placeholder='e.g. "add to cart" or "in stock"'
          placeholderTextColor="#aaa"
          autoCapitalize="none"
        />
        <Text style={styles.hint}>
          StockWise searches for this phrase in the page HTML. When found, the item is considered in stock.
        </Text>

        <Text style={styles.label}>Check Interval (minutes) *</Text>
        <TextInput
          style={styles.input}
          value={intervalMinutes}
          onChangeText={setIntervalMinutes}
          placeholder="15"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Minimum 5 minutes. Background checks are subject to OS scheduling.</Text>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Notify when in stock</Text>
            <Text style={styles.hint}>Receive an immediate push notification when stock is detected.</Text>
          </View>
          <Switch
            value={notifyOnInStock}
            onValueChange={setNotifyOnInStock}
            trackColor={{ true: '#4CAF50', false: '#ccc' }}
            thumbColor="#fff"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Item'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f0f2f5' },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#dde2ee',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dde2ee',
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  saveBtn: {
    marginTop: 32,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
