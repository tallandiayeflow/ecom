export interface InvoiceItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  productId?: string;
  productImage?: string;
  total?: number;
}

export interface CreateInvoiceData {
  invoice_number: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  items: InvoiceItem[];
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod: 'cash_on_delivery' | 'card' | 'bank_transfer' | 'other'|'espèces'|'Mobile Money';
  notes?: string;
  taxRate?: number;
  discount?: number;
}

export interface UpdateInvoiceData {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  items?: InvoiceItem[];
  status?: 'pending' | 'paid' | 'cancelled';
  paymentMethod?: 'cash_on_delivery' | 'card' | 'bank_transfer' | 'other';
  notes?: string;
  taxRate?: number;
  discount?: number;
}


// Types pour les factures
export interface Invoice {
  id: string;
  invoice_number: string;
  order_id?: string | null;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_city?: string | null;
  amount: number;
  tax: number;
  tax_rate: number;
  discount: number;
  total: number;
  status: 'paid' | 'pending' | 'cancelled';
  payment_method: 'cash_on_delivery' | 'card' | 'bank_transfer' | 'other';
  payment_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items?: InvoiceItemDetail[];
  user_name?: string;
  user_email?: string;
}

export interface InvoiceItemDetail {
  id: string;
  invoice_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  unit_price: number;
  quantity: number;
  total: number;
}