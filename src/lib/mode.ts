import axios, { AxiosInstance } from 'axios';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Instance Axios configurée
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ==================== INTERCEPTORS ====================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== TYPES ====================

import type {
  BannerSlide,
  CartItem,
  Category,
  FlashSale,
  Order,
  Product,
  User,
  VoucherData,
} from '@/types';


export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message?: string;
}

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

export interface VoucherValidationResult {
  valid: boolean;
  discount: number;
  message: string;
}

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

export interface InvoicePayload {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  items: {
    id: string;
    name: string;
    unitPrice: number;
    quantity: number;
    productId?: string;
    productImage?: string;
  }[];
  status: 'paid' | 'pending' | 'cancelled';
  paymentMethod: 'cash_on_delivery' | 'card' | 'bank_transfer' | 'other';
  notes?: string;
  taxRate?: number;
  discount?: number;
}

// ==================== AUTH ====================

export const register = async (
  email: string,
  password: string,
  name: string
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/register', {
    email,
    password,
    name,
  });
  return response.data;
};

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

export const resetPassword = async (email: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/reset-password', {
    email,
  });
  return response.data;
};

// ==================== PRODUCTS ====================

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
}

export const getProducts = async (filters?: ProductFilters): Promise<ProductsResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.category) params.append('category', filters.category);
  if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.inStock) params.append('inStock', 'true');
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get<ProductsResponse>(`/products?${params.toString()}`);
  return response.data;
};

export const getProduct = async (id: string): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
};

export const createProduct = async (productData: Partial<Product>): Promise<Product> => {
  const response = await api.post<Product>('/products', productData);
  return response.data;
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  const response = await api.put<Product>(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/products/${id}`);
  return response.data;
};

// ==================== CATEGORIES ====================

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>('/categories');
  return response.data;
};

export const createCategory = async (categoryData: Partial<Category>): Promise<Category> => {
  const response = await api.post<Category>('/categories', categoryData);
  return response.data;
};

export const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<Category> => {
  const response = await api.put<Category>(`/categories/${id}`, categoryData);
  return response.data;
};

export const deleteCategory = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/categories/${id}`);
  return response.data;
};

// ==================== CART ====================

export const getCart = async (): Promise<CartItem[]> => {
  const response = await api.get<CartItem[]>('/cart');
  return response.data;
};

export const addToCart = async (productId: string, quantity: number): Promise<CartItem[]> => {
  const response = await api.post<CartItem[]>('/cart', {
    productId,
    quantity,
  });
  return response.data;
};

export const updateCartItem = async (productId: string, quantity: number): Promise<CartItem[]> => {
  const response = await api.put<CartItem[]>(`/cart/${productId}`, {
    quantity,
  });
  return response.data;
};

export const removeCartItem = async (productId: string): Promise<CartItem[]> => {
  const response = await api.delete<CartItem[]>(`/cart/${productId}`);
  return response.data;
};

export const clearCart = async (): Promise<void> => {
  await api.delete('/cart');
};

// ==================== ORDERS ====================

export const createOrder = async (orderData: CreateOrderData): Promise<Order> => {
  const response = await api.post<Order>('/orders', orderData);
  return response.data;
};

export const getOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>('/orders');
  return response.data;
};

export const getOrder = async (orderId: string): Promise<Order> => {
  const response = await api.get<Order>(`/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (
  id: string,
  status: Order['status']
): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/orders/${id}/status`, { status });
  return response.data;
};

// ==================== FLASH SALES ====================

export const getFlashSales = async (): Promise<FlashSale[]> => {
  const response = await api.get<FlashSale[]>('/flash-sales');
  return response.data;
};

export const createFlashSale = async (flashSaleData: Partial<FlashSale>): Promise<FlashSale> => {
  const response = await api.post<FlashSale>('/flash-sales', flashSaleData);
  return response.data;
};

export const deleteFlashSale = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/flash-sales/${id}`);
  return response.data;
};

// ==================== VOUCHERS ====================

export const getVouchers = async (): Promise<VoucherData[]> => {
  const response = await api.get<VoucherData[]>('/vouchers');
  return response.data;
};

export const updateVoucher = async (
  id: string,
  voucherData: Partial<Omit<VoucherData, 'id' | 'usedCount' | 'discount' | 'discountValue'>>
): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/vouchers/${id}`, voucherData);
  return response.data;
};
export const deleteVoucher = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/vouchers/${id}`);
  return response.data;
};


export const createVoucher = async (
  voucherData: Partial<Omit<VoucherData, 'id' | 'usedCount' | 'discount' | 'discountValue'>>
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/vouchers', voucherData);
  return response.data;
};


export const validateVoucher = async (
  code: string,
  orderTotal: number
): Promise<VoucherValidationResult> => {
  const response = await api.post<VoucherValidationResult>('/vouchers/validate', {
    code,
    orderTotal,
  });
  return response.data;
};


// ==================== BANNERS ====================

export const getBanners = async (): Promise<BannerSlide[]> => {
  const response = await api.get<BannerSlide[]>('/banners');
  return response.data;
};

export const createBanner = async (bannerData: Partial<BannerSlide>): Promise<BannerSlide> => {
  const response = await api.post<BannerSlide>('/banners', bannerData);
  return response.data;
};

export const deleteBanner = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/banners/${id}`);
  return response.data;
};

// ==================== ADMIN ====================

export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/admin/users');
  return response.data;
};

export const toggleUserStatus = async (userId: string): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/admin/users/${userId}/toggle-status`);
  return response.data;
};

export const getAllOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>('/admin/orders');
  return response.data;
};

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get<AdminStats>('/admin/stats');
  return response.data;
};

// ==================== USER ====================

export interface UpdateUserProfileData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
}

/**
 * Récupérer les infos utilisateur (profil, points fidélité)
 */
export const getUserInfo = async (): Promise<{
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  loyaltyPoints: number;
}> => {
  const response = await api.get('/user');
  return response.data;
};

/**
 * Modifier le profil utilisateur
 */
export const updateUserProfile = async (
  data: UpdateUserProfileData
): Promise<{ message: string }> => {
  const response = await api.put('/user', data);
  return response.data;
};

/**
 * Récupérer les commandes de l'utilisateur
 */
export const getUserOrders = async (): Promise<Order[]> => {
  const response = await api.get('/user/orders');
  return response.data;
};
// Récupérer tous les utilisateurs (admin)
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/admin/users');
  return response.data;
};

// Mettre à jour un utilisateur (admin)
export const updateUser = async (
  id: string,
  userData: Partial<{ name: string; email: string; phone?: string; address?: string; password?: string }>
): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/admin/users/${id}`, userData);
  return response.data;
};

export const createUser = async (
  userData: Partial<{ name: string; email: string; phone?: string; address?: string; password?: string }>
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/admin/users`, userData);
  return response.data;
};

// ==================== UTILITY ====================


// ==================== UTILITY ====================

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export default api;
