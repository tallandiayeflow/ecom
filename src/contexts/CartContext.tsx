import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stockQuantity: number;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  addToCart: (product: Product, quantity: number) => void;
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

  const addToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stockQuantity) }
            : item
        );
      }
      return [...prev, { productId: product.id, product, quantity }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return; // Optionnel: ne pas autoriser <1 ou supprimer ici
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, item.product.stockQuantity) }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartTotal, cartCount, updateQuantity, removeFromCart, addToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
