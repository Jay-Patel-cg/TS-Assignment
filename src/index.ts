import { select, input, confirm, number } from "@inquirer/prompts";
import chalk from "chalk";
import Table from "cli-table3";

import {
  FoodItem,
  Customer,
  CartItem,
  Payment,
  Coupon,
  OrderStatus,
  BillSuccess,
} from "./types.js";
import { foodItems, sampleGuest, sampleMembers, availableCoupons } from "./data.js";
import {
  createGuestCustomer,
  createMemberCustomer,
  formatAddress,
  isMember,
} from "./customer.js";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  calculateSubtotal,
  calculateItemTotal,
  clearCart,
} from "./cart.js";
import {
  generateBill,
  calculateDiscount,
  calculateTax,
  calculateDeliveryCharge,
  calculateFinalAmount,
  FREE_DELIVERY_THRESHOLD,
} from "./billing.js";
import { processPayment } from "./payment.js";
import {
  updateHistoryOrderStatus,
  saveOrderToHistory,
  getOrderHistory,
  getStatusBadge,
} from "./order.js";
import { formatCurrency, generateOrderId } from "./utils.js";

let currentCustomer: Customer | null = sampleGuest;
let cart: CartItem[] = [];
let activeCoupon: Coupon | undefined = undefined;

function printHeader(): void {
  console.clear();
  console.log(
    chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                   🍔 GOURMET BITES TERMINAL 🍕                 ║
║                   Food Ordering & Billing System               ║
╚═══════════════════════════════════════════════════════════════╝
`)
  );
  displayCustomerBanner();
}

function displayCustomerBanner(): void {
  if (!currentCustomer) {
    console.log(chalk.yellow("👤 Current Customer: None selected\n"));
    return;
  }

  if (isMember(currentCustomer)) {
    console.log(
      chalk.greenBright(
        `👤 Active Customer: ${chalk.bold(currentCustomer.name)} [${chalk.yellow(
          currentCustomer.membershipLevel.toUpperCase() + " MEMBER"
        )} - ${currentCustomer.discountPercentage}% OFF] | Phone: ${
          currentCustomer.phone || "N/A"
        }`
      )
    );
  } else {
    console.log(
      chalk.blueBright(
        `👤 Active Customer: ${chalk.bold(
          currentCustomer.name
        )} [GUEST] | Phone: ${currentCustomer.phone || "N/A"}`
      )
    );
  }
  console.log(
    chalk.gray(`📍 Address: ${formatAddress(currentCustomer.address)}\n`)
  );
}

async function viewFoodMenu(): Promise<void> {
  printHeader();

  const filterCategory = await select<string>({
    message: "Filter food menu by category:",
    choices: [
      { name: "✨ Show All Items", value: "all" },
      { name: "🍕 Pizza", value: "pizza" },
      { name: "🍔 Burger", value: "burger" },
      { name: "🥤 Drink", value: "drink" },
      { name: "🍰 Dessert", value: "dessert" },
    ],
  });

  const filteredItems: FoodItem[] =
    filterCategory === "all"
      ? foodItems
      : foodItems.filter((item) => item.category === filterCategory);

  const table = new Table({
    head: [
      chalk.cyan("ID"),
      chalk.cyan("Name"),
      chalk.cyan("Category"),
      chalk.cyan("Price"),
      chalk.cyan("Availability"),
    ],
    colWidths: [6, 30, 12, 12, 15],
  });

  filteredItems.forEach((item: FoodItem) => {
    const availText = item.isAvailable
      ? chalk.green("In Stock")
      : chalk.red("Out of Stock");
    table.push([
      item.id,
      item.name,
      item.category.toUpperCase(),
      formatCurrency(item.price),
      availText,
    ]);
  });

  console.log(table.toString());

  await input({ message: "Press ENTER to return to main menu..." });
}

async function manageCustomer(): Promise<void> {
  printHeader();

  const action = await select<string>({
    message: "Customer Management:",
    choices: [
      { name: "📋 Select Sample Guest Customer", value: "guest_sample" },
      { name: "🌟 Select Sample Member Customer", value: "member_sample" },
      { name: "➕ Create New Guest Customer", value: "new_guest" },
      { name: "👑 Create New Member Customer", value: "new_member" },
      { name: "↩️  Back to Main Menu", value: "back" },
    ],
  });

  if (action === "guest_sample") {
    currentCustomer = sampleGuest;
    console.log(chalk.green(`\nSelected Guest: ${sampleGuest.name}`));
  } else if (action === "member_sample") {
    const memberChoice = await select<number>({
      message: "Choose a sample member:",
      choices: sampleMembers.map((m) => ({
        name: `${m.name} (${m.membershipLevel.toUpperCase()} - ${m.discountPercentage}% OFF)`,
        value: m.id,
      })),
    });
    const foundMember = sampleMembers.find((m) => m.id === memberChoice);
    if (foundMember) {
      currentCustomer = foundMember;
      console.log(
        chalk.green(`\nSelected Member: ${foundMember.name} (${foundMember.membershipLevel})`)
      );
    }
  } else if (action === "new_guest") {
    const name = await input({ message: "Enter customer name:" });
    const phone = await input({ message: "Enter phone number (optional):" });
    const street = await input({ message: "Enter street address:" });
    const city = await input({ message: "Enter city:" });
    const pincode = await input({ message: "Enter pincode:" });

    const newId = Math.floor(300 + Math.random() * 900);
    currentCustomer = createGuestCustomer(
      newId,
      name || "Guest Customer",
      { street, city, pincode },
      phone || undefined
    );
    console.log(chalk.green(`\nGuest customer ${name} created successfully!`));
  } else if (action === "new_member") {
    const name = await input({ message: "Enter member name:" });
    const phone = await input({ message: "Enter phone number (optional):" });
    const street = await input({ message: "Enter street address:" });
    const city = await input({ message: "Enter city:" });
    const pincode = await input({ message: "Enter pincode:" });

    const level = await select<"silver" | "gold" | "platinum">({
      message: "Select Membership Tier:",
      choices: [
        { name: "🥈 Silver (5% OFF)", value: "silver" },
        { name: "🥇 Gold (10% OFF)", value: "gold" },
        { name: "💎 Platinum (15% OFF)", value: "platinum" },
      ],
    });

    const newId = Math.floor(400 + Math.random() * 900);
    currentCustomer = createMemberCustomer(
      newId,
      name || "Member Customer",
      { street, city, pincode },
      level,
      phone || undefined
    );
    console.log(
      chalk.green(
        `\nMember customer ${name} created as ${level.toUpperCase()} tier!`
      )
    );
  }

  await input({ message: "Press ENTER to continue..." });
}

async function handleAddToCart(): Promise<void> {
  printHeader();

  const availableItems = foodItems.filter((item) => item.isAvailable);

  if (availableItems.length === 0) {
    console.log(chalk.red("No items currently available in store."));
    await input({ message: "Press ENTER to return..." });
    return;
  }

  const selectedItemId = await select<number>({
    message: "Select food item to add to cart:",
    choices: availableItems.map((item) => ({
      name: `${item.name} (${item.category.toUpperCase()}) - ${formatCurrency(item.price)}`,
      value: item.id,
    })),
  });

  const targetItem = foodItems.find((item) => item.id === selectedItemId);
  if (!targetItem) return;

  const qtyInput = await number({
    message: `Enter quantity for ${targetItem.name}:`,
    default: 1,
    min: 1,
    max: 20,
  });
  const quantity = qtyInput ?? 1;

  const addInstruction = await confirm({
    message: "Would you like to add a special instruction?",
    default: false,
  });

  let specialInstruction: string | undefined = undefined;
  if (addInstruction) {
    specialInstruction = await input({
      message: "Enter special instruction (e.g. Extra spicy, No onions):",
    });
  }

  cart = addToCart(cart, targetItem, quantity, specialInstruction);
  console.log(
    chalk.green(
      `\nAdded ${quantity}x ${targetItem.name} to cart successfully!`
    )
  );
  await input({ message: "Press ENTER to continue..." });
}

function renderCartTable(): void {
  if (cart.length === 0) {
    console.log(chalk.yellow("🛒 Your cart is empty.\n"));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan("ID"),
      chalk.cyan("Item Name"),
      chalk.cyan("Price"),
      chalk.cyan("Qty"),
      chalk.cyan("Instruction"),
      chalk.cyan("Total"),
    ],
    colWidths: [6, 25, 12, 8, 20, 12],
  });

  cart.forEach((item: CartItem) => {
    table.push([
      item.id,
      item.name,
      formatCurrency(item.price),
      item.quantity,
      item.specialInstruction || "-",
      formatCurrency(calculateItemTotal(item)),
    ]);
  });

  console.log(table.toString());

  const subtotal = calculateSubtotal(cart);
  const deliveryCharge = calculateDeliveryCharge(subtotal);
  console.log(chalk.bold(`Subtotal: ${formatCurrency(subtotal)}`));
  if (deliveryCharge === 0) {
    console.log(chalk.green(`Delivery Charge: FREE (Orders over ₹${FREE_DELIVERY_THRESHOLD})`));
  } else {
    console.log(chalk.yellow(`Delivery Charge: ${formatCurrency(deliveryCharge)} (Free on orders over ₹${FREE_DELIVERY_THRESHOLD})`));
  }

  if (activeCoupon) {
    console.log(
      chalk.magenta(
        `Applied Coupon: ${activeCoupon.code} (${activeCoupon.description})`
      )
    );
  }
  console.log();
}

async function viewCartMenu(): Promise<void> {
  printHeader();
  renderCartTable();
  await input({ message: "Press ENTER to return to main menu..." });
}

async function handleUpdateQuantity(): Promise<void> {
  printHeader();
  if (cart.length === 0) {
    console.log(chalk.yellow("Your cart is empty. Nothing to update."));
    await input({ message: "Press ENTER to return..." });
    return;
  }

  renderCartTable();

  const selectedItemId = await select<number>({
    message: "Select item to update quantity:",
    choices: cart.map((item) => ({
      name: `${item.name} (Current Qty: ${item.quantity})`,
      value: item.id,
    })),
  });

  const newQty = await number({
    message: "Enter new quantity (Set to 0 to remove):",
    min: 0,
    max: 50,
  });

  if (newQty !== undefined) {
    cart = updateQuantity(cart, selectedItemId, newQty);
    console.log(chalk.green("\nCart quantity updated successfully!"));
  }

  await input({ message: "Press ENTER to continue..." });
}

async function handleRemoveFromCart(): Promise<void> {
  printHeader();
  if (cart.length === 0) {
    console.log(chalk.yellow("Your cart is empty."));
    await input({ message: "Press ENTER to return..." });
    return;
  }

  renderCartTable();

  const selectedItemId = await select<number>({
    message: "Select item to remove from cart:",
    choices: cart.map((item) => ({
      name: item.name,
      value: item.id,
    })),
  });

  cart = removeFromCart(cart, selectedItemId);
  console.log(chalk.green("\nItem removed from cart."));
  await input({ message: "Press ENTER to continue..." });
}

async function applyCouponMenu(): Promise<void> {
  printHeader();

  const choice = await select<string>({
    message: "Promotional Coupons:",
    choices: [
      ...availableCoupons.map((c) => ({
        name: `🎟️  ${c.code} - ${c.description}`,
        value: c.code,
      })),
      { name: "❌ Remove active coupon", value: "remove" },
      { name: "↩️  Back", value: "back" },
    ],
  });

  if (choice === "remove") {
    activeCoupon = undefined;
    console.log(chalk.yellow("Active coupon removed."));
  } else if (choice !== "back") {
    const coupon = availableCoupons.find((c) => c.code === choice);
    if (coupon) {
      activeCoupon = coupon;
      console.log(chalk.green(`Coupon "${coupon.code}" applied!`));
    }
  }

  await input({ message: "Press ENTER to continue..." });
}

async function handleCheckout(): Promise<void> {
  printHeader();

  if (!currentCustomer) {
    console.log(
      chalk.red("❌ Error: No customer selected. Please select/create a customer first.")
    );
    await input({ message: "Press ENTER to return..." });
    return;
  }

  if (cart.length === 0) {
    console.log(chalk.red("❌ Error: Your cart is empty. Add items before checkout."));
    await input({ message: "Press ENTER to return..." });
    return;
  }

  console.log(chalk.bold.yellow("📋 ORDER SUMMARY & BREAKDOWN\n"));
  renderCartTable();

  const subtotal = calculateSubtotal(cart);
  const discountBreakdown = calculateDiscount(subtotal, currentCustomer, activeCoupon);
  const amountAfterDiscount = subtotal - discountBreakdown.totalDiscount;
  const deliveryCharge = calculateDeliveryCharge(subtotal);
  const tax = calculateTax(amountAfterDiscount);
  const finalAmount = calculateFinalAmount(
    subtotal,
    discountBreakdown.totalDiscount,
    tax,
    deliveryCharge
  );

  console.log(chalk.bold("Subtotal: ") + formatCurrency(subtotal));
  console.log(
    chalk.green("Membership Discount: -") +
      formatCurrency(discountBreakdown.membershipDiscount)
  );
  if (discountBreakdown.additionalDiscount > 0) {
    console.log(
      chalk.green("Additional High-Value Discount (5% on > ₹2000): -") +
        formatCurrency(discountBreakdown.additionalDiscount)
    );
  }
  if (discountBreakdown.couponDiscount > 0) {
    console.log(
      chalk.green(`Coupon Discount (${activeCoupon?.code}): -`) +
        formatCurrency(discountBreakdown.couponDiscount)
    );
  }
  console.log(
    chalk.cyan("GST Tax (5%): +") + formatCurrency(tax)
  );
  if (deliveryCharge > 0) {
    console.log(chalk.yellow("Delivery Charge: +") + formatCurrency(deliveryCharge));
  } else {
    console.log(chalk.green("Delivery Charge: FREE"));
  }
  console.log(
    chalk.bold.cyan("═════════════════════════════════════════")
  );
  console.log(
    chalk.bold.greenBright(`TOTAL PAYABLE: ${formatCurrency(finalAmount)}`)
  );
  console.log(
    chalk.bold.cyan("═════════════════════════════════════════\n")
  );

  const proceed = await confirm({
    message: "Proceed to Payment?",
    default: true,
  });

  if (!proceed) {
    console.log(chalk.yellow("Checkout cancelled. Items remain in cart."));
    await input({ message: "Press ENTER to return..." });
    return;
  }

  const paymentMethod = await select<"cash" | "card" | "upi">({
    message: "Select Payment Method:",
    choices: [
      { name: "💵 Cash on Delivery / Counter", value: "cash" },
      { name: "💳 Credit / Debit Card", value: "card" },
      { name: "📱 UPI / QR Code", value: "upi" },
    ],
  });

  let paymentObj: Payment | null = null;

  if (paymentMethod === "cash") {
    const receivedAmount = await number({
      message: `Enter cash received (Required: ${formatCurrency(finalAmount)}):`,
      min: finalAmount,
    });
    if (receivedAmount !== undefined) {
      paymentObj = {
        method: "cash",
        receivedAmount,
      };
    }
  } else if (paymentMethod === "card") {
    const last4 = await input({
      message: "Enter Last 4 Digits of your Card:",
      validate: (val) =>
        val.length === 4 && !isNaN(Number(val))
          ? true
          : "Must be exactly 4 digits",
    });
    paymentObj = {
      method: "card",
      last4Digits: last4,
    };
  } else if (paymentMethod === "upi") {
    const txnId = await input({
      message: "Enter UPI Transaction ID (e.g. UPI12984729):",
      default: `UPI${Math.floor(100000 + Math.random() * 900000)}`,
    });
    paymentObj = {
      method: "upi",
      transactionId: txnId,
    };
  }

  if (!paymentObj) {
    console.log(chalk.red("Payment details input failed."));
    await input({ message: "Press ENTER to return..." });
    return;
  }

  const payResult = processPayment(paymentObj, finalAmount);
  if (!payResult.success) {
    console.log(chalk.red(`\n❌ ${payResult.message}`));
    await input({ message: "Press ENTER to return..." });
    return;
  }

  console.log(chalk.green(`\n✅ ${payResult.message}`));

  const newOrderId = generateOrderId();
  const billResult = generateBill(
    newOrderId,
    currentCustomer,
    cart,
    paymentObj,
    activeCoupon
  );

  if (billResult.status === "error") {
    console.log(chalk.red(`\n❌ Bill Generation Failed: ${billResult.message}`));
  } else {
    displayFinalBill(billResult);
    saveOrderToHistory(billResult);
    
    cart = clearCart();
    activeCoupon = undefined;
  }

  await input({ message: "Press ENTER to return to main menu..." });
}

function displayFinalBill(bill: BillSuccess): void {
  console.log(
    chalk.green.bold(`
================================================================
                    FINAL RECEIPT / BILL
================================================================
`)
  );
  console.log(`Order ID:      ${chalk.bold(bill.orderId)}`);
  console.log(`Date/Time:     ${bill.createdAt}`);
  console.log(`Customer:      ${bill.customer.name}`);
  console.log(`Type:          ${bill.customer.type.toUpperCase()}`);
  console.log(`Order Status:  ${getStatusBadge(bill.orderStatus)}`);
  console.log("----------------------------------------------------------------");

  const table = new Table({
    head: [chalk.cyan("Item"), chalk.cyan("Qty"), chalk.cyan("Price"), chalk.cyan("Total")],
    colWidths: [30, 8, 12, 12],
  });

  bill.cartItems.forEach((item) => {
    table.push([item.name, item.quantity, formatCurrency(item.price), formatCurrency(item.price * item.quantity)]);
  });

  console.log(table.toString());

  console.log(`Subtotal:                        ${formatCurrency(bill.subtotal)}`);
  console.log(`Membership Discount:             -${formatCurrency(bill.discount.membershipDiscount)}`);
  console.log(`Additional >₹2000 Discount:       -${formatCurrency(bill.discount.additionalDiscount)}`);
  if (bill.discount.couponDiscount > 0) {
    console.log(`Coupon Discount:                 -${formatCurrency(bill.discount.couponDiscount)}`);
  }
  console.log(`Delivery Fee:                    +${formatCurrency(bill.deliveryCharge)}`);
  console.log(`GST (5%):                        +${formatCurrency(bill.tax)}`);
  console.log("----------------------------------------------------------------");
  console.log(chalk.bold.green(`FINAL AMOUNT PAID:               ${formatCurrency(bill.finalAmount)}`));

  if (bill.payment.method === "cash") {
    console.log(`Payment Method:                  CASH (Received: ${formatCurrency(bill.payment.receivedAmount)})`);
  } else if (bill.payment.method === "card") {
    console.log(`Payment Method:                  CARD (Last 4 Digits: ${bill.payment.last4Digits})`);
  } else if (bill.payment.method === "upi") {
    console.log(`Payment Method:                  UPI (Txn ID: ${bill.payment.transactionId})`);
  }
  console.log("================================================================\n");
}

async function handleOrderHistoryAndStatus(): Promise<void> {
  printHeader();

  const history = getOrderHistory();
  if (history.length === 0) {
    console.log(chalk.yellow("No orders placed yet in this session."));
    await input({ message: "Press ENTER to return..." });
    return;
  }

  const orderChoices = history.map((record) => ({
    name: `${record.orderId} - ${record.bill.customer.name} - ${formatCurrency(
      record.bill.finalAmount
    )} [${getStatusBadge(record.status)}]`,
    value: record.orderId,
  }));

  const selectedOrderId = await select<string>({
    message: "Select an order to view details or update status:",
    choices: [...orderChoices, { name: "↩️  Back", value: "back" }],
  });

  if (selectedOrderId === "back") return;

  const targetRecord = history.find((r) => r.orderId === selectedOrderId);
  if (!targetRecord) return;

  displayFinalBill(targetRecord.bill);

  const changeStatus = await confirm({
    message: `Would you like to change status for ${targetRecord.orderId}?`,
    default: true,
  });

  if (changeStatus) {
    const newStatus = await select<OrderStatus>({
      message: `Select new status (Current: ${targetRecord.status}):`,
      choices: [
        { name: "⏳ Pending", value: "pending" },
        { name: "✅ Confirmed", value: "confirmed" },
        { name: "👨‍🍳 Preparing", value: "preparing" },
        { name: "🚀 Delivered", value: "delivered" },
        { name: "❌ Cancelled", value: "cancelled" },
      ],
    });

    try {
      const updated = updateHistoryOrderStatus(targetRecord.orderId, newStatus);
      if (updated) {
        console.log(
          chalk.green(
            `\nOrder ${targetRecord.orderId} status updated to ${getStatusBadge(
              newStatus
            )}!`
          )
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log(chalk.red(`\n❌ Error: ${err.message}`));
      }
    }
  }

  await input({ message: "Press ENTER to return..." });
}

async function main(): Promise<void> {
  let running = true;

  while (running) {
    printHeader();

    const choice = await select<string>({
      message: "What would you like to do?",
      choices: [
        { name: "🍕 1. View Food Menu", value: "view_menu" },
        { name: "👤 2. Select / Create Customer", value: "customer" },
        { name: "➕ 3. Add Item to Cart", value: "add_cart" },
        { name: "🛒 4. View Cart", value: "view_cart" },
        { name: "✏️  5. Update Cart Quantity", value: "update_qty" },
        { name: "❌ 6. Remove Item from Cart", value: "remove_cart" },
        { name: "🎟️  7. Apply Coupon Code", value: "coupon" },
        { name: "💳 8. Checkout & Process Payment", value: "checkout" },
        { name: "📦 9. View Orders & Change Status", value: "orders" },
        { name: "🚪 10. Exit", value: "exit" },
      ],
    });

    switch (choice) {
      case "view_menu":
        await viewFoodMenu();
        break;
      case "customer":
        await manageCustomer();
        break;
      case "add_cart":
        await handleAddToCart();
        break;
      case "view_cart":
        await viewCartMenu();
        break;
      case "update_qty":
        await handleUpdateQuantity();
        break;
      case "remove_cart":
        await handleRemoveFromCart();
        break;
      case "coupon":
        await applyCouponMenu();
        break;
      case "checkout":
        await handleCheckout();
        break;
      case "orders":
        await handleOrderHistoryAndStatus();
        break;
      case "exit":
        running = false;
        console.log(
          chalk.cyan("\nThank you for using Gourmet Bites Terminal! Goodbye! 👋\n")
        );
        break;
    }
  }
}

main().catch((err: unknown) => {
  console.error(chalk.red("Application crashed with error:"), err);
});
