"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";

export interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  size: string | null;
  color: string | null;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | {
      type: "UPDATE_QUANTITY";
      payload: { key: string; quantity: number };
    }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" }
  | { type: "CLEAR_CART" }
  | { type: "RESTORE_CART"; payload: CartState };

interface CartContextValue {
  state: CartState;
  dispatch: Dispatch<CartAction>;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_STORAGE_KEY = "cart";

const initialState: CartState = {
  items: [],
  isOpen: false,
};

export function getCartItemKey(item: Pick<CartItem, "id" | "size" | "color">) {
  return `${item.id}-${item.size ?? ""}-${item.color ?? ""}`;
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const incoming = action.payload;
      const key = getCartItemKey(incoming);
      const existing = state.items.find((item) => getCartItemKey(item) === key);

      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            getCartItemKey(item) === key
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  price: incoming.price,
                  image: incoming.image,
                  name: incoming.name,
                  category: incoming.category,
                }
              : item,
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, { ...incoming, quantity: 1 }],
      };
    }

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (item) => getCartItemKey(item) !== action.payload,
        ),
      };

    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items
          .map((item) =>
            getCartItemKey(item) === action.payload.key
              ? {
                  ...item,
                  quantity: Math.max(0, Math.floor(action.payload.quantity)),
                }
              : item,
          )
          .filter((item) => item.quantity > 0),
      };

    case "OPEN_CART":
      return { ...state, isOpen: true };

    case "CLOSE_CART":
      return { ...state, isOpen: false };

    case "CLEAR_CART":
      return { ...state, items: [] };

    case "RESTORE_CART":
      return {
        items: action.payload.items,
        isOpen: action.payload.isOpen,
      };

    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // Restore the saved cart once on the client.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        const validItems = Array.isArray(parsed.items)
          ? parsed.items.filter((item: unknown): item is CartItem => {
              if (!item || typeof item !== "object") return false;

              const value = item as Partial<CartItem>;

              return (
                typeof value.id === "number" &&
                typeof value.name === "string" &&
                typeof value.price === "number" &&
                Number.isFinite(value.price) &&
                value.price >= 0 &&
                typeof value.quantity === "number" &&
                Number.isFinite(value.quantity) &&
                value.quantity > 0 &&
                Number.isInteger(value.quantity)
              );
            })
          : [];

        dispatch({
          type: "RESTORE_CART",
          payload: {
            items: validItems,
            isOpen: false,
          },
        });
      }
    } catch (error) {
      console.error("Could not restore cart:", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Never overwrite saved data before restoration has finished.
  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save cart:", error);
    }
  }, [state, hydrated]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartState() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCartState must be used within a CartProvider");
  }

  return context.state;
}

export function useCartDispatch() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCartDispatch must be used within a CartProvider");
  }

  return context.dispatch;
}

export function useCartReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return ready;
}
