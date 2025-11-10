export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  role: 'user' | 'admin';
  loyaltyPoints: number;
  createdAt: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  specifications: Record<string, string>;
  featured?: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  productCount: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  discount: number;
  finalTotal: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  voucherCode?: string;
  loyaltyPointsEarned: number;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlashSale {
  id: string;
  productId: string;
  product: Product;
  discountPrice: number;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  stock: number;
  isActive: boolean;
}

export interface Voucher {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxUses: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface BannerSlide {
  id: string;
  productId: string;
  product: Product;
  title: string;
  subtitle: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
}
