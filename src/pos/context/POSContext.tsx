import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { CurrentSession, POSProduct } from '../db/posDB';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productBarcode?: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  lineTotal: number;
  image?: string;
}

export interface POSUser {
  id: string;
  name: string;
  role: 'cashier' | 'admin';
}

interface POSState {
  user: POSUser | null;
  session: CurrentSession | null;
  cart: CartItem[];
  isOnline: boolean;
  pendingCount: number;
}

type POSAction =
  | { type: 'SET_USER'; payload: POSUser | null }
  | { type: 'SET_SESSION'; payload: CurrentSession | null }
  | { type: 'ADD_TO_CART'; payload: POSProduct }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'SET_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SET_PENDING_COUNT'; payload: number };

function posReducer(state: POSState, action: POSAction): POSState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'ADD_TO_CART': {
      const product = action.payload;
      const existing = state.cart.find(i => i.productId === product.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(i =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.unitPrice }
              : i
          ),
        };
      }
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        productId: product.id,
        productName: product.name,
        productBarcode: product.barcode ?? undefined,
        unitPrice: product.price,
        quantity: 1,
        discount: 0,
        lineTotal: product.price,
        image: product.image ?? undefined,
      };
      return { ...state, cart: [...state.cart, newItem] };
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(i => i.productId !== action.payload) };
    case 'SET_QUANTITY': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return { ...state, cart: state.cart.filter(i => i.productId !== productId) };
      }
      return {
        ...state,
        cart: state.cart.map(i =>
          i.productId === productId
            ? { ...i, quantity, lineTotal: quantity * i.unitPrice }
            : i
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    case 'SET_PENDING_COUNT':
      return { ...state, pendingCount: action.payload };
    default:
      return state;
  }
}

interface POSContextValue {
  state: POSState;
  setUser: (user: POSUser | null) => void;
  setSession: (session: CurrentSession | null) => void;
  addToCart: (product: POSProduct) => void;
  removeFromCart: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setOnline: (online: boolean) => void;
  setPendingCount: (n: number) => void;
  cartTotal: number;
  cartSubtotal: number;
}

const POSContext = createContext<POSContextValue | null>(null);

export function POSProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(posReducer, {
    user: (() => {
      try {
        const u = localStorage.getItem('pos_user');
        return u ? JSON.parse(u) : null;
      } catch { return null; }
    })(),
    session: null,
    cart: [],
    isOnline: navigator.onLine,
    pendingCount: 0,
  });

  const setUser = useCallback((user: POSUser | null) => {
    dispatch({ type: 'SET_USER', payload: user });
  }, []);
  const setSession = useCallback((session: CurrentSession | null) => {
    dispatch({ type: 'SET_SESSION', payload: session });
  }, []);
  const addToCart = useCallback((product: POSProduct) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  }, []);
  const removeFromCart = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  }, []);
  const setQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'SET_QUANTITY', payload: { productId, quantity } });
  }, []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), []);
  const setOnline = useCallback((online: boolean) => {
    dispatch({ type: 'SET_ONLINE', payload: online });
  }, []);
  const setPendingCount = useCallback((n: number) => {
    dispatch({ type: 'SET_PENDING_COUNT', payload: n });
  }, []);

  const cartSubtotal = state.cart.reduce((acc, i) => acc + i.lineTotal, 0);
  const cartTotal = cartSubtotal;

  return (
    <POSContext.Provider value={{
      state, setUser, setSession, addToCart, removeFromCart,
      setQuantity, clearCart, setOnline, setPendingCount,
      cartTotal, cartSubtotal,
    }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error('usePOS must be used inside POSProvider');
  return ctx;
}
