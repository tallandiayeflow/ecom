import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { Product, CartItem } from '@/types';

interface CartContextType {
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  updateQuantity: (productId: string, quantity: number, selectedColor?: string, selectedSize?: string) => void;
  updateVariant: (productId: string, oldColor?: string, oldSize?: string, newColor?: string, newSize?: string) => void;
  removeFromCart: (productId: string, selectedColor?: string, selectedSize?: string) => void;
  addToCart: (product: Product, quantity: number, selectedColor?: string, selectedSize?: string) => void;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    // Optionnel: Charger le panier depuis localStorage à l'initialisation
    const savedCart = localStorage.getItem('cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    // Optionnel: Sauvegarder le panier dans localStorage à chaque changement
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (
    product: Product,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
      );

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize
            ? {
              ...item,
              quantity: Math.min(item.quantity + quantity, product.stockQuantity),
            }
            : item
        );
      }

      return [
        ...prev,
        { productId: product.id, product, quantity, selectedColor, selectedSize },
      ];
    });
  };


  const updateQuantity = (
    productId: string,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    if (quantity < 1) return;

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId &&
          item.selectedColor === selectedColor &&
          item.selectedSize === selectedSize
          ? { ...item, quantity: Math.min(quantity, item.product.stockQuantity) }
          : item
      )
    );
  };

  const updateVariant = (
    productId: string,
    oldColor?: string,
    oldSize?: string,
    newColor?: string,
    newSize?: string
  ) => {
    setCart((prev) => {
      // 1. Find the item we want to update
      const targetItem = prev.find(
        (item) =>
          item.productId === productId &&
          item.selectedColor === oldColor &&
          item.selectedSize === oldSize
      );

      if (!targetItem) return prev;

      // 2. Check if an item with the NEW variant already exists
      const existingNewVariant = prev.find(
        (item) =>
          item.productId === productId &&
          item.selectedColor === newColor &&
          item.selectedSize === newSize
      );

      if (existingNewVariant && existingNewVariant !== targetItem) {
        // Merge them
        return prev
          .filter((item) => item !== targetItem) // Remove old variant
          .map((item) =>
            item === existingNewVariant
              ? {
                ...item,
                quantity: Math.min(
                  item.quantity + targetItem.quantity,
                  item.product.stockQuantity
                ),
              }
              : item
          );
      }

      // 3. Just update the variant if no merge needed
      return prev.map((item) =>
        item === targetItem
          ? { ...item, selectedColor: newColor, selectedSize: newSize }
          : item
      );
    });
  };

  const removeFromCart = (
    productId: string,
    selectedColor?: string,
    selectedSize?: string
  ) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize
          )
      )
    );
  };


  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartTotal, cartCount, updateQuantity, updateVariant, removeFromCart, addToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
