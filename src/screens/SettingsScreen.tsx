import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  AppSettings,
  getSettings,
  saveSettings,
} from '../storage/stockStorage';
import {
  registerBackgroundTask,
  unregisterBackgroundTask,
} from '../services/stockChecker';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    defaultCheckIntervalMinutes: 15,
    globalNotificationsEnabled: true,
  });
  const [intervalText, setIntervalText] = useState('15');
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getSettings().then((s) => {
        setSettings(s);
        setIntervalText(s.defaultCheckIntervalMinutes.toString());
      });
    }, []),
  );

  async function handleSave() {
    const interval = parseInt(intervalText, 10);
    if (isNaN(interval) || interval < 5) {
      Alert.alert('Invalid Value', 'Check interval must be at least 5 minutes.');
      return;
    }

    const updated: AppSettings = {
      ...settings,
      defaultCheckIntervalMinutes: interval,
    };

    await saveSettings(updated);
    setSettings(updated);

    // Register or unregister background task based on global toggle
    if (updated.globalNotificationsEnabled) {
      await registerBackgroundTask();
    } else {
      await unregisterBackgroundTask();
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleToggleNotifications(value: boolean) {
    setSettings((prev) => ({ ...prev, globalNotificationsEnabled: value }));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Notifications</Text>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>Enable All Notifications</Text>
          <Text style={styles.rowHint}>
            Master toggle for all stock alert push notifications.
          </Text>
        </View>
        <Switch
          value={settings.globalNotificationsEnabled}
          onValueChange={handleToggleNotifications}
          trackColor={{ true: '#4CAF50', false: '#ccc' }}
          thumbColor="#fff"
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Background Checking</Text>

      <Text style={styles.fieldLabel}>Default Check Interval (minutes)</Text>
      <TextInput
        style={styles.input}
        value={intervalText}
        onChangeText={setIntervalText}
        keyboardType="numeric"
        placeholder="15"
        placeholderTextColor="#aaa"
      />
      <Text style={styles.hint}>
        Applies to new items. Minimum 5 min. iOS and Android may batch background tasks — actual
        frequency depends on OS scheduling.
      </Text>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save Settings'}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.about}>
        StockWise monitors product pages for availability and fires an instant push notification
        the moment stock is detected. Add items on the home screen, customise the keyword used to
        detect availability, and adjust the check frequency here.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f0f2f5',
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dde2ee',
    gap: 12,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  rowHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
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
    marginTop: 6,
    lineHeight: 17,
  },
  saveBtn: {
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  about: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});
