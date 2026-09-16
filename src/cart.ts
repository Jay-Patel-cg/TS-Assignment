import { CartItem, FoodItem } from "./types.js";

export function addToCart(
  cart: CartItem[],
  item: FoodItem,
  quantity: number,
  specialInstruction?: string
): CartItem[] {
  if (quantity <= 0) {
    return cart;
  }

  if (!item.isAvailable) {
    return cart;
  }

  const existingItem = cart.find(
    (cartItem: CartItem) => cartItem.id === item.id
  );

  if (existingItem) {
    return cart.map((cartItem: CartItem) => {
      if (cartItem.id === item.id) {
        return {
          ...cartItem,
          quantity: cartItem.quantity + quantity,
          specialInstruction:
            specialInstruction || cartItem.specialInstruction,
        };
      }
      return cartItem;
    });
  }

  const newCartItem: CartItem = {
    ...item,
    quantity,
    specialInstruction,
  };

  return [...cart, newCartItem];
}

export function removeFromCart(
  cart: CartItem[],
  foodItemId: number
): CartItem[] {
  return cart.filter((item: CartItem) => item.id !== foodItemId);
}

export function updateQuantity(
  cart: CartItem[],
  foodItemId: number,
  quantity: number
): CartItem[] {
  if (quantity <= 0) {
    return removeFromCart(cart, foodItemId);
  }

  return cart.map((item: CartItem) => {
    if (item.id === foodItemId) {
      return {
        ...item,
        quantity,
      };
    }
    return item;
  });
}

export function calculateItemTotal(item: CartItem): number {
  return item.price * item.quantity;
}

export function calculateSubtotal(cart: CartItem[]): number {
  return cart.reduce(
    (total: number, item: CartItem) => total + calculateItemTotal(item),
    0
  );
}

export function clearCart(): CartItem[] {
  return [];
}
