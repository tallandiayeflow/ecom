import {
  addToCart as apiAddToCart,
  clearCart as apiClearCart,
  updateCartItem as apiUpdateCartItem,
  getCart
} from '@/lib/api';
import { CartItem, Product } from '@/types';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setCart([]);
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      const cartData = await getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Error loading cart:', error);
      // Si l'utilisateur n'est pas connecté, initialiser un panier vide
      setCart([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (product: Product, quantity: number = 1) => {
    try {
      setIsLoading(true);
      const updatedCart = await apiAddToCart(product.id, quantity);
      setCart(updatedCart);
      toast.success(`${product.name} ajouté au panier 🛒`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'ajout au panier';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      setIsLoading(true);
      const updatedCart = await apiUpdateCartItem(productId, quantity);
      setCart(updatedCart);
      toast.success('Quantité mise à jour ✅');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      setIsLoading(true);
      const updatedCart = await apiUpdateCartItem(productId, 0);
      setCart(updatedCart);
      toast.success('Produit retiré du panier 🗑️');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la suppression';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setIsLoading(true);
      await apiClearCart();
      setCart([]);
      toast.success('Panier vidé');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Erreur lors du vidage du panier';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCart = async () => {
    await loadCart();
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        cartCount, 
        cartTotal, 
        isLoading,
        addToCart, 
        updateQuantity, 
        removeFromCart, 
        clearCart,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
