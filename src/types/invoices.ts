// Types pour les factures
export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  userId: string;
  amount: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod: string;
  items: InvoiceItem[];
  userName?: string;
  userEmail?: string;
  orderStatus?: string;
  createdAt: string;
  paidAt?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  cancelledInvoices: number;
  totalRevenue: number;
  avgInvoiceAmount: number;
}

// Types pour le stock
export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  quantity: number;
  movementType: 'in' | 'out' | 'adjustment' | 'return';
  previousStock: number;
  newStock: number;
  reason: string;
  userId: string;
  userName?: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  name: string;
  stock: number;
  imageUrl?: string;
  price: number;
  categoryId?: string;
}

export interface StockAlerts {
  lowStock: StockAlert[];
  outOfStock: StockAlert[];
  lowStockCount: number;
  outOfStockCount: number;
}

export interface StockStats {
  general: {
    totalProducts: number;
    totalStock: number;
    outOfStockCount: number;
    lowStockCount: number;
    totalStockValue: number;
  };
  recentMovements: Array<{
    date: string;
    movementType: string;
    totalQuantity: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    stock: number;
    price: number;
    stockValue: number;
  }>;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  price: number;
  imageUrl?: string;
  categoryId?: string;
  categoryName?: string;
  stockValue: number;
  stockStatus: 'out_of_stock' | 'low_stock' | 'medium_stock' | 'good_stock';
}
