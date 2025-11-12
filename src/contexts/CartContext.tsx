import { addToCart as apiAddToCart, clearCart as apiClearCart, removeCartItem as apiRemoveCartItem, updateCartItem as apiUpdateCartItem, getCart } from '@/lib/api';
import { CartItem, Product } from '@/types';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Charger le panier au montage et quand l'utilisateur change
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setCart([]); // Vider le panier si déconnecté
    }
  }, [user]);

  // Charger le panier depuis l'API
  const loadCart = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const cartData = await getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Error loading cart:', error);
      // Ne pas afficher d'erreur si l'utilisateur n'est pas connecté
      if (error.response?.status !== 401) {
        toast.error('Erreur lors du chargement du panier');
      }
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un produit au panier
  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour ajouter des produits au panier');
      return;
    }

    try {
      setLoading(true);
      const updatedCart = await apiAddToCart(product.id, quantity);
      setCart(updatedCart);
      toast.success(`${product.name} ajouté au panier 🛒`);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'ajout au panier';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour la quantité d'un produit
  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    try {
      setLoading(true);
      
      if (quantity === 0) {
        await removeFromCart(productId);
        return;
      }

      const updatedCart = await apiUpdateCartItem(productId, quantity);
      setCart(updatedCart);
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast.error('Erreur lors de la mise à jour');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un produit du panier
  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const updatedCart = await apiRemoveCartItem(productId);
      setCart(updatedCart);
      toast.success('Produit retiré du panier');
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Vider tout le panier
  const clearCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await apiClearCart();
      setCart([]);
      toast.success('Panier vidé');
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      toast.error('Erreur lors de la suppression du panier');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir le panier
  const refreshCart = async () => {
    await loadCart();
  };

  // Calculer le nombre total d'articles
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculer le total du panier
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
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
