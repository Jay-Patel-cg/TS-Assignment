import { Payment, CashPayment, CardPayment, UpiPayment } from "./types.js";
import { assertNever } from "./utils.js";

export interface PaymentProcessResult {
  success: boolean;
  message: string;
  changeAmount?: number;
}

export function isCashPayment(payment: Payment): payment is CashPayment {
  return payment.method === "cash" && "receivedAmount" in payment;
}

export function isCardPayment(payment: Payment): payment is CardPayment {
  return payment.method === "card" && "last4Digits" in payment;
}

export function isUpiPayment(payment: Payment): payment is UpiPayment {
  return payment.method === "upi" && "transactionId" in payment;
}

export function processPayment(
  payment: Payment,
  amountToPay: number
): PaymentProcessResult {
  switch (payment.method) {
    case "cash": {
      if ("receivedAmount" in payment && typeof payment.receivedAmount === "number") {
        const received = payment.receivedAmount;
        if (received < amountToPay) {
          return {
            success: false,
            message: `Payment failed: Insufficient cash. Required: ₹${amountToPay.toFixed(
              2
            )}, Received: ₹${received.toFixed(2)}`,
          };
        }
        const changeAmount = received - amountToPay;
        return {
          success: true,
          message: `Cash payment of ₹${received.toFixed(
            2
          )} accepted. Change to return: ₹${changeAmount.toFixed(2)}`,
          changeAmount,
        };
      }
      return {
        success: false,
        message: "Invalid cash payment parameters.",
      };
    }

    case "card": {
      if ("last4Digits" in payment && typeof payment.last4Digits === "string") {
        if (payment.last4Digits.length !== 4 || isNaN(Number(payment.last4Digits))) {
          return {
            success: false,
            message: "Invalid card details. Last 4 digits must be a 4-digit number.",
          };
        }
        return {
          success: true,
          message: `Card payment of ₹${amountToPay.toFixed(
            2
          )} authorized successfully (Card ending in **** ${payment.last4Digits}).`,
        };
      }
      return {
        success: false,
        message: "Invalid card payment parameters.",
      };
    }

    case "upi": {
      if ("transactionId" in payment && typeof payment.transactionId === "string") {
        if (payment.transactionId.trim().length === 0) {
          return {
            success: false,
            message: "Invalid UPI payment: Transaction ID cannot be empty.",
          };
        }
        return {
          success: true,
          message: `UPI payment of ₹${amountToPay.toFixed(
            2
          )} verified successfully (Txn ID: ${payment.transactionId}).`,
        };
      }
      return {
        success: false,
        message: "Invalid UPI payment parameters.",
      };
    }

    default:
      return assertNever(payment);
  }
}
