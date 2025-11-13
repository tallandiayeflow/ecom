export interface InvoiceItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  productId?: string;
  productImage?: string;
  total?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  items: InvoiceItem[];
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod: 'cash_on_delivery' | 'card' | 'bank_transfer' | 'other';
  notes?: string;
  taxRate?: number;
  discount?: number;
  amount: number;
  tax: number;
  total: number;
  createdAt: string;
}

export interface CreateInvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  items: InvoiceItem[];
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod: 'cash_on_delivery' | 'card' | 'bank_transfer' | 'other';
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
