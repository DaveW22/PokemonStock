import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import axios from 'axios';
import { getItems, updateItem, getSettings } from '../storage/stockStorage';
import { sendLocalNotification } from './notificationService';
import { StockItem, StockStatus } from '../types/StockItem';

export const STOCK_CHECK_TASK = 'STOCK_CHECK_TASK';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Fetches the page HTML for a given URL and checks whether the
 * selector keyword appears, which indicates the item is in stock.
 */
async function checkStockForItem(item: StockItem): Promise<StockStatus> {
  try {
    const response = await axios.get<string>(item.url, {
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; StockWiseBot/1.0)',
      },
      // Treat any content type as text so we can search the raw HTML
      responseType: 'text',
      transformResponse: [(data) => data],
    });

    const html: string = response.data as string;
    const keyword = item.selector.toLowerCase();
    const inStock = html.toLowerCase().includes(keyword);
    return inStock ? 'in_stock' : 'out_of_stock';
  } catch (err) {
    console.warn(`[StockChecker] Error checking ${item.url}:`, err);
    return 'error';
  }
}

// ── Background task definition ────────────────────────────────────────────────

TaskManager.defineTask(STOCK_CHECK_TASK, async () => {
  try {
    const [items, settings] = await Promise.all([getItems(), getSettings()]);

    if (!settings.globalNotificationsEnabled) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    let anyUpdated = false;

    for (const item of items) {
      if (!item.notifyOnInStock) continue;

      const newStatus = await checkStockForItem(item);
      const previousStatus = item.lastStatus;

      const updatedItem: StockItem = {
        ...item,
        lastChecked: new Date().toISOString(),
        lastStatus: newStatus,
      };

      await updateItem(updatedItem);
      anyUpdated = true;

      // Fire notification only when transitioning to in_stock
      if (newStatus === 'in_stock' && previousStatus !== 'in_stock') {
        await sendLocalNotification(
          '🟢 Back in Stock!',
          `${item.name} is now available.`,
          item.id,
        );
      }
    }

    return anyUpdated
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (err) {
    console.error('[StockChecker] Background task failed:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ── Registration helpers ──────────────────────────────────────────────────────

export async function registerBackgroundTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(STOCK_CHECK_TASK);
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(STOCK_CHECK_TASK, {
    minimumInterval: 15 * 60, // 15 minutes (OS minimum on iOS)
    stopOnTerminate: false,   // keep running on Android after app close
    startOnBoot: true,        // restart on device reboot
  });
}

export async function unregisterBackgroundTask(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(STOCK_CHECK_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(STOCK_CHECK_TASK);
  }
}

/**
 * Runs an immediate (foreground) check for all tracked items.
 * Call this when the user opens the app or pulls to refresh.
 */
export async function runManualCheck(): Promise<void> {
  const [items, settings] = await Promise.all([getItems(), getSettings()]);

  for (const item of items) {
    const newStatus = await checkStockForItem(item);
    const previousStatus = item.lastStatus;

    await updateItem({
      ...item,
      lastChecked: new Date().toISOString(),
      lastStatus: newStatus,
    });

    if (
      settings.globalNotificationsEnabled &&
      item.notifyOnInStock &&
      newStatus === 'in_stock' &&
      previousStatus !== 'in_stock'
    ) {
      await sendLocalNotification(
        '🟢 Back in Stock!',
        `${item.name} is now available.`,
        item.id,
      );
    }
  }
}
