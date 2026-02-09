
/**
 * Interface principale pour une facture
 */
export interface Invoice {
  id: string;
  invoice_number: string;
  order_id?: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  amount: number;
  tax: number;
  tax_rate: number;
  discount: number;
  total: number;
  status: 'paid' | 'pending' | 'cancelled';
  payment_method: PaymentMethod;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  items?: InvoiceItem[];
  user_name?: string;
  user_email?: string;
}

/**
 * Interface pour un article de facture
 */
export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  unit_price: number;
  quantity: number;
  total: number;
}

/**
 * Données pour créer une nouvelle facture
 */
export interface CreateInvoiceData {
  invoiceNumber?: string;
  orderId?: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  items: CreateInvoiceItem[];
  status?: 'paid' | 'pending' | 'cancelled';
  paymentMethod?: PaymentMethod;
  notes?: string;
  taxRate?: number;
  discount?: number;
}

/**
 * Interface pour un article lors de la création
 */
export interface CreateInvoiceItem {
  productId: string;
  name: string;
  productImage?: string;
  unitPrice: number;
  quantity: number;
}

/**
 * Données pour mettre à jour le statut/paiement d'une facture
 */
export interface UpdateInvoiceData {
  status?: 'paid' | 'pending' | 'cancelled';
  paymentMethod?: PaymentMethod;
  notes?: string;
}

/**
 * Données pour mettre à jour complètement une facture (client + items)
 */
export interface UpdateInvoiceCompleteData {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  items?: CreateInvoiceItem[];
  status?: 'paid' | 'pending' | 'cancelled';
  paymentMethod?: PaymentMethod;
  notes?: string;
  taxRate?: number;
  discount?: number;
}

/**
 * Statistiques globales du rapport de ventes
 */
export interface SalesReportStats {
  total_invoices: number;
  total_revenue: number;
  total_ht: number;
  total_tax: number;
  total_discounts: number;
  average_invoice: number;
}

/**
 * Ventes d'une journée
 */
export interface DailySale {
  date: string;
  invoices_count: number;
  revenue: number;
}

/**
 * Produit le plus vendu
 */
export interface TopProduct {
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

/**
 * Rapport de ventes complet
 */
export interface SalesReport {
  period: 'day' | 'week' | 'month';
  start_date: string;
  end_date: string;
  statistics: SalesReportStats;
  daily_sales: DailySale[];
  top_products: TopProduct[];
}

/**
 * Paramètres pour générer un rapport de ventes
 */
export interface SalesReportParams {
  period?: 'day' | 'week' | 'month';
  start_date?: string;
  end_date?: string;
}

/**
 * Filtres pour la liste des factures
 */
export interface InvoiceFilters {
  search?: string;
  status?: 'paid' | 'pending' | 'cancelled';
  payment_method?: PaymentMethod;
  date_min?: string;
  date_max?: string;
  page?: number;
  limit?: number;
}

/**
 * Réponse paginée pour la liste des factures
 */
export interface InvoicesResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Type pour le statut de paiement
 */
export type InvoiceStatus = 'paid' | 'pending' | 'cancelled';

/**
 * Type pour la méthode de paiement
 */
export type PaymentMethod = 'cash_on_delivery' | 'card' | 'bank_transfer' | 'other' | 'espèces' | 'Mobile Money';

/**
 * Libellés français pour les statuts
 */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: 'Payée',
  pending: 'En attente',
  cancelled: 'Annulée',
};

/**
 * Libellés français pour les méthodes de paiement
 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash_on_delivery: 'Espèces',
  card: 'Carte bancaire',
  bank_transfer: 'Virement',
  other: 'Autre',
  'espèces': 'Espèces',
  'Mobile Money': 'Mobile Money',
};

/**
 * Couleurs pour les statuts de facture
 */
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  paid: '#22c55e',
  pending: '#f59e0b',
  cancelled: '#ef4444',
};