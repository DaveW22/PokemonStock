import AsyncStorage from '@react-native-async-storage/async-storage';
import { StockItem } from '../types/StockItem';

const STORAGE_KEY = '@stockwise_items';
const SETTINGS_KEY = '@stockwise_settings';

export interface AppSettings {
  defaultCheckIntervalMinutes: number;
  globalNotificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultCheckIntervalMinutes: 15,
  globalNotificationsEnabled: true,
};

// ── Items ────────────────────────────────────────────────────────────────────

export async function getItems(): Promise<StockItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StockItem[]) : [];
  } catch {
    return [];
  }
}

export async function saveItems(items: StockItem[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function addItem(item: StockItem): Promise<void> {
  const items = await getItems();
  await saveItems([...items, item]);
}

export async function updateItem(updated: StockItem): Promise<void> {
  const items = await getItems();
  await saveItems(items.map((i) => (i.id === updated.id ? updated : i)));
}

export async function deleteItem(id: string): Promise<void> {
  const items = await getItems();
  await saveItems(items.filter((i) => i.id !== id));
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
