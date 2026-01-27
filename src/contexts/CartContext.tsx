import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stockQuantity: number;
  originalPrice?: number;
  brand: string;
  category: string;
  image_url?: string;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface CartContextType {
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;
  updateQuantity: (productId: string, quantity: number, selectedColor?: string, selectedSize?: string) => void;
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
