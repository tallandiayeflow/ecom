// ==================== USER ====================
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  role: 'user' | 'admin';
  isAdmin?: boolean;  // ✅ Ajout pour compatibilité
  loyaltyPoints: number;
  createdAt: string;
  isActive: boolean;
  code?:string
}

// ==================== PRODUCT ====================
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  categoryId?: string;  // ✅ Ajout pour l'ID de catégorie
  images: string[];
  image_url?: string;  // ✅ Fallback pour une seule image
  inStock: boolean;
  stockQuantity: number;
  specifications: Record<string, string>;
  featured?: boolean;
  createdAt: string;
  brand: string;
}

// ==================== CATEGORY ====================
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount?: number;  // ✅ Optionnel car calculé dynamiquement
}

// ==================== CART ====================
export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

// ==================== ORDERS ====================

// Interface pour créer une commande
export interface CreateOrderData {
  items: {
    productId: string;
    quantity: number;
    price: number;
    name: string;
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
  productId?: string;  // ✅ Optionnel
  productName: string;  // ✅ Nom principal
  productImage?: string;  // ✅ Optionnel
  price: number;
  quantity: number;
  name:string
}

// Interface pour une commande
export interface Order {
  id: string;
  userId?: string;  // ✅ Optionnel pour le frontend
  items: OrderItem[];
  total: number;
  discount?: number;  // ✅ Optionnel
  finalTotal?: number;  // ✅ Optionnel
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  voucherCode?: string;
  loyaltyPointsEarned?: number;  // ✅ Optionnel
  qrCode?: string;
  createdAt?: string;  // ✅ Optionnel
  updatedAt?: string;  // ✅ Optionnel
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
  validFrom: string;      // ✅ AJOUT
  validUntil: string;     // ✅ RENOMMAGE depuis expiryDate
  isActive: boolean;
  createdAt?: string;     // ✅ AJOUT
}



// ==================== FLASH SALES ====================
export interface FlashSale {
  id: string;
  productId: string;
  product?: Product; // Optionnel, peut contenir la donnée produit complète
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
  subtitle?: string;  // ✅ Optionnel
  imageUrl: string;
  productId?: string;  // ✅ Optionnel
  product?: Product;  // ✅ Optionnel
  images?: string[];  // ✅ Optionnel pour compatibilité
  order: number;
  isActive: boolean;
  link?: string;  // ✅ Ajout pour lien externe
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