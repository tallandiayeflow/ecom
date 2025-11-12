import axios, { AxiosInstance } from 'axios';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Instance Axios configurée
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes
});

// ==================== INTERCEPTORS ====================

// Ajouter automatiquement le token JWT à chaque requête
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

// Gérer les erreurs globales et le token expiré
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide - rediriger vers login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== TYPES (importés de @/types) ====================

import type {
  BannerSlide,
  CartItem,
  Category,
  FlashSale,
  Order,
  Product,
  User,
  Voucher,
} from '@/types';

// Types de réponse spécifiques
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

// ==================== AUTH ENDPOINTS ====================

/**
 * Inscription d'un nouvel utilisateur
 */
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

/**
 * Connexion utilisateur
 */
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

/**
 * Obtenir l'utilisateur actuellement connecté
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};

/**
 * Réinitialiser le mot de passe
 */
export const resetPassword = async (email: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/reset-password', {
    email,
  });
  return response.data;
};

// ==================== PRODUCTS ENDPOINTS ====================

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Obtenir la liste des produits avec filtres
 */
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

/**
 * Obtenir les détails d'un produit
 */
export const getProduct = async (id: string): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
};

/**
 * Créer un nouveau produit (Admin uniquement)
 */
export const createProduct = async (productData: Partial<Product>): Promise<Product> => {
  const response = await api.post<Product>('/products', productData);
  return response.data;
};

/**
 * Mettre à jour un produit (Admin uniquement)
 */
export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  const response = await api.put<Product>(`/products/${id}`, productData);
  return response.data;
};

/**
 * Supprimer un produit (Admin uniquement)
 */
export const deleteProduct = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/products/${id}`);
  return response.data;
};

// ==================== CATEGORIES ENDPOINTS ====================

/**
 * Obtenir toutes les catégories
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>('/categories');
  return response.data;
};

/**
 * Créer une catégorie (Admin uniquement)
 */
export const createCategory = async (categoryData: Partial<Category>): Promise<Category> => {
  const response = await api.post<Category>('/categories', categoryData);
  return response.data;
};

/**
 * Mettre à jour une catégorie (Admin uniquement)
 */
export const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<Category> => {
  const response = await api.put<Category>(`/categories/${id}`, categoryData);
  return response.data;
};

/**
 * Supprimer une catégorie (Admin uniquement)
 */
export const deleteCategory = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/categories/${id}`);
  return response.data;
};

// ==================== CART ENDPOINTS ====================

/**
 * Obtenir le panier de l'utilisateur
 */
export const getCart = async (): Promise<CartItem[]> => {
  const response = await api.get<CartItem[]>('/cart');
  return response.data;
};

/**
 * Ajouter un produit au panier
 */
export const addToCart = async (productId: string, quantity: number = 1): Promise<CartItem[]> => {
  const response = await api.post<CartItem[]>('/cart', {
    productId,
    quantity,
  });
  return response.data;
};

/**
 * Mettre à jour la quantité d'un produit dans le panier
 */
export const updateCartItem = async (productId: string, quantity: number): Promise<CartItem[]> => {
  if (quantity === 0) {
    // Si quantité = 0, supprimer l'article
    return await removeFromCart(productId);
  }
  
  const response = await api.put<CartItem[]>(`/cart/${productId}`, { quantity });
  return response.data;
};

/**
 * Retirer un produit du panier
 */
export const removeFromCart = async (productId: string): Promise<CartItem[]> => {
  const response = await api.delete<CartItem[]>(`/cart/${productId}`);
  return response.data;
};

/**
 * Vider complètement le panier
 */
export const clearCart = async (): Promise<void> => {
  await api.delete('/cart');
};

// ==================== ORDERS ENDPOINTS ====================

export interface CreateOrderData {
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  voucherCode?: string;
  useLoyaltyPoints?: boolean;
}

/**
 * Obtenir les commandes de l'utilisateur
 */
export const getOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>('/orders');
  return response.data;
};

/**
 * Obtenir les détails d'une commande
 */
export const getOrder = async (id: string): Promise<Order> => {
  const response = await api.get<Order>(`/orders/${id}`);
  return response.data;
};

/**
 * Créer une nouvelle commande
 */
export const createOrder = async (orderData: CreateOrderData): Promise<Order> => {
  const response = await api.post<Order>('/orders', orderData);
  return response.data;
};

/**
 * Mettre à jour le statut d'une commande (Admin uniquement)
 */
export const updateOrderStatus = async (
  id: string,
  status: Order['status']
): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/orders/${id}/status`, { status });
  return response.data;
};

// ==================== FLASH SALES ENDPOINTS ====================

/**
 * Obtenir les ventes flash actives
 */
export const getFlashSales = async (): Promise<FlashSale[]> => {
  const response = await api.get<FlashSale[]>('/flash-sales');
  return response.data;
};

/**
 * Créer une vente flash (Admin uniquement)
 */
export const createFlashSale = async (flashSaleData: Partial<FlashSale>): Promise<FlashSale> => {
  const response = await api.post<FlashSale>('/flash-sales', flashSaleData);
  return response.data;
};

/**
 * Supprimer une vente flash (Admin uniquement)
 */
export const deleteFlashSale = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/flash-sales/${id}`);
  return response.data;
};

// ==================== VOUCHERS ENDPOINTS ====================

/**
 * Obtenir les vouchers disponibles
 */
export const getVouchers = async (): Promise<Voucher[]> => {
  const response = await api.get<Voucher[]>('/vouchers');
  return response.data;
};

/**
 * Valider un code voucher
 */
export const validateVoucher = async (
  code: string,
  orderTotal: number
): Promise<{ valid: boolean; discount: number; message: string }> => {
  const response = await api.post<{ valid: boolean; discount: number; message: string }>(
    '/vouchers/validate',
    { code, orderTotal }
  );
  return response.data;
};

/**
 * Créer un voucher (Admin uniquement)
 */
export const createVoucher = async (voucherData: Partial<Voucher>): Promise<Voucher> => {
  const response = await api.post<Voucher>('/vouchers', voucherData);
  return response.data;
};

// ==================== BANNERS ENDPOINTS ====================

/**
 * Obtenir les bannières actives
 */
export const getBanners = async (): Promise<BannerSlide[]> => {
  const response = await api.get<BannerSlide[]>('/banners');
  return response.data;
};

/**
 * Créer une bannière (Admin uniquement)
 */
export const createBanner = async (bannerData: Partial<BannerSlide>): Promise<BannerSlide> => {
  const response = await api.post<BannerSlide>('/banners', bannerData);
  return response.data;
};

/**
 * Supprimer une bannière (Admin uniquement)
 */
export const deleteBanner = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/banners/${id}`);
  return response.data;
};

// ==================== ADMIN ENDPOINTS ====================

export interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

/**
 * Obtenir tous les utilisateurs (Admin uniquement)
 */
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/admin/users');
  return response.data;
};

/**
 * Activer/Désactiver un utilisateur (Admin uniquement)
 */
export const toggleUserStatus = async (userId: string): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/admin/users/${userId}/toggle-status`);
  return response.data;
};

/**
 * Obtenir toutes les commandes (Admin uniquement)
 */
export const getAllOrders = async (): Promise<Order[]> => {
  const response = await api.get<Order[]>('/admin/orders');
  return response.data;
};

/**
 * Obtenir les statistiques (Admin uniquement)
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get<AdminStats>('/admin/stats');
  return response.data;
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Vérifier si l'utilisateur est authentifié
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

/**
 * Obtenir le token stocké
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Déconnexion (nettoyer le localStorage)
 */
export const logout = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Export par défaut de l'instance axios
export default api;
