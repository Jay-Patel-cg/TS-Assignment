import {
  CartItem,
  Customer,
  Payment,
  Coupon,
  DiscountBreakdown,
  BillResult,
  BillSuccess,
  BillError,
} from "./types.js";
import { calculateSubtotal } from "./cart.js";
import { getCustomerDiscountPercentage } from "./customer.js";

export const GST_RATE = 0.05;
export const FREE_DELIVERY_THRESHOLD = 500;
export const STANDARD_DELIVERY_CHARGE = 40;

export function calculateDiscount(
  subtotal: number,
  customer: Customer,
  coupon?: Coupon
): DiscountBreakdown {
  if (subtotal <= 0) {
    return {
      membershipDiscount: 0,
      additionalDiscount: 0,
      couponDiscount: 0,
      totalDiscount: 0,
    };
  }

  const membershipPercentage = getCustomerDiscountPercentage(customer);
  const membershipDiscount = (subtotal * membershipPercentage) / 100;

  const runningSubtotalAfterMembership = subtotal - membershipDiscount;

  let additionalDiscount = 0;
  if (subtotal > 2000) {
    additionalDiscount = (runningSubtotalAfterMembership * 5) / 100;
  }

  const runningSubtotalAfterAdditional =
    runningSubtotalAfterMembership - additionalDiscount;

  let couponDiscount = 0;
  if (coupon) {
    const minOrder = coupon.minOrderAmount ?? 0;
    if (subtotal >= minOrder) {
      if (coupon.discountPercentage > 0) {
        couponDiscount =
          (runningSubtotalAfterAdditional * coupon.discountPercentage) / 100;
        if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
          couponDiscount = coupon.maxDiscount;
        }
      } else if (coupon.maxDiscount) {
        couponDiscount = Math.min(
          coupon.maxDiscount,
          runningSubtotalAfterAdditional
        );
      }
    }
  }

  const totalDiscount = Math.min(
    subtotal,
    membershipDiscount + additionalDiscount + couponDiscount
  );

  return {
    membershipDiscount,
    additionalDiscount,
    couponDiscount,
    totalDiscount,
  };
}

export function calculateTax(amountAfterDiscount: number): number {
  if (amountAfterDiscount <= 0) return 0;
  return amountAfterDiscount * GST_RATE;
}

export function calculateDeliveryCharge(subtotal: number): number {
  if (subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0) {
    return 0;
  }
  return STANDARD_DELIVERY_CHARGE;
}

export function calculateFinalAmount(
  subtotal: number,
  discountAmount: number,
  taxAmount: number,
  deliveryCharge: number
): number {
  const amountAfterDiscount = Math.max(0, subtotal - discountAmount);
  return amountAfterDiscount + taxAmount + deliveryCharge;
}

export function generateBill(
  orderId: string,
  customer: Customer | null,
  cart: CartItem[],
  payment: Payment | null,
  coupon?: Coupon
): BillResult {
  if (!customer) {
    const errorResult: BillError = {
      status: "error",
      message: "Customer details missing. Please select or create a customer.",
    };
    return errorResult;
  }

  if (cart.length === 0) {
    const errorResult: BillError = {
      status: "error",
      message: "Cart is empty. Please add items to the cart before checkout.",
    };
    return errorResult;
  }

  if (!payment) {
    const errorResult: BillError = {
      status: "error",
      message: "Payment method not selected or processing failed.",
    };
    return errorResult;
  }

  const subtotal = calculateSubtotal(cart);
  const discount = calculateDiscount(subtotal, customer, coupon);
  const amountAfterDiscount = subtotal - discount.totalDiscount;
  const deliveryCharge = calculateDeliveryCharge(subtotal);
  const tax = calculateTax(amountAfterDiscount);
  const finalAmount = calculateFinalAmount(
    subtotal,
    discount.totalDiscount,
    tax,
    deliveryCharge
  );

  const successResult: BillSuccess = {
    status: "success",
    orderId,
    customer,
    cartItems: [...cart],
    subtotal,
    discount,
    amountAfterDiscount,
    deliveryCharge,
    tax,
    finalAmount,
    payment,
    orderStatus: "confirmed",
    createdAt: new Date().toLocaleString(),
  };

  return successResult;
}
