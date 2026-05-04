// ==================== USER ====================
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  role: 'user' | 'admin';
  isAdmin?: boolean;
  loyaltyPoints: number;
  createdAt: string;
  isActive: boolean;
  code?: string;
}

// ==================== PRODUCT ====================
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  categoryId?: string;
  images: string[];
  image_url?: string;
  inStock: boolean;
  stockQuantity: number;
  specifications: Record<string, string>;
  featured?: boolean;
  createdAt: string;
  brand: string;
  colors?: string[];
  sizes?: string[];
}

// ==================== CATEGORY ====================
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount?: number;
  
}

// ==================== CART ====================
export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
  selectedColor?: string;
  selectedSize?: string;
}

// ==================== ORDERS ====================
// Interface pour créer une commande
export interface CreateOrderData {
  items: {
    productId: string;
    quantity: number;
    price: number;
    name: string;
    selectedColor?: string;
    selectedSize?: string;
  }[];
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  voucherCode?: string;
  discount?: number;
}

// Interface pour un item de commande
export interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  productImage?: string;
  price: number;
  quantity: number;
  name: string;
  selectedColor?: string;
  selectedSize?: string;
}

// Interface pour une commande
export interface Order {
  id: string;
  userId?: string;
  items: OrderItem[];
  total: number;
  discount?: number;
  finalTotal?: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  voucherCode?: string;
  loyaltyPointsEarned?: number;
  qrCode?: string;
  createdAt?: string;
  updatedAt?: string;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  paymentReference?: string;
}

// ==================== VOUCHERS ====================
// Interface pour la validation de voucher
export interface VoucherValidationResult {
  valid: boolean;
  discount: number;
  message?: string;
}

export interface VoucherData {
  id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxUses: number | null;
  usedCount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt?: string;
}

// ==================== FLASH SALES ====================
export interface FlashSale {
  id: string;
  productId: string;
  product?: Product;
  discountPrice: number;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  stock: number;
  soldCount?: number;
  isActive: boolean;
}

// ==================== BANNERS ====================
export interface BannerSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  productId?: string;
  product?: Product;
  images?: string[];
  order: number;
  isActive: boolean;
  link?: string;
}

// ==================== ADMIN ====================
export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export type MovementType = "in" | "out" | "return" | "adjustment";

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  createdAt: string;
}

// Interfaces spécifiques pour PayTech

export interface PaytechPaymentRequest {
  order_id: string;
  payment_method?: string;
}

export interface PaytechPaymentResponse {
  success: number;
  redirect_url?: string;
  message?: string;
}

export type PaymentStatus = "pending" | "paid" | "failed";

export interface UpdateOrderPayload {
  status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_method?: string;
  payment_status?: PaymentStatus;
  payment_reference?: string;
}


