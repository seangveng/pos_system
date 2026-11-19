"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";

export interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: string } // payload = unique key
  | { type: "UPDATE_QUANTITY"; payload: { key: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "TOGGLE_CART" }
  | { type: "OPEN_CART" }
  | { type: "CLOSE_CART" };

const getKey = (item: Pick<CartItem, "id" | "size" | "color">) =>
  `${item.id}-${item.size}-${item.color}`;

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const key = getKey(action.payload);
      const existingItem = state.items.find((item) => getKey(item) === key);

      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            getKey(item) === key
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }

    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map((item) =>
          getKey(item) === action.payload.key
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };

    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter((item) => getKey(item) !== action.payload),
      };

    case "CLEAR_CART":
      return { ...state, items: [] };

    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen };

    case "OPEN_CART":
      return { ...state, isOpen: true };

    case "CLOSE_CART":
      return { ...state, isOpen: false };

    default:
      return state;
  }
};

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  // ✅ Load from localStorage on first render
  const stored =
    typeof window !== "undefined" ? localStorage.getItem("cart") : null;
  const initialState: CartState = stored
    ? JSON.parse(stored)
    : { items: [], isOpen: false };

  const [state, dispatch] = useReducer(cartReducer, initialState);

  // ✅ Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(state));
  }, [state]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
