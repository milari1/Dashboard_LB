// Database types matching the sales table structure
export interface Sale {
  id: number;
  branch: string | null;
  sale_date: Date | null;
  client: string | null;
  items: string | null;
  qty: number | null;
  unit_of_measure: string | null;
  unit_price_usd: number | null;
  price_subtotal_with_tax: number | null;
  price_subtotal_with_tax_usd: number | null;
  rate: number | null;
  invoice_number: string | null;
  guest_number: string | null;
  table_number: string | null;
  month: string | null;
  tax: number | null;
  category: string | null;
  group_name: string | null;
  barcode: string | null;
  source_row_hash: string;
  last_synced_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface SyncLog {
  id: number;
  synced_at: Date;
  rows_processed: number;
  rows_inserted: number;
  rows_updated: number;
  file_etag: string | null;
  file_modified: Date | null;
  status: string;
  error_message: string | null;
}

// Dashboard API response types
export interface KPIMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topBranch: string;
  revenueChange: number; // percentage
  ordersChange: number;
}

export interface BranchMetrics {
  branch: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  topItem: string | null;
}

export interface CategoryMetrics {
  category: string;
  revenue: number;
  quantity: number;
  orders: number;
}

export interface TrendData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopItem {
  item: string;
  quantity: number;
  revenue: number;
  orders: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}
