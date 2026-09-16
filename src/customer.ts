import {
  Customer,
  GuestCustomer,
  MemberCustomer,
  MembershipLevel,
  Address,
} from "./types.js";

export function isMember(customer: Customer): customer is MemberCustomer {
  return "membershipId" in customer;
}

export function createGuestCustomer(
  id: number,
  name: string,
  address: Address | string,
  phone?: string
): GuestCustomer {
  return {
    id,
    name,
    address,
    phone,
    type: "guest",
  };
}

export function getDiscountByLevel(level: MembershipLevel): number {
  switch (level) {
    case "silver":
      return 5;
    case "gold":
      return 10;
    case "platinum":
      return 15;
    default:
      return 0;
  }
}

export function createMemberCustomer(
  id: number,
  name: string,
  address: Address | string,
  level: MembershipLevel,
  phone?: string
): MemberCustomer {
  const discountPercentage = getDiscountByLevel(level);
  const randomId = Math.floor(100 + Math.random() * 900);

  return {
    id,
    name,
    address,
    phone,
    type: "member",
    membershipId: `MEM-${level.toUpperCase()}-${randomId}`,
    discountPercentage,
    membershipLevel: level,
  };
}

export function getCustomerDiscountPercentage(customer: Customer): number {
  if ("membershipId" in customer) {
    return customer.discountPercentage;
  }
  return 0;
}

export function formatAddress(address: Address | string): string {
  if (typeof address === "string") {
    return address;
  }
  return `${address.street}, ${address.city} - ${address.pincode}`;
}
