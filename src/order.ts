import { OrderStatus, BillSuccess, OrderRecord } from "./types.js";
import { assertNever } from "./utils.js";

const orderHistory: OrderRecord[] = [];

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean {
  const allowed = allowedTransitions[currentStatus];
  return allowed.includes(newStatus);
}

export function updateOrderStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): OrderStatus {
  if (currentStatus === newStatus) {
    return currentStatus;
  }

  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw new Error(
      `Invalid order status transition from "${currentStatus}" to "${newStatus}".`
    );
  }

  return newStatus;
}

export function getStatusBadge(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "⏳ PENDING";
    case "confirmed":
      return "✅ CONFIRMED";
    case "preparing":
      return "👨‍🍳 PREPARING";
    case "delivered":
      return "🚀 DELIVERED";
    case "cancelled":
      return "❌ CANCELLED";
    default:
      return assertNever(status);
  }
}

export function saveOrderToHistory(bill: BillSuccess): OrderRecord {
  const record: OrderRecord = {
    orderId: bill.orderId,
    bill,
    status: bill.orderStatus,
    updatedAt: new Date().toLocaleString(),
  };
  orderHistory.push(record);
  return record;
}

export function getOrderHistory(): OrderRecord[] {
  return [...orderHistory];
}

export function findOrderById(orderId: string): OrderRecord | undefined {
  return orderHistory.find((order) => order.orderId === orderId);
}

export function updateHistoryOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): boolean {
  const order = findOrderById(orderId);
  if (!order) return false;

  const updatedStatus = updateOrderStatus(order.status, newStatus);
  order.status = updatedStatus;
  order.bill.orderStatus = updatedStatus;
  order.updatedAt = new Date().toLocaleString();
  return true;
}
