/**
 * API Endpoints for Phone Shop
 * This file contains all API endpoint definitions for easy backend integration
 * Currently using mock data - replace with actual API calls when backend is ready
 */

import { User, Product, Category, Order, CartItem, FlashSale, Voucher, BannerSlide } from '@/types';
import { mockProducts, mockCategories, mockFlashSales, mockBanners, mockUsers, mockOrders } from './mockData';

// ===========================
// AUTH ENDPOINTS
// ===========================

/**
 * POST /auth/register
 * Register a new user
 * @param email - User email
 * @param password - User password
 * @param name - User full name
 */
export const register = async (email: string, password: string, name: string): Promise<User> => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 500));
  const newUser: User = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    name,
    role: 'user',
    loyaltyPoints: 0,
    createdAt: new Date().toISOString(),
    isActive: true,
  };
  return newUser;
};

/**
 * POST /auth/login
 * Login user
 * @param email - User email
 * @param password - User password
 */
export const login = async (email: string, password: string): Promise<{ user: User; token: string }> => {
  // Mock implementation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Demo accounts
  if (email === 'admin@demo.com' && password === 'admin123') {
    return {
      user: mockUsers.find(u => u.role === 'admin')!,
      token: 'mock-admin-token',
    };
  }
  
  if (email === 'user@demo.com' && password === 'user123') {
    return {
      user: mockUsers.find(u => u.role === 'user')!,
      token: 'mock-user-token',
    };
  }
  
  throw new Error('Invalid credentials');
};

/**
 * POST /auth/reset-password
 * Request password reset
 * @param email - User email
 */
export const resetPassword = async (email: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
};

/**
 * GET /auth/me
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockUsers[1]; // Return demo user
};

// ===========================
// PRODUCTS ENDPOINTS
// ===========================

/**
 * GET /products
 * Get all products with filters
 * @param params - Filter parameters (category, minPrice, maxPrice, search, inStock)
 */
export const getProducts = async (params?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let filtered = [...mockProducts];
  
  if (params?.category) {
    filtered = filtered.filter(p => p.category === params.category);
  }
  if (params?.minPrice) {
    filtered = filtered.filter(p => p.price >= params.minPrice!);
  }
  if (params?.maxPrice) {
    filtered = filtered.filter(p => p.price <= params.maxPrice!);
  }
  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.description.toLowerCase().includes(search)
    );
  }
  if (params?.inStock !== undefined) {
    filtered = filtered.filter(p => p.inStock === params.inStock);
  }
  
  const page = params?.page || 1;
  const limit = params?.limit || 12;
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    products: filtered.slice(start, end),
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit),
  };
};

/**
 * GET /products/:id
 * Get single product by ID
 * @param id - Product ID
 */
export const getProduct = async (id: string): Promise<Product> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const product = mockProducts.find(p => p.id === id);
  if (!product) throw new Error('Product not found');
  return product;
};

/**
 * POST /products
 * Create new product (Admin only)
 * @param product - Product data
 */
export const createProduct = async (product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const newProduct: Product = {
    ...product,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
  };
  mockProducts.push(newProduct);
  return newProduct;
};

/**
 * PUT /products/:id
 * Update product (Admin only)
 * @param id - Product ID
 * @param updates - Product updates
 */
export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const index = mockProducts.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Product not found');
  mockProducts[index] = { ...mockProducts[index], ...updates };
  return mockProducts[index];
};

/**
 * DELETE /products/:id
 * Delete product (Admin only)
 * @param id - Product ID
 */
export const deleteProduct = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockProducts.findIndex(p => p.id === id);
  if (index !== -1) {
    mockProducts.splice(index, 1);
  }
};

// ===========================
// CATEGORIES ENDPOINTS
// ===========================

/**
 * GET /categories
 * Get all categories
 */
export const getCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockCategories;
};

/**
 * POST /categories
 * Create new category (Admin only)
 * @param category - Category data
 */
export const createCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const newCategory: Category = {
    ...category,
    id: Math.random().toString(36).substr(2, 9),
  };
  mockCategories.push(newCategory);
  return newCategory;
};

/**
 * PUT /categories/:id
 * Update category (Admin only)
 */
export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockCategories.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Category not found');
  mockCategories[index] = { ...mockCategories[index], ...updates };
  return mockCategories[index];
};

/**
 * DELETE /categories/:id
 * Delete category (Admin only)
 */
export const deleteCategory = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const index = mockCategories.findIndex(c => c.id === id);
  if (index !== -1) {
    mockCategories.splice(index, 1);
  }
};

// ===========================
// CART ENDPOINTS
// ===========================

/**
 * GET /cart
 * Get user's cart
 */
export const getCart = async (): Promise<CartItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  // Return from localStorage or empty array
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
};

/**
 * POST /cart/add
 * Add item to cart
 * @param productId - Product ID
 * @param quantity - Quantity to add
 */
export const addToCart = async (productId: string, quantity: number): Promise<CartItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const cart = await getCart();
  const existingItem = cart.find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    const product = await getProduct(productId);
    cart.push({ productId, quantity, product });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  return cart;
};

/**
 * PUT /cart/update
 * Update cart item quantity
 * @param productId - Product ID
 * @param quantity - New quantity
 */
export const updateCartItem = async (productId: string, quantity: number): Promise<CartItem[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const cart = await getCart();
  const item = cart.find(item => item.productId === productId);
  
  if (item) {
    if (quantity === 0) {
      const filtered = cart.filter(item => item.productId !== productId);
      localStorage.setItem('cart', JSON.stringify(filtered));
      return filtered;
    }
    item.quantity = quantity;
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  return cart;
};

/**
 * POST /cart/clear
 * Clear entire cart
 */
export const clearCart = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  localStorage.removeItem('cart');
};

// ===========================
// ORDERS ENDPOINTS
// ===========================

/**
 * POST /orders
 * Create new order
 * @param orderData - Order data
 */
export const createOrder = async (orderData: {
  items: CartItem[];
  total: number;
  shippingAddress: Order['shippingAddress'];
  voucherCode?: string;
}): Promise<Order> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const loyaltyPointsEarned = Math.floor(orderData.total / 10);
  
  const order: Order = {
    id: Math.random().toString(36).substr(2, 9).toUpperCase(),
    userId: 'current-user-id',
    items: orderData.items,
    total: orderData.total,
    discount: 0,
    finalTotal: orderData.total,
    status: 'pending',
    shippingAddress: orderData.shippingAddress,
    voucherCode: orderData.voucherCode,
    loyaltyPointsEarned,
    qrCode: `ORDER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockOrders.push(order);
  return order;
};

/**
 * GET /orders/:id
 * Get order by ID
 * @param id - Order ID
 */
export const getOrder = async (id: string): Promise<Order> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const order = mockOrders.find(o => o.id === id);
  if (!order) throw new Error('Order not found');
  return order;
};

/**
 * GET /orders/user/:id
 * Get user's order history
 * @param userId - User ID
 */
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockOrders.filter(o => o.userId === userId);
};

/**
 * PUT /orders/:id/status
 * Update order status (Admin only)
 * @param id - Order ID
 * @param status - New status
 */
export const updateOrderStatus = async (id: string, status: Order['status']): Promise<Order> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const order = mockOrders.find(o => o.id === id);
  if (!order) throw new Error('Order not found');
  order.status = status;
  order.updatedAt = new Date().toISOString();
  return order;
};

// ===========================
// FLASH SALES ENDPOINTS
// ===========================

/**
 * GET /flash-sales
 * Get all active flash sales
 */
export const getFlashSales = async (): Promise<FlashSale[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockFlashSales.filter(fs => fs.isActive);
};

/**
 * POST /flash-sales
 * Create flash sale (Admin only)
 * @param flashSale - Flash sale data
 */
export const createFlashSale = async (flashSale: Omit<FlashSale, 'id' | 'product'>): Promise<FlashSale> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const product = await getProduct(flashSale.productId);
  const newFlashSale: FlashSale = {
    ...flashSale,
    id: Math.random().toString(36).substr(2, 9),
    product,
  };
  mockFlashSales.push(newFlashSale);
  return newFlashSale;
};

/**
 * DELETE /flash-sales/:id
 * Delete flash sale (Admin only)
 */
export const deleteFlashSale = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const index = mockFlashSales.findIndex(fs => fs.id === id);
  if (index !== -1) {
    mockFlashSales.splice(index, 1);
  }
};

// ===========================
// BANNER ENDPOINTS
// ===========================

/**
 * GET /banner
 * Get all banner slides
 */
export const getBanners = async (): Promise<BannerSlide[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return mockBanners.filter(b => b.isActive).sort((a, b) => a.order - b.order);
};

/**
 * POST /banner
 * Add product to banner (Admin only)
 * @param banner - Banner data
 */
export const createBanner = async (banner: Omit<BannerSlide, 'id' | 'product'>): Promise<BannerSlide> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const product = await getProduct(banner.productId);
  const newBanner: BannerSlide = {
    ...banner,
    id: Math.random().toString(36).substr(2, 9),
    product,
  };
  mockBanners.push(newBanner);
  return newBanner;
};

/**
 * DELETE /banner/:id
 * Remove banner slide (Admin only)
 */
export const deleteBanner = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const index = mockBanners.findIndex(b => b.id === id);
  if (index !== -1) {
    mockBanners.splice(index, 1);
  }
};

// ===========================
// VOUCHERS ENDPOINTS
// ===========================

/**
 * POST /vouchers/generate
 * Generate new voucher (Admin only)
 * @param voucher - Voucher data
 */
export const generateVoucher = async (voucher: Omit<Voucher, 'id' | 'usedCount' | 'createdAt'>): Promise<Voucher> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const newVoucher: Voucher = {
    ...voucher,
    id: Math.random().toString(36).substr(2, 9),
    usedCount: 0,
    createdAt: new Date().toISOString(),
  };
  return newVoucher;
};

/**
 * POST /vouchers/validate
 * Validate voucher code
 * @param code - Voucher code
 * @param orderTotal - Order total amount
 */
export const validateVoucher = async (code: string, orderTotal: number): Promise<{
  valid: boolean;
  discount: number;
  message: string;
}> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock validation
  if (code === 'WELCOME10') {
    if (orderTotal >= 100) {
      return { valid: true, discount: orderTotal * 0.1, message: '10% discount applied' };
    }
    return { valid: false, discount: 0, message: 'Minimum purchase of $100 required' };
  }
  
  return { valid: false, discount: 0, message: 'Invalid voucher code' };
};

/**
 * GET /vouchers/user/:id
 * Get user's available vouchers
 */
export const getUserVouchers = async (userId: string): Promise<Voucher[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [];
};

// ===========================
// LOYALTY POINTS ENDPOINTS
// ===========================

/**
 * GET /loyalty/:userId
 * Get user's loyalty points
 */
export const getLoyaltyPoints = async (userId: string): Promise<number> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  const user = mockUsers.find(u => u.id === userId);
  return user?.loyaltyPoints || 0;
};

// ===========================
// USERS ENDPOINTS (Admin)
// ===========================

/**
 * GET /users
 * Get all users (Admin only)
 */
export const getAllUsers = async (): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockUsers;
};

/**
 * PUT /users/:id/toggle
 * Toggle user active status (Admin only)
 */
export const toggleUserStatus = async (id: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const user = mockUsers.find(u => u.id === id);
  if (!user) throw new Error('User not found');
  user.isActive = !user.isActive;
  return user;
};

/**
 * GET /orders
 * Get all orders (Admin only)
 */
export const getAllOrders = async (): Promise<Order[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockOrders;
};
