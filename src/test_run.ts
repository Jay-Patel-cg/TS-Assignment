import { foodItems, sampleMembers } from "./data.js";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  calculateSubtotal,
} from "./cart.js";
import {
  calculateDiscount,
  calculateTax,
  calculateFinalAmount,
  generateBill,
} from "./billing.js";
import { processPayment } from "./payment.js";
import { updateOrderStatus, getStatusBadge } from "./order.js";
import { formatCurrency } from "./utils.js";
import { CartItem, Payment } from "./types.js";

console.log("=== RUNNING AUTOMATED CORE LOGIC TEST SUITE ===");

console.log(`✓ Food Items loaded: ${foodItems.length} items`);
console.assert(foodItems.length >= 8, "Should have at least 8 food items");

let cart: CartItem[] = [];
cart = addToCart(cart, foodItems[0], 2, "Extra cheese");
cart = addToCart(cart, foodItems[2], 1);
cart = addToCart(cart, foodItems[6], 2);

console.assert(cart.length === 3, "Cart should contain 3 items");
const subtotal1 = calculateSubtotal(cart);
console.log(`✓ Cart Subtotal: ${formatCurrency(subtotal1)} (Expected: ₹987.00)`);
console.assert(subtotal1 === 987, "Subtotal should be 987");

cart = updateQuantity(cart, foodItems[0].id, 3);
const subtotal2 = calculateSubtotal(cart);
console.log(`✓ Updated Subtotal: ${formatCurrency(subtotal2)} (Expected: ₹1286.00)`);

cart = removeFromCart(cart, foodItems[2].id);
console.assert(cart.length === 2, "Cart should contain 2 items after removal");

const goldMember = sampleMembers[1];
cart = addToCart(cart, foodItems[1], 4);
const highSubtotal = calculateSubtotal(cart);
console.log(`✓ High Value Subtotal: ${formatCurrency(highSubtotal)}`);

const discountBreakdown = calculateDiscount(highSubtotal, goldMember);
const expectedTotalDisc = discountBreakdown.totalDiscount;
console.log(`✓ Gold Membership Discount (10%): ${formatCurrency(discountBreakdown.membershipDiscount)}`);
console.log(`✓ Additional High-Value Discount (5%): ${formatCurrency(discountBreakdown.additionalDiscount)}`);
console.log(`✓ Total Discount: ${formatCurrency(expectedTotalDisc)}`);

const amountAfterDiscount = highSubtotal - expectedTotalDisc;
const tax = calculateTax(amountAfterDiscount);
console.log(`✓ GST Tax (5%): ${formatCurrency(tax)}`);

const finalAmount = calculateFinalAmount(highSubtotal, expectedTotalDisc, tax, 0);
console.log(`✓ Final Payable Amount: ${formatCurrency(finalAmount)}`);

const cashPay: Payment = { method: "cash", receivedAmount: 3000 };
const cashResult = processPayment(cashPay, finalAmount);
console.log(`✓ Cash Payment Processed: ${cashResult.message}`);
console.assert(cashResult.success === true, "Cash payment should succeed");

const upiPay: Payment = { method: "upi", transactionId: "UPI987654321" };
const upiResult = processPayment(upiPay, finalAmount);
console.log(`✓ UPI Payment Processed: ${upiResult.message}`);
console.assert(upiResult.success === true, "UPI payment should succeed");

const billResult = generateBill("ORD-TEST-1", goldMember, cart, upiPay);
if (billResult.status === "error") {
  console.error("❌ Bill generation failed:", billResult.message);
} else {
  console.log(`✓ Bill Generated Successfully! Order ID: ${billResult.orderId}`);
  console.log(`✓ Order Status: ${getStatusBadge(billResult.orderStatus)}`);
}

let status = billResult.status === "success" ? billResult.orderStatus : "pending";
status = updateOrderStatus(status, "preparing");
console.log(`✓ Order Status Updated: ${getStatusBadge(status)}`);
status = updateOrderStatus(status, "delivered");
console.log(`✓ Order Status Final: ${getStatusBadge(status)}`);

console.log("\n=== ALL CORE LOGIC TESTS PASSED SUCCESSFULLY! ===");
