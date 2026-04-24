export type StockStatus = 'unknown' | 'in_stock' | 'out_of_stock' | 'error';

export interface StockItem {
  id: string;
  name: string;
  url: string;
  selector: string; // CSS-style keyword to search for in page HTML, e.g. "add to cart"
  checkIntervalMinutes: number;
  lastChecked: string | null;   // ISO date string
  lastStatus: StockStatus;
  notifyOnInStock: boolean;
  createdAt: string; // ISO date string
}
