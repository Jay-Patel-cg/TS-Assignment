export type FoodCategory = "pizza" | "burger" | "drink" | "dessert";

export interface FoodItem {
  readonly id: number;
  name: string;
  category: FoodCategory;
  price: number;
  isAvailable: boolean;
}

export interface Address {
  street: string;
  city: string;
  pincode: string;
}

export interface BaseCustomer {
  readonly id: number;
  name: string;
  phone?: string;
  address: Address | string;
}

export interface GuestCustomer extends BaseCustomer {
  type: "guest";
}

export type MembershipLevel = "silver" | "gold" | "platinum";

export interface MemberCustomer extends BaseCustomer {
  type: "member";
  membershipId: string;
  discountPercentage: number;
  membershipLevel: MembershipLevel;
}

export type Customer = GuestCustomer | MemberCustomer;

export interface OrderInformation {
  quantity: number;
  specialInstruction?: string;
}

export type CartItem = FoodItem & OrderInformation;

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivered"
  | "cancelled";

export interface CashPayment {
  method: "cash";
  receivedAmount: number;
}

export interface CardPayment {
  method: "card";
  last4Digits: string;
}

export interface UpiPayment {
  method: "upi";
  transactionId: string;
}

export type Payment = CashPayment | CardPayment | UpiPayment;

export interface Coupon {
  code: string;
  description: string;
  discountPercentage: number;
  maxDiscount?: number;
  minOrderAmount?: number;
}

export interface DiscountBreakdown {
  membershipDiscount: number;
  additionalDiscount: number;
  couponDiscount: number;
  totalDiscount: number;
}

export interface BillSuccess {
  status: "success";
  orderId: string;
  customer: Customer;
  cartItems: CartItem[];
  subtotal: number;
  discount: DiscountBreakdown;
  amountAfterDiscount: number;
  deliveryCharge: number;
  tax: number;
  finalAmount: number;
  payment: Payment;
  orderStatus: OrderStatus;
  createdAt: string;
}

export interface BillError {
  status: "error";
  message: string;
}

export type BillResult = BillSuccess | BillError;

export interface OrderRecord {
  orderId: string;
  bill: BillSuccess;
  status: OrderStatus;
  updatedAt: string;
}
