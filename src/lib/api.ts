import axios, { AxiosInstance } from 'axios';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://phone-backend.duckdns.org/api';

// Instance Axios configurée
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
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
  (error) => Promise.reject(error)
);

const publicPaths = ['/public/order', '/vouchers/validate', '/products'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isPublic = publicPaths.some(path => requestUrl.includes(path));
      if (!isPublic) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth';
        }
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
export interface FlashSaleResponse {
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
  order_id: 'temp';
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
  total?:number,
  finalTotal?:number,

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
  name: string,
  phone:string
): Promise<LoginResponse> => {
  const response = await api.post('/auth/register', {
    email,
    password,
    name,
    phone
  });
  return response.data;
};

export const login = async (
  identifier: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', {
    identifier,
    password,
  });
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get('/auth/me');
  return response.data;
};

/*export const forgotPassword = async (
  email: string
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/reset-password', {
    email,
  });
  return response.data;
};

export const changePassword = async (
  token: string,
  newPassword: string
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/auth/change-password', {
    token,
    newPassword,
  });
  return response.data;
};*/

/**
 * Demande de réinitialisation de mot de passe
 * Envoie un email avec un lien de réinitialisation
 */
export const requestPasswordReset = async (
  email: string
): Promise<{ message: string }> => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Vérifie la validité d'un token de réinitialisation
 */
export const verifyResetToken = async (
  token: string
): Promise<{ valid: boolean }> => {
  const response = await api.post('/auth/verify-reset-token', { token });
  return response.data;
};

/**
 * Réinitialise le mot de passe avec un token
 */
export const resetPassword = async (
  token: string,
  newPassword?: string
): Promise<{ message: string; email?: string }> => {
  const response = await api.post('/auth/reset-password', {
    token,
    newPassword,
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

export const getProducts = async (
  filters?: ProductFilters
): Promise<ProductsResponse> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.minPrice !== undefined)
    params.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice !== undefined)
    params.append('maxPrice', filters.maxPrice.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.inStock) params.append('inStock', 'true');
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/products?${params.toString()}`);
  return response.data;
};



export const getProduct = async (id: string): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (
  productData: Partial<Product>
): Promise<Product> => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (
  id: string,
  productData: Partial<Product>
): Promise<Product> => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (
  id: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

// ==================== CATEGORIES ====================
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/categories');
  return response.data;
};

export const createCategory = async (
  categoryData: Partial<Category>
): Promise<Category> => {
  const response = await api.post('/categories', categoryData);
  return response.data;
};

export const updateCategory = async (
  id: string,
  categoryData: Partial<Category>
): Promise<Category> => {
  const response = await api.put(`/categories/${id}`, categoryData);
  return response.data;
};

export const deleteCategory = async (
  id: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

// ==================== CART ====================
export const getCart = async (): Promise<CartItem[]> => {
  const response = await api.get('/cart');
  return response.data;
};

export const addToCart = async (
  productId: string,
  quantity: number
): Promise<CartItem> => {
  const response = await api.post('/cart', {
    productId,
    quantity,
  });
  return response.data;
};

export const updateCartItem = async (
  productId: string,
  quantity: number
): Promise<CartItem> => {
  const response = await api.put(`/cart/${productId}`, {
    quantity,
  });
  return response.data;
};

export const removeCartItem = async (
  productId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/cart/${productId}`);
  return response.data;
};

export const clearCart = async (): Promise<void> => {
  await api.delete('/cart');
};

// ==================== ORDERS ====================
export const createOrder = async (
  orderData: CreateOrderData
): Promise<Order> => {
  const response = await api.post('/orders', orderData);
  return response.data;
};

export const getOrders = async (): Promise<Order[]> => {
  const response = await api.get('/orders');
  return response.data;
};

export const getOrder = async (orderId: string): Promise<Order> => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export const deleteOrder = async (orderId: string): Promise<Order> => {
  const response = await api.delete(`/admin/orders/${orderId}`);
  return response.data;
};

export const getOrderPubic = async (orderId: string): Promise<Order> => {
  const response = await api.get(`/orders/public/order/${orderId}`);
  return response.data;
};


export const updateOrderStatus = async (
  id: string,
  status: Order['status']
): Promise<{ message: string }> => {
  const response = await api.put(`/orders/status/${id}`, { status });
  return response.data;
};

// Met à jour le statut, la méthode paiement, le statut paiement et référence d'une commande
export const updateOrderDetails = async (
  orderId: string,
  updates: {
    status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    payment_method?: string,
    payment_status?: 'pending' | 'paid' | 'failed',
    payment_reference?: string,
  }
): Promise<{ message: string }> => {
  const response = await api.put(`/admin/orders/update/${orderId}`, updates);
  return response.data;
};



// ==================== FLASH SALES ====================
export interface FlashSaleFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
}
export interface FlashSalesResponse {
  flashSales: FlashSale[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export const getFlashSales = async (
  filters?: FlashSaleFilters
): Promise<FlashSalesResponse> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.minPrice !== undefined)
    params.append('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice !== undefined)
    params.append('maxPrice', filters.maxPrice.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.inStock) params.append('inStock', 'true');
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/flash-sales?${params.toString()}`);
  return response.data as FlashSalesResponse;
};




export const getFlashSaleId = async (productId: string): Promise<FlashSale> => {
  const response = await api.get(`/flash-sales/${productId}`);
  const data = response.data;
  return Array.isArray(data) ? data[0] : data;
};


export const getFlashSalesAdmin = async (): Promise<FlashSale[]> => {
  const response = await api.get('/flash-sales/admin');
  return response.data;
};

export const createFlashSale = async (
  flashSaleData: Partial<FlashSale>
): Promise<FlashSale> => {
  const response = await api.post('/flash-sales', flashSaleData);
  return response.data;
};

export const deleteFlashSale = async (
  id: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/flash-sales/${id}`);
  return response.data;
};

// ==================== VOUCHERS ====================


// Récupérer la liste de tous les vouchers (admin)
export const getVouchers = async (): Promise<VoucherData[]> => {
  const response = await api.get('/vouchers');
  return response.data;
};

// Créer un voucher (admin)
export const createVoucher = async (voucherData: Partial<VoucherData>): Promise<{ message: string }> => {
  const response = await api.post('/vouchers', voucherData);
  return response.data;
};

// Mettre à jour un voucher par ID (admin)
export const updateVoucher = async (
  id: string,
  voucherData: Partial<VoucherData>
): Promise<{ message: string }> => {
  const response = await api.put(`/vouchers/${id}`, voucherData);
  return response.data;
};

// Supprimer un voucher par ID (admin)
export const deleteVoucher = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/vouchers/${id}`);
  return response.data;
};

// Valider un code voucher pour une commande client
export const validateVoucher = async (
  code: string,
  orderTotal: number
): Promise<VoucherValidationResult> => {
  const response = await api.post('/vouchers/validate', { code, orderTotal });
  return response.data;
};

// Echanger ses points de fidélité contre un code voucher pour une commande client

export const redeemLoyaltyPoints = async (pointsCost: number, voucherValue: number) => {
  const response = await api.post('/loyalty/redeem', {
    pointsCost,
    voucherValue
  });
  return response.data;
};

export const getUserVouchers = async () => {
  const response = await api.get('/loyalty/vouchers');
  return response.data;
};


// ==================== BANNERS ====================
export const getBanners = async (): Promise<BannerSlide[]> => {
  const response = await api.get('/banners');
  return response.data;
};

export const createBanner = async (
  bannerData: Partial<BannerSlide>
): Promise<BannerSlide> => {
  const response = await api.post('/banners', bannerData);
  return response.data;
};

export const deleteBanner = async (
  id: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/banners/${id}`);
  return response.data;
};

// ==================== ADMIN ====================
export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const toggleUserStatus = async (
  userId: string
): Promise<{ message: string }> => {
  const response = await api.put(`/admin/users/${userId}/toggle-status`);
  return response.data;
};

interface GetOrdersParams {
  date_min?: string;
  date_max?: string;
  limit?: number;
  offset?: number;
}

export const getAllOrders = async (params?: GetOrdersParams): Promise<{ orders: Order[]; total: number }> => {
  const response = await api.get('/admin/orders', { params });
  return response.data;
};

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get('/admin/stats');
  return response.data;
};

// ==================== FACTURES (Invoices) ====================
import type {
  CreateInvoiceData,
  Invoice,
  UpdateInvoiceData,
} from '@/types/invoices';

/**
 * Récupère la liste des factures avec filtres optionnels
 * @param filters InvoiceFilters optionnel
 */
export const getInvoices = async (search?: string, date?: string) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (date) params.append("date", date);

  const res = await api.get(`/factures?${params.toString()}`);
  return res.data;
};

/**
 * Récupère une facture par son ID
 */
export const getInvoice = async (id: string): Promise<Invoice> => {
  const response = await api.get(`/factures/${id}`);
  return response.data;
};

/**
 * Crée une nouvelle facture
 */
export const createInvoice = async (
  data: CreateInvoiceData
): Promise<Invoice> => {
  const response = await api.post('/factures', data);
  return response.data;
};

/**
 * Met à jour une facture existante
 */
export const updateInvoice = async (
  id: string,
  data: UpdateInvoiceData
): Promise<Invoice> => {
  const response = await api.put(`/factures/${id}`, data);
  return response.data;
};

/**
 * Supprime une facture par son ID
 */
export const deleteInvoice = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete(`/factures/${id}`);
  return response.data;
};

/**
 * Génère et télécharge le PDF d'une facture
 */
export const generateInvoicePdf = async (id: string): Promise<void> => {
  const response = await api.get(`/factures/${id}/pdf`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `facture_${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
// =====================User======================
export interface UpdateUserProfileData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
}
export const getUserInfo = async (): Promise<{
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  loyaltyPoints: number;
  code?: string;
}> => {
  const response = await api.get('/user');
  return response.data;
};

export const updateUserProfile = async (
  data: UpdateUserProfileData
): Promise<{ message: string }> => {
  const response = await api.put('/user', data);
  return response.data;
};

export const getUserOrders = async (): Promise<Order[]> => {
  const response = await api.get('/user/orders');
  return response.data;
};
// Récupérer tous les utilisateurs (admin)
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>('/admin/users');
  return response.data;
};

export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/admin/users/${id}`);
  return response.data;
} 

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
//===================== Gestion des stock =====================
// ==================== TYPES POUR STOCK ====================
export interface StockStats {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
}

export interface StockAlert {
  id: string;
  name: string;
  stock: number;
  imageUrl: string;
  price: number;
  status: 'low' | 'out';
}

export interface StockAlerts {
  lowStockCount: number;
  outOfStockCount: number;
  alerts: StockAlert[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  stockValue: number;
  imageUrl: string;
  stockStatus: 'out_of_stock' | 'low_stock' | 'medium_stock' | 'good_stock';
}

export interface InventoryResponse {
  inventory: InventoryItem[];
  items: InventoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  type: 'in' | 'out' | 'return' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  user: string;
  date: string;
  createdAt?: string;
}

export interface StockMovementsResponse {
  movements: StockMovement[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateStockMovementRequest {
  productId: string;
  type: 'in' | 'out' | 'return' | 'adjustment';
  quantity: number;
  reason?: string;
}

export interface CreateStockMovementResponse {
  id: string;
  message: string;
  previousStock: number;
  newStock: number;
}

export interface UpdateProductStockRequest {
  stock: number;
  reason?: string;
}

export interface UpdateProductStockResponse {
  message: string;
  productName: string;
  previousStock: number;
  newStock: number;
}

// ==================== API ENDPOINTS STOCK ====================
export const stock = {
  // GET /api/stock/stats - Obtenir les statistiques globales du stock
  getStats: async (): Promise<StockStats> => {
    const { data } = await api.get<StockStats>('/stock/stats');
    return data;
  },

  // GET /api/stock/alerts - Obtenir les alertes de stock
  getAlerts: async (): Promise<StockAlerts> => {
    const { data } = await api.get<StockAlerts>('/stock/alerts');
    return data;
  },

  // GET /api/stock/inventory - Obtenir l'inventaire complet
  getInventory: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<InventoryResponse> => {
    const { data } = await api.get<InventoryResponse>('/stock/inventory', { params });
    return data;
  },

  // GET /api/stock/movements - Obtenir l'historique des mouvements de stock
  getMovements: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<StockMovementsResponse> => {
    const { data } = await api.get<StockMovementsResponse>('/stock/movements', { params });
    return data;
  },

  // POST /api/stock/movements - Créer un mouvement de stock
  createMovement: async (
    movement: CreateStockMovementRequest
  ): Promise<CreateStockMovementResponse> => {
    const { data } = await api.post<CreateStockMovementResponse>(
      '/stock/movements',
      movement
    );
    return data;
  },

  // PATCH /api/stock/products/:id - Mettre à jour le stock d'un produit
  updateProductStock: async (
    productId: string,
    stockData: UpdateProductStockRequest
  ): Promise<UpdateProductStockResponse> => {
    const { data } = await api.patch<UpdateProductStockResponse>(
      `/stock/products/${productId}`,
      stockData
    );
    return data;
  },

  // DELETE /api/stock/movements/:id - Supprimer un mouvement de stock
  deleteMovement: async (movementId: string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(
      `/stock/movements/${movementId}`
    );
    return data;
  },
};
// Dans votre fichier api.tsx

export interface CreateFactureRequest {
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string | null;
  type: 'sale' | 'purchase';
  items: {
    product_id: string;
    product_name: string;
    product_image: string;
    unit_price: number;
    quantity: number;
    total: number;
  }[];
}

export interface CreateFactureResponse {
  id: string;
  invoice_number: string;
  message: string;
}

export interface UserVisit {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  visit_date: string;
}

export interface VisitsFilters {
  user_id?: string;
  date_min?: string;
  date_max?: string;
}

export interface GenericMessageResponse {
  message: string;
}

export interface VisitsStats {
  total_visits: number;
  today_visits: number;
}

// Enregistrer la visite de l’utilisateur connecté
export const registerVisit = async (): Promise<GenericMessageResponse> => {
  const response = await api.post('/visits');
  return response.data;
};

// Valider manuellement une visite par code utilisateur (admin)
export const validateVisitByCode = async (data: { user_code: string }): Promise<GenericMessageResponse> => {
  const response = await api.post('/visits/validate', data);
  return response.data;
};

// Récupérer l’historique des visites avec filtres optionnels (admin)
export const getVisits = async (filters?: VisitsFilters): Promise<UserVisit[]> => {
  const params = new URLSearchParams();
  if (filters?.user_id) params.append('user_id', filters.user_id);
  if (filters?.date_min) params.append('date_min', filters.date_min);
  if (filters?.date_max) params.append('date_max', filters.date_max);

  const response = await api.get('/visits', { params });
  return response.data;
};

// Exporter les visites filtrées au format CSV (admin)
export const exportVisitsCsv = async (filters?: VisitsFilters): Promise<Blob> => {
  const params = new URLSearchParams();
  if (filters?.user_id) params.append('user_id', filters.user_id);
  if (filters?.date_min) params.append('date_min', filters.date_min);
  if (filters?.date_max) params.append('date_max', filters.date_max);

  const response = await api.get('/visits/export', { params, responseType: 'blob' });
  return response.data;
};

// Obtenir les statistiques globales des visites (admin)
export const getVisitsStats = async (): Promise<VisitsStats> => {
  const response = await api.get('/visits/stats');
  return response.data;
};
//=================== ENDPOINTS Paytech====================


import type { JobApplication, PaytechPaymentRequest, PaytechPaymentResponse } from '@/types';

/**
 * Initialise la demande de paiement PayTech
 * @param data Données de paiement conformes à CreateOrderData + payment_method, user_id optionnel
 * @returns Réponse contenant succès et URL redirection
 */
export const requestPaytechPayment = async (
  data: CreateOrderData & PaytechPaymentRequest & { user_id?: string }
): Promise<PaytechPaymentResponse> => {
  const response = await api.post<PaytechPaymentResponse>('/payments/request-payment', data);
  return response.data;
};



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

export const submitJobApplication = async (formData: FormData) => {
  const response = await api.post('/jobs/apply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getAllJobs = async (params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  jobs: JobApplication[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  const response = await api.get(`/jobs/admin/jobs?${searchParams.toString()}`);
  return response.data;
};

export const downloadJobCV = async (jobId: string) => {
  const response = await api.get(`/jobs/admin/jobs/${jobId}/download`, {
    responseType: 'blob'
  });
  const blob = response.data;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CV_${jobId.slice(0, 8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return blob;
};

export const updateJobStatus = async (
  jobId: string,
  status: 'accepted' | 'rejected',
  notes?: string
): Promise<{ message: string }> => {
  const response = await api.put(`/admin/jobs/${jobId}/status`, { status, admin_notes: notes });
  return response.data;
};

export const deleteJob = async (jobId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/jobs/admin/jobs/${jobId}`);
  return response.data;
};



// Endpoints factures
export const factures = {
  // GET /api/factures - Liste toutes les factures
  getAllInvoices: async (): Promise<Invoice[]> => {
    const { data } = await api.get<Invoice[]>('/factures');
    return data;
  },

  // GET /api/factures/:id - Détails d'une facture
  getInvoice: async (invoiceId: string): Promise<Invoice> => {
    const { data } = await api.get<Invoice>(`/factures/${invoiceId}`);
    return data;
  },

  // POST /api/factures - Créer une facture
  createInvoice: async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
    const { data } = await api.post<Invoice>('/factures', invoiceData);
    return data;
  },

  // PUT /api/factures/:id - Mettre à jour une facture
  updateInvoice: async (
    invoiceId: string,
    updates: {
      status?: 'paid' | 'pending' | 'cancelled';
      paymentMethod?: 'cash_on_delivery' | 'card' | 'bank_transfer' | 'other';
      notes?: string;
    }
  ): Promise<Invoice> => {
    const { data } = await api.put<Invoice>(`/factures/${invoiceId}`, updates);
    return data;
  },

  // DELETE /api/factures/:id - Supprimer une facture
  deleteInvoice: async (invoiceId: string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(`/factures/${invoiceId}`);
    return data;
  },

  downloadIncvoicePdf: async (invoiceId: string): Promise<void> => {
    const response = await api.get(`/factures/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
  },
};




export default api;




